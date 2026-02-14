import '../../../packages/ui-styles/global.css'
import {useEffect, useRef, useState} from 'react'
import '@bsg/ui-styles/global.css';
import {Poppins} from 'next/font/google'
import {Button} from '@bsg/ui/button'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCircle, faCopy, faEllipsisVertical, faPaperPlane, faRightFromBracket} from '@fortawesome/free-solid-svg-icons'
import {faGoogle} from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import {
    getUserInfoFromToken,
    SignInWithChromeIdentity
} from '@/firebase/auth/signIn/googleImplementation/chromeExtensionAuth'
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

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
    const [isLiveStatisticsOpen, setIsLiveStatisticsOpen] = useState<boolean>(false)

    // Initialize WebSocket Hook
    const {messages, isConnected, joinRoom, sendChatMessage} = useChatSocket(userProfile?.id);

    // copy room code to clipboard (works in extension and locally)
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
            // fallback
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

        // Send message via WebSocket
        sendChatMessage(currentRoom.code, text);

        // REMOVED: Optimistic update.
        // The server will echo the message back to us, so we don't need to add it manually here.
        // This prevents the "double message" issue for the sender.

        inputRef.current!.value = ''
    }

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [messages])

    // join/create handlers
    const handleJoin = (roomCode: string) => {
        setCurrentRoom({code: roomCode, options: {}})
        joinRoom(roomCode);
    }

    const handleCreate = (roomCode: string, options: any) => {
        setCurrentRoom({code: roomCode, options: {...options}})
        // Currently just joins the room code generated.
        // Future: Send 'create-room' request if backend distinguishes it.
        joinRoom(roomCode);
    }

    // --- RENDER LOGIC ---
    if (!loggedIn) {
        return (
            <div
                className={`${poppins.className} min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8`}>
                <div
                    className="bg-inputBackground rounded-xl shadow-2xl w-full max-w-md p-8 pt-16 space-y-8">
                    <div className="flex justify-center mb-2">
                        <span className="text-5xl font-extrabold tracking-wide text-white drop-shadow-lg">BSG_</span>
                    </div>
                    <div className="flex flex-col justify-center items-center gap-y-4">
                        <Button
                            onClick={async () => {
                                try {
                                    // Sign in via chrome identity + firebase
                                    await SignInWithChromeIdentity()
                                    // Then request token non-interactively and fetch user info
                                    if (typeof chrome !== 'undefined' && chrome.identity) {
                                        chrome.identity.getAuthToken({interactive: false}, async (tokenResult) => {
                                            if (chrome.runtime.lastError) {
                                                // fallback to interactive token if needed
                                                chrome.identity.getAuthToken({interactive: true}, async (tResult) => {
                                                    let t: string | undefined
                                                    if (!tResult) return
                                                    if ((tResult as any).token) t = (tResult as any).token
                                                    if (!t) return
                                                    const info = await getUserInfoFromToken(t)
                                                    setUserProfile({
                                                        id: info.email || info.id || info.sub || 'me',
                                                        name: info.name,
                                                        avatarUrl: info.picture
                                                    })
                                                    setLoggedIn(true)
                                                })
                                                return
                                            }
                                            let t: string | undefined
                                            if (!tokenResult) return
                                            if ((tokenResult as any).token) t = (tokenResult as any).token
                                            if (!t) return
                                            const info = await getUserInfoFromToken(t)
                                            setUserProfile({
                                                id: info.email || info.id || info.sub || 'me',
                                                name: info.name,
                                                avatarUrl: info.picture
                                            })
                                            setLoggedIn(true)
                                        })
                                    } else {
                                        // Non-extension environment: just mark logged in (Dev mode)
                                        // Generate random ID to prevent collision in local testing
                                        const randomSuffix = Math.floor(Math.random() * 10000);
                                        setUserProfile({
                                            id: `dev-user-${randomSuffix}@example.com`,
                                            name: `Dev User ${randomSuffix}`,
                                            avatarUrl: ''
                                        })
                                        setLoggedIn(true)
                                    }
                                } catch (err) {
                                    //console.error('Sign-in failed', err)
                                    // Generate random ID to prevent collision in local testing
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

    // Show RoomChoice if not yet in a room
    if (!currentRoom) {
        return (
            <RoomChoice
                onJoin={handleJoin}
                onCreate={handleCreate}
            />
        )
    }

    // Load participants from room options or use dummy data
    const participants: Participant[] = currentRoom.options?.participants || [
        {id: '1', name: userProfile?.name, avatarUrl: userProfile?.avatarUrl},
        {id: '2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/100?img=1'},
        {id: '3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/100?img=2'},
        {id: '4', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/100?img=3'}
    ]

    const participants2 = [
        {id: "1", username: "player1", defaultColor: "red", currentProblemIndex: 3, score: 9293},
        {id: "2", username: "player2", defaultColor: "orange", currentProblemIndex: 3, score: 8700},
        {id: "3", username: "player3", defaultColor: "yellow", currentProblemIndex: null, score: 12893},
        {id: "4", username: "player4", defaultColor: "green", currentProblemIndex: 1, score: 2387},
        {id: "5", username: "player5", defaultColor: "blue", currentProblemIndex: 3, score: 8237},
        {id: "6", username: "player6", defaultColor: "purple", currentProblemIndex: 2, score: 3921},
        {id: "7", username: "player7", defaultColor: "sky", currentProblemIndex: null, score: 10292}
    ]

    const problems = [
        {id: 1, title: "Two Sum", difficulty: 0, tags: ["Array", "Hash Table"]},
        {id: 2, title: "Add Two Numbers", difficulty: 1, tags: ["Linked List", "Math", "Recursion"]},
        {
            id: 3,
            title: "Longest Substring Without Repeating Characters",
            difficulty: 1,
            tags: ["Hash Table", "String", "Sliding Window"]
        },
        {
            id: 4,
            title: "Median of Two Sorted Arrays",
            difficulty: 2,
            tags: ["Array", "Binary Search", "Divide and Conquer"]
        }
    ]

    return (
        <div className="flex flex-col h-screen bg-[#262626]">
            <header className="bg-inputBackground px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="text-xs text-gray-300 mb-1">Room Code:</div>
                        <div
                            className="bg-background text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
                            <div className="text-2xl font-semibold">{currentRoom.code}</div>
                            <TooltipWrapper text={'Copy Code'}>
                                <Button onClick={() => copyRoomCode(currentRoom.code)}
                                        size={'icon'} variant={'outline'}
                                        className={'border-0 hover:bg-inputBackground'}>
                                    <FontAwesomeIcon icon={faCopy} className="text-gray-200 text-sm"/>
                                </Button>
                            </TooltipWrapper>
                            {copied && <div className="text-xs text-white ml-2">copied</div>}
                            <TooltipWrapper text={isConnected ? 'Connected' : 'Not connected'}>
                                <FontAwesomeIcon icon={faCircle} size={'2xs'}
                                                 className={isConnected ? 'text-green-500' : 'text-red-500'}/>
                            </TooltipWrapper>
                        </div>
                    </div>
                </div>

                {/*<div className="flex items-center gap-3">*/}
                {/*    /!* show current user's avatar *!/*/}
                {/*    {userProfile && (*/}
                {/*        <img src={userProfile.avatarUrl} alt={userProfile.name} title={userProfile.name}*/}
                {/*             className="w-8 h-8 rounded-full border-2 border-green-500 object-cover"/>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/* Kebab Menu */}
                <DropdownMenu
                    open={isMenuOpen}
                    onOpenChange={(open) => {
                        setIsMenuOpen(open);
                    }}>

                    {/* */}
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"
                                className={'hover:bg-inputBackground hover:text-white hover:brightness-125'}>
                            <FontAwesomeIcon
                                icon={faEllipsisVertical}
                                className="text-2xl"
                            />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="min-w-[160px] dark bg-neutral-800"
                        align="end"
                    >
                        {isMenuOpen &&
                            <>
                                {/*<DropdownMenuGroup>*/}
                                {/*    <DropdownMenuLabel>Live Statistics</DropdownMenuLabel>*/}
                                {/*    <DropdownMenuItem*/}
                                {/*        onSelect={(e) => {*/}
                                {/*            e.preventDefault()*/}
                                {/*            setMenuState("liveStatistics")*/}
                                {/*        }}*/}
                                {/*    >*/}
                                {/*        Live Statistics*/}
                                {/*    </DropdownMenuItem>*/}
                                {/*    <DropdownMenuItem>Problem Statistics</DropdownMenuItem>*/}
                                {/*    <DropdownMenuItem>Leaderboard</DropdownMenuItem>*/}
                                {/*</DropdownMenuGroup>*/}
                                {/*<DropdownMenuSeparator className="bg-neutral-700"/>*/}

                                {/* Participant avatars (lobby) */}
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Participants</DropdownMenuLabel>
                                    {participants.map((p) => (
                                        <DropdownMenuItem key={p.id}>
                                            <Avatar>
                                                <AvatarImage
                                                    key={p.id}
                                                    src={p.avatarUrl}
                                                    alt={p.name || p.id}
                                                    title={p.name || p.id}
                                                />
                                                <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {p.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator className="bg-neutral-700"/>

                                {/* Exit button */}
                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            setCurrentRoom(null);
                                            setLoggedIn(false)
                                        }}
                                        className="flex justify-between w-full text-red-500 data-[highlighted]:text-red-500 data-[highlighted]:bg-red-500/25"
                                    >
                                        Exit Group
                                        <FontAwesomeIcon icon={faRightFromBracket}/>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </>
                        }

                        {isLiveStatisticsOpen &&
                            <LiveStatistics
                                className="w-[22rem]"
                                problems={problems}
                                participants={participants2}
                            />
                        }
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className="flex">
                        {msg.isSystem ? (
                            <div className="w-full text-center text-gray-400 text-sm my-2">
                                {msg.data}
                            </div>
                        ) : (
                            <div
                                className={`${msg.userHandle === userProfile?.id ? 'bg-primary self-end ml-auto' : 'bg-gray-700 self-start'} text-white p-2 rounded-lg max-w-xs break-words`}>
                                <div
                                    className="text-xs text-gray-300 mb-1">{msg.userHandle === userProfile?.id ? 'You' : msg.userHandle}</div>
                                {msg.data}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-inputBackground px-4 py-3 flex items-center space-x-2">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-background text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            sendMessage()
                        }
                    }}
                />
                <TooltipWrapper text={'Send Message'}>
                    <Button
                        onClick={sendMessage}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className="text-white"
                                         style={{transform: 'translateX(-1px)'}}/>
                    </Button>
                </TooltipWrapper>
            </div>
        </div>
    )
}
