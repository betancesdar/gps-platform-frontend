import { create } from 'zustand';
import { DeviceLocationState } from '@/types/geocode';

interface DevicesLocationState {
    locationsByDeviceId: Record<string, DeviceLocationState>;
    selectedDeviceId: string | null;
    followSelected: boolean;

    // Actions
    updateLocation: (deviceId: string, location: Omit<DeviceLocationState, 'updatedAt'>) => void;
    setSelectedDeviceId: (deviceId: string | null) => void;
    setFollowSelected: (enabled: boolean) => void;
    clearStaleLocations: () => void;
    clearAll: () => void;
}

const STALE_THRESHOLD_MS = 10000; // 10 seconds

export const useDevicesLocationStore = create<DevicesLocationState>((set) => ({
    locationsByDeviceId: {},
    selectedDeviceId: null,
    followSelected: false,

    updateLocation: (deviceId, location) =>
        set((state) => ({
            locationsByDeviceId: {
                ...state.locationsByDeviceId,
                [deviceId]: {
                    ...location,
                    updatedAt: Date.now(),
                },
            },
        })),

    setSelectedDeviceId: (deviceId) => set({ selectedDeviceId: deviceId }),

    setFollowSelected: (enabled) => set({ followSelected: enabled }),

    clearStaleLocations: () =>
        set((state) => {
            const now = Date.now();
            const filtered: Record<string, DeviceLocationState> = {};

            Object.entries(state.locationsByDeviceId).forEach(([deviceId, location]) => {
                if (now - location.updatedAt <= STALE_THRESHOLD_MS) {
                    filtered[deviceId] = location;
                }
            });

            return { locationsByDeviceId: filtered };
        }),

    clearAll: () => set({ locationsByDeviceId: {}, selectedDeviceId: null }),
}));

// Utility to check if a location is stale
export function isLocationStale(location: DeviceLocationState): boolean {
    return Date.now() - location.updatedAt > STALE_THRESHOLD_MS;
}
