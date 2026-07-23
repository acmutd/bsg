import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { SERVER_URL } from '../lib/config';

interface UserStatistics {
    score: number;
}

const POLL_INTERVAL_MS = 15_000;

export function useStatistics() {
    const roomId = useRoomStore((s) => s.roomId);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const fetchStats = () => {
            fetch(`${SERVER_URL}/statistics/${roomId}`, { credentials: 'include' })
                .then((res) => res.json())
                .then((data) => setStatistics(data.data))
                .catch((err) => console.error('[useStatistics]', err));
        };

        fetchStats();
        const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [roomId]);

    return { statistics };
}
