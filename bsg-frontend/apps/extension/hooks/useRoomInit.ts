import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../lib/config'
import { useChatSocket } from './useChatSocket'
import { useUserStore } from '@/stores/useUserStore';

export const useRoomInit = () => {

    const { joinChatRoom } = useChatSocket();
    const initRoom = useRoomStore(s => s.initRoom);
    const userId = useUserStore(s => s.userId);

    const handleJoinRoom = async (roomCode: string) => {
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomCode}/join`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to join');

            const room = data.data;

            initRoom(
                room.id,
                room.adminId,
                userId === room.adminId,
                room.shortCode
            );

            joinChatRoom(room.id);

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ activeRoomId: room.id });
                chrome.storage.local.remove('nextProblem');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }
        } catch (e) {
            console.error(e);
            alert("Failed to join room. Please check the ID.");
        }
    }

    const handleCreateRoom = async (roomCode: string, options: any) => {
        try {
            // 1. Create Room
            const res = await fetch(`${SERVER_URL}/rooms`, {
                method: 'POST',
                body: JSON.stringify({ roomName: roomCode }),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const roomId = data.data.id;
            const adminId = data.data.adminId;
            const shortCode = data.data.shortCode;

            // 2. Create Round
            const roundParams = {
                duration: options.duration || 30,
                numEasyProblems: options.easy || 0,
                numMediumProblems: options.medium || 0,
                numHardProblems: options.hard || 0
            };
            const roundRes = await fetch(`${SERVER_URL}/rooms/${roomId}/rounds/create`, {
                method: 'POST',
                body: JSON.stringify(roundParams),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!roundRes.ok) {
                const roundData = await roundRes.json();
                throw new Error(roundData.error || 'Failed to create round');
            }

            // 3. Join the room (so creator is in active users list)
            const joinRes = await fetch(`${SERVER_URL}/rooms/${roomId}/join`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!joinRes.ok) {
                const joinData = await joinRes.json();
                throw new Error(joinData.error || 'Failed to join room');
            }

            // 4. Update state and join WebSocket room
            initRoom(
                roomId,
                adminId,
                userId === adminId,
                shortCode
            );

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ activeRoomId: roomId });
                chrome.storage.local.remove('nextProblem');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }

            joinChatRoom(roomId);
        } catch (e) {
            console.error("Failed to create room/round", e);
            alert("Failed to create room. Please try again.");
        }
    }

    return { handleJoinRoom, handleCreateRoom };
}
