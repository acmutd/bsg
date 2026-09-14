import { useRouter } from "next/router";
import { useState } from "react";
import { User } from "@bsg/models/User";
import { useUserStore } from "@/stores/useUserStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { getServerUrl } from "../lib/config";

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

        try {

            //Open the OAuth Window
            const popup = window.open(`${getServerUrl()}/auth/${Provider}`)

            //Keep polling to see if auth is done or not
            const checkAuth = async () => {

                //wait for response from the server
                const response = await fetch(`${getServerUrl()}/auth/user`, {
                    method: "GET",
                    credentials: "include"
                });

                if (response.ok) {
                    const userObject: User = await response.json()
                    loginUser(
                        userObject.id,
                        userObject.name,
                        userObject.email,
                        userObject.photo
                    );

                    popup?.close()
                    router.push('/start-page');

                    return userObject;

                } else if (popup && !popup.closed) {
                    //Not Authenticated yet
                    setTimeout(checkAuth, 1000);
                }
            }

            setTimeout(checkAuth, 5000);

        } catch (err) {
            window.open("_blank")
            console.warn("Authentication failed")

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

        const finishLogout = () => {
            resetUser();
            resetRoom();
            router.push('/login-page');
        };

        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined') {
            chrome.runtime.sendMessage({type: 'LOGOUT'}, (response) => {
                if (response && response.success) {
                    finishLogout();
                }
            })
        } else {
            finishLogout();
        }
    }

    return {
        credentials,
        handleChange,
        login,
        logout
    }
}
