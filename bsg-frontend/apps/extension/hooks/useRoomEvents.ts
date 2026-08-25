import { useEffect, useState, useRef } from "react";
import { useRoomStore } from "@/stores/useRoomStore";
import { getServerUrl } from '../lib/config'
import { useUserStore } from "@/stores/useUserStore";
import { useRoomInit } from './useRoomInit';
import { useRouter } from 'next/router';


export const parseProblemSlug = (url: string): string | null => {
    const match = url.match(/\/problems\/([^/?#]+)/);
    return match ? match[1] : null;
}

export const problemUrl = (slug: string): string => `https://leetcode.com/problems/${slug}/`;


export const resolveResumeSlug = (tabUrl: string, problems: string[]): string | null => {
    if (problems.length === 0) return null;

    // Already on one of this round's problems
    const currentSlug = parseProblemSlug(tabUrl);
    
    if (currentSlug && problems.includes(currentSlug)) return null;

    if (!tabUrl.includes('leetcode.com')) return null;

    return problems[0];
}


// The single door for every automatic navigation. rtc-service replays events to
// each reconnecting socket, and navigating reloads the panel, so any mover that
// can re-fire will bounce the user forever. Two invariants prevent that, kept
// here so no future caller has to remember them:
//   1. never navigate to the page we are already on
//   2. decide from the tab's live URL, so a replay resolves to "stay put"
//      instead of re-issuing a move the user has already acted past
const navigateActiveTab = async (decide: (tabUrl: string) => string | null) => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return;

    const targetSlug = decide(tab.url);
    if (!targetSlug || parseProblemSlug(tab.url) === targetSlug) return;

    chrome.tabs.update(tab.id, { url: problemUrl(targetSlug) });
}

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

    const LastGameRef = useRef<string>('')

    // Refresh participants when someone joins or leaves (debounced to avoid
    // bursty refreshes when several events arrive at once).
    useEffect(() => {
        if (!lastParticipantJoinTime || !roomId) return;
        const timer = setTimeout(() => setRoomParticipants(roomId), 800);
        return () => clearTimeout(timer);
    }, [lastParticipantJoinTime, roomId]);

    useEffect(() => {

        if(!roomId) return;

        if(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local){
            chrome.storage.local.get(["lastGameEvent", "problems", "roundEndTime"], async function(result) {
                const LastGameEvent = result.lastGameEvent

                if(!LastGameEvent) return;

                //Re-render didnt happen so we are fine early return
                if (LastGameRef.current == LastGameEvent) return;

                //we got here meaning re-render actually happened or someone left the tab so we should
                //go to the problem page
                if(LastGameEvent === 'round-start' || LastGameEvent === 'join-round'){
                    const storedProblems: string[] = result.problems || [];
                    const storedEndTime: number | null = result.roundEndTime ?? null;

                    let shouldResume = false;
                    if(storedEndTime && storedEndTime > Date.now()){
                        shouldResume = true
                    }

                    if (!shouldResume || storedProblems.length === 0) return;

                    await navigateActiveTab(url => resolveResumeSlug(url, storedProblems));
                }

            })
        }

    },[])

    // Refresh participants when round starts (indicates room activity)
    useEffect(() => {
        if (!lastGameEvent || !roomId) return;

        // Shared by round-start and join-round: both put a client into a running
        // round, the only difference being whether it was there when it began.
        const applyRoundData = (data: any) => {
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
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ problems: problems})
                }
                // Resume rather than force: someone already on one of this round's
                // problems stays put, so the replayed round-start cannot undo a step
                // they just took with the toolbar arrows.
                navigateActiveTab(url => resolveResumeSlug(url, problems));
            }
        };

        if (lastGameEvent.type === 'round-start') {
            LastGameRef.current = 'round-start'
            setRoomParticipants(roomId);
            applyRoundData(lastGameEvent.data);
            //problem array kept getting erased due to zustand stored it here and the lastGameEvent as well
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ lastGameEvent: lastGameEvent.type})
            }
        } else if (lastGameEvent.type === 'join-round') {
            LastGameRef.current = 'join-round'
            setRoomParticipants(roomId);

            // join-round is broadcast to the whole room, so only the user who
            // actually joined should be set up and navigated.
            const data = lastGameEvent.data;
            if (data?.userID === userId && data?.roundStatus === 'in-progress') {
                applyRoundData(data);
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ lastGameEvent: lastGameEvent.type})
                }
            }
        } else if (lastGameEvent.type === 'next-problem') {
            LastGameRef.current = 'next-problem'
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
            // The server addressed this move to one user, so unlike the resume
            // paths it may move them off a valid round problem - but it still
            // goes through the door, which no-ops once they have arrived.
            if (userId && (userHandle == userId)) {
                navigateActiveTab(() => nextProblem);
            }
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ lastGameEvent: lastGameEvent.type})
            }
        } else if (lastGameEvent.type === 'round-end') {
            LastGameRef.current = 'round-end'
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
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ lastGameEvent: lastGameEvent.type})
            }
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
            const res = await fetch(`${getServerUrl()}/rooms/${roomId}/start`, {
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
            const res = await fetch(`${getServerUrl()}/rooms/${roomId}/end`, {
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
                        chrome.storage.local.remove("lastGameEvent");
                        chrome.storage.local.remove("problems");
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
            const response = await fetch(`${getServerUrl()}/rooms/${roomId}/leave`, {
                    method: 'POST',
                    credentials: 'include'
            });
            const message = await response.json()
            if(response.ok){

                if(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local){
                    chrome.storage.local.remove("activeRoomId");
                    chrome.storage.local.remove('roundEndTime');
                    chrome.storage.local.remove("lastGameEvent");
                    chrome.storage.local.remove("problems");
                }
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