import './globals.css'
import type {Metadata} from 'next'
import {Poppins} from 'next/font/google'

const poppins = Poppins({weight: '400', subsets: ['latin'], variable: '--poppins'})

export const metadata: Metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={poppins.className}>
        <main className={'h-screen flex flex-col justify-center items-center'}>
            <div>
                {/*<Navbar/>*/}
                <div className={"flex flex-1"}>
                    {children}
                </div>
            </div>
        </main>
        </body>
        </html>
    )
}
