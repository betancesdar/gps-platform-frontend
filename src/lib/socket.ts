import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
    return socket;
};

export const createSocket = (token: string): Socket => {
    if (socket) {
        socket.disconnect();
    }

    // IMPORTANTE: namespace /devices según backend real
    socket = io(`${WS_URL}/devices`, {
        auth: {
            token: token,
        },
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
    });

    // Connection event handlers
    socket.on('connect', () => {
        console.log('✅ WebSocket connected to /devices:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('🔴 WebSocket connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 WebSocket reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
        console.error('🔴 WebSocket reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
        console.error('🔴 WebSocket reconnection failed');
    });

    return socket;
};

export const connectSocket = (token: string): Socket => {
    const socket = createSocket(token);
    socket.connect();
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const updateSocketAuth = (token: string): void => {
    if (socket) {
        socket.auth = { token };
        if (socket.connected) {
            socket.disconnect();
            socket.connect();
        }
    }
};

export default getSocket;
