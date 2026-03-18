import { create } from 'zustand';
import { TabName } from '@bsg/models/TabName';
import { User } from '@bsg/models/User';
import { Message } from '@/hooks/useChatSocket';
import { GameEvent } from '@bsg/models/GameEvent';
import { Asterisk } from 'lucide-react';
import { InputType } from 'zlib';
import { group } from 'console';

interface roomStoreState {
  isInRoom: boolean;
  isConnected: boolean;
  isAdmin: boolean;
  adminId: string | null;
  roomCode: string | null;
  shortCode: string | null;
  participants: User[];
  activeTab: TabName;
  inputText: string;
  messages: Message[];
  isRoundStarted: boolean;
  roundEndTime: number | null;
  nextProblem: string | null;
  lastGameEvent: GameEvent | null;

  setIsInRoom: (isInRoom: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setAdminId: (adminId: string) => void;
  setRoomCode: (roomCode: string | null) => void;
  setShortCode: (shortCode: string | null) => void;
  setParticipants: (participants: User[]) => void;
  setActiveTab: (activeTab: TabName) => void;
  setInputText: (inputText: string) => void;
  setMessages: (messages: Message[]) => void;
  setIsRoundStarted: (isRoundStarted: boolean) => void;
  setRoundEndTime: (roundEndTime: number | null) => void;
  setNextProblem: (nextProblem: string | null) => void;
  setLastGameEvent: (lastGameEvent: GameEvent | null) => void;

  addMessage: (message: Message) => void;
  initRoom: (
    roomCode: string,
    adminId: string,
    isAdmin: boolean,
    shortCode: string
  ) => void;
  resetRoom: () => void;
}

const roomStoreInit = {
  isInRoom: false,
  isConnected: false,
  isAdmin: false,
  adminId: null,
  roomCode: null,
  shortCode: null,
  duration: 30,
  participants: [],
  activeTab: 'chat' as TabName,
  inputText: '',
  messages: [],
  isRoundStarted: false,
  roundEndTime: null,
  nextProblem: null,
  lastGameEvent: null
};

export const useRoomStore = create<roomStoreState>((set) => ({
  ...roomStoreInit,

  setIsInRoom: (isInRoom) => set({ isInRoom }),
  setIsConnected: (isConnected) => set({ isConnected: isConnected }),
  setIsAdmin: (isAdmin) => set({ isAdmin: isAdmin }),
  setAdminId: (adminId) => set({ adminId: adminId }),
  setRoomCode: (roomCode) => set({ roomCode: roomCode }),
  setShortCode: (shortCode) => set({ shortCode: shortCode }),
  setParticipants: (participants) => set({ participants: participants }),
  setActiveTab: (activeTab) => set({ activeTab: activeTab }),
  setInputText: (inputText) => set({ inputText: inputText }),
  setMessages: (messages) => set({ messages: messages }),
  setIsRoundStarted: (isRoundStarted) => set({ isRoundStarted: isRoundStarted }),
  setRoundEndTime: (roundEndTime) => set({ roundEndTime: roundEndTime }),
  setNextProblem: (nextProblem) => set({ nextProblem: nextProblem }),
  setLastGameEvent: (lastGameEvent) => set({ lastGameEvent: lastGameEvent }),

  addMessage: (message) => set(s => ({ messages: [...s.messages, message] })),
  initRoom: (
    roomCode,
    adminId,
    isAdmin,
    shortCode
  ) => set({ 
    roomCode: roomCode,
    adminId: adminId,
    isAdmin: isAdmin,
    shortCode: shortCode,
    isInRoom: true
  }),
  resetRoom: () => set(roomStoreInit)
}));