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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  // --- Clipboard Logic ---
  if (msg.type === 'COPY_TO_CLIPBOARD') {
    const text = msg.text || '';
    (async () => {
      const ok = await doCopy(text);
      sendResponse({ ok });
    })();
    return true; // Async response
  }

  // --- State Management Logic ---
  // In MV3, Service Workers are ephemeral. We must rely on storage.

  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(['session'], (result) => {
      console.log('GET_STATE returning:', result.session);
      sendResponse(result.session || {});
    });
    return true; // Async response
  }

  if (msg.type === 'SET_STATE') {
    console.log('SET_STATE received:', msg.payload);
    chrome.storage.local.get(['session'], (result) => {
      const currentSession = result.session || {};
      const newSession = { ...currentSession, ...msg.payload };
      chrome.storage.local.set({ session: newSession }, () => {
        console.log('Session saved:', newSession);
        sendResponse({ success: true });
      });
    });
    return true; // Async response
  }

  // Handle other messages or return false
  return false;
});

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
