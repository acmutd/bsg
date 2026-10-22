const PRODUCTION_CONFIG = {
  SERVER_URL: 'https://api.binarysearchgang.com',
  RTC_SERVICE_URL: 'wss://api.binarysearchgang.com/ws',
};

const CONFIG = { ...PRODUCTION_CONFIG };

let offscreenCreated = false;

async function ensureOffscreen() {
    if (offscreenCreated) return true;
    if (!chrome.offscreen) return false;

    try {
        const exists = await chrome.offscreen.hasDocument();
        if (!exists) {
            await chrome.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: ['CLIPBOARD'],
                justification: 'Required to write to clipboard from content scripts'
            });
        }
        offscreenCreated = true;
        return true;
    } catch (e) {
        console.error('ensureOffscreen error', e);
        return false;
    }
}


async function doCopy(text) {
    // try to use the offscreen document if available
    const hasOffscreen = await ensureOffscreen().catch(() => false);
    if (hasOffscreen) {
        try {
            const res = await chrome.runtime.sendMessage({type: 'OFFSCREEN_COPY', text});
            return res && res.ok;
        } catch (e) {
            console.error('sendMessage to offscreen failed', e);
        }
    }

    // try the clipboard API in the service worker context
    try {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) {
        console.warn('navigator.clipboard.writeText in service worker failed', e);
    }

    // give up
    return false;
}

// Slugs the user typed code into this round. storage.session, not zustand:
// zustand dies when the top frame navigates, which is the exact moment a
// problem should turn yellow. Memory-only, so it can't leak into a later round.
const TOUCHED_KEY = 'touchedSlugs';
// The round these slugs belong to, so a replayed round-start can't wipe them.
const TOUCHED_ROUND_KEY = 'touchedSlugsRound';

// Chained: each mutation is a read-modify-write, and two concurrent reads would
// both see the pre-write list, so one would clobber the other.
let touchedWrites = Promise.resolve();

function markProblemTouched(slug) {
  if (!slug) return;

  touchedWrites = touchedWrites
    .then(async () => {
      const result = await chrome.storage.session.get([TOUCHED_KEY]);
      const touched = result[TOUCHED_KEY] || [];
      // Skip the write so a re-report can't fire onChanged and re-render the panel.
      if (touched.includes(slug)) return;

      await chrome.storage.session.set({ [TOUCHED_KEY]: [...touched, slug] });
    })
    .catch((e) => console.error('Background: touched-problem write failed', e));
}

function resetTouchedProblems(roundKey) {
  touchedWrites = touchedWrites
    .then(async () => {
      const result = await chrome.storage.session.get([TOUCHED_ROUND_KEY]);
      // rtc-service replays round-start to every reconnecting socket, and the
      // panel reconnects on each navigation, so this is asked for constantly.
      // Clearing only on a real round change stops those replays from wiping
      // the list on the very navigation meant to turn a problem yellow.
      if (result[TOUCHED_ROUND_KEY] === roundKey) return;

      await chrome.storage.session.set({
        [TOUCHED_ROUND_KEY]: roundKey,
        [TOUCHED_KEY]: [],
      });
    })
    .catch((e) => console.error('Background: touched-problem reset failed', e));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request && request.type === 'COPY_TO_CLIPBOARD') {

    const text = request.text || '';

    (async () => {
      const ok = await doCopy(text);
      sendResponse({ ok });
    })();

    // return true to indicate we'll call sendResponse asynchronously
    return true;

  }

  if (request.type === 'CHECK_AUTH') {
    // fetch user data from localhost server
    fetch(`${CONFIG.SERVER_URL}/auth/user`, {
      credentials: 'include',
      method: 'GET'
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Not authenticated');

      })
      .then(userData => {
        chrome.storage.local.set({ user: userData }, () => {
          sendResponse({ success: true, user: userData });
        });
      })
      .catch(error => {
        chrome.storage.local.remove('user', () => {
          sendResponse({ success: false, error: error.message });
        });
      });

    return true; // keep message channel open for async response
  }

  if (request.type === 'LOGOUT') {
    const finishLogout = () => {
      activeRoomId = null;
      if (socket) {
        try {
          socket.close();
        } catch (e) {}
        socket = null;
      }
      chrome.storage.local.remove(['user', 'activeRoomId', 'roundEndTime', 'nextProblem', 'problems', 'lastGameEvent', 'pendingSubmissions'], () => {
        if (chrome.action) chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: true });
      });
    };

    fetch(`${CONFIG.SERVER_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => finishLogout())
      .catch(() => finishLogout());

    return true;
  }

  // problem progress intercept logic
  if (request.type === 'PROBLEM_PROGRESS_RESET') {
    // Queued rather than set directly so a report still in flight from the
    // previous round can't land after the reset and survive into the new one.
    resetTouchedProblems(request.roundKey);
    sendResponse({ received: true });
    return false;
  }

  if (request.type === 'PROBLEM_TOUCHED') {
    markProblemTouched(request.slug);
    sendResponse({ received: true });
    return false;
  }

  // submission intercept logic
  if (request.type === 'SUBMISSION_PENDING') {
    const { submissionId, problemSlug } = request.data;
    if (submissionId && problemSlug) {
      chrome.storage.local.get(['pendingSubmissions'], (result) => {
        const pending = result.pendingSubmissions || {};
        pending[submissionId] = request.data;
        chrome.storage.local.set({ pendingSubmissions: pending });
      });
    }
    sendResponse({ received: true });
    return false;
  }

  if (request.type === 'SUBMISSION_RESULT') {
    const { submissionId, status_msg } = request.data;
    // Acknowledge immediately; the content script doesn't use the response, so
    // holding the message channel open risks "channel closed" errors when the
    // LeetCode page navigates away before the async work below completes.
    sendResponse({ received: true });

    chrome.storage.local.get(['pendingSubmissions', 'roundEndTime'], (result) => {
      const pending = result.pendingSubmissions || {};
      const pendingData = pending[submissionId];

      if (pendingData) {
        if (status_msg === 'Accepted') {
          // TTL check: reject if the round timer has already expired
          const roundEndTime = result.roundEndTime;
          if (roundEndTime && Date.now() > roundEndTime) {
            console.log(`Background: Submission ${submissionId} rejected — round TTL exceeded`);
            delete pending[submissionId];
            chrome.storage.local.set({ pendingSubmissions: pending });
            return;
          }

          console.log(`Background: Processing Accepted submission ${submissionId} for ${pendingData.problemSlug}`);
          fetch(`${CONFIG.SERVER_URL}/submission`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              slug: pendingData.problemSlug,
              status: 'Accepted',
              code: pendingData.typed_code,
              language: pendingData.lang,
              runtime: request.data.elapsed_time,
              memory: request.data.memory_percentile
            }),
            credentials: 'include'
          })
            .then(res => {
              console.log("Background: Submission server response status:", res.status);
              return res.text().then(text => ({ status: res.status, text }));
            })
            .then(({ status, text }) => console.log('Background: Submission server response text:', status, text))
            .catch(err => console.error('Background: Submission server network error:', err));

        }

        // cleanup
        delete pending[submissionId];
        chrome.storage.local.set({ pendingSubmissions: pending });
      } else {
        console.warn(`Background: No pending submission found for ID ${submissionId}`);
      }
    });

    return false;
  }
});


// redirect logic
// NOTE: always read CONFIG.RTC_SERVICE_URL live (never snapshot it into a
// const) so local-dev auto-detect / storage overrides actually take effect.
let socket = null;
let activeRoomId = null;
let userProfile = null;

chrome.storage.local.get(['activeRoomId', 'user', 'configServerUrl', 'configRtcServiceUrl'], (result) => {
  if (result.configServerUrl) CONFIG.SERVER_URL = result.configServerUrl;
  if (result.configRtcServiceUrl) CONFIG.RTC_SERVICE_URL = result.configRtcServiceUrl;
  if (result.activeRoomId) activeRoomId = result.activeRoomId;
  if (result.user) userProfile = result.user;

  // Auto-detect local dev: if no explicit override, probe localhost:3000
  if (!result.configServerUrl) {
    fetch('http://localhost:3000/auth/user', { method: 'GET', credentials: 'include', signal: AbortSignal.timeout(2000) })
      .then(() => {
        CONFIG.SERVER_URL = 'http://localhost:3000';
        CONFIG.RTC_SERVICE_URL = 'ws://localhost:5001/ws';
        chrome.storage.local.set({ configServerUrl: CONFIG.SERVER_URL, configRtcServiceUrl: CONFIG.RTC_SERVICE_URL });
      })
      .catch(() => {});
  }

  if (activeRoomId && userProfile) {
    connectWebSocket();
  } else {
    console.debug("Background: Not connecting to WS. Missing data:", { activeRoomId, hasProfile: !!userProfile });
  }
});

// listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.activeRoomId) {
      activeRoomId = changes.activeRoomId.newValue;
      if (activeRoomId && userProfile) connectWebSocket();
    }
    if (changes.user) {
      userProfile = changes.user.newValue;
      if (activeRoomId && userProfile) connectWebSocket();
    }
  }
});

function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    // if already open, ensure we are in the correct room
    if (socket.readyState === WebSocket.OPEN && activeRoomId && userProfile) {
      sendJoinRoom();
    }
    return;
  }

  socket = new WebSocket(CONFIG.RTC_SERVICE_URL);

  socket.onopen = () => {
    if (activeRoomId && userProfile) {
      sendJoinRoom();
    }
  };

  socket.onmessage = (event) => {
    try {
      const response = JSON.parse(event.data);

      if (response.status === 'ok') {
        const { responseType, message } = response;
        if (responseType === 'next-problem') {
          console.log("Background DEBUG: Received next-problem from WS!", message);
          if (message && message.data) {
            handleNextProblem(message.data);
          }
        } else if (responseType === 'round-end') {
          console.log("Background: Round ended:", message?.data);
          chrome.storage.local.remove('nextProblem');
          chrome.action.setBadgeText({ text: "" });
        } else if (responseType === 'room-expired') {
          console.log("Background: Room expired and deleted:", message?.data);
          chrome.storage.local.remove(['activeRoomId', 'nextProblem', 'roundEndTime']);
          chrome.action.setBadgeText({ text: "" });
          chrome.notifications.create({
            type: 'basic',
            title: 'Room Closed',
            message: 'Your room has expired and been deleted.'
          });
        }
      }
    } catch (e) {
      console.error('Background: WS processing error', e);
    }
  };

  socket.onclose = () => {
    socket = null;
    setTimeout(() => {
      if (activeRoomId) connectWebSocket();
    }, 5000);
  };

  socket.onerror = (err) => {
    console.error("Background: WS Error Event");
  };
}

function sendJoinRoom() {
  if (!socket || socket.readyState !== WebSocket.OPEN || !activeRoomId || !userProfile) return;

  const payload = {
    name: userProfile.id + '_bg',
    "request-type": "join-room",
    data: JSON.stringify({
      userHandle: userProfile.id + '_bg',
      roomID: activeRoomId,
      suppressAnnouncement: true
    })
  };

  socket.send(JSON.stringify(payload));
}


async function handleNextProblem(dataStr) {
  let data = dataStr;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) {
      console.error("Background: Failed to parse next-problem data", e);
      return;
    }
  }

  // Check if data is valid object
  if (!data || typeof data !== 'object') {
    console.error("Background: Invalid next-problem data format", data);
    return;
  }

  const { nextProblem, userHandle } = data;
  console.log("Background DEBUG: handleNextProblem called! My ID:", userProfile?.id, "Event handle:", userHandle, "Next:", nextProblem);

  if (userProfile && (userProfile.id == userHandle)) {
    console.log("Background DEBUG: Setting nextProblem in chrome storage to:", nextProblem);
    chrome.storage.local.set({ nextProblem: nextProblem });
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#00FF00" });

  } else {
    console.log("Background: Ignoring next-problem (ID mismatch)");
  }
}
