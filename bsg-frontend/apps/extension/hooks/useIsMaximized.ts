import { useEffect, useState } from "react";

export const useIsMaximized = () => {
    const [maximized, setMaximized] = useState(false);

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['isPanelMaximized'], (result) => {
            setMaximized(result.isPanelMaximized === true);
        });

        const onChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.isPanelMaximized) {
                setMaximized(changes.isPanelMaximized.newValue === true);
            }
        };

        chrome.storage.onChanged.addListener(onChange);

        return () => chrome.storage.onChanged.removeListener(onChange);
    }, []);

    return maximized;
}
