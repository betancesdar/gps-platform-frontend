'use client';

import { useState } from 'react';
import { streamService, StreamOptions } from '@/services/stream.service';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useDevicesLocationStore } from '@/store/useDevicesLocationStore';
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
    const updateLocation = useDevicesLocationStore((state) => state.updateLocation);
    const { pendingActions, setPending } = useDeviceControlStore();

    const isDevicePending = (deviceId: string) => !!useDeviceControlStore.getState().pendingActions[deviceId];

    const syncRealStatus = async (deviceId: string) => {
        try {
            const res = await streamService.getStatus(deviceId);
            if (res) {
                const newDevStatus = res.status === 'stopped' ? 'ONLINE' : 'EXECUTING';
                updateDeviceStatus(deviceId, newDevStatus);
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, {
                    ...prevLoc,
                    streamStatus: res.status ?? prevLoc?.streamStatus,
                    state: res.state ?? prevLoc?.state,
                    dwellRemainingSeconds: typeof res.dwellRemainingSeconds === 'number'
                        ? res.dwellRemainingSeconds
                        : (prevLoc as any)?.dwellRemainingSeconds
                });
            } else {
                updateDeviceStatus(deviceId, 'ONLINE');
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, {
                    ...prevLoc,
                    streamStatus: 'stopped',
                    state: undefined,
                    dwellRemainingSeconds: null
                });
            }
        } catch (err) {
            console.warn(`[SyncStatus] Failed to sync status for ${deviceId}`);
        }
    };

    const startDevice = async (deviceId: string, routeId: string, speed?: number) => {
        const currentStatus = useDevicesStore.getState().devicesById[deviceId]?.status;
        if (currentStatus === 'EXECUTING') return null;
        if (isDevicePending(deviceId)) return null;

        setPending(deviceId, true);
        setIsLoading(true);
        setError(null);
        try {
            const options: StreamOptions = { speed: speed || 30, loop: false };
            const truthStatus = await streamService.start(deviceId, routeId, options);
            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error starting stream';
            setError(message);
            throw err;
        } finally {
            await syncRealStatus(deviceId);
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
            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error pausing stream';
            setError(message);
            throw err;
        } finally {
            await syncRealStatus(deviceId);
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
            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error resuming stream';
            setError(message);
            throw err;
        } finally {
            await syncRealStatus(deviceId);
            setPending(deviceId, false);
            setIsLoading(false);
        }
    };

    const stopDevice = async (deviceId: string) => {
        if (isDevicePending(deviceId)) return;
        setPending(deviceId, true);
        setIsLoading(true);
        setError(null);
        try {
            const truthStatus = await streamService.stop(deviceId);
            return truthStatus;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Error stopping stream';
            setError(message);
            throw err;
        } finally {
            await syncRealStatus(deviceId);
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
            await syncRealStatus(deviceId);
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
            await syncRealStatus(deviceId);
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
