import { create } from 'zustand';

interface userStoreState {
  isLoggedIn: boolean;
  userId: string | null;
  username: string | null;
  email: string | null;
  iconUrl: string | null;

  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setUserId: (userId: string | null) => void;
  setUsername: (username: string | null) => void;
  setEmail: (email: string | null) => void;
  setIconUrl: (iconUrl: string | null) => void;

  loginUser: (
    userId: string,
    username: string,
    email: string,
    iconUrl: string
  ) => void;
  resetUser: () => void;
}

const userStoreInit = {
  isLoggedIn: false,
  userId: null,
  username: null,
  email: null,
  iconUrl: null,
}

export const useUserStore = create<userStoreState>((set) => ({
  ...userStoreInit,

  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn: isLoggedIn }),
  setUserId: (userId) => set({ userId: userId }),
  setUsername: (username) => set({ username: username }),
  setEmail: (email) => set({ email: email }),
  setIconUrl: (iconUrl) => set({ iconUrl: iconUrl }),

  loginUser: (
    userId,
    username,
    email,
    iconUrl
  ) => set({
    userId: userId,
    username: username,
    email: email,
    iconUrl: iconUrl,
    isLoggedIn: true
  }),
  resetUser: () => set(userStoreInit)
}));