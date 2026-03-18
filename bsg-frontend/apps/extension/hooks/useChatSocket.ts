import { useCallback, useEffect, useMemo, useRef } from 'react';
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

    const socketRef = useRef<WebSocket | null>(null);
    const chatRef = useRef<HTMLDivElement | null>(null);

    const userEmail = useUserStore(s => s.email);
    const username = useUserStore(s => s.username);
    const iconUrl = useUserStore(s => s.iconUrl);
    const inputText = useRoomStore(s => s.inputText);
    const roomId = useRoomStore(s => s.roomId);
    const messages = useRoomStore(s => s.messages);
    const setInputText = useRoomStore(s => s.setInputText);
    const setMessages = useRoomStore(s => s.setMessages);
    const addMessage = useRoomStore(s => s.addMessage);
    const setIsConnected = useRoomStore(s => s.setIsConnected);
    const setLastGameEvent = useRoomStore(s => s.setLastGameEvent);

    useEffect(() => {
        if (!userEmail) return;

        const ws = new WebSocket(RTC_SERVICE_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);

                if (response.status === 'ok') {
                    const { message, responseType } = response;

                    if (responseType === 'chat-message') {
                        console.log('recieved chat message: ' + message)
                        addMessage({
                            userHandle: message.userHandle,
                            userName: message.userName,
                            userPhoto: message.userPhoto,
                            data: message.message || message.data,
                            roomID: message.roomID,
                            isSystem: false
                        });
                    } else if (responseType === 'system-announcement') {
                        console.log('recieved system message: ' + message);
                        addMessage({
                            userHandle: 'System',
                            data: message.data,
                            roomID: message.roomID,
                            isSystem: true
                        });
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

    const sendMessage = () => {
        if (!roomId) return;

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && userEmail) {
            const payload = {
                name: userEmail,
                "request-type": "chat-message",
                data: JSON.stringify({
                    userHandle: userEmail,
                    userName: username,
                    userPhoto: iconUrl,
                    roomID: roomId,
                    message: inputText
                })
            };
            socketRef.current.send(JSON.stringify(payload));

            setInputText('');
        }
    };

    // Derived from messages so will persist as well
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
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [messages])

    return { joinChatRoom, sendMessage, chatRef, groupedMessages };
};
