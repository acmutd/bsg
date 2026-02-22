import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {User} from "@bsg/models/User";

export type AuthProvider = 'google' | 'github';

export const useLogIn = () => {
    const [user, setUser] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [isInTab, setIsInTab] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false);

    const router = useRouter()
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
                    const userObject = await response.json()
                    setLoggedIn(true)
                    setUserProfile(userObject)
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
        console.log("Got inside of the logout function ")

        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined') {
            chrome.runtime.sendMessage({type: 'LOGOUT'}, (response) => {
                if (response && response.success) {
                    setLoggedIn(false)
                }
            })
        }
    }


    //check if the user is logged in using the service worker
    useEffect(() => {
        console.log("useEffect running on mount");

        //check if chrome api is available
        if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined') {
            console.log("Sending CHECK_AUTH message");

            chrome.runtime.sendMessage({type: 'CHECK_AUTH'}, (response) => {
                console.log("Received response from background:", response);
                if (response && response.success) {
                    console.log("Auth successful, setting user:", response.user);
                    setUserProfile(response.user)
                    setUser(true)
                    setLoggedIn(true)
                    void router.push('/room-user')
                } else {
                    console.log("Auth failed or no session");
                }

            })

        }

    }, [loggedIn, router]); //router because ESlint error nothing to do with re-render

    return {
        credentials,
        handleChange,
        login
    }
}
