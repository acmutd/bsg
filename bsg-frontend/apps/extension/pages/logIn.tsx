"use client";
import CreateRoom from "@bsg/components/createRoom/createRoom";
import LogInForm from "@bsg/components/logInForm/logInForm";
import {Button} from "@bsg/ui/button";
import Logo from "@bsg/components/Logo";    
import { SignInWithGoogleRedirect, HandleAuthRedirectedResult } from "../firebase/auth/signIn/googleImplementation/googleAuth";
import { useEffect, useState } from 'react';
import { User }  from 'firebase/auth';


export default function LogIn() {
    const [user, setUser] = useState<User | null>(null);
    const [userLoading, setUserLoading ] = useState(true);

    useEffect(() => {

        const fetchUser = async () =>{
            const displayName = await HandleAuthRedirectedResult();
                setUser(displayName);
                setUserLoading(false);
        }

    },[userLoading]) 
    
    return (

        <div className={'m-32 justify-center'}>
            <Logo></Logo>
            <div className={'flex justify-center items-center'}>
                <Button onClick={SignInWithGoogleRedirect}>Sign in with Google</Button>
            </div>
        </div>
    );
}
