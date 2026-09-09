import { create } from 'zustand';

type ThemePreference = 'auto' | 'dark' | 'light';

interface SettingsStoreState {
    chatNotificationsEnabled: boolean;
    setChatNotificationsEnabled: (enabled: boolean) => void;
    blurProfanity: boolean;
    setBlurProfanity: (enabled: boolean) => void;
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => void;
    loadSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
    chatNotificationsEnabled: true,
    blurProfanity: true,
    themePreference: 'auto',

    setChatNotificationsEnabled: (enabled) => {
        set({ chatNotificationsEnabled: enabled });

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ chatNotificationsEnabled: enabled });
        }
    },

    setBlurProfanity: (enabled) => {
        set({ blurProfanity: enabled });

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ blurProfanity: enabled });
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
            chrome.storage.local.get(['chatNotificationsEnabled', 'blurProfanity', 'themePreference'], (result) => {
                if (typeof result.chatNotificationsEnabled === 'boolean') {
                    set({ chatNotificationsEnabled: result.chatNotificationsEnabled });
                }
                if (typeof result.blurProfanity === 'boolean') {
                    set({ blurProfanity: result.blurProfanity });
                }
                if (result.themePreference === 'auto' || result.themePreference === 'dark' || result.themePreference === 'light') {
                    set({ themePreference: result.themePreference });
                }
            });
        }
    },
}));
