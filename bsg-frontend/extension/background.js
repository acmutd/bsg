// Background service worker to handle API calls
// This bypasses CSP restrictions on extension pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_AUTH') {
        // Fetch user data from localhost server
        fetch('http://localhost:3000/auth/user', {
            credentials: 'include',
        })
        .then(response => {
            if (response.ok) {
                return response.json();
                
            }
            throw new Error('Not authenticated');

        })
        .then(userData => {
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
