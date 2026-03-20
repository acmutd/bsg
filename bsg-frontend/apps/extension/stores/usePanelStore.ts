import { create } from 'zustand';

interface panelStoreState {
  isPanelHovered: boolean;
  setIsPanelHovered: (isPanelHovered: boolean) => void;
}

export const usePanelStore = create<panelStoreState>((set) => ({
    isPanelHovered: false,
    setIsPanelHovered: (isPanelHovered) => set({ isPanelHovered: isPanelHovered }),
}));