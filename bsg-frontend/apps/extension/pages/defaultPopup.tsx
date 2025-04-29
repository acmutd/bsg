"use client";
import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";
import React from "react";
import Logo from "@bsg/components/Logo";

export default function DefaultPopup() {
    const {redirectToLeetCode, isOnLeetCode} = useDefaultPopup();

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
