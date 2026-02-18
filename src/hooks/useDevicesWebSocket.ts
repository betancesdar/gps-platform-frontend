import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDevicesLocationStore } from '@/store/useDevicesLocationStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { WsMockLocationMessage } from '@/types/geocode';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

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

            const socket = io(`${WS_URL}/devices`, {
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
                // ... same logic
                let deviceId = message.deviceId;
                if (!deviceId) return;

                updateLocation(deviceId, {
                    lat: message.latitude,
                    lng: message.longitude,
                    bearing: message.bearing,
                    speed: message.speed,
                    accuracy: message.accuracy,
                });
            });

            // Listen for device status events
            socket.on('DEVICE_ONLINE', (data: { deviceId: string }) => {
                console.log('✅ Device Online:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, 'ONLINE');
            });

            socket.on('DEVICE_OFFLINE', (data: { deviceId: string }) => {
                console.log('❌ Device Offline:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, 'OFFLINE');
            });

            socket.on('DEVICE_STATUS_UPDATE', (data: { deviceId: string; status: 'ONLINE' | 'OFFLINE' | 'EXECUTING' }) => {
                console.log('🔄 Device Status Update:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, data.status);
            });

            // Listen for specific connection events (aliases)
            socket.on('DEVICE_CONNECTED', (data: { deviceId: string }) => {
                console.log('✅ Device Connected:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, 'ONLINE');
            });

            socket.on('DEVICE_DISCONNECTED', (data: { deviceId: string }) => {
                console.log('❌ Device Disconnected:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, 'OFFLINE');
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
