import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { User } from "@bsg/models/User";
import { useUserStore } from "@/stores/useUserStore";
import { useRoomInit } from "./useRoomInit";

export type AuthProvider = 'google' | 'github';

export const useLogin = () => {

    const router = useRouter();
    const { checkActiveRoom } = useRoomInit();

    const isLoggedIn = useUserStore(s => s.isLoggedIn);
    const loginUser = useUserStore(s => s.loginUser);
    const resetUser = useUserStore(s => s.resetUser);

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
            const popup = window.open(`http://localhost:3000/auth/${Provider}`)

            //Keep polling to see if auth is done or not
            const checkAuth = async () => {

                //wait for response from the server
                const response = await fetch(`http://localhost:3000/auth/user`, {
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

    const logout = () => {
        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined') {
            chrome.runtime.sendMessage({type: 'LOGOUT'}, (response) => {
                if (response && response.success) {
                    resetUser();
                }
            })
        }
    }

    // TODO: Display a loading screen while active room is being checked (start-page will be loaded only after failure)
    // Check if the user is logged in using the service worker
    useEffect(() => {
        //check if chrome api is available
        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined') {

            chrome.runtime.sendMessage({type: 'CHECK_AUTH'}, (response) => {
                if (response && response.success) {
                    const user: User = response.user;
                    loginUser(
                        user.id,
                        user.name,
                        user.email,
                        user.photo
                    );

                    router.push('/start-page');
                    checkActiveRoom();
                }
            })
        }
    }, [isLoggedIn, router]); //router because ESlint error nothing to do with re-render

    return {
        credentials,
        handleChange,
        login,
        logout
    }
}
