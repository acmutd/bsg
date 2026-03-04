import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow'
import { TabName } from '@bsg/models/TabName';

interface ActiveTabState {
  activeTab: TabName;
  setActiveTab: (tabName: TabName) => void;
}

export const useActiveTab = create<ActiveTabState>((set) => ({
    activeTab: 'chat',
    setActiveTab: (tabName) => set({ activeTab: tabName })
}));