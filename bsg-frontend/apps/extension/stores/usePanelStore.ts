import { create } from 'zustand';

interface panelStoreState {
  isPanelHovered: boolean;
  setIsPanelHovered: (isPanelHovered: boolean) => void;
  isFolded: boolean;
  setIsFolded: (isFolded: boolean) => void;
}

export const usePanelStore = create<panelStoreState>((set) => ({
  isPanelHovered: false,
  setIsPanelHovered: (isPanelHovered) => set({ isPanelHovered }),
  isFolded: false,
  setIsFolded: (isFolded) => set({ isFolded }),
}));
