"use client";
import CreateRoom from "@bsg/components/createRoom/createRoom";
import LogInForm from "@bsg/components/logInForm/logInForm";
import {Button} from "@bsg/ui/button";
import Logo from "@bsg/components/Logo";
import { useEffect, useState } from 'react';
import { useNewTab } from '../hooks/useNewTab';

// Define the user type
interface User {
    id: string;
    name: string;
    email: string;
    photo?: string;
}

export default function LogIn() {
    const[loggingIn, isLoggingIn] = useState(false);
    const[user, SetUser] = useState<User | null>(null);
    const[loading, setLoading] = useState(true);

    // Check if user is already logged in on component mount
    useEffect(() => {
        // Check if chrome API is available (only in extension context)
        if (typeof chrome === 'undefined' || !chrome.storage) {
            setLoading(false);
            return;
        }

        chrome.storage.local.get(['user'], (result) => {
            if (result.user) {
                // User found in storage check with the event listener
                chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
                    if (response && response.success) {
                        SetUser(response.user);
                    } else {
                        // Session expired, clear storage
                        chrome.storage.local.remove('user');
                    }
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });
    }, []); // Run once on mount

    useEffect(() => {
        if (!loggingIn) return; // Only run when loggingIn is true

        // Check if chrome API is available
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            isLoggingIn(false);
            return;
        }

        // Open the OAuth window
        const authWindow = window.open('http://localhost:3000/auth/google');

        // Poll for authentication every second using background worker
        const checkAuth = setInterval(() => {
            // Send message to background worker to check auth
            chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
                if (response && response.success) {
                    SetUser(response.user); // Save user to state
                    authWindow?.close(); // Close the OAuth window
                    clearInterval(checkAuth); // Stop polling
                    isLoggingIn(false); // Reset logging in state
                }
                // Silently continue polling if not authenticated yet
            });
        }, 1000); // Check every 1 second

        // Cleanup: stop polling after 2 minutes or when component unmounts
        const timeout = setTimeout(() => {
            clearInterval(checkAuth);
            authWindow?.close();
            isLoggingIn(false);
        }, 120000); // 2 minutes timeout

        // Cleanup function
        return () => {
            clearInterval(checkAuth);
            clearTimeout(timeout);
        };
    }, [loggingIn]); // Re-run when loggingIn changes

    const handleLogout = () => {
        // Check if chrome API is available
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            SetUser(null);
            return;
        }

        // Clear user from state and storage
        chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
            SetUser(null);
        });
    };

    // Show loading state
    if (loading) {
        return (
            <div className={'flex items-center justify-center min-h-screen'}>
                <p>Loading...</p>
            </div>
        );
    }

    // Show user info if logged in
    if (user) {
        return (
            <div className={'flex flex-col items-center justify-center min-h-screen gap-4'}>
                {user.photo && <img src={user.photo} alt={user.name} className="w-24 h-24 rounded-full" />}
                <h1>Welcome, {user.name}!</h1>
                <p>Email: {user.email}</p>
                <Button onClick={handleLogout}>Logout</Button>
            </div>
        );
    }

    return (
        <div className={'flex items-center justify-center min-h-screen'}>
            <Button onClick={() => isLoggingIn(true)} disabled={loggingIn}>
                {loggingIn ? 'Signing in...' : 'Sign In With Google'}
            </Button>
        </div>
    );
}
