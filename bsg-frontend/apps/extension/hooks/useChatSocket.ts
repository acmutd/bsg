import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { RTC_SERVICE_URL } from '../lib/config';
import { useUserStore } from '@/stores/useUserStore';
import { text } from 'stream/consumers';

export type Message = {
    userHandle: string;
    userName?: string;
    userPhoto?: string;
    data: string;
    roomID: string;
    isSystem?: boolean;
}

export const useChatSocket = () => {

    const socketRef = useRef<WebSocket | null>(null);
    const pendingRoomIDRef = useRef<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const chatRef = useRef<HTMLDivElement | null>(null);
    const isAtBottom = useRef<boolean>(true);

    const [ messages, setMessages ] = useState<Message[]>([]);
    const [ charCount, setCharCount ] = useState<number>(0);
    const [ isMultiline, setIsMultiline ] = useState<boolean>(false);
    const [ showJump, setShowJump ] = useState<boolean>(false);

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

        // Trim whitespace and squash newlines
        const text = textArea.value.trim().replace(/\n{3,}/g, '\n\n');
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

            textArea.value = '';
            textArea.style.height = 'auto';
            setIsMultiline(false);
            setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) > 200);
        }
    };

    const handleChange = () => {
        const chat = chatRef.current;
        const textArea = inputRef.current;
        if (!chat || !textArea) return;

        setCharCount(textArea.value.length);

        // Get auto line height
        textArea.style.height = 'auto';
        const lineHeight = parseInt(getComputedStyle(textArea).lineHeight);

        // Check multiline before width expansion
        setIsMultiline(textArea.scrollHeight > lineHeight);

        // Cap text area height at 8 * line height
        textArea.style.height = `${Math.min(textArea.scrollHeight, 8 * lineHeight)}px`
        
        setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) > 200);
        if (isAtBottom.current) chat.scrollTop = chat.scrollHeight;
    }

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
            isAtBottom.current = chat.clientHeight + chat.scrollTop === chat.scrollHeight;
            setShowJump(chat.scrollHeight - (chat.clientHeight + chat.scrollTop) > 200);
        };

        chat.addEventListener('scroll', handleScroll)
        return () => chat.removeEventListener('scroll', handleScroll);
    }, [])

    useEffect(() => {
        const chat = chatRef.current;
        if (!chat) return;

        if (isAtBottom.current) chat.scrollTop = chat.scrollHeight;
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
        charCount,
        showJump,
        jumpToBottom,
        isMultiline
    };
};