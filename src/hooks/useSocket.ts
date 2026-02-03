import { useEffect, useCallback } from 'react';
import {
    connectSocket,
    disconnectSocket,
    getSocket,
    onMessage,
    onStatus,
    clearHandlers,
    isConnected,
    WSMessage,
    MockLocationPayload,
} from '@/lib/socket';
import { useSocketStore } from '@/store/useSocketStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useAuthStore } from '@/store/useAuthStore';

export const useSocket = () => {
    const { setSocket, setConnectionStatus } = useSocketStore();
    const { updateDeviceStatus } = useDevicesStore();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (!token) {
            console.log('⚠️ No token available, skipping WebSocket connection');
            return;
        }

        // Connect to WebSocket
        const socket = connectSocket(token);
        setSocket(socket);

        // Handle connection status changes
        const unsubscribeStatus = onStatus((status, error) => {
            console.log('🔌 WebSocket status:', status, error || '');
            setConnectionStatus(status, error);
        });

        // Handle incoming messages
        const unsubscribeMessage = onMessage((message: WSMessage) => {
            switch (message.type) {
                case 'CONNECTED':
                    console.log('✅ WebSocket handshake complete');
                    break;

                case 'MOCK_LOCATION':
                    // Handle location updates for devices
                    const location = message.payload as MockLocationPayload;
                    console.log('📍 Location update:', location);
                    // You can emit this to a device location store if needed
                    break;

                case 'STREAM_STARTED':
                    console.log('▶️ Stream started:', message.payload);
                    if (message.payload?.deviceId) {
                        updateDeviceStatus(message.payload.deviceId, 'EXECUTING');
                    }
                    break;

                case 'STREAM_PAUSED':
                    console.log('⏸️ Stream paused:', message.payload);
                    break;

                case 'STREAM_RESUMED':
                    console.log('▶️ Stream resumed:', message.payload);
                    break;

                case 'STREAM_STOPPED':
                    console.log('⏹️ Stream stopped:', message.payload);
                    if (message.payload?.deviceId) {
                        updateDeviceStatus(message.payload.deviceId, 'ONLINE');
                    }
                    break;

                case 'STREAM_COMPLETED':
                    console.log('✅ Stream completed:', message.payload);
                    if (message.payload?.deviceId) {
                        updateDeviceStatus(message.payload.deviceId, 'ONLINE');
                    }
                    break;

                case 'ERROR':
                    console.error('❌ WebSocket error from server:', message.message);
                    break;

                default:
                    console.log('📨 Unknown message type:', message.type);
            }
        });

        // Cleanup on unmount
        return () => {
            unsubscribeStatus();
            unsubscribeMessage();
            clearHandlers();
            disconnectSocket();
            setSocket(null);
            setConnectionStatus('disconnected');
        };
    }, [token, setSocket, setConnectionStatus, updateDeviceStatus]);

    return {
        socket: getSocket(),
        isConnected: useSocketStore((state) => state.isConnected),
        connectionStatus: useSocketStore((state) => state.connectionStatus),
        connectionError: useSocketStore((state) => state.connectionError),
    };
};
