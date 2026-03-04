import { create } from 'zustand';

interface IsPanelHoveredState {
  isPanelHovered: boolean;
  setIsPanelHovered: (bool: boolean) => void;
}

export const useIsPanelHovered = create<IsPanelHoveredState>((set) => ({
    isPanelHovered: false,
    setIsPanelHovered: (bool) => set({ isPanelHovered: bool })
}));