import { create } from 'zustand';

interface SettingsStoreState {
    chatNotificationsEnabled: boolean;
    setChatNotificationsEnabled: (enabled: boolean) => void;
    loadSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
    chatNotificationsEnabled: true,

    setChatNotificationsEnabled: (enabled) => {
        set({ chatNotificationsEnabled: enabled });

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ chatNotificationsEnabled: enabled });
        }
    },

    loadSettings: () => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.get(['chatNotificationsEnabled'], (result) => {
                if (typeof result.chatNotificationsEnabled === 'boolean') {
                    set({ chatNotificationsEnabled: result.chatNotificationsEnabled });
                }
            });
        }
    },
}));