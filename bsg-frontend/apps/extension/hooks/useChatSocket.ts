import { useEffect, useRef, useState, useCallback } from 'react';

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
            console.log('Connected to RTC service');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);

                if (response.status === 'ok') {
                    const { message, responseType } = response;

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
                        // Check if this is a round-start message (contains comma-separated problem IDs)
                        let displayMessage = message.data;
                        if (message.data && message.data.includes(',') && /^\d+(,\d+)*$/.test(message.data)) {
                            // This is a problem list from round-start
                            const problemIds = message.data.split(',');
                            displayMessage = `Round started!\nProblems: ${problemIds.join(', ')}`;
                        }

                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: displayMessage,
                            roomID: message.roomID,
                            isSystem: true
                        }]);
                    } else if (responseType === 'user-joined') {
                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: `${message.userHandle} joined the room`,
                            roomID: message.roomID,
                            isSystem: true
                        }]);
                    } else if (responseType === 'user-left') {
                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: `${message.userHandle} left the room`,
                            roomID: message.roomID,
                            isSystem: true
                        }]);
                    } else if (responseType === 'round-started') {
                        const problemList = message.problemList || [];
                        const problemText = problemList.length > 0
                            ? `\nProblems: ${problemList.join(', ')}`
                            : '';
                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: `Round started! Duration: ${message.duration} minutes${problemText}`,
                            roomID: message.roomID,
                            isSystem: true
                        }]);
                    } else if (responseType === 'submission-created') {
                        setMessages(prev => [...prev, {
                            userHandle: 'System',
                            data: `${message.userHandle} submitted a solution!`,
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

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('Disconnected from RTC service');
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [userEmail]);

    const joinRoom = useCallback((roomID: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && userEmail) {
            const payload = {
                name: userEmail,
                "request-type": "join-room",
                data: JSON.stringify({
                    userHandle: userEmail,
                    roomID: roomID
                })
            };
            console.log('Sending join-room:', payload); // Debug log
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

    const addMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    return {
        messages,
        isConnected,
        joinRoom,
        sendChatMessage,
        addMessage
    };
};