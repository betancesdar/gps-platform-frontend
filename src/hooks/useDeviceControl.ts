import { useState } from 'react';
import { streamService, StreamStatus } from '@/services/stream.service';
import { useDevicesStore } from '@/store/useDevicesStore';

/**
 * Hook for controlling device stream execution via REST API
 * Backend uses REST endpoints for stream control, not WebSocket
 */
export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { updateDevice, updateDeviceStatus } = useDevicesStore();

    /**
     * Start streaming route to device
     * POST /api/stream/start
     */
    const startDevice = async (
        deviceId: string,
        routeId: string,
        speed?: number // m/s, default: 1.4
    ): Promise<StreamStatus | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await streamService.start({
                deviceId,
                routeId,
                speed: speed || 1.4,
            });
            updateDeviceStatus(deviceId, 'EXECUTING');
            return result;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Error starting stream';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Pause stream
     * POST /api/stream/pause
     */
    const pauseDevice = async (deviceId: string): Promise<StreamStatus | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await streamService.pause(deviceId);
            return result;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Error pausing stream';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Resume stream
     * POST /api/stream/resume
     */
    const resumeDevice = async (deviceId: string): Promise<StreamStatus | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await streamService.resume(deviceId);
            return result;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Error resuming stream';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Stop stream
     * POST /api/stream/stop
     */
    const stopDevice = async (deviceId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            await streamService.stop(deviceId);
            updateDeviceStatus(deviceId, 'ONLINE');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Error stopping stream';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Get stream status for a device
     * GET /api/stream/status/:deviceId
     */
    const getStreamStatus = async (deviceId: string): Promise<StreamStatus | null> => {
        try {
            return await streamService.getStatus(deviceId);
        } catch (err) {
            return null;
        }
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
        getStreamStatus,
        startAll,
        stopAll,
        isLoading,
        error,
    };
};
