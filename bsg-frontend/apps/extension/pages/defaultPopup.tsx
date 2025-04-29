"use client";
import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";

export default function DefaultPopup() {
    const {redirectToLeetcode} = useDefaultPopup();
    return (
        <Button onClick={redirectToLeetcode}>Go to Leetcode</Button>
    );
}
