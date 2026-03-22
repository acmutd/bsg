type MessageType = 'FOLD' | 'UNFOLD' | 'MAXIMIZE' | 'ACTIVE';

export const messageScript = async (type: MessageType) => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type });
}
