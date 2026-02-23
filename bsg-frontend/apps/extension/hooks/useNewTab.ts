import {useCallback} from 'react';

export const useNewTab = () => {
    const openInNewTab = useCallback((url: string) => {
        void chrome.tabs.create({url});
    }, []);

    return {openInNewTab};
};
