import '@bsg/ui-styles/global.css';
import './theme.css';
import type {Metadata} from 'next'
import {Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono} from 'next/font/google'
import Navbar from "@bsg/components/navbar";
import React, {ReactNode} from "react";

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    variable: '--font-bricolage',
    display: 'swap',
})

const instrument = Instrument_Sans({
    subsets: ['latin'],
    variable: '--font-instrument',
    display: 'swap',
})

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'BSG — Binary Search Gang',
    description: 'Solve LeetCode problems with friends in private rooms. Chat live, compete on a leaderboard, and level up together.',
}

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}>
        <body className="font-sans">
        <div className="bsg-atmosphere" aria-hidden="true"/>
        <Navbar/>
        <main className="min-h-screen pt-[72px] flex flex-col items-center justify-center">
            {children}
        </main>
        </body>
        </html>
    )
}
