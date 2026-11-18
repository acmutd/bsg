import { useRouter } from "next/router";
import { useState } from "react";
import { User } from "@bsg/models/User";
import { useUserStore } from "@/stores/useUserStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { getServerUrl } from "../lib/config";
import { pushRoute } from "@/utils/navigation";

export type AuthProvider = 'google' | 'github';

export const useLogin = () => {

    const router = useRouter();

    const isLoggedIn = useUserStore(s => s.isLoggedIn);
    const loginUser = useUserStore(s => s.loginUser);
    const resetUser = useUserStore(s => s.resetUser);
    const resetRoom = useRoomStore(s => s.resetRoom);

    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    })
    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        setCredentials({...credentials, [e.target.name]: e.target.value})
    }

    const login = async (Provider: AuthProvider) => {
        let popup: Window | null = null;
        try {
            popup = window.open(`${getServerUrl()}/auth/${Provider}`);
            if (!popup) {
                throw new Error('The authentication popup was blocked');
            }

            const deadline = Date.now() + 60_000;
            let popupClosedAt: number | null = null;
            let lastRequestError: unknown;
            while (Date.now() < deadline) {
                let response: Response | null = null;
                try {
                    response = await fetch(`${getServerUrl()}/auth/user`, {
                        method: "GET",
                        credentials: "include"
                    });
                } catch (error) {
                    lastRequestError = error;
                }

                if (response?.ok) {
                    const userObject: User = await response.json();
                    loginUser(
                        userObject.id,
                        userObject.name,
                        userObject.email,
                        userObject.photo
                    );
                    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                        await chrome.storage.local.set({ user: userObject });
                    }

                    await pushRoute(router, '/start-page');
                    return;
                }

                if (popup.closed) {
                    popupClosedAt ??= Date.now();
                    if (Date.now() - popupClosedAt >= 5000) {
                        console.warn('Authentication popup closed before an authenticated session was available');
                        return;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.warn('Timed out waiting for authentication', lastRequestError);
        } catch (err) {
            console.warn("Authentication failed", err);
        } finally {
            popup?.close();
        }
    }

    const logout = async () => {
        // Leave the room (if any) so the server removes us from the participant list
        const currentRoomId = useRoomStore.getState().roomId;
        if (currentRoomId) {
            try {
                await fetch(`${getServerUrl()}/rooms/${currentRoomId}/leave`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.warn('Unable to leave room during logout', error);
            }
        }
        const finishLogout = async () => {
            resetUser();
            resetRoom();
            await pushRoute(router, '/login-page');
        };

        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined') {
            chrome.runtime.sendMessage({type: 'LOGOUT'}, (response) => {
                if (response && response.success) {
                    finishLogout().catch(error => console.error('Failed to navigate after logout', error));
                }
            })
        } else {
            finishLogout().catch(error => console.error('Failed to navigate after logout', error));
        }
    }

    return {
        credentials,
        handleChange,
        login,
        logout
    }
}
