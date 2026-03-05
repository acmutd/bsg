export const fold = async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: "FOLD"
        });
    }
}

export const unfold = async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: "UNFOLD"
        });
    }
}

export const maximize = async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: "MAXIMIZE"
        });
    }
}

