import { create } from 'zustand';

type ThemePreference = 'auto' | 'dark' | 'light';

interface SettingsStoreState {
    chatNotificationsEnabled: boolean;
    setChatNotificationsEnabled: (enabled: boolean) => void;
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => void;
    loadSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
    chatNotificationsEnabled: true,
    themePreference: 'auto',

    setChatNotificationsEnabled: (enabled) => {
        set({ chatNotificationsEnabled: enabled });

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ chatNotificationsEnabled: enabled });
        }
    },

    setThemePreference: (pref) => {
        set({ themePreference: pref });

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ themePreference: pref });
        }
    },

    loadSettings: () => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.get(['chatNotificationsEnabled', 'themePreference'], (result) => {
                if (typeof result.chatNotificationsEnabled === 'boolean') {
                    set({ chatNotificationsEnabled: result.chatNotificationsEnabled });
                }
                if (result.themePreference === 'auto' || result.themePreference === 'dark' || result.themePreference === 'light') {
                    set({ themePreference: result.themePreference });
                }
            });
        }
    },
}));