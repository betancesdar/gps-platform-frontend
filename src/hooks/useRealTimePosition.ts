import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useDevicesStore } from '@/store/useDevicesStore';
import { ExecutionProgressUpdateEvent } from '@/types';

export const useRealTimePosition = () => {
    const { updateDevice } = useDevicesStore();

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleProgressUpdate = (data: ExecutionProgressUpdateEvent) => {
            // Actualizar el dispositivo con el progreso
            updateDevice(data.deviceId, {
                // Los datos del progreso se pueden guardar en el dispositivo
                ...data,
            });
        };

        socket.on('EXECUTION_PROGRESS_UPDATE', handleProgressUpdate);

        return () => {
            socket?.off('EXECUTION_PROGRESS_UPDATE', handleProgressUpdate);
        };
    }, [updateDevice]);

    const socket = getSocket();
    return {
        isConnected: socket?.connected || false,
    };
};
