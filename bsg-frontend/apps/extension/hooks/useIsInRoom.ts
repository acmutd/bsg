import { create } from 'zustand';

interface IsInRoomState {
  isInRoom: boolean;
  setIsInRoom: (bool: boolean) => void;
}

export const useIsInRoom = create<IsInRoomState>((set) => ({
    isInRoom: false,
    setIsInRoom: (bool) => set({ isInRoom: bool })
}));