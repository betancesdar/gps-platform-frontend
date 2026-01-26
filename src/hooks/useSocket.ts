import { useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useSocketStore } from '@/store/useSocketStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
    DeviceOnlineEvent,
    DeviceOfflineEvent,
    DeviceStatusUpdateEvent,
    ExecutionProgressUpdateEvent,
} from '@/types';

export const useSocket = () => {
    const { setSocket, setConnected, setConnectionError } = useSocketStore();
    const { updateDeviceStatus, updateDevice } = useDevicesStore();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (!token) return;

        // Conectar socket con token
        const socket = connectSocket(token);
        setSocket(socket);

        // Connection events
        socket.on('connect', () => {
            console.log('✅ Socket connected to /devices');
            setConnected(true);
            setConnectionError(null);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('🔴 Socket connection error:', error);
            setConnectionError(error.message);
        });

        // Device events (BACKEND REAL - nombres exactos)
        socket.on('DEVICE_ONLINE', (data: DeviceOnlineEvent) => {
            console.log('📱 Device online:', data.deviceId, data.deviceName);
            updateDeviceStatus(data.deviceId, 'ONLINE');
        });

        socket.on('DEVICE_OFFLINE', (data: DeviceOfflineEvent) => {
            console.log('📱 Device offline:', data.deviceId);
            updateDeviceStatus(data.deviceId, 'OFFLINE');
        });

        socket.on('DEVICE_STATUS_UPDATE', (data: DeviceStatusUpdateEvent) => {
            console.log('📊 Device status update:', data);
            // Actualizar el dispositivo con el nuevo estado
            updateDevice(data.deviceId, {
                status: data.status as any,
                lastSeen: new Date(data.timestamp),
            });
        });

        socket.on('EXECUTION_PROGRESS_UPDATE', (data: ExecutionProgressUpdateEvent) => {
            console.log('⏱️ Execution progress:', data.deviceId, 'point', data.currentPointIndex);
            // Puedes actualizar el progreso en el store de devices si lo necesitas
            updateDevice(data.deviceId, {
                // Añade campos personalizados si es necesario
                ...data,
            });
        });

        // Cleanup on unmount
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('DEVICE_ONLINE');
            socket.off('DEVICE_OFFLINE');
            socket.off('DEVICE_STATUS_UPDATE');
            socket.off('EXECUTION_PROGRESS_UPDATE');
            disconnectSocket();
            setSocket(null);
            setConnected(false);
        };
    }, [
        token,
        setSocket,
        setConnected,
        setConnectionError,
        updateDeviceStatus,
        updateDevice,
    ]);

    return {
        socket: getSocket(),
        isConnected: useSocketStore((state) => state.isConnected),
        connectionError: useSocketStore((state) => state.connectionError),
    };
};
