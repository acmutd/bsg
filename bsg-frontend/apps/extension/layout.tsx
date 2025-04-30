import '@bsg/ui-styles';
import type {Metadata} from 'next'

export const metadata: Metadata = {
    title: 'BSG',
    description: 'Binary Search Gang Chrome Extension',
}

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        <main className="flex flex-col items-center justify-center w-56 h-full">
            {children}
        </main>
        </body>
        </html>
    )
}
