import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { RTC_SERVICE_URL } from '../lib/config';
import { useUserStore } from '@/stores/useUserStore';
import { useSettingsStore } from '@/stores/useSettingsStore';


//for audio unpload to out folder
function playChatSound(filename: string) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return;
    if (!useSettingsStore.getState().chatNotificationsEnabled) return; // checks if chat notifications are enabled

    const audio = new Audio(chrome.runtime.getURL(`sounds/${filename}`));
    audio.play().catch(() => {});
}

export type Message = {
    userHandle: string;
    userName?: string;
    userPhoto?: string;
    data: string;
    roomID: string;
    isSystem?: boolean;
}

export const useChatSocket = () => {

    const MAX_CHARS = 500;

    const socketRef = useRef<WebSocket | null>(null);
    const pendingRoomIDRef = useRef<string | null>(null);
    const joinedRoomIDRef = useRef<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const counterRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chatRef = useRef<HTMLDivElement | null>(null);
    const isAtBottom = useRef<boolean>(true);
    const atLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const emojiMenuRef = useRef<HTMLDivElement | null>(null);
    const suppressChatSoundsRef = useRef(false); //sound allowed 

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [showJump, setShowJump] = useState<boolean>(false);
    const [atLimit, setAtLimit] = useState<boolean>(false);
    const [emojiSearch, setEmojiSearch] = useState<string>('');

    const userEmail = useUserStore(s => s.email);
    const username = useUserStore(s => s.username);
    const iconUrl = useUserStore(s => s.iconUrl);
    const roomId = useRoomStore(s => s.roomId);
    const setIsConnected = useRoomStore(s => s.setIsConnected);
    const setLastGameEvent = useRoomStore(s => s.setLastGameEvent);

    useEffect(() => {
        if (!userEmail) return;

        const ws = new WebSocket(RTC_SERVICE_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);

            //race-condition prevention joinRoom was happening before
            //the wb connection
            const targetRoomID = pendingRoomIDRef.current || roomId;
            if(userEmail && targetRoomID){
                if (joinedRoomIDRef.current === targetRoomID) {
                    return;
                }
                const payload ={
                    name:userEmail,
                    "request-type": "join-room",
                    data: JSON.stringify({
                        userHandle: userEmail,
                        roomID: targetRoomID
                    })
                };
                suppressChatSoundsRef.current = true; // 
                ws.send(JSON.stringify(payload));

                joinedRoomIDRef.current = targetRoomID;
                console.log("Sent join-room on socket open", { roomID: targetRoomID });
            }
        };

        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);

                if (response.status === 'ok') {
                    const { message, responseType } = response;

                    if (responseType === 'chat-message') {
                        console.log('recieved chat message: ' + JSON.stringify(message))
                        setMessages(prev => [...prev, {
                            userHandle: message.userHandle,
                            userName: message.userName,
                            userPhoto: message.userPhoto,
                            data: message.message || message.data,
                            roomID: message.roomID,
                            isSystem: false
                        }]);

                        // checks user handle to know if the message is sent by the user or received from others
                        if (!suppressChatSoundsRef.current) {
                            if (message.userHandle === userEmail) {
                                playChatSound('message-sent.mp3');
                            } else {
                                playChatSound('message-recieved.mp3');
                            }
                        }
                    } else if (responseType === 'system-announcement') {
                        // Ignore connection-level join acks to avoid repeated chat noise on reconnects.
                        if (message?.data === 'Join Room Request') { //  border between history and new msgs
                            suppressChatSoundsRef.current = false;
                            return;
                        }
                        console.log('recieved system message: ' + message);
                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: message.data,
                            roomID: message.roomID,
                            isSystem: true
                        }]);
                    } else if (responseType === 'round-start') {
                        try {
                            const parsedData = JSON.parse(message.data);
                            setLastGameEvent({
                                type: 'round-start',
                                data: parsedData,
                                timestamp: Date.now()
                            });
                        } catch (e) {
                            setLastGameEvent({
                                type: 'round-start',
                                data: message.data,
                                timestamp: Date.now()
                            });
                        }
                    } else if (responseType === 'round-end') {
                        setLastGameEvent({
                            type: 'round-end',
                            data: message.data,
                            timestamp: Date.now()
                        });
                    } else if (responseType === 'next-problem') {
                        try {
                            const parsedData = JSON.parse(message.data);
                            setLastGameEvent({
                                type: 'next-problem',
                                data: parsedData,
                                timestamp: Date.now()
                            });
                        } catch (e) {
                            console.error('Failed to parse next-problem data', e);
                        }
                    }
                } else if (response.status === 'error') {
                    console.error('RTC Error:', response.message);
                }
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            joinedRoomIDRef.current = null;
        };

        return () => {
            ws.close();
        };
    }, [userEmail]);

    const joinChatRoom = useCallback((roomID: string) => {
        // Clear messages when joining a new room so we don't see chat history from previous rooms
        setMessages([]);
        setLastGameEvent(null);
        suppressChatSoundsRef.current = true;  

        if (joinedRoomIDRef.current === roomID) {
            pendingRoomIDRef.current = roomID;
            return;
        }

        pendingRoomIDRef.current = roomID;

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && userEmail) {
            const payload = {
                name: userEmail,
                "request-type": "join-room",
                data: JSON.stringify({
                    userHandle: userEmail,
                    roomID: roomID
                })
            };
            suppressChatSoundsRef.current = true;
            socketRef.current.send(JSON.stringify(payload));
            joinedRoomIDRef.current = roomID;
        }
    }, [userEmail]);

    const handleSubmit = () => {
        const chat = chatRef.current;
        const textArea = inputRef.current;
        if (!roomId || !chat || !textArea) return;

        const text = inputText.trim();
        if (!text) return;

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && userEmail) {
            const payload = {
                name: userEmail,
                "request-type": "chat-message",
                data: JSON.stringify({
                    userHandle: userEmail,
                    userName: username,
                    userPhoto: iconUrl,
                    roomID: roomId,
                    message: text
                })
            };
            socketRef.current.send(JSON.stringify(payload));

            setInputText('');
            textArea.style.height = 'auto';
            setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) >= 200);
        }
    };

    /*
     *  Toggles expansion based on pre-expanded line height
     *  Implementation can't be done using states because calculating the
     *  pre-expanded height requires bypassing React's render cycle
     */
    const handleExpand = () => {
        const chat = chatRef.current;
        const container = containerRef.current;
        const textArea = inputRef.current;
        const counter = counterRef.current;
        if (!chat || !container || !textArea || !counter) return;

        // Collapse container
        counter.classList.add('hidden');
        container.classList.remove('flex-col', 'gap-2');

        // Measure pre-expanded line height
        textArea.style.height = 'auto';
        const lineHeight = parseInt(getComputedStyle(textArea).lineHeight);
        const isExpanded = textArea.scrollHeight > lineHeight;

        // Toggle expansion based on measurement
        counter.classList.toggle('hidden', !isExpanded);
        container.classList.toggle('flex-col', isExpanded);
        container.classList.toggle('gap-2', isExpanded);

        // Cap text area height at 8 * line height
        textArea.style.height = `${Math.min(textArea.scrollHeight, 8 * lineHeight)}px`

        // Handle scroll changes due to adding/removing lines
        if (isAtBottom.current) chat.scrollTop = chat.scrollHeight;
        setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) >= 200);
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;

        if (newText.length <= MAX_CHARS) {
            setInputText(newText);
            handleExpand();

        } else if (inputText.length < MAX_CHARS) {
            setInputText(newText.substring(0, MAX_CHARS));
            handleExpand();

            setAtLimit(true);
            if (atLimitTimeoutRef.current) clearTimeout(atLimitTimeoutRef.current);
            atLimitTimeoutRef.current = setTimeout(() => setAtLimit(false), 500);

        } else {
            setAtLimit(true);
            if (atLimitTimeoutRef.current) clearTimeout(atLimitTimeoutRef.current);
            atLimitTimeoutRef.current = setTimeout(() => setAtLimit(false), 500);
        }
    }

    const insertEmoji = (emoji: string) => {
        const textarea = inputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = inputText.slice(0, start) + emoji + inputText.slice(end);

        if (newText.length <= MAX_CHARS) {
            setInputText(newText);
            requestAnimationFrame(() => {
                textarea.selectionStart = start + emoji.length;
                textarea.selectionEnd = start + emoji.length;
                textarea.focus();
                handleExpand();
            });
        } else if (inputText.length < MAX_CHARS) {
            setInputText(newText.substring(0, MAX_CHARS));
            requestAnimationFrame(() => {
                textarea.focus();
                handleExpand();
            });

            setAtLimit(true);
            if (atLimitTimeoutRef.current) clearTimeout(atLimitTimeoutRef.current);
            atLimitTimeoutRef.current = setTimeout(() => setAtLimit(false), 500);
        } else {
            setAtLimit(true);
            if (atLimitTimeoutRef.current) clearTimeout(atLimitTimeoutRef.current);
            atLimitTimeoutRef.current = setTimeout(() => setAtLimit(false), 500);
        }
    };

    const scrollToCategory = (category: string) => {
        setEmojiSearch('');

        setTimeout(() => {
            const menuEl = emojiMenuRef.current;
            const categoryEl = categoryRefs.current[category];

            if (menuEl && categoryEl) {
                menuEl.scrollTop = categoryEl.offsetTop - menuEl.offsetTop;
            }
        }, 0);
    }

    useEffect(() => {
        const textArea = inputRef.current;
        const container = containerRef.current;
        if (!textArea) return;

        let frameID: number | null = null;
        const scheduleExpand = () => {
            if (frameID !== null) {
                cancelAnimationFrame(frameID);
            }
            frameID = requestAnimationFrame(() => {
                frameID = null;
                handleExpand();
            });
        };
        const resizeOberserver = new ResizeObserver(scheduleExpand);

        resizeOberserver.observe(container || textArea);
        return () => {
            if (frameID !== null) {
                cancelAnimationFrame(frameID);
            }
            resizeOberserver.disconnect();
        };
    }, []);

    // Derived from messages so will persist between tabs as well
    // TODO: make O(1) by only adding messages
    const groupedMessages = useMemo(() => {
        return messages.reduce((groups, msg) => {
            const lastGroup = groups[groups.length - 1];

            if (
                lastGroup &&
                !msg.isSystem &&
                lastGroup[0].userHandle === msg.userHandle //lastGroup[0].userName === msg.userName
            ) {
                lastGroup.push(msg);
            } else {
                groups.push([msg]);
            }

            return groups;
        }, [] as typeof messages[]);
    }, [messages]);

    useEffect(() => {
        const chat = chatRef.current;
        if (!chat) return;

        // Check if scroll is at the bottom
        const handleScroll = () => {
            isAtBottom.current = chat.scrollHeight - (chat.clientHeight + chat.scrollTop) <= 4;
            setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) >= 200);
        };

        chat.addEventListener('scroll', handleScroll);
        return () => chat.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const chat = chatRef.current;
        if (!chat) return;

        if (isAtBottom.current) chat.scrollTop = chat.scrollHeight;
        setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) >= 200);
    }, [messages]);

    const jumpToBottom = () => {
        const chat = chatRef.current;
        if (!chat) return;

        chat.scrollTop = chat.scrollHeight;
    };

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        joinChatRoom,
        handleChange,
        handleSubmit,
        chatRef,
        groupedMessages,
        inputRef,
        inputText,
        showJump,
        jumpToBottom,
        containerRef,
        counterRef,
        atLimit,
        MAX_CHARS,
        clearMessages,
        insertEmoji,
        categoryRefs,
        emojiMenuRef,
        scrollToCategory,
        emojiSearch,
        setEmojiSearch
    };
};