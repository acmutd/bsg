import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../lib/config';
import { Participant } from '@bsg/models/Participant';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Raw shape returned by GET /rooms/:id/leaderboard */
interface LeaderboardEntry {
    userAuthID: string;
    handle: string;
    photoURL: string;
    /** already-decoded integer score from the backend */
    score: number;
    rank: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000;

/**
 * Fetches and polls the room leaderboard from the backend.
 *
 * - Automatically polls every 15 s while a round is active.
 * - Triggers an extra fetch when a round ends (so final standings display).
 * - Maps backend `LeaderboardEntry[]` → frontend `Participant[]`.
 */
export function useLeaderboard() {
    const roomId = useRoomStore((s) => s.roomId);
    const isRoundStarted = useRoomStore((s) => s.isRoundStarted);
    const lastGameEvent = useRoomStore((s) => s.lastGameEvent);

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        if (!roomId) return;

        if (abortRef.current) {
            abortRef.current.abort();
        }
        const abortController = new AbortController();
        abortRef.current = abortController;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${SERVER_URL}/rooms/${roomId}/leaderboard`, {
                credentials: 'include',
                signal: abortController.signal,
            });

            if (res.status === 404) {
                // No active round yet — clear board gracefully
                setParticipants([]);
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || `HTTP ${res.status}`);
            }

            const data = await res.json() as { leaderboard: LeaderboardEntry[] };
            const entries = data.leaderboard ?? [];

            // Map backend entries → Participant (frontend model)
            const mapped: Participant[] = entries.map((entry) => ({
                id: entry.userAuthID,
                username: entry.handle || entry.userAuthID,
                avatarUrl: entry.photoURL || undefined,
                defaultColor: '#72ab1c',
                currentProblemIndex: null,
                score: entry.score,
            }));

            // Entries already come back sorted by rank from the backend
            setParticipants(mapped);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('[useLeaderboard] fetch failed:', err);
            setError(err?.message ?? 'Failed to load leaderboard');
        } finally {
            setIsLoading(false);
        }
    }, [roomId]);

    // ── Initial fetch whenever the room changes ──────────────────────────────
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // ── Polling: active while a round is running ─────────────────────────────
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isRoundStarted && roomId) {
            intervalRef.current = setInterval(fetchLeaderboard, POLL_INTERVAL_MS);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRoundStarted, roomId, fetchLeaderboard]);

    // ── Extra fetch on round-end so final standings appear immediately ────────
    useEffect(() => {
        if (lastGameEvent?.type === 'round-end') {
            fetchLeaderboard();
        }
    }, [lastGameEvent, fetchLeaderboard]);

    return { participants, isLoading, error, refresh: fetchLeaderboard };
}
