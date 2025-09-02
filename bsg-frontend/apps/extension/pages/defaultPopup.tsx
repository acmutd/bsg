"use client";
import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";
import React from "react";
import Logo from "@bsg/components/Logo";
import LogInForm from "@bsg/components/logInForm/logInForm";
import {useState} from 'react';

export default function DefaultPopup() {
    const {redirectToLeetCode, isOnLeetCode} = useDefaultPopup();
    const [showLogin, setShowLogin] = useState(false);

    if (isOnLeetCode === null) {
        return <div className="p-4 text-sm">Loading...</div>;
    }

    return (
        <div className={'my-5 mx-7'}>
            <Logo/>
            {isOnLeetCode ? (
                <>
                    <p className={"m-2"}>You are on LeetCode</p>
                </>
            ) : (
                <>
                    <p className={"m-2"}>You are not on LeetCode. Once you go to the website you can open up the side
                        panel to
                        start solving!</p>
                    <Button onClick={redirectToLeetCode}>Go to LeetCode</Button>
                </>
            )}
        </div>
    );
}
