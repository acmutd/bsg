import { create } from 'zustand';
import { TabName } from '@bsg/models/TabName';
import { User } from '@bsg/models/User';
import { GameEvent } from '@bsg/models/GameEvent';

interface roomStoreState {
  isInRoom: boolean;
  roomId: string | null;
  isConnected: boolean;
  isAdmin: boolean;
  adminId: string | null;
  roomCode: string | null;
  participants: User[];
  activeTab: TabName;
  isRoundStarted: boolean;
  roundEndTime: number | null;
  lastGameEvent: GameEvent | null;

  setIsInRoom: (isInRoom: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  setIsConnected: (isConnected: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setAdminId: (adminId: string) => void;
  setRoomCode: (roomCode: string | null) => void;
  setParticipants: (participants: User[]) => void;
  setActiveTab: (activeTab: TabName) => void;
  setIsRoundStarted: (isRoundStarted: boolean) => void;
  setRoundEndTime: (roundEndTime: number | null) => void;
  setLastGameEvent: (lastGameEvent: GameEvent | null) => void;

  initRoom: (
    roomId: string,
    roomCode: string,
    adminId: string,
    isAdmin: boolean
  ) => void;
  resetRoom: () => void;
}

const roomStoreInit = {
  isInRoom: false,
  roomId: null,
  isConnected: false,
  isAdmin: false,
  adminId: null,
  roomCode: null,
  participants: [],
  activeTab: 'chat' as TabName,
  isRoundStarted: false,
  roundEndTime: null,
  lastGameEvent: null
};

export const useRoomStore = create<roomStoreState>((set) => ({
  ...roomStoreInit,

  setIsInRoom: (isInRoom) => set({ isInRoom }),
  setRoomId: (roomId) => set({ roomId: roomId }),
  setIsConnected: (isConnected) => set({ isConnected: isConnected }),
  setIsAdmin: (isAdmin) => set({ isAdmin: isAdmin }),
  setAdminId: (adminId) => set({ adminId: adminId }),
  setRoomCode: (roomCode) => set({ roomCode: roomCode }),
  setParticipants: (participants) => set({ participants: participants }),
  setActiveTab: (activeTab) => set({ activeTab: activeTab }),
  setIsRoundStarted: (isRoundStarted) => set({ isRoundStarted: isRoundStarted }),
  setRoundEndTime: (roundEndTime) => set({ roundEndTime: roundEndTime }),
  setLastGameEvent: (lastGameEvent) => set({ lastGameEvent: lastGameEvent }),

  initRoom: (
    roomId,
    roomCode,
    adminId,
    isAdmin
  ) => set({ 
    roomId: roomId,
    roomCode: roomCode,
    adminId: adminId,
    isAdmin: isAdmin,
    isInRoom: true
  }),
  resetRoom: () => set(roomStoreInit)
}));