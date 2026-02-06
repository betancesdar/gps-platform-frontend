import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDevicesLocationStore } from '@/store/useDevicesLocationStore';
import { WsMockLocationMessage } from '@/types/geocode';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

interface UseDevicesWebSocketOptions {
    autoConnect?: boolean;
}

/**
 * Hook to manage WebSocket connection for live device tracking
 * Listens for MOCK_LOCATION messages and updates the location store
 * 
 * NOTE: If MOCK_LOCATION messages don't include deviceId, you'll need to
 * resolve it based on your connection scheme (e.g., room/channel metadata)
 */
export function useDevicesWebSocket(options: UseDevicesWebSocketOptions = {}) {
    const { autoConnect = true } = options;
    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 1000;

    const updateLocation = useDevicesLocationStore((state) => state.updateLocation);

    useEffect(() => {
        if (!autoConnect) return;

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No auth token found, cannot connect to WebSocket');
            return;
        }

        const connectWebSocket = () => {
            console.log('Connecting to devices WebSocket...');

            const socket = io(`${WS_URL}/ws`, {
                auth: {
                    token,
                },
                transports: ['websocket'],
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ Connected to devices WebSocket');
                reconnectAttempts.current = 0;
            });

            socket.on('disconnect', (reason) => {
                console.log('❌ Disconnected from WebSocket:', reason);

                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
                    console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        socket.connect();
                    }, delay);
                }
            });

            socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });

            // Listen for MOCK_LOCATION messages
            socket.on('MOCK_LOCATION', (message: WsMockLocationMessage['data']) => {
                console.log('📍 Received MOCK_LOCATION:', message);

                // Extract deviceId - adjust this based on your backend implementation
                let deviceId = message.deviceId;

                // If deviceId is not in the message, you may need to resolve it
                // from the socket connection metadata. For example:
                // deviceId = socket.handshake?.auth?.deviceId;
                // Or from a room/channel that the socket joined.

                if (!deviceId) {
                    console.warn('MOCK_LOCATION message missing deviceId, cannot update location');
                    return;
                }

                // Update location store
                updateLocation(deviceId, {
                    lat: message.latitude,
                    lng: message.longitude,
                    bearing: message.bearing,
                    speed: message.speed,
                    accuracy: message.accuracy,
                });
            });

            // Generic message listener (for debugging)
            socket.onAny((eventName, ...args) => {
                console.log(`[WS Event] ${eventName}:`, args);
            });
        };

        connectWebSocket();

        // Cleanup
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [autoConnect, updateLocation]);

    return {
        socket: socketRef.current,
        isConnected: socketRef.current?.connected || false,
    };
}
