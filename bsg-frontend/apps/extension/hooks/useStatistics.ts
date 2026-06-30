import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../lib/config';

export interface UserStatistics {
    score: number;
}

export interface RoundProblem {
    id: number;
    name: string;
    slug: string;
    difficulty: string;
}

export interface RoundDetails {
    roundId: number;
    status: string;
    problems: RoundProblem[];
    /** Map of userAuthID → list of solved problem IDs */
    solvedProblems: Record<string, number[]>;
}

const POLL_INTERVAL_MS = 15_000;

export function useStatistics() {
    const roomId = useRoomStore((s) => s.roomId);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [roundDetails, setRoundDetails] = useState<RoundDetails | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const fetchStats = () => {
            // Fetch original statistics
            fetch(`${SERVER_URL}/statistics/${roomId}`, { credentials: 'include' })
                .then((res) => res.json())
                .then((data) => setStatistics(data.data))
                .catch((err) => console.error('[useStatistics]', err));
            
            // Fetch new round details for problem breakdowns
            fetch(`${SERVER_URL}/rooms/${roomId}/round-details`, { credentials: 'include' })
                .then((res) => {
                    if (res.status === 404) return null;
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then((data) => {
                    if (data) setRoundDetails(data);
                })
                .catch((err) => console.error('[useStatistics - round details]', err));
        };

        fetchStats();
        const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [roomId]);

    return { statistics, roundDetails };
}
