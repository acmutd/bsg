import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../lib/config'
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'next/router';

export const useRoomInit = () => {

    const router = useRouter();

    const initRoom = useRoomStore(s => s.initRoom);
    const setIsRoundStarted = useRoomStore(s => s.setIsRoundStarted);
    const setRoundEndTime = useRoomStore(s => s.setRoundEndTime);
    const userId = useUserStore(s => s.userId);

    const joinRoom = async (roomCode: string) => {
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
                room.shortCode,
                room.adminId,
                userId === room.adminId,
            );

            router.push('/room-page');

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

    const createRoom = async (roomCode: string, options: any) => {
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
                numHardProblems: options.hard || 0,
                tags: options.tags || []
            };
            console.log("Create round params", roundParams);
            const roundRes = await fetch(`${SERVER_URL}/rooms/${roomId}/rounds/create`, {
                method: 'POST',
                body: JSON.stringify(roundParams),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!roundRes.ok) {
                const roundData = await roundRes.json();
                throw new Error(roundData.error || roundData.message || 'Failed to create round');
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
                shortCode,
                adminId,
                userId === adminId
            );

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ activeRoomId: roomId });
                chrome.storage.local.remove('nextProblem');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }

            router.push('/room-page');

        } catch (e) {
            console.error("Failed to create room/round", e);
            alert("Failed to create room. Please try again.");
        }
    }

    // TODO: Return a boolean to determine if room-choice is loaded
    const checkActiveRoom = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/rooms/active`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.id || data.roomID) { // handle potentially different response structure
                    const roomId = data.id || data.roomID;
                    // Fetch room details to get round status
                    const roomRes = await fetch(`${SERVER_URL}/rooms/${roomId}`, { credentials: 'include' });
                    if (roomRes.ok) {
                        const roomData = await roomRes.json();
                        const room = roomData.data;
                        console.log("CheckActiveRoom: Fetched room details", room);
                        initRoom(
                            room.id,
                            room.shortCode,
                            room.adminId,
                            userId === room.adminId
                        );

                        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                            console.log("CheckActiveRoom: Saving activeRoomId to storage", room.id);
                            chrome.storage.local.set({ activeRoomId: room.id }, () => {
                                console.log("CheckActiveRoom: Saved activeRoomId");
                            });
                        } else {
                            console.warn("CheckActiveRoom: chrome.storage.local not available");
                        }

                        router.push('/room-page');

                        // Check for active round
                        console.log("CheckActiveRoom: Rounds:", room.rounds);
                        if (room.rounds && room.rounds.length > 0) {
                            const lastRound = room.rounds[room.rounds.length - 1];
                            const status = lastRound.Status || lastRound.status;
                            console.log("CheckActiveRoom: Last round status:", status);
                            // ROUND_STARTED = "started" (need to verify constant value, assuming string)
                            if (status === "started") {
                                setIsRoundStarted(true);
                                const startTimeStr = lastRound.LastUpdatedTime || lastRound.lastUpdatedTime;
                                const startTime = new Date(startTimeStr).getTime();
                                const duration = lastRound.duration || lastRound.Duration;
                                const endTime = startTime + (duration * 60 * 1000);
                                if (endTime > Date.now()) {
                                    setRoundEndTime(endTime);
                                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                                        chrome.storage.local.set({ roundEndTime: endTime });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to check active room", e);
        }
    }

    return { joinRoom, createRoom, checkActiveRoom };
}
