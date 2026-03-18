import { create } from 'zustand';

interface panelStoreState {
  isPanelHovered: boolean;
  isActivePanel: boolean;

  setIsPanelHovered: (isPanelHovered: boolean) => void;
  setIsActivePanel: (isActivePanel: boolean) => void;
}

export const usePanelStore = create<panelStoreState>((set) => ({
    isPanelHovered: false,
    isActivePanel: false,

    setIsPanelHovered: (isPanelHovered) => set({ isPanelHovered: isPanelHovered }),
    setIsActivePanel: (isActivePanel) => set({ isActivePanel: isActivePanel })
}));