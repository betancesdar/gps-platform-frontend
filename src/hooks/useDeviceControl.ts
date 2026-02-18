'use client';

import { useState } from 'react';
import { streamService, StreamOptions } from '@/services/stream.service';
import { useDevicesStore } from '@/store/useDevicesStore';

export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const updateDeviceStatus = useDevicesStore((state) => state.updateDeviceStatus);

    const startDevice = async (deviceId: string, routeId: string, speed?: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const options: StreamOptions = {
                speed: speed || 30, // Default to 30 km/h
                loop: false,
            };
            await streamService.start(deviceId, routeId, options);
            updateDeviceStatus(deviceId, 'EXECUTING');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error starting stream';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const pauseDevice = async (deviceId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await streamService.pause(deviceId);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error pausing stream';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const resumeDevice = async (deviceId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await streamService.resume(deviceId);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error resuming stream';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const stopDevice = async (deviceId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await streamService.stop(deviceId);
            updateDeviceStatus(deviceId, 'ONLINE');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error stopping stream';
            setError(message);
            throw err;
        } finally {
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
