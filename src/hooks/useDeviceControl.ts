'use client';

import { useState } from 'react';
import { streamService, StreamOptions } from '@/services/stream.service';
import { useDevicesStore } from '@/store/useDevicesStore';
import { create } from 'zustand';

interface DeviceControlState {
    pendingActions: Record<string, boolean>;
    setPending: (deviceId: string, isPending: boolean) => void;
}

export const useDeviceControlStore = create<DeviceControlState>((set) => ({
    pendingActions: {},
    setPending: (deviceId, isPending) =>
        set((state) => ({
            pendingActions: {
                ...state.pendingActions,
                [deviceId]: isPending,
            },
        })),
}));

export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const updateDeviceStatus = useDevicesStore((state) => state.updateDeviceStatus);
    const { pendingActions, setPending } = useDeviceControlStore();

    const isDevicePending = (deviceId: string) => !!pendingActions[deviceId];

    const startDevice = async (deviceId: string, routeId: string, speed?: number) => {
        const currentStatus = useDevicesStore.getState().devicesById[deviceId]?.status;
        if (currentStatus === 'EXECUTING') return null;
        if (isDevicePending(deviceId)) return null;

        setPending(deviceId, true);
        setIsLoading(true);
        setError(null);
        try {
            const options: StreamOptions = {
                speed: speed || 30, // Default to 30 km/h
                loop: false,
            };
            const truthStatus = await streamService.start(deviceId, routeId, options);

            // Single source of truth sync using POST response
            if (truthStatus && truthStatus.status !== 'stopped') {
                updateDeviceStatus(deviceId, 'EXECUTING');
            } else {
                updateDeviceStatus(deviceId, 'ONLINE');
            }

            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error starting stream';
            setError(message);

            // Fallback status check
            streamService.getStatus(deviceId).then(res => {
                if (!res || res.status === 'stopped') updateDeviceStatus(deviceId, 'ONLINE');
                else if (res.status === 'running' || res.status === 'paused') updateDeviceStatus(deviceId, 'EXECUTING');
            }).catch(() => { });

            throw err;
        } finally {
            setPending(deviceId, false);
            setIsLoading(false);
        }
    };

    const pauseDevice = async (deviceId: string) => {
        if (isDevicePending(deviceId)) return;
        setPending(deviceId, true);
        setIsLoading(true);
        setError(null);
        try {
            const truthStatus = await streamService.pause(deviceId);

            // Single source of truth sync
            if (truthStatus && truthStatus.status !== 'stopped') {
                updateDeviceStatus(deviceId, 'EXECUTING');
            } else {
                updateDeviceStatus(deviceId, 'ONLINE');
            }

            return truthStatus; // Backend response acts as truth
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error pausing stream';
            setError(message);

            streamService.getStatus(deviceId).then(res => {
                if (!res || res.status === 'stopped') updateDeviceStatus(deviceId, 'ONLINE');
                else updateDeviceStatus(deviceId, 'EXECUTING');
            }).catch(() => { });

            throw err;
        } finally {
            setPending(deviceId, false);
            setIsLoading(false);
        }
    };

    const resumeDevice = async (deviceId: string) => {
        if (isDevicePending(deviceId)) return;
        setPending(deviceId, true);
        setIsLoading(true);
        setError(null);
        try {
            const truthStatus = await streamService.resume(deviceId);

            // Single source of truth sync
            if (truthStatus && truthStatus.status !== 'stopped') {
                updateDeviceStatus(deviceId, 'EXECUTING');
            } else {
                updateDeviceStatus(deviceId, 'ONLINE');
            }

            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error resuming stream';
            setError(message);

            streamService.getStatus(deviceId).then(res => {
                if (!res || res.status === 'stopped') updateDeviceStatus(deviceId, 'ONLINE');
                else updateDeviceStatus(deviceId, 'EXECUTING');
            }).catch(() => { });

            throw err;
        } finally {
            setPending(deviceId, false);
            setIsLoading(false);
        }
    };

    const stopDevice = async (deviceId: string) => {
        const currentStatus = useDevicesStore.getState().devicesById[deviceId]?.status;
        if (currentStatus !== 'EXECUTING') return;

        if (isDevicePending(deviceId)) return;
        setPending(deviceId, true);
        setIsLoading(true);
        setError(null);
        try {
            const truthStatus = await streamService.stop(deviceId);

            // Single source of truth sync
            if (truthStatus && truthStatus.status !== 'stopped') {
                updateDeviceStatus(deviceId, 'EXECUTING');
            } else {
                updateDeviceStatus(deviceId, 'ONLINE');
            }

            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error stopping stream';
            setError(message);
            throw err;
        } finally {
            setPending(deviceId, false);
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

    const skipDwell = async (deviceId: string) => {
        if (isDevicePending(deviceId)) return;
        setPending(deviceId, true);
        setError(null);
        try {
            const result = await streamService.skipDwell(deviceId);
            return result;
        } catch (err: any) {
            const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Error skipping dwell';
            setError(message);
            throw err;
        } finally {
            setPending(deviceId, false);
        }
    };

    const extendDwell = async (deviceId: string, seconds: number) => {
        if (isDevicePending(deviceId)) return;
        setPending(deviceId, true);
        setError(null);
        try {
            const result = await streamService.extendDwell(deviceId, seconds);
            return result;
        } catch (err: any) {
            const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Error extending dwell';
            setError(message);
            throw err;
        } finally {
            setPending(deviceId, false);
        }
    };

    return {
        startDevice,
        pauseDevice,
        resumeDevice,
        stopDevice,
        getStreamStatus,
        skipDwell,
        extendDwell,
        isLoading,
        isDevicePending,
        error,
    };
};
