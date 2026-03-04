export const collapse = async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: "COLLAPSE"
        });
    }
}

export const expand = async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: "EXPAND"
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

