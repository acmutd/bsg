let offscreenCreated = false;
let lastProcessedSubmission = { slug: '', time: 0 };

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

let sessionCache = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  // --- Clipboard Logic ---
  if (msg.type === 'COPY_TO_CLIPBOARD') {
    const text = msg.text || '';
    doCopy(text).then(ok => sendResponse({ ok }));
    return true; // Async response
  }

  // --- Auth Logic ---
  if (msg.type === 'CHECK_AUTH') {
    fetch('http://localhost:3000/auth/user', { credentials: 'include', method: 'GET' })
      .then(r => r.ok ? r.json() : Promise.reject('Not authenticated'))
      .then(userData => {
        chrome.storage.local.set({ user: userData }, () => sendResponse({ success: true, user: userData }));
      })
      .catch(err => {
        chrome.storage.local.remove('user', () => sendResponse({ success: false, error: err.message }));
      });
    return true;
  }

  if (msg.type === 'LOGOUT') {
    fetch('http://localhost:3000/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => {
        chrome.storage.local.remove(['session', 'user'], () => {
          sessionCache = null;
          sendResponse({ success: true });
        });
      });
    return true;
  }

  // --- State Management Logic ---
  if (msg.type === 'GET_STATE') {
    if (sessionCache) {
      sendResponse(sessionCache);
    } else {
      chrome.storage.local.get(['session'], (result) => {
        sessionCache = result.session || {};
        sendResponse(sessionCache);
      });
      return true;
    }
  }

  if (msg.type === 'SET_STATE') {
    const updateState = (current) => {
      const newSession = { ...current, ...msg.payload };
      sessionCache = newSession;
      chrome.storage.local.set({ session: newSession }, () => sendResponse({ success: true }));
    };
    if (sessionCache) updateState(sessionCache);
    else chrome.storage.local.get(['session'], r => updateState(r.session || {}));
    return true;
  }

  // --- Submission Logic ---
  if (msg.type === 'SUBMISSION_SUCCESS') {
    const { problemSlug, verdict } = msg.payload;
    console.log('Processing submission:', problemSlug, verdict);

    const handleSubmission = (session) => {
      const { currentRoom, idToken, problemSlugs, lastNavigatedFrom } = session;

      // Deduplication
      const now = Date.now();
      if (lastProcessedSubmission.slug === problemSlug && (now - lastProcessedSubmission.time) < 10000) {
        return;
      }
      lastProcessedSubmission = { slug: problemSlug, time: now };

      if (!currentRoom) return;

      // NOTIFY BACKEND (Central Service)
      if (idToken) {
        fetch(`http://localhost:5050/api/submissions/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken
          },
          body: JSON.stringify({
            roomID: currentRoom.code,
            problemSlug: problemSlug,
            verdict: verdict
          })
        }).then(r => r.ok ? r.json() : Promise.reject('Backend reporting failed'))
          .then(data => console.log('Backend solve recorded:', data))
          .catch(err => console.error('Error reporting solve to backend:', err));
      }

      // Show local notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'BSG - Problem Solved!',
        message: `You solved ${problemSlug}!`
      });

      // --- AUTO-NAVIGATION ---
      if (verdict === 'Accepted' && problemSlugs && problemSlugs.length > 0) {
        const currentIndex = problemSlugs.indexOf(problemSlug);
        if (currentIndex !== -1 && currentIndex < problemSlugs.length - 1 && lastNavigatedFrom !== problemSlug) {
          const nextSlug = problemSlugs[currentIndex + 1];
          const nextUrl = `https://leetcode.com/problems/${nextSlug}/`;

          const updatedSession = { ...session, lastNavigatedFrom: problemSlug };
          sessionCache = updatedSession;
          chrome.storage.local.set({ session: updatedSession });

          setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length > 0 && tabs[0].id) chrome.tabs.update(tabs[0].id, { url: nextUrl });
            });
          }, 5000);
        }
      }
    };

    if (sessionCache) handleSubmission(sessionCache);
    else chrome.storage.local.get(['session'], r => {
      sessionCache = r.session || {};
      handleSubmission(sessionCache);
    });

    return true;
  }

  return false;
});

async function doCopy(text) {
  const hasOffscreen = await ensureOffscreen().catch(() => false);
  if (hasOffscreen) {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_COPY', text });
      return res && res.ok;
    } catch (e) { }
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { }
  return false;
}
