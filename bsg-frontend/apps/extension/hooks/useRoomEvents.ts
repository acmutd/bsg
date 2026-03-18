import { useRoomStore } from "@/stores/useRoomStore";
import { useChatSocket } from "./useChatSocket";
import { SERVER_URL } from '../lib/config'
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { User } from "@bsg/models/User";

export function useRoomEvents() {

    const { joinChatRoom } = useChatSocket();
    const isLoggedIn = useUserStore(s => s.isLoggedIn);
    const isInRoom = useRoomStore(s => s.isInRoom);
    const userId = useUserStore(s => s.userId);
    const roomCode = useRoomStore(s => s.roomCode);
    const nextProblem = useRoomStore(s => s.nextProblem);
    const lastGameEvent = useRoomStore(s => s.lastGameEvent);
    const setNextProblem = useRoomStore(s => s.setNextProblem);
    const setRoundEndTime = useRoomStore(s => s.setRoundEndTime);
    const setIsRoundStarted = useRoomStore(s => s.setIsRoundStarted);
    const loginUser = useUserStore(s => s.loginUser);
    const initRoom = useRoomStore(s => s.initRoom);
    const resetRoom = useRoomStore(s => s.resetRoom);

    // Handle Game Events
    useEffect(() => {
        if (!lastGameEvent) return;

        if (lastGameEvent.type === 'round-start') {
            const data = lastGameEvent.data;
            let problems: string[] = [];
            let endTime: number;

            if (data && typeof data === 'object' && data.startTime) {
                // new format: { startTime (unix seconds), duration (minutes), problems }
                problems = data.problems || [];
                endTime = (data.startTime * 1000) + (data.duration * 60 * 1000);
            } else {
                // legacy fallback: comma-separated slugs
                // const slugs = typeof data === 'string' ? data.split(',') : [];
                // problems = slugs;
                // const duration = currentRoom?.options?.duration || 30;
                // endTime = Date.now() + duration * 60 * 1000;
                endTime = Date.now() + 30 * 60 * 1000;
            }

            setRoundEndTime(endTime);
            setIsRoundStarted(true);

            // Store for background script TTL check
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ roundEndTime: endTime });
            }

            // Clear stale nextProblem state
            setNextProblem(null);
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.remove('nextProblem');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }

            if (problems.length > 0) {
                window.open(`https://leetcode.com/problems/${problems[0]}/`, '_top');
            }
        } else if (lastGameEvent.type === 'next-problem') {
            let eventData = lastGameEvent.data;
            if (typeof eventData === 'string') {
                try {
                    eventData = JSON.parse(eventData);
                } catch (e) {
                    console.error("Failed to parse next-problem data in component", e);
                }
            }

            console.log("DEBUG: Handling next-problem event", { eventData, userId });

            const { nextProblem, userHandle } = eventData;

            // userHandle from backend is AuthID. userProfile.id is AuthID.
            if (userId && (userHandle == userId)) {
                console.log("DEBUG: Redirecting to next problem", nextProblem);
                window.open(`https://leetcode.com/problems/${nextProblem}/`, '_top');
            } else {
                console.log("DEBUG: Not redirecting. ID mismatch or no profile.", {
                    requiredHandle: userHandle,
                    myId: userId
                });
            }
        } else if (lastGameEvent.type === 'round-end') {
            setRoundEndTime(null);
            setIsRoundStarted(false);
            resetRoom();

            // Clear nextProblem and TTL state on round end
            setNextProblem(null);
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.remove('nextProblem');
                chrome.storage.local.remove('roundEndTime');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }
        }
    }, [lastGameEvent, isLoggedIn, isInRoom]);

    // Check storage for nextProblem state on mount and when extension opens
    useEffect(() => {
        const updateState = () => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['nextProblem'], (result) => {
                    console.log("DEBUG EVENT: on mount chrome.storage.local.get nextProblem:", result.nextProblem);
                    setNextProblem(result.nextProblem || null);
                });
            }
        };

        updateState();

        // Listen for changes (e.g. background script updates while popup is open)
        const listener = (changes: any, namespace: string) => {
            if (namespace === 'local' && changes.nextProblem) {
                console.log("DEBUG EVENT: chrome.storage.local nextProblem changed:", changes.nextProblem);
                setNextProblem(changes.nextProblem.newValue || null);
            }
        };

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener(listener);
        }

        return () => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                chrome.storage.onChanged.removeListener(listener);
            }
        };
    }, []);

    useEffect(() => {
        console.log("DEBUG EVENT: React state nextProblem is now:", nextProblem);
    }, [nextProblem]);

    const handleStartRound = async () => {
        if (!roomCode) return;
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomCode}/start`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to start round: ${res.status}`);
            }
        } catch (e: any) {
            console.error("Failed to start round", e);
            alert(`Failed to start round: ${e.message}`);
        }
    }

    const handleEndRound = async () => {
        if (!roomCode) return;
        console.log('Ending round for room:', roomCode);
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomCode}/end`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) {
                console.error('Failed to end round:', res.status, data);
                alert(`Failed to end round: ${data.error || res.status}`);
            } else {
                console.log('End round response:', data);
                // Wait for round-end WS event to reset state.
                // As a fallback, reset locally after a short delay.
                setTimeout(() => {
                    setIsRoundStarted(false);
                    setRoundEndTime(null);
                    resetRoom();
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.remove('roundEndTime');
                    }
                }, 2000);
            }
        } catch (e: any) {
            console.error('Failed to end round (network error):', e);
            alert(`Failed to end round: ${e.message}`);
        }
    }

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
                if (response?.success) {
                    const user: User = response.user;
                    loginUser(
                        user.id,
                        user.name,
                        user.email,
                        user.photo
                    );

                    checkActiveRoom();
                }
            })
        }
    }, [])

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
                            room.adminId,
                            userId === room.adminId,
                            room.shortCode
                        );

                        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                            console.log("CheckActiveRoom: Saving activeRoomId to storage", room.id);
                            chrome.storage.local.set({ activeRoomId: room.id }, () => {
                                console.log("CheckActiveRoom: Saved activeRoomId");
                            });
                        } else {
                            console.warn("CheckActiveRoom: chrome.storage.local not available");
                        }

                        joinChatRoom(room.id);

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

    return { handleStartRound, handleEndRound, checkActiveRoom };
}