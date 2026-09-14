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
  previousTab: Exclude<TabName, 'settings'>;
  isRoundStarted: boolean;
  roundEndTime: number | null;
  roundDuration: number | null;
  lastGameEvent: GameEvent | null;
  roomNotice: string | null;
  problems: string[];
  lastParticipantJoinTime: number | null;
  unreadCount: number; // for chat notification count

  incrementUnread: () => void; // for chat notification count
  clearUnread: () => void; // for chat notification count
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
  setRoundDuration: (roundDuration: number | null) => void;
  setLastGameEvent: (lastGameEvent: GameEvent | null) => void;
  setRoomNotice: (roomNotice: string | null) => void;
  setProblems: (problems: string[]) => void;
  setLastParticipantJoinTime: (time: number | null) => void;

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
  previousTab: 'chat' as Exclude<TabName, 'settings'>,
  isRoundStarted: false,
  roundEndTime: null,
  roundDuration: null,
  lastGameEvent: null,
  roomNotice: null,
  problems: [],
  lastParticipantJoinTime: null,
  unreadCount: 0, // set to 0 initially
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
  setActiveTab: (activeTab) => set((state) => ({
    activeTab,
    // Remember the screen that opened Settings so its button can return there.
    previousTab: activeTab === 'settings'
      ? (state.activeTab === 'settings' ? state.previousTab : state.activeTab)
      : state.previousTab,
  })),
  setIsRoundStarted: (isRoundStarted) => set({ isRoundStarted: isRoundStarted }),
  setRoundEndTime: (roundEndTime) => set({ roundEndTime: roundEndTime }),
  setRoundDuration: (roundDuration) => set({ roundDuration: roundDuration }),
  setLastGameEvent: (lastGameEvent) => set({ lastGameEvent: lastGameEvent }),
  // for chat notification count
  setRoomNotice: (roomNotice) => set({ roomNotice: roomNotice }),
  setProblems: (problems) => set({ problems: problems }),
  setLastParticipantJoinTime: (time) => set({ lastParticipantJoinTime: time }),
  incrementUnread: () => set((state) => {
    return { unreadCount: state.unreadCount + 1 };
  }),
  clearUnread: () => {
    set({ unreadCount: 0 });
  },


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
    isInRoom: true,
    unreadCount: 0
  }),
  resetRoom: () => set(roomStoreInit)
}));
