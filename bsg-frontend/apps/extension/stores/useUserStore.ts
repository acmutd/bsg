import { create } from 'zustand';
import { User } from "@bsg/models/User";

interface userStoreState {
  isLoggedIn: boolean;
  user: User | null;

  setIsLogedIn: (boolean) => void;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<userStoreState>((set) => ({
    isLoggedIn: false,
    user: null,

    setIsLogedIn: (isLoggedIn) => set({ isLoggedIn: isLoggedIn }),
    setUser: (user) => set({ user: user }),
}));