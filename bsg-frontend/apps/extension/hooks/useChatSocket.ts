import {useCallback, useEffect, useRef, useState} from 'react';

const RTC_SERVICE_URL = 'ws://localhost:5001/ws';

export type Message = {
    userHandle: string;
    userName?: string;
    userPhoto?: string;
    data: string;
    roomID: string;
    isSystem?: boolean;
}

export const useChatSocket = (userEmail: string | null | undefined) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);

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
                    const {message, responseType} = response;

                    if (responseType === 'chat-message') {
                        setMessages(prev => [...prev, {
                            userHandle: message.userHandle,
                            userName: message.userName,
                            userPhoto: message.userPhoto,
                            data: message.message || message.data,
                            roomID: message.roomID,
                            isSystem: false
                        }]);
                    } else if (responseType === 'system-announcement') {
                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: message.data,
                            roomID: message.roomID,
                            isSystem: true
                        }]);
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

    const joinRoom = useCallback((roomID: string) => {
        // Clear messages when joining a new room so we don't see chat history from previous rooms
        setMessages([]);

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

    const sendChatMessage = useCallback((roomID: string, message: string, user?: { name: string, photo?: string }) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && userEmail) {
            const payload = {
                name: userEmail,
                "request-type": "chat-message",
                data: JSON.stringify({
                    userHandle: userEmail,
                    userName: user?.name,
                    userPhoto: user?.photo,
                    roomID: roomID,
                    message: message
                })
            };
            socketRef.current.send(JSON.stringify(payload));
        }
    }, [userEmail]);

    return {
        messages,
        isConnected,
        joinRoom,
        sendChatMessage
    };
};
