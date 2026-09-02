import { useEffect, useState } from "react";

export const useBrowser = () => {
    const [browser, setBrowser] = useState<string | null>(null);

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

        chrome.storage.local.get(['browser'], (result) => {
            if (result.browser) setBrowser(result.browser);
        });

        // The content script may not have written the value yet when the panel
        // mounts, so pick it up whenever it lands.
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.browser) setBrowser(changes.browser.newValue);
        };

        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    return browser;
}
