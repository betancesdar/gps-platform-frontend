import { useEffect, useState } from 'react';
import { onMessage, isConnected, WSMessage } from '@/lib/socket';
import { useDevicesStore } from '@/store/useDevicesStore';
import { ExecutionProgressUpdateEvent } from '@/types';

export const useRealTimePosition = () => {
    const { updateDevice } = useDevicesStore();
    const [connected, setConnected] = useState(isConnected());

    useEffect(() => {
        // Update connection status periodically or listen to status changes (if available)
        // For now, simple check on mount
        setConnected(isConnected());

        const handleMessage = (message: WSMessage) => {
            if (message.type === 'EXECUTION_PROGRESS_UPDATE' && message.payload) {
                const data = message.payload as ExecutionProgressUpdateEvent;
                updateDevice(data.deviceId, {
                    status: 'EXECUTING',
                    lastSeen: new Date(data.timestamp),
                });
            }
        };

        const unsubscribe = onMessage(handleMessage);

        return () => {
            unsubscribe();
        };
    }, [updateDevice]);

    return {
        isConnected: connected,
    };
};
