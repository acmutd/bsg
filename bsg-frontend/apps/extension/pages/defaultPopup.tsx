"use client";
import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";
import React from "react";

export default function DefaultPopup() {
    const {redirectToLeetcode} = useDefaultPopup();
    return (
        <div className={'my-5 mx-7'}>
            <p className={"p-4 text-3xl font-medium"}>BSG_</p>
            <p className={"m-2"}>You are not on Leetcode. Once you go to the website you can open up the side panel to
                start solving!</p>
            <Button onClick={redirectToLeetcode}>Go to Leetcode</Button>
        </div>
    );
}
