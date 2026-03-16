import { create } from 'zustand';
import { TabName } from '@bsg/models/TabName';
import { User } from '@bsg/models/User';
import { Message } from '@/hooks/useChatSocket';

interface roomStoreState {
  isInRoom: boolean;
  isConnected: boolean;
  roomCode: string | null;
  participants: User[];
  activeTab: TabName;
  messages: Message[];

  setIsInRoom: (isInRoom: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setRoomCode: (roomCode: string | null) => void;
  setParticipants: (participants: User[]) => void;
  setActiveTab: (activeTab: TabName) => void;
  setMessages: (messages: Message[]) => void;

  addMessage: (message: Message) => void;
}

export const useRoomStore = create<roomStoreState>((set) => ({
    isInRoom: false,
    isConnected: false,
    roomCode: null,
    participants: [],
    activeTab: 'chat',
    messages: [],

    setIsInRoom: (isInRoom) => set({ isInRoom: isInRoom }),
    setIsConnected: (isConnected) => set({ isConnected: isConnected }),
    setRoomCode: (roomCode) => set({ roomCode: roomCode }),
    setParticipants: (participants) => set({ participants: participants }),
    setActiveTab: (activeTab) => set({ activeTab: activeTab }),
    setMessages: (messages) => set({ messages: messages }),

    addMessage: (message) => set((prev) => ({ messages: [...prev.messages, message]}))
}));