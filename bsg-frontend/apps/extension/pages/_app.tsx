import '../../../packages/ui-styles/global.css'
import { useEffect, useRef, useState } from 'react'
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faCopy, faEllipsisVertical, faPaperPlane, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import { SignInWithChromeIdentity } from '@/firebase/auth/signIn/googleImplementation/chromeExtensionAuth'
import { useChatSocket } from '@/hooks/useChatSocket'
import LiveStatistics from '@bsg/components/liveStatistics/liveStatistics';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@bsg/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@bsg/ui/avatar";
import TooltipWrapper from "@bsg/components/TooltipWrapper";
import { domainToUnicode } from 'url';

//const poppins = Poppins({ weight: '400', subsets: ['latin'] })

type Participant = { id: string; name?: string; avatarUrl?: string }

export default function App() {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    })

    const [loggedIn, setLoggedIn] = useState(false)
    const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
    const [copied, setCopied] = useState(false)
    const [userProfile, setUserProfile] = useState<Participant | null>(null)

    const [activeTab, setActiveTab] = useState<'chat' | 'live'>('chat')
    const [collapsed, setCollapsed] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

    const { messages, isConnected, joinRoom, sendChatMessage } = useChatSocket(userProfile?.id);

    function copyRoomCode(roomCode: string) {
        if (!roomCode) return
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', text: roomCode }, (resp) => {
                    const ok = resp && resp.ok
                    if (ok) {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                        return
                    }
                    doLocalCopy(roomCode)
                })
                return
            }
        } catch (e) {
        }
        doLocalCopy(roomCode)
    }

    function doLocalCopy(roomCode: string) {
        const ta = document.createElement('textarea')
        ta.value = roomCode
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        try {
            document.execCommand('copy')
        } catch {
        }
        ta.remove()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function sendMessage() {
        const text = inputRef.current?.value.trim()
        if (!text || !currentRoom) return
        sendChatMessage(currentRoom.code, text);
        inputRef.current!.value = ''
    }

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [messages])

    const handleJoin = (roomCode: string) => {
        setCurrentRoom({ code: roomCode, options: {} })
        joinRoom(roomCode);
    }

    const handleCreate = (roomCode: string, options: any) => {
        setCurrentRoom({ code: roomCode, options: { ...options } })
        joinRoom(roomCode);
    }

    const handleGoogle = async () => {
        try {
            await SignInWithChromeIdentity()
            const randomSuffix = Math.floor(Math.random() * 10000);
            setUserProfile({
                id: `dev-user-${randomSuffix}@example.com`,
                name: `Dev User ${randomSuffix}`,
                avatarUrl: ''
            })
            setLoggedIn(true)
        } catch {
            const randomSuffix = Math.floor(Math.random() * 10000);
            setUserProfile({
                id: `dev-user-${randomSuffix}@example.com`,
                name: `Dev User ${randomSuffix}`,
                avatarUrl: ''
            })
            setLoggedIn(true)
        }
    }

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value })
    }

    const toggleCollapse = async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: "TOGGLE_COLLAPSE"
            });
        }
    }

    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            setCollapsed(entry.contentRect.width <= 36);
        });

        observer.observe(document.documentElement);

        return () => observer.disconnect();
    }, []);

    if (!loggedIn) {
        if (collapsed) {
            return (
                <div className="min-h-screen bg-[#262626] flex flex-col p-1 items-center justify-between">
                    <div className="flex flex-col py-2 px-1 gap-1 items-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <svg
                                viewBox="0 0 81 65"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                                    stroke="#62AF2E"
                                    stroke-width="6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>

                        <div className=" font-medium text-sm [writing-mode:vertical-lr] rotate-180">BSG</div>
                    </div>

                    <Button
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center bg-transparent hover:bg-[#3C3C3C]"
                        onClick={toggleCollapse}
                    >
                        <svg
                            aria-hidden="true"
                            focusable="false"
                            data-prefix="far"
                            data-icon="chevron-left"
                            className="h-[1em]"
                            role="img" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 320 512"
                        >
                            <path
                                fill="currentColor"
                                d="M15 239c-9.4 9.4-9.4 24.6 0 33.9L207 465c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L65.9 256 241 81c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L15 239z"
                            />
                        </svg>
                    </Button>
                </div>
            )
        }

        return (
            <div className="min-h-screen bg-[#262626] flex flex-col">
                <div className="bg-[#333333] flex items-center p-1 justify-between">
                    <div className="flex px-2 py-1 gap-1 font-medium text-sm items-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <svg
                                viewBox="0 0 81 65"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                                    stroke="#62AF2E"
                                    stroke-width="6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        BSG
                    </div>

                    <Button
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center bg-transparent hover:bg-[#484848]"
                        onClick={toggleCollapse}
                    >
                        <svg
                            aria-hidden="true"
                            focusable="false"
                            data-prefix="far"
                            data-icon="chevron-right"
                            className="h-[1em]"
                            role="img"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 320 512"
                        >
                            <path
                                fill="currentColor"
                                d="M305 239c9.4 9.4 9.4 24.6 0 33.9L113 465c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l175-175L79 81c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L305 239z"
                            />
                        </svg>
                    </Button>
                </div>

                <div className="flex flex-col px-5 py-16 gap-8 items-center">
                    <div className="flex items-center text-4xl font-bold gap-3">
                        <div className="w-16 h-16 flex items-center justify-center">
                            <svg
                                viewBox="0 0 81 65"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                                    stroke="#62AF2E"
                                    stroke-width="6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        BSG_
                    </div>

                    <div className="rounded-lg w-full h-full max-w-sm flex flex-col p-8 gap-8 items-center bg-[#333333]">
                        <div className="flex flex-col items-center gap-1">
                            <h1 className="text-lg font-medium">Join Now</h1>
                            <p className="text-xs">Create your account to start coding</p>
                        </div>

                        <form
                            className="w-full flex flex-col gap-2"
                            id="createAccount"
                        //onSubmit={handleCreate}
                        >
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="email"
                                    className="text-xs font-medium"
                                >
                                    Email
                                </label>
                                <div className="bg-[#3C3C3C] w-full rounded-lg flex gap-3 p-3 items-center">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    <input
                                        className="bg-transparent w-full text-xs"
                                        type="text"
                                        id="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={credentials.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="password"
                                    className="text-xs font-medium"
                                >
                                    Password
                                </label>
                                <div className="bg-[#3C3C3C] w-full rounded-lg flex gap-3 p-3 items-center">
                                    <input
                                        className="bg-transparent w-full text-xs"
                                        type="text"
                                        id="password"
                                        name="password"
                                        placeholder="•••••••"
                                        value={credentials.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="w-full flex flex-col gap-2">
                            <Button
                                className="w-full rounded-lg"
                                type="submit"
                                form="createAccount"
                            >
                                Create Acount
                            </Button>

                            <div className="w-full flex items-center gap-3 text-xs font-medium">
                                <hr className="w-full" />
                                OR
                                <hr className="w-full" />
                            </div>

                            <Button
                                className="flex items-center gap-4 bg-[#454545] w-full rounded-lg"
                                onClick={handleGoogle}
                            >
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <svg
                                        width="24px"
                                        height="24px"
                                        viewBox="-3 0 262 262"
                                        xmlns="http://www.w3.org/2000/svg"
                                        preserveAspectRatio="xMidYMid"
                                    >
                                        <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
                                        <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
                                        <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
                                        <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
                                    </svg>
                                </div>
                                Sign up with Google
                            </Button>
                        </div>

                        <p className="text-xs">Already have an account? Sign in</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentRoom) {
        return <RoomChoice onJoin={handleJoin} onCreate={handleCreate} />
    }

    const participants: Participant[] = [
        { id: '1', name: userProfile?.name, avatarUrl: userProfile?.avatarUrl },
        { id: '2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/100?img=1' },
        { id: '3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/100?img=2' },
    ]

    const participants2 = [
        { id: "1", username: "player1", defaultColor: "red", currentProblemIndex: 3, score: 9293 },
        { id: "2", username: "player2", defaultColor: "orange", currentProblemIndex: 3, score: 8700 },
    ]

    const problems = [
        { id: 1, title: "Two Sum", difficulty: 0, tags: ["Array"] },
        { id: 2, title: "Add Two Numbers", difficulty: 1, tags: ["Linked List"] },
    ]

    return (
        <div className="flex flex-col h-screen bg-background">

            {/* HEADER */}
            <header className="bg-inputBackground px-4 py-3 flex items-center justify-between">
                <div className="flex flex-col">
                    <div className="text-xs text-gray-300 mb-1">Room Code:</div>
                    <div
                        className="bg-background text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
                        <div className="text-2xl font-semibold">{currentRoom.code}</div>
                        <TooltipWrapper text={'Copy Code'}>
                            <Button size={'icon'} variant={'outline'}
                                onClick={() => copyRoomCode(currentRoom.code)}
                                className={'border-0 hover:bg-inputBackground hover:text-white'}>
                                <FontAwesomeIcon icon={faCopy} />
                            </Button>
                        </TooltipWrapper>
                        {copied && <div className="text-xs text-white ml-2">copied</div>}
                        <TooltipWrapper text={isConnected ? 'Connected' : 'Not Connected'}>
                            <FontAwesomeIcon icon={faCircle} size={'2xs'}
                                className={isConnected ? 'text-green-500' : 'text-red-500'} />
                        </TooltipWrapper>
                    </div>
                </div>

                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"
                            className={'hover:bg-inputBackground hover:text-white hover:brightness-125'}>
                            <FontAwesomeIcon icon={faEllipsisVertical} size={'lg'} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dark bg-neutral-800">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Participants</DropdownMenuLabel>
                            {participants.map((p) => (
                                <DropdownMenuItem key={p.id}>
                                    <Avatar>
                                        <AvatarImage src={p.avatarUrl} />
                                        <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {p.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => {
                                setCurrentRoom(null);
                                setLoggedIn(false)
                            }}
                            className="text-red-500"
                        >
                            Exit Group
                            <FontAwesomeIcon icon={faRightFromBracket} />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <div className="bg-inputBackground px-4 py-2">
                <div className="bg-background rounded-xl p-1 flex w-full max-w-md mx-auto">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'chat'
                                ? 'bg-inputBackground text-white shadow'
                                : 'text-gray-300 hover:text-white'}`}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'live'
                                ? 'bg-inputBackground text-white shadow'
                                : 'text-gray-300 hover:text-white'}`}
                    >
                        Live Statistics
                    </button>
                </div>
            </div>

            {activeTab === 'chat' && (
                <>
                    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div className={'bg-inputBackground'} key={i}>{msg.data}</div>
                        ))}
                    </div>

                    <div className="bg-inputBackground px-4 py-3 flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            className="flex-1 bg-background text-white rounded-full px-4 py-2"
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <TooltipWrapper text={'Send Your Message'}>
                            <Button onClick={sendMessage}
                                className="bg-primary rounded-full w-10 h-10">
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </Button>
                        </TooltipWrapper>
                    </div>
                </>
            )}

            {activeTab === 'live' && (
                <div className="flex-1 overflow-y-auto p-4">
                    <LiveStatistics
                        problems={problems}
                        participants={participants2}
                    />
                </div>
            )}
        </div>
    )
}
