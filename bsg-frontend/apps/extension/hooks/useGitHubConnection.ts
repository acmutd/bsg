import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { getServerUrl } from '../lib/config';

export interface GitHubConnection {
    connected: boolean;
    username: string | null;
}

export function useGitHubConnection() {
    const isLoggedIn = useUserStore((s) => s.isLoggedIn);
    const [connection, setConnection] = useState<GitHubConnection>({ connected: false, username: null });

    const refresh = useCallback(async () => {
        try {
            const res = await fetch(`${getServerUrl()}/auth/github/connect/status`, { credentials: 'include' });
            if (!res.ok) return;
            const data: GitHubConnection = await res.json();
            setConnection(data);
            return data;
        } catch (err) {
            console.error('[useGitHubConnection]', err);
        }
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setConnection({ connected: false, username: null });
            return;
        }
        refresh();
    }, [isLoggedIn, refresh]);

    // opens the GitHub consent tab and refreshes the status once the user comes back
    const connect = () => {
        const popup = window.open(`${getServerUrl()}/auth/github/connect`);
        if (!popup) return;

        // same idea as login(): keep checking until it's linked or the tab is gone
        const checkConnection = async () => {
            const data = await refresh();
            if (data?.connected) return;
            if (popup.closed) {
                // the tab can close right after the link is saved, so check one last time
                refresh();
                return;
            }
            setTimeout(checkConnection, 1000);
        };

        setTimeout(checkConnection, 1000);
    };

    return { ...connection, connect };
}
