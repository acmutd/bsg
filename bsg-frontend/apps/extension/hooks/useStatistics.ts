import { useEffect, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { getServerUrl } from '../lib/config';

interface UserStatistics {
    score: number;
}

const POLL_INTERVAL_MS = 15_000;

export function useStatistics(isActive: boolean) {
    const roomId = useRoomStore((s) => s.roomId);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);

    useEffect(() => {
        if (!roomId || !isActive) return;

        let cancelled = false;

        const fetchStats = () => {
            fetch(`${getServerUrl()}/statistics/${roomId}`, { credentials: 'include' })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (!cancelled) setStatistics(data.data);
                })
                .catch((err) => console.error('[useStatistics]', err));
        };

        fetchStats();
        const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [roomId, isActive]);

    return { statistics };
}
