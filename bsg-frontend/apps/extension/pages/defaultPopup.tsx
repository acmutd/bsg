import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";
import React from "react";
import Logo from "@bsg/components/Logo";

export default function DefaultPopup() {
    const {redirectToLeetCode, isOnLeetCode} = useDefaultPopup();

    return (
        <div className="relative p-5 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-30%] right-[-30%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            <div className="relative p-4 rounded-2xl bg-bsg-surface/50 backdrop-blur-md border border-bsg-glass shadow-bsg-glass">
                <div className="flex justify-center mb-3">
                    <Logo/>
                </div>
                {isOnLeetCode ? (
                    <p className="text-sm text-foreground/70 text-center">You are on LeetCode. Go to a problem to open up the side panel!</p>
                ) : (
                    <>
                        <p className="text-sm text-foreground/70 text-center mb-3">You are not on LeetCode. Once you go to the website you can open up the side
                            panel to start solving!</p>
                        <Button onClick={redirectToLeetCode} className="w-full bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,30%)] text-white transition-colors">Go to LeetCode</Button>
                    </>
                )}
            </div>
        </div>
    );
}


