import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/hooks/useDefaultPopup";
import React from "react";

// A true sine, three periods wide (x from -100 to 200) in a 0-100 viewBox, so
// the card only ever shows the middle third. Q/T keeps every period identical,
// which is what lets the scroll loop seamlessly. Mid-line y=45, amplitude 10
// (for a quadratic the crest lands halfway between mid-line and control point).
const WAVE = "M-100,45 Q-75,25 -50,45 T0,45 T50,45 T100,45 T150,45 T200,45 L200,100 L-100,100 Z";

// One period is 100 user units, so translating by exactly that lands the wave
// back on itself and the loop point is invisible.
const WAVE_CSS = `
@keyframes bsg-wave-drift {
    from { transform: translateX(0); }
    to   { transform: translateX(-100px); }
}
.bsg-wave { animation: bsg-wave-drift 14s linear infinite; }

@media (prefers-reduced-motion: reduce) {
    .bsg-wave { animation: none; }
}
`;

// The BSG trophy mark, same path as the auth screen (pages/login-page.tsx).
function TrophyIcon() {
    return (
        <svg
            viewBox="0 0 81 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-auto"
            aria-hidden="true"
        >
            <path
                d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                stroke="#62AF2E"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function DefaultPopup() {
    const {redirectToLeetCode, isOnLeetCode} = useDefaultPopup();

    return (
        <div className="relative w-[250px] overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-30%] right-[-30%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            <div className="relative p-5 overflow-hidden bg-bsg-surface/50 backdrop-blur-md shadow-bsg-glass">
                {/* Sine wave with the theme-colored gradient filling everything under it */}
                <style>{WAVE_CSS}</style>
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        {/* Transparent where it meets the wave, ramping to green at the bottom.
                            The extra stops ease the transition so there is no visible band. */}
                        <linearGradient id="bsg-wave-fill" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="100">
                            <stop offset="0%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0}} />
                            <stop offset="25%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.05}} />
                            <stop offset="50%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.16}} />
                            <stop offset="75%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.34}} />
                            <stop offset="100%" style={{stopColor: "rgb(var(--primary))", stopOpacity: 0.58}} />
                        </linearGradient>
                    </defs>
                    <g className="bsg-wave">
                        <path d={WAVE} fill="url(#bsg-wave-fill)" />
                    </g>
                </svg>

                <div className="relative flex flex-col items-center">
                    <div className="pt-3">
                        <TrophyIcon/>
                    </div>
                    <p className="mt-1 text-2xl font-semibold" style={{color: "rgb(var(--primary))"}}>BSG</p>

                    {isOnLeetCode ? (
                        <p className="mt-4 text-xs font-medium text-center" style={{textWrap: "balance"} as React.CSSProperties}>You are on LeetCode. Go to a problem to open up the side panel!</p>
                    ) : (
                        <>
                            <p className="mt-4 text-xs font-medium text-center" style={{textWrap: "balance"} as React.CSSProperties}>You are not on LeetCode. Once you go to the website you can open up the side
                                panel to start solving!</p>
                            <Button onClick={redirectToLeetCode} size="sm" className="mt-4 w-[85%] text-xs bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,30%)] text-white font-semibold transition-colors">Go to LeetCode</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
