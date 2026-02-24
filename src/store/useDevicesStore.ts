import { create } from 'zustand';
import { Device, devicesService } from '@/services/devices.service';

interface DevicesState {
    devices: Device[];
    selectedDeviceId: string | null;
    isLoading: boolean;
    error: string | null;

    // State for filtering
    showOfflineHistory: boolean;

    // Route Selection State
    selectedRouteIds: Record<string, string>;

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

    // New Actions
    toggleShowOfflineHistory: () => void;
    loadDevices: () => Promise<void>;
    deleteDevice: (deviceId: string) => Promise<void>;
    setSelectedRouteId: (deviceId: string, routeId: string) => void;
}

export const useDevicesStore = create<DevicesState>((set, get) => ({
    devices: [],
    selectedDeviceId: null,
    isLoading: false,
    error: null,
    showOfflineHistory: false, // Default: Hide offline history (filter active only)
    selectedRouteIds: {},

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
            selectedDeviceId: state.selectedDeviceId === deviceId ? null : state.selectedDeviceId,
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

    // New Actions Implementation
    toggleShowOfflineHistory: () => {
        const current = get().showOfflineHistory;
        set({ showOfflineHistory: !current });
        // Reload devices with new filter settings
        get().loadDevices();
    },

    loadDevices: async () => {
        const { showOfflineHistory, setLoading, setDevices, setError } = get();
        setLoading(true);
        try {
            // If showOfflineHistory is false, fetch only active within 600s (10 min)
            // If true, fetch all (undefined/null)
            const activeWithin = showOfflineHistory ? undefined : 600;
            const devices = await devicesService.getDevices(activeWithin);

            // Filter out locally deleted devices
            let deletedIds: string[] = [];
            if (typeof window !== 'undefined') {
                try {
                    const stored = localStorage.getItem('deleted_device_ids');
                    if (stored) deletedIds = JSON.parse(stored);
                } catch (e) {
                    console.error('Failed to parse deleted_device_ids', e);
                }
            }

            const filteredDevices = devices.filter(d => !deletedIds.includes(d.id));
            setDevices(filteredDevices);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load devices:', err);
            setError(err.message || 'Failed to load devices');
        } finally {
            setLoading(false);
        }
    },

    deleteDevice: async (deviceId: string) => {
        try {
            await devicesService.deleteDevice(deviceId);
            // Only remove from local state after backend confirms delete
            get().removeDevice(deviceId);
        } catch (err: any) {
            console.error('Failed to delete device:', err);
            throw new Error(err?.message || 'Failed to delete device');
        }
    },

    setSelectedRouteId: (deviceId: string, routeId: string) =>
        set((state) => ({
            selectedRouteIds: {
                ...state.selectedRouteIds,
                [deviceId]: routeId,
            },
        })),
}));

// Re-export Device type for convenience
export type { Device } from '@/services/devices.service';
