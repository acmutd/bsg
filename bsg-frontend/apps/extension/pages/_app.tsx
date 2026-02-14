import '../../../packages/ui-styles/global.css'
import {useEffect, useRef, useState} from 'react'
import '@bsg/ui-styles/global.css';
import {Poppins} from 'next/font/google'
import {Button} from '@bsg/ui/button'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCircle, faCopy, faEllipsisVertical, faPaperPlane, faRightFromBracket} from '@fortawesome/free-solid-svg-icons'
import {faGoogle} from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import {SignInWithChromeIdentity} from '@/firebase/auth/signIn/googleImplementation/chromeExtensionAuth'
import {useChatSocket} from '@/hooks/useChatSocket'
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
import {Avatar, AvatarFallback, AvatarImage} from "@bsg/ui/avatar";
import TooltipWrapper from "@bsg/components/TooltipWrapper";

const poppins = Poppins({weight: '400', subsets: ['latin']})

type Participant = { id: string; name?: string; avatarUrl?: string }

export default function App() {
    const [loggedIn, setLoggedIn] = useState(false)
    const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
    const [copied, setCopied] = useState(false)
    const [userProfile, setUserProfile] = useState<Participant | null>(null)

    const [activeTab, setActiveTab] = useState<'chat' | 'live'>('chat')

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

    const {messages, isConnected, joinRoom, sendChatMessage} = useChatSocket(userProfile?.id);

    function copyRoomCode(roomCode: string) {
        if (!roomCode) return
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({type: 'COPY_TO_CLIPBOARD', text: roomCode}, (resp) => {
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
        setCurrentRoom({code: roomCode, options: {}})
        joinRoom(roomCode);
    }

    const handleCreate = (roomCode: string, options: any) => {
        setCurrentRoom({code: roomCode, options: {...options}})
        joinRoom(roomCode);
    }

    if (!loggedIn) {
        return (
            <div
                className={`${poppins.className} min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8`}>
                <div className="bg-inputBackground rounded-xl shadow-2xl w-full max-w-md p-8 pt-16 space-y-8">
                    <div className="flex justify-center mb-2">
                        <span className="text-5xl font-extrabold tracking-wide text-white drop-shadow-lg">BSG_</span>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-y-4">
                        <Button
                            onClick={async () => {
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
                            }}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
                        >
                            <FontAwesomeIcon icon={faGoogle}/>
                            <span>Sign in with Google</span>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentRoom) {
        return <RoomChoice onJoin={handleJoin} onCreate={handleCreate}/>
    }

    const participants: Participant[] = [
        {id: '1', name: userProfile?.name, avatarUrl: userProfile?.avatarUrl},
        {id: '2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/100?img=1'},
        {id: '3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/100?img=2'},
    ]

    const participants2 = [
        {id: "1", username: "player1", defaultColor: "red", currentProblemIndex: 3, score: 9293},
        {id: "2", username: "player2", defaultColor: "orange", currentProblemIndex: 3, score: 8700},
    ]

    const problems = [
        {id: 1, title: "Two Sum", difficulty: 0, tags: ["Array"]},
        {id: 2, title: "Add Two Numbers", difficulty: 1, tags: ["Linked List"]},
    ]

    return (
        <div className="flex flex-col h-screen bg-[#262626]">

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
                                <FontAwesomeIcon icon={faCopy}/>
                            </Button>
                        </TooltipWrapper>
                        {copied && <div className="text-xs text-white ml-2">copied</div>}
                        <TooltipWrapper text={isConnected ? 'Connected' : 'Not Connected'}>
                            <FontAwesomeIcon icon={faCircle} size={'2xs'}
                                             className={isConnected ? 'text-green-500' : 'text-red-500'}/>
                        </TooltipWrapper>
                    </div>
                </div>

                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"
                                className={'hover:bg-inputBackground hover:text-white hover:brightness-125'}>
                            <FontAwesomeIcon icon={faEllipsisVertical} size={'lg'}/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dark bg-neutral-800">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Participants</DropdownMenuLabel>
                            {participants.map((p) => (
                                <DropdownMenuItem key={p.id}>
                                    <Avatar>
                                        <AvatarImage src={p.avatarUrl}/>
                                        <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {p.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            onSelect={() => {
                                setCurrentRoom(null);
                                setLoggedIn(false)
                            }}
                            className="text-red-500"
                        >
                            Exit Group
                            <FontAwesomeIcon icon={faRightFromBracket}/>
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
                            <div key={i}>{msg.data}</div>
                        ))}
                    </div>

                    <div className="bg-inputBackground px-4 py-3 flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            className="flex-1 bg-background text-white rounded-full px-4 py-2"
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage}
                                className="bg-primary rounded-full w-10 h-10">
                            <FontAwesomeIcon icon={faPaperPlane}/>
                        </Button>
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
