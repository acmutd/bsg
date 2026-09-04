import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";
import React from "react";
import Logo from "@bsg/components/Logo";

// One period of a sine-like curve across the card, drawn in a 0-100 box so it
// stretches to whatever size the popup ends up being.
const WAVE = "M0,30 C20,25 30,52 50,58 C70,64 82,56 100,42";

export default function DefaultPopup() {
    const {redirectToLeetCode, isOnLeetCode} = useDefaultPopup();

    return (
        <div className="relative p-5 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-30%] right-[-30%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            <div className="relative p-4 rounded-2xl overflow-hidden bg-bsg-surface/50 backdrop-blur-md border border-bsg-glass shadow-bsg-glass">
                {/* Sine wave with the theme-colored gradient filling everything under it */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="bsg-wave-fill" x1="0" y1="0" x2="0.35" y2="1">
                            <stop offset="0%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.12}} />
                            <stop offset="55%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.3}} />
                            <stop offset="100%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.55}} />
                        </linearGradient>
                    </defs>
                    <path d={`${WAVE} L100,100 L0,100 Z`} fill="url(#bsg-wave-fill)" />
                </svg>

                <div className="relative">
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
        </div>
    );
}
