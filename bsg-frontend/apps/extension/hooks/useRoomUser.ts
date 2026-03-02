import {useEffect, useRef, useState} from "react";
import {useChatSocket} from "@/hooks/useChatSocket";
import {User} from "@bsg/models/User";

export const useRoomUser = () => {
    const [loggedIn, setLoggedIn] = useState(false)
    const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
    const [copied, setCopied] = useState(false)
    const [user, setUser] = useState(false)
    const [userProfile, setUserProfile] = useState<User | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<'chat' | 'live'>('chat')


    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Initialize WebSocket Hook
    const {messages, isConnected, joinRoom, sendChatMessage} = useChatSocket(userProfile?.id);

    const problems = [
        {id: 1, title: "Two Sum", difficulty: 0, tags: ["Array"]},
        {id: 2, title: "Add Two Numbers", difficulty: 1, tags: ["Linked List"]},
    ]

    const participants2 = [
        {id: "1", username: "player1", defaultColor: "red", currentProblemIndex: 3, score: 9293},
        {id: "2", username: "player2", defaultColor: "orange", currentProblemIndex: 3, score: 8700},
    ]


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
        sendChatMessage(currentRoom.code, text, {
            name: userProfile?.name || 'Unknown',
            photo: userProfile?.photo
        });

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


    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({type: 'CHECK_AUTH'}, (response) => {
                if (response?.success) {
                    setUserProfile(response.user)
                    setLoggedIn(true)
                }
            })
        }
    }, [])

    return {
        problems,
        setLoggedIn,
        containerRef,
        messages,
        inputRef,
        participants2,
        copyRoomCode,
        sendMessage,
        handleCreate,
        handleJoin,
        loggedIn,
        copied,
        setCopied,
        user,
        setUser,
        isMenuOpen,
        setIsMenuOpen,
        activeTab,
        setActiveTab,
        currentRoom,
        isConnected,
        setUserProfile,
        sendChatMessage,
        setCurrentRoom
    }
}
