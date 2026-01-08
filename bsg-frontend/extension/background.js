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

    if (!request || request.type !== 'COPY_TO_CLIPBOARD') {

      const text = request.text || '';

      (async () => {
        const ok = await doCopy(text);
        sendResponse({ ok });
      })();

      // return true to indicate we'll call sendResponse asynchronously
      return true;

    }

    if (request.type === 'CHECK_AUTH') {
        // Fetch user data from localhost server
        fetch('http://localhost:3000/auth/user', {
            credentials: 'include',
            method: 'GET'
        })
        .then(response => {
            if (response.ok) {
                //return into JSON format because the network call made it a string
                return response.json();
            }
            throw new Error('Not authenticated');

        })
        .then(userData => {
          console.log("User name:", userData.name)
            // Store user in Chrome storage for persistence
            chrome.storage.local.set({ user: userData }, () => {
                sendResponse({ success: true, user: userData });
            });
        })
        .catch(error => {
            // Clear user from storage if not authenticated
            chrome.storage.local.remove('user', () => {
                sendResponse({ success: false, error: error.message });
            });
        });

        return true; // Keep message channel open for async response
    }

    if (request.type === 'LOGOUT') {
        // Clear user from Chrome storage
        fetch('http://localhost:3000/auth/logout', {
            method: 'GET',
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
});
