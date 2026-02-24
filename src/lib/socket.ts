/**
 * Native WebSocket client for GPS Mock Location Backend
 * Backend uses ws library, not socket.io
 * Connection URL: ws://<host>:4000/ws?token=JWT&deviceId=DEVICE_ID
 */

/**
 * Build the WebSocket URL from the API base URL.
 *
 * Rules:
 *  - http://HOST:PORT/...  →  ws://HOST:PORT/ws
 *  - https://HOST/...      →  wss://HOST/ws
 *  - Appends ?token=TOKEN and optionally &deviceId=ID
 *
 * Source of truth: NEXT_PUBLIC_API_URL (same var used by axiosInstance).
 * Fallback: window.location.hostname + :4000 when in browser.
 */
export function buildWsUrl(token: string): string {
    // Derive the HTTP base the same way axios does
    const apiBase: string =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined'
            ? `http://${window.location.hostname}:4000`
            : 'http://localhost:4000');

    let wsBase: string;
    try {
        const url = new URL(apiBase);
        // Convert scheme: http → ws, https → wss
        const wsScheme = url.protocol === 'https:' ? 'wss' : 'ws';
        // Retain host + explicit port; replace path with /ws
        wsBase = `${wsScheme}://${url.hostname}${url.port ? ':' + url.port : ''}/ws`;
    } catch {
        // Fallback if URL parse fails (shouldn't happen in practice)
        wsBase = apiBase
            .replace(/^https/, 'wss')
            .replace(/^http/, 'ws')
            .replace(/\/[^/]*$/, '') + '/ws';
    }

    const wsUrl = `${wsBase}?token=${encodeURIComponent(token)}`;

    if (process.env.NODE_ENV !== 'production') {
        console.log('[DASH_WS] apiBaseUrl=', apiBase);
        console.log('[DASH_WS] wsUrl=', wsUrl.replace(token, token.slice(0, 8) + '…'));
    }

    return wsUrl;
}

// WebSocket message types from backend
export type WSMessageType = 'CONNECTED' | 'MOCK_LOCATION' | 'ERROR' | 'STREAM_STARTED' | 'STREAM_PAUSED' | 'STREAM_RESUMED' | 'STREAM_STOPPED' | 'STREAM_COMPLETED' | 'EXECUTION_PROGRESS_UPDATE';

export interface WSMessage {
    type: WSMessageType;
    payload?: any;
    message?: string;
}

export interface MockLocationPayload {
    lat: number;
    lng: number;
    speed: number;
    bearing: number;
    accuracy: number;
}

type MessageHandler = (message: WSMessage) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'connecting' | 'error', error?: string) => void;

let socket: WebSocket | null = null;
let messageHandlers: MessageHandler[] = [];
let statusHandlers: StatusHandler[] = [];
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

// Current connection params (for reconnection)
let currentToken: string | null = null;
let currentDeviceId: string | null = null;

/**
 * Get the current WebSocket instance
 */
export const getSocket = (): WebSocket | null => {
    return socket;
};

/**
 * Check if WebSocket is connected
 */
export const isConnected = (): boolean => {
    return socket !== null && socket.readyState === WebSocket.OPEN;
};

/**
 * Connect to WebSocket server
 * @param token JWT token from login
 */
export const connectSocket = (token: string): WebSocket | null => {
    if (!token) return null;

    // Disconnect existing socket
    if (socket) {
        disconnectSocket();
    }

    // Store for reconnection
    currentToken = token;

    // Build WebSocket URL with correct host, port, and /ws path
    const wsUrl = buildWsUrl(token);

    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, 'TOKEN_HIDDEN'));
    notifyStatus('connecting');

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttempts = 0;
        notifyStatus('connected');
    };

    socket.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        notifyStatus('disconnected');

        // Auto-reconnect if not intentionally closed
        if (event.code !== 1000 && event.code !== 1001 && currentToken) {
            attemptReconnect();
        }
    };

    socket.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
        notifyStatus('error', 'Connection error');
    };

    socket.onmessage = (event) => {
        try {
            const message: WSMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message:', message.type, message.payload);

            // Notify all message handlers
            messageHandlers.forEach(handler => {
                try {
                    handler(message);
                } catch (e) {
                    console.error('Error in message handler:', e);
                }
            });
        } catch (e) {
            console.error('Failed to parse WebSocket message:', event.data);
        }
    };

    return socket;
};

/**
 * Attempt to reconnect to WebSocket
 */
const attemptReconnect = () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('🔴 Max reconnection attempts reached');
        notifyStatus('error', 'Failed to reconnect after multiple attempts');
        return;
    }

    reconnectAttempts++;
    console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }

    reconnectTimeout = setTimeout(() => {
        if (currentToken) {
            connectSocket(currentToken);
        }
    }, RECONNECT_DELAY);
};

/**
 * Disconnect WebSocket
 */
export const disconnectSocket = (): void => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    currentToken = null;
    reconnectAttempts = 0;

    if (socket) {
        socket.close(1000, 'Client disconnect');
        socket = null;
    }
};

/**
 * Send message to WebSocket server
 */
export const sendMessage = (type: string, payload?: any): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('Cannot send message: WebSocket not connected');
        return false;
    }

    const message = JSON.stringify({ type, payload });
    socket.send(message);
    console.log('📤 Sent WebSocket message:', type, payload);
    return true;
};

/**
 * Register a message handler
 */
export const onMessage = (handler: MessageHandler): (() => void) => {
    messageHandlers.push(handler);
    return () => {
        messageHandlers = messageHandlers.filter(h => h !== handler);
    };
};

/**
 * Register a status handler
 */
export const onStatus = (handler: StatusHandler): (() => void) => {
    statusHandlers.push(handler);
    return () => {
        statusHandlers = statusHandlers.filter(h => h !== handler);
    };
};

/**
 * Notify all status handlers
 */
const notifyStatus = (status: 'connected' | 'disconnected' | 'connecting' | 'error', error?: string): void => {
    statusHandlers.forEach(handler => {
        try {
            handler(status, error);
        } catch (e) {
            console.error('Error in status handler:', e);
        }
    });
};

/**
 * Clear all handlers (use on unmount)
 */
export const clearHandlers = (): void => {
    messageHandlers = [];
    statusHandlers = [];
};

export default getSocket;
