import { useEffect, useState } from "react";
import { useRoomStore } from "@/stores/useRoomStore";
import { SERVER_URL } from '../lib/config'
import { useUserStore } from "@/stores/useUserStore";
import { useRoomInit } from './useRoomInit';
import { useRouter } from 'next/router';

export function useRoomEvents() {

    const [ nextProblem, setNextProblem ] = useState<string | null>(null);

    const router = useRouter();

    const isLoggedIn = useUserStore(s => s.isLoggedIn);
    const isInRoom = useRoomStore(s => s.isInRoom);
    const userId = useUserStore(s => s.userId);
    const roomId = useRoomStore(s => s.roomId);
    const lastGameEvent = useRoomStore(s => s.lastGameEvent);
    const lastParticipantJoinTime = useRoomStore(s => s.lastParticipantJoinTime);
    const setRoundEndTime = useRoomStore(s => s.setRoundEndTime);
    const setIsRoundStarted = useRoomStore(s => s.setIsRoundStarted);
    const setResetRoom = useRoomStore(s => s.resetRoom);
    const setActiveTab = useRoomStore(s => s.setActiveTab)
    const { setRoomParticipants } = useRoomInit();

    // Refresh participants when someone joins or leaves
    useEffect(() => {
        if (!lastParticipantJoinTime || !roomId) return;
        setRoomParticipants(roomId);
    }, [lastParticipantJoinTime, roomId]);

    // Refresh participants when round starts (indicates room activity)
    useEffect(() => {
        if (!lastGameEvent || !roomId) return;

        if (lastGameEvent.type === 'round-start') {
            setRoomParticipants(roomId);
            const data = lastGameEvent.data;
            let problems: string[] = [];
            let endTime: number;

            if (data && typeof data === 'object' && data.startTime) {
                // new format: { startTime (unix seconds), duration (minutes), problems }
                problems = data.problems || [];
                if (data.serverNow) {
                    const remainingUntilStart = (data.startTime - data.serverNow) * 1000;
                    endTime = Date.now() + remainingUntilStart + (data.duration * 60 * 1000);
                } else {
                    endTime = (data.startTime * 1000) + (data.duration * 60 * 1000);
                }
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
            
                
            //problem array kept getting erased due to zustand stored it here
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ problems: problems });

            } 

            
                
            //problem array kept getting erased due to zustand stored it here
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ problems: problems });

            } 

                const targetSlug = problems[0];
                const currentPath = typeof window !== 'undefined' ? window.location.pathname : "";
                const alreadyOnTarget = currentPath.includes(`/problems/${targetSlug}/`);
                if (!alreadyOnTarget) {
                    window.open(`https://leetcode.com/problems/${targetSlug}/`, '_top');
                }
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

            const { nextProblem, userHandle } = eventData;

            // userHandle from backend is AuthID. userProfile.id is AuthID.
            if (userId && (userHandle == userId)) {
                window.open(`https://leetcode.com/problems/${nextProblem}/`, '_top');
            }
        } else if (lastGameEvent.type === 'round-end') {
            console.log("We got inside of the round-end game type ")
            setRoundEndTime(null);
            setIsRoundStarted(false);

            // Clear nextProblem, problems, and TTL state on round end
            setNextProblem(null);
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.remove('nextProblem');
                chrome.storage.local.remove('roundEndTime');
                chrome.storage.local.remove('problems');
                if (chrome.action) chrome.action.setBadgeText({ text: "" });
            }
            setActiveTab('leaderboard')
        }
    }, [lastGameEvent, isLoggedIn, isInRoom]);


    // Check storage for nextProblem state on mount and when extension opens
    useEffect(() => {
        const updateState = () => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['nextProblem'], (result) => {
                    setNextProblem(result.nextProblem || null);
                });
            }
        };

        updateState();

        // Listen for changes (e.g. background script updates while popup is open)
        const listener = (changes: any, namespace: string) => {
            if (namespace === 'local' && changes.nextProblem) {
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

    const handleStartRound = async () => {
        if (!roomId) return;
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomId}/start`, {
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
        if (!roomId) return;
        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomId}/end`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) {
                console.error('Failed to end round:', res.status, data);
                alert(`Failed to end round: ${data.error || res.status}`);
            } else {
                // Wait for round-end WS event to reset state.
                // As a fallback, reset locally after a short delay.
                setTimeout(() => {
                    setIsRoundStarted(false);
                    setRoundEndTime(null);
                    
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

    const handleLeaveRoom = async () => {

        if(!roomId && !userId) return;

        try {
            const response = await fetch(`${SERVER_URL}/rooms/${roomId}/leave`, {
                    method: 'POST',
                    credentials: 'include'
            });
            const message = await response.json()
            if(response.ok){
                setResetRoom();
                router.push('/start-page')
            } else{
                console.error(message)
            }

        } catch(error){
            console.warn('Unable to send request to leave room')
        }

    }

    return { handleStartRound, handleEndRound, handleLeaveRoom };
}