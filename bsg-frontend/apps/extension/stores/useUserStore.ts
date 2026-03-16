import { create } from 'zustand';
import { User } from "@bsg/models/User";

interface userStoreState {
  isLoggedIn: boolean;
  user: User | null;

  setIsLoggedIn: (boolean) => void;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<userStoreState>((set) => ({
    isLoggedIn: false,
    user: null,

    setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn: isLoggedIn }),
    setUser: (user) => set({ user: user }),
}));