import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useDevicesStore } from '@/store/useDevicesStore';
import {
    StartRoutePayload,
    PauseRoutePayload,
    ResumeRoutePayload,
    StopRoutePayload,
    UpdateSpeedPayload,
    SocketResponse,
    ExecutionPlan,
    ExecutionState,
} from '@/types';

export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { updateDevice } = useDevicesStore();

    /**
     * Start route execution via WebSocket
     */
    const startDevice = async (
        deviceId: string,
        routeId: string,
        speed?: number // m/s, default: 1.4
    ): Promise<ExecutionPlan | null> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const socket = getSocket();
            if (!socket || !socket.connected) {
                setIsLoading(false);
                setError('Socket not connected');
                reject(new Error('Socket not connected'));
                return;
            }

            const payload: StartRoutePayload = {
                deviceId,
                routeId,
                speed: speed || 1.4, // default walking speed
            };

            socket.emit('START_ROUTE', payload, (response: SocketResponse<ExecutionPlan>) => {
                setIsLoading(false);
                if (response.success) {
                    updateDevice(deviceId, { status: 'EXECUTING' });
                    resolve(response.executionPlan || null);
                } else {
                    const errorMsg = response.message || 'Error starting route';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    };

    /**
     * Pause route execution via WebSocket
     */
    const pauseDevice = async (deviceId: string): Promise<ExecutionState | null> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const socket = getSocket();
            if (!socket || !socket.connected) {
                setIsLoading(false);
                setError('Socket not connected');
                reject(new Error('Socket not connected'));
                return;
            }

            const payload: PauseRoutePayload = { deviceId };

            socket.emit('PAUSE_ROUTE', payload, (response: SocketResponse<ExecutionState>) => {
                setIsLoading(false);
                if (response.success) {
                    resolve(response.state || null);
                } else {
                    const errorMsg = response.message || 'Error pausing route';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    };

    /**
     * Resume route execution via WebSocket
     */
    const resumeDevice = async (deviceId: string): Promise<ExecutionState | null> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const socket = getSocket();
            if (!socket || !socket.connected) {
                setIsLoading(false);
                setError('Socket not connected');
                reject(new Error('Socket not connected'));
                return;
            }

            const payload: ResumeRoutePayload = { deviceId };

            socket.emit('RESUME_ROUTE', payload, (response: SocketResponse<ExecutionState>) => {
                setIsLoading(false);
                if (response.success) {
                    resolve(response.state || null);
                } else {
                    const errorMsg = response.message || 'Error resuming route';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    };

    /**
     * Stop route execution via WebSocket
     */
    const stopDevice = async (deviceId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const socket = getSocket();
            if (!socket || !socket.connected) {
                setIsLoading(false);
                setError('Socket not connected');
                reject(new Error('Socket not connected'));
                return;
            }

            const payload: StopRoutePayload = { deviceId };

            socket.emit('STOP_ROUTE', payload, (response: SocketResponse) => {
                setIsLoading(false);
                if (response.success) {
                    updateDevice(deviceId, { status: 'ONLINE' });
                    resolve();
                } else {
                    const errorMsg = response.message || 'Error stopping route';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    };

    /**
     * Update execution speed via WebSocket
     */
    const updateSpeed = async (deviceId: string, speed: number): Promise<ExecutionPlan | null> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            const socket = getSocket();
            if (!socket || !socket.connected) {
                setIsLoading(false);
                setError('Socket not connected');
                reject(new Error('Socket not connected'));
                return;
            }

            const payload: UpdateSpeedPayload = {
                deviceId,
                speed, // m/s
            };

            socket.emit('UPDATE_SPEED', payload, (response: SocketResponse<ExecutionPlan>) => {
                setIsLoading(false);
                if (response.success) {
                    resolve(response.executionPlan || null);
                } else {
                    const errorMsg = response.message || 'Error updating speed';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    };

    /**
     * Start all devices (bulk operation)
     */
    const startAll = async (devices: Array<{ id: string; routeId: string }>, speed?: number) => {
        const promises = devices.map((device) =>
            startDevice(device.id, device.routeId, speed)
        );
        return Promise.allSettled(promises);
    };

    /**
     * Stop all devices (bulk operation)
     */
    const stopAll = async (deviceIds: string[]) => {
        const promises = deviceIds.map((deviceId) => stopDevice(deviceId));
        return Promise.allSettled(promises);
    };

    return {
        startDevice,
        pauseDevice,
        resumeDevice,
        stopDevice,
        updateSpeed,
        startAll,
        stopAll,
        isLoading,
        error,
    };
};
