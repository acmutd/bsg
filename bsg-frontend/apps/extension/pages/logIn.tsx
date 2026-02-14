"use client";
import {Button} from "@bsg/ui/button";
import Logo from "@bsg/components/Logo";
import {useEffect, useState} from 'react';
import {onAuthStateChanged, User} from 'firebase/auth';
import {useNewTab} from '@/hooks/useNewTab';
import {
    SignInWithChromeIdentity,
    SignOutFromChrome
} from '@/firebase/auth/signIn/googleImplementation/chromeExtensionAuth';
import {getFirebaseAuth} from '@/firebase/config';
import {Avatar, AvatarFallback, AvatarImage} from "@bsg/ui/avatar";


export default function LogIn() {
    const {openInNewTab} = useNewTab();
    const [isInTab, setIsInTab] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        // Check if we're running in a tab context vs extension popup
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes(chrome.runtime.id)) {
                    setIsInTab(true);
                }
            });
        }

        // Listen for auth state changes (only in browser when auth available)
        const auth = getFirebaseAuth();
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                console.log('User is signed in:', currentUser.email);
            } else {
                console.log('User is signed out');
            }
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        if (isInTab) {
            // We're in a tab - use Chrome Identity API with Firebase
            try {
                setLoading(true);
                const user = await SignInWithChromeIdentity();
                console.log('User signed in:', user);

                // Notify content script that auth state has changed
                try {
                    chrome.tabs.query({}, (tabs) => {
                        tabs.forEach(tab => {
                            if (tab.url && tab.url.includes('leetcode.com') && tab.id) {
                                chrome.tabs.sendMessage(tab.id, {
                                    type: 'AUTH_STATE_CHANGED',
                                    user: {
                                        email: user.email,
                                        displayName: user.displayName,
                                        photoURL: user.photoURL
                                    }
                                });
                            }
                        });
                    });
                } catch (error) {
                    console.error('Failed to notify content script:', error);
                }

                // Close this tab after successful auth - the auth state listener will update the popup
                setTimeout(() => window.close(), 1000);
            } catch (error) {
                console.error('Sign in error:', error);
                setLoading(false);
            }
        } else {
            // We're in popup - open a new tab with a page that handles Google auth
            openInNewTab(chrome.runtime.getURL('logIn.html'));
        }
    };

    const handleSignOut = async () => {
        try {
            setLoading(true);
            await SignOutFromChrome();
            console.log('User signed out');

            // Notify content script that user signed out
            try {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.url && tab.url.includes('leetcode.com') && tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'AUTH_STATE_CHANGED',
                                user: null
                            });
                        }
                    });
                });
            } catch (error) {
                console.error('Failed to notify content script:', error);
            }
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={'m-32 justify-center border-0'}>
            <Logo></Logo>
            <div className={'flex justify-center items-center flex-col gap-4'}>
                {user ? (
                    // User is signed in - show user info and sign out option
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border-green-200">
                            <p className="text-green-800 font-medium">Welcome!</p>
                            <p className="text-green-700">{user.displayName || user.email}</p>
                            {user.photoURL && (
                                <Avatar>
                                    <AvatarImage src={user.photoURL} alt={"Profile"}/>
                                    <AvatarFallback>{user.email?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        <Button
                            onClick={handleSignOut}
                            disabled={loading}
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            {loading ? "Signing out..." : "Sign Out"}
                        </Button>
                    </div>
                ) : (
                    // User is not signed in - show sign in button
                    <Button onClick={handleGoogleLogin} disabled={loading}>
                        {loading ? "Signing in..." : (isInTab ? "Complete Google Sign In" : "Sign in with Google")}
                    </Button>
                )}
            </div>
        </div>
    );
}
