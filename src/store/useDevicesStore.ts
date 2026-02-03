import { create } from 'zustand';
import { Device } from '@/services/devices.service';

interface DevicesState {
    devices: Device[];
    selectedDeviceId: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setDevices: (devices: Device[]) => void;
    addDevice: (device: Device) => void;
    updateDevice: (deviceId: string, updates: Partial<Device>) => void;
    removeDevice: (deviceId: string) => void;
    updateDeviceStatus: (deviceId: string, status: 'ONLINE' | 'OFFLINE' | 'EXECUTING') => void;
    setSelectedDevice: (deviceId: string | null) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    clearDevices: () => void;
}

export const useDevicesStore = create<DevicesState>((set) => ({
    devices: [],
    selectedDeviceId: null,
    isLoading: false,
    error: null,

    setDevices: (devices) => set({ devices }),

    addDevice: (device) =>
        set((state) => ({
            devices: [...state.devices, device],
        })),

    updateDevice: (deviceId, updates) =>
        set((state) => ({
            devices: state.devices.map((device) =>
                device.id === deviceId ? { ...device, ...updates } : device
            ),
        })),

    removeDevice: (deviceId) =>
        set((state) => ({
            devices: state.devices.filter((device) => device.id !== deviceId),
        })),

    updateDeviceStatus: (deviceId, status) =>
        set((state) => ({
            devices: state.devices.map((device) =>
                device.id === deviceId
                    ? { ...device, status, lastSeen: new Date() }
                    : device
            ),
        })),

    setSelectedDevice: (deviceId) => set({ selectedDeviceId: deviceId }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearDevices: () => set({ devices: [], selectedDeviceId: null }),
}));

// Re-export Device type for convenience
export type { Device } from '@/services/devices.service';
