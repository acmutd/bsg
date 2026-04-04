import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../lib/config'
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'next/router';

export const useRoomInit = () => {

    const router = useRouter();

    const initRoom = useRoomStore(s => s.initRoom);
    const setIsRoundStarted = useRoomStore(s => s.setIsRoundStarted);
    const setRoundEndTime = useRoomStore(s => s.setRoundEndTime);
    const setRoomNotice = useRoomStore(s => s.setRoomNotice);
    const userId = useUserStore(s => s.userId);

    const parseJsonSafe = async (res: Response): Promise<any | null> => {
        try {
            return await res.json();
        } catch {
            return null;
        }
    };

    const extractErrorMessage = (payload: any, fallback: string): string => {
        if (!payload) return fallback;
        if (typeof payload === 'string' && payload.trim()) return payload;
        if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
        if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
        if (typeof payload.details === 'string' && payload.details.trim()) return payload.details;
        return fallback;
    };

    const sanitizeRoundCreationError = (message: string): string => {
        if (!message) return 'Failed to create round.';
        if (message.includes('Not enough tagged problems found.')) {
            return 'Failed to create round. Not enough tagged problems found.';
        }
        return message;
    };

    const joinRoom = async (roomCode: string): Promise<{ success: true } | { success: false; message: string }> => {
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomCode}/join`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await parseJsonSafe(res);
            if (!res.ok) {
                return { success: false, message: extractErrorMessage(data, 'Failed to join room.') };
            }

            const room = data.data;

            initRoom(
                room.id,
                room.shortCode,
                room.adminId,
                userId === room.adminId,
            );

            setRoomNotice(null);

            router.push('/room-page');

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ activeRoomId: room.id });
                chrome.storage.local.remove('nextProblem');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }

            return { success: true };

        } catch (e) {
            console.error(e);
            return { success: false, message: 'Failed to join room. Please try again.' };
        }
    }

    const createRoom = async (roomCode: string, options: any): Promise<{ success: true } | { success: false; message: string }> => {
        try {
            // 1. Create Room
            const res = await fetch(`${SERVER_URL}/rooms`, {
                method: 'POST',
                body: JSON.stringify({ roomName: roomCode }),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await parseJsonSafe(res);
            if (!res.ok) {
                return { success: false, message: extractErrorMessage(data, 'Failed to create room.') };
            }
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
            const roundData = await parseJsonSafe(roundRes);
            if (!roundRes.ok) {
                const rawMessage = extractErrorMessage(roundData, 'Failed to create round.');
                return { success: false, message: sanitizeRoundCreationError(rawMessage) };
            }

            // 3. Join the room (so creator is in active users list)
            const joinRes = await fetch(`${SERVER_URL}/rooms/${roomId}/join`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!joinRes.ok) {
                const joinData = await parseJsonSafe(joinRes);
                return { success: false, message: extractErrorMessage(joinData, 'Room was created, but failed to join.') };
            }

            // 4. Update state and join WebSocket room
            initRoom(
                roomId,
                shortCode,
                adminId,
                userId === adminId
            );

            const warningMessage = roundData?.warningMessage;
            setRoomNotice(typeof warningMessage === 'string' && warningMessage.trim() ? warningMessage : null);

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ activeRoomId: roomId });
                chrome.storage.local.remove('nextProblem');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }

            router.push('/room-page');
            return { success: true };

        } catch (e) {
            console.error("Failed to create room/round", e);
            return { success: false, message: 'Failed to create room. Please try again.' };
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
                        setRoomNotice(null);

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
