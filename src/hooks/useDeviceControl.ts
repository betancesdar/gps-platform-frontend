'use client';

import { useState } from 'react';
import { streamService, StreamOptions } from '@/services/stream.service';
import { useDevicesStore } from '@/store/useDevicesStore';

const pendingActions = new Set<string>();

export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const updateDeviceStatus = useDevicesStore((state) => state.updateDeviceStatus);

    const startDevice = async (deviceId: string, routeId: string, speed?: number) => {
        if (pendingActions.has(deviceId)) return null;
        pendingActions.add(deviceId);
        setIsLoading(true);
        setError(null);
        try {
            const options: StreamOptions = {
                speed: speed || 30, // Default to 30 km/h
                loop: false,
            };
            // Optimistic UI update
            updateDeviceStatus(deviceId, 'EXECUTING');
            const result = await streamService.start(deviceId, routeId, options);
            return result;
        } catch (err: any) {
            // Revert optimistic update on failure
            updateDeviceStatus(deviceId, 'ONLINE');
            const message = err.response?.data?.message || err.message || 'Error starting stream';
            setError(message);
            throw err;
        } finally {
            pendingActions.delete(deviceId);
            setIsLoading(false);
        }
    };

    const pauseDevice = async (deviceId: string) => {
        if (pendingActions.has(deviceId)) return;
        pendingActions.add(deviceId);
        setIsLoading(true);
        setError(null);
        try {
            const result = await streamService.pause(deviceId);
            return result; // Backend response acts as truth
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error pausing stream';
            setError(message);
            throw err;
        } finally {
            pendingActions.delete(deviceId);
            setIsLoading(false);
        }
    };

    const resumeDevice = async (deviceId: string) => {
        if (pendingActions.has(deviceId)) return;
        pendingActions.add(deviceId);
        setIsLoading(true);
        setError(null);
        try {
            const result = await streamService.resume(deviceId);
            return result;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error resuming stream';
            setError(message);
            throw err;
        } finally {
            pendingActions.delete(deviceId);
            setIsLoading(false);
        }
    };

    const stopDevice = async (deviceId: string) => {
        if (pendingActions.has(deviceId)) return;
        pendingActions.add(deviceId);
        setIsLoading(true);
        setError(null);
        try {
            const result = await streamService.stop(deviceId);
            updateDeviceStatus(deviceId, 'ONLINE');
            return result;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error stopping stream';
            setError(message);
            throw err;
        } finally {
            pendingActions.delete(deviceId);
            setIsLoading(false);
        }
    };

    const getStreamStatus = async (deviceId: string) => {
        try {
            return await streamService.getStatus(deviceId);
        } catch (err) {
            return null;
        }
    };

    return {
        startDevice,
        pauseDevice,
        resumeDevice,
        stopDevice,
        getStreamStatus,
        isLoading,
        error,
    };
};
