import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { RTC_SERVICE_URL } from '../lib/config';
import { useUserStore } from '@/stores/useUserStore';

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
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const counterRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chatRef = useRef<HTMLDivElement | null>(null);
    const isAtBottom = useRef<boolean>(true);
    const atLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [ messages, setMessages ] = useState<Message[]>([]);
    const [ inputText, setInputText ] = useState<string>('');
    const [ showJump, setShowJump ] = useState<boolean>(false);
    const [ atLimit, setAtLimit ] = useState<boolean>(false);

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
            if(userEmail && roomId){
                const payload ={
                    name:userEmail,
                    "request-type": "join-room",
                    data: JSON.stringify({
                        userHandle: userEmail,
                        roomID: pendingRoomIDRef.current
                    })
                };
                ws.send(JSON.stringify(payload));
            }
        };

        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);

                if (response.status === 'ok') {
                    const { message, responseType } = response;

                    if (responseType === 'chat-message') {
                        console.log('recieved chat message: ' + JSON.stringify(message))
                        setMessages( prev => [...prev, {
                            userHandle: message.userHandle,
                            userName: message.userName,
                            userPhoto: message.userPhoto,
                            data: message.message || message.data,
                            roomID: message.roomID,
                            isSystem: false
                        }]);
                    } else if (responseType === 'system-announcement') {
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
        };

        return () => {
            ws.close();
        };
    }, [userEmail]);

    const joinChatRoom = useCallback((roomID: string) => {
        // Clear messages when joining a new room so we don't see chat history from previous rooms
        setMessages([]);
        setLastGameEvent(null);
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
            socketRef.current.send(JSON.stringify(payload));
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

    useEffect(() => {
        const textArea = inputRef.current;
        if (!textArea) return;

        const resizeOberserver = new ResizeObserver(handleExpand);

        resizeOberserver.observe(textArea);
        return () => resizeOberserver.disconnect();
    }, []);

    // Derived from messages so will persist between tabs as well
    // TODO: make O(1) by only adding messages
    const groupedMessages = useMemo(() => {
        return messages.reduce((groups, msg) => {
            const lastGroup = groups[groups.length - 1];

            if (
                lastGroup &&
                !msg.isSystem &&
                lastGroup[0].userName === msg.userName
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
        MAX_CHARS
    };
};