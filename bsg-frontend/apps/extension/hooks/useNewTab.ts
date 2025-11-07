import { useCallback } from 'react';

export const useNewTab = () => {
  const openInNewTab = useCallback((url: string) => {
    chrome.tabs.create({ url });
  }, []);

  return { openInNewTab };
};