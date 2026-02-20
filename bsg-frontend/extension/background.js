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
      const res = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_COPY', text });
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
    fetch('http://localhost:3000/auth/user', {
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
    fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => {
        chrome.storage.local.remove('user', () => {
          sendResponse({ success: true });
        });
      })
      .catch(() => {
        chrome.storage.local.remove('user', () => {
          sendResponse({ success: true });
        });
      });

    return true;
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
    chrome.storage.local.get(['pendingSubmissions'], (result) => {
      const pending = result.pendingSubmissions || {};
      const pendingData = pending[submissionId];

      if (pendingData) {
        if (status_msg === 'Accepted') {
          fetch('http://localhost:3000/submission', {
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
            .then(res => res.json())
            .catch(e => console.error('Background: Failed to report submission:', e));
        }

        // cleanup
        delete pending[submissionId];
        chrome.storage.local.set({ pendingSubmissions: pending });
      } else {
        console.warn(`Background: No pending submission found for ID ${submissionId}`);
      }
    });

    sendResponse({ received: true });
    return false;
  }
});


// redirect logic
const RTC_SERVICE_URL = 'ws://localhost:5001/ws';
let socket = null;
let activeRoomId = null;
let userProfile = null;

chrome.storage.local.get(['activeRoomId', 'user'], (result) => {
  if (result.activeRoomId) activeRoomId = result.activeRoomId;
  if (result.user) userProfile = result.user;

  if (activeRoomId && userProfile) {
    connectWebSocket();
  } else {
    console.log("Background: Not connecting to WS. Missing data:", { activeRoomId, hasProfile: !!userProfile });
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

  socket = new WebSocket(RTC_SERVICE_URL);

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
          if (message && message.data) {
            handleNextProblem(message.data);
          }
        } else if (responseType === 'round-end') {
          console.log("Background: Round ended:", message?.data);
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
      roomID: activeRoomId
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

  if (userProfile && (userProfile.id == userHandle)) {
    chrome.storage.local.set({ nextProblem: nextProblem });
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#00FF00" });

  } else {
    console.log("Background: Ignoring next-problem (ID mismatch)");
  }
}
