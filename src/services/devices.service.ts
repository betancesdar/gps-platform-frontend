import axiosInstance from '@/lib/axios';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Backend device format
export interface BackendDevice {
    deviceId: string;
    platform: string;
    appVersion: string;
    registeredAt: string;
    lastSeenAt?: string;
    isConnected: boolean;
    user?: string;
}

// Frontend device format (mapped)
export interface Device {
    id: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE' | 'EXECUTING';
    lastSeen: Date | null;
    createdAt: Date;
    updatedAt: Date;
    platform?: string;
    appVersion?: string;
}

// Transform backend device to frontend format
function transformDevice(backendDevice: BackendDevice): Device {
    return {
        id: backendDevice.deviceId,
        name: backendDevice.deviceId, // Use deviceId as name
        status: backendDevice.isConnected ? 'ONLINE' : 'OFFLINE',
        lastSeen: backendDevice.lastSeenAt ? new Date(backendDevice.lastSeenAt) : null,
        createdAt: new Date(backendDevice.registeredAt),
        updatedAt: new Date(backendDevice.registeredAt),
        platform: backendDevice.platform,
        appVersion: backendDevice.appVersion,
    };
}

export const devicesService = {
    /**
     * Register a new device
     * POST /api/devices/register
     */
    async registerDevice(deviceId: string, platform: string = 'web', appVersion: string = '1.0.0'): Promise<Device> {
        const response = await axiosInstance.post<ApiResponse<BackendDevice>>('/devices/register', {
            deviceId,
            platform,
            appVersion,
        });
        return transformDevice(response.data.data);
    },

    /**
     * Get all devices
     * GET /api/devices
     */
    async getDevices(): Promise<Device[]> {
        const response = await axiosInstance.get<ApiResponse<BackendDevice[]>>('/devices');

        // Handle various response formats
        let devices: BackendDevice[] = [];

        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            devices = response.data.data;
        } else if (Array.isArray(response.data)) {
            devices = response.data as unknown as BackendDevice[];
        }

        return devices.map(transformDevice);
    },

    /**
     * Get my devices
     * GET /api/devices/me
     */
    async getMyDevices(): Promise<Device[]> {
        const response = await axiosInstance.get<ApiResponse<BackendDevice[]>>('/devices/me');

        let devices: BackendDevice[] = [];
        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            devices = response.data.data;
        }

        return devices.map(transformDevice);
    },

    /**
     * Get device by ID
     * GET /api/devices/:deviceId
     */
    async getDeviceById(deviceId: string): Promise<Device> {
        const response = await axiosInstance.get<ApiResponse<BackendDevice>>(`/devices/${deviceId}`);
        return transformDevice(response.data.data);
    },

    /**
     * Delete device
     * DELETE /api/devices/:deviceId
     */
    async deleteDevice(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<ApiResponse<any>>(`/devices/${deviceId}`);
        return { success: response.data.success };
    },
};
