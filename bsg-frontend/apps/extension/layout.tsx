import '@bsg/ui-styles';
import type {Metadata} from 'next'
import {Poppins} from 'next/font/google'

const poppins = Poppins({weight: '400', subsets: ['latin'], variable: '--poppins'})

export const metadata: Metadata = {
    title: 'BSG',
    description: 'Binary Search Gang Chrome Extension',
}

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={poppins.className}>
        <main className="flex flex-col items-center justify-center w-56 h-full">
            {children}
        </main>
        </body>
        </html>
    )
}
