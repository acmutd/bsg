const useCollapsedSidebar = () => {
    const toggleCollapse = async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, {
                type: "TOGGLE_COLLAPSE"
            });
        }
    }

    return {
        toggleCollapse,
    }
}
