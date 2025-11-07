import React from 'react';
import { createContext, useContext } from 'react';
import { useState, useEffect} from 'react';
import { signInWithEmailAndPassword, 
         createUserWithEmailAndPassword,
         signOut,
         onAuthStateChanged,
         User
 } from "firebase/auth";
import { auth } from "../../lib/firebase/config";


interface AuthProviderProps {
    children: React.ReactNode;
}


export default function AuthProvider ({children}: AuthProviderProps){


    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const login = async (email: string, password: string): Promise<void> => {
        const userCredentials = signInWithEmailAndPassword(auth, email, password);
        const gotUserCredentials = await userCredentials;
        setCurrentUser(gotUserCredentials.user);
    }



}