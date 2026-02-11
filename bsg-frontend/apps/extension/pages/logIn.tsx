import { Button } from "@bsg/ui/button";
import Logo from "@bsg/components/Logo";
import { useEffect, useState } from 'react';
import {Poppins} from 'next/font/google';
import { useRouter } from 'next/router';


type AuthProvider = 'google' | 'github';

interface User  {
        id: string,
        name: string,
        email: string,
        photo: string
}

const poppins = Poppins({ weight: '400', subsets: ['latin'] })


export default function UserLogIn() {

    const[user, setUser] = useState(false);
    const[isloggedIn, setLoggedIn] = useState(false);
    const[userProfile, setUserProfile] = useState<User | null>(null);
    const[authProvider, setAuthProvider] = useState<AuthProvider | undefined>(undefined)

    const router = useRouter()

    const Login = async (Provider: AuthProvider) => {
        
        try{
            
            //Open the OAuth Window
            const popup = window.open(`https://bsg-kappa.vercel.app/auth/${Provider}`)

            //Keep polling to see if auth is done or not
            const checkAuth = async () => {
                    
                    //wait for response from the server
                    const response = await fetch(`https://bsg-kappa.vercel.app/auth/user`, {
                                                method: "GET",
                                                credentials: "include"
                    });

                    if(response.ok){
                        const userObject = await response.json()
                        setLoggedIn(true)
                        setUserProfile(userObject)
                        popup?.close()

                        return userObject;

                    }else if (popup && !popup.closed){
                        //Not Authenticated yet
                        setTimeout(checkAuth, 1000);

                    }
                }


                setTimeout(checkAuth, 5000);


            }


         catch (err) {
            window.open("_blank")
            console.warn("Authentication failed")

        }
    }




    const Logout = () => {
        console.log("Got inside of the logout function ")

        if(typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined' ){
            chrome.runtime.sendMessage({type: 'LOGOUT'}, (response) => {
                if(response && response.success){
                    setLoggedIn(false)
                }
            })
        }
    }




      //check if the user is logged in using the service worker
    useEffect(() => {
        console.log("useEffect running on mount");

        //check if chrome api is available
        if(typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && typeof chrome.runtime.id !== 'undefined'){
                console.log("Sending CHECK_AUTH message");

                chrome.runtime.sendMessage({type: 'CHECK_AUTH'}, (response) => {
                    console.log("Received response from background:", response);
                    if(response && response.success){
                    console.log("Auth successful, setting user:", response.user);
                    setUserProfile(response.user)
                    setUser(true)
                    setLoggedIn(true)
                    router.push('/room-user')
                    } else {
                    console.log("Auth failed or no session");
                    }

                })

        }

        }, [isloggedIn, router]); //router because ESlint error nothing to do with re-render 

    return (

        <div className={`${poppins.className} min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8`}>
          <div className="bg-[#333333] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-8 pt-16 space-y-8">
            <div className="flex justify-center mb-2">
              <span className="text-5xl font-extrabold tracking-wide text-white drop-shadow-lg">BSG_</span>
            </div>
            <div className="flex flex-col justify-center items-center gap-y-4">

                {isloggedIn ? (   
                    <p>Hello {userProfile?.name}</p>
                ):(
                    <Button onClick={async () => { await Login('google')}}>
                        <span>Sign in with Google</span>
                    </Button>
                )}
            </div>
          </div>
        </div>

    )

}

