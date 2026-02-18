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
    assignedRoute?: {
        id: string;
        name: string;
    };
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
    assignedRoute?: {
        id: string;
        name: string;
    };
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
        assignedRoute: backendDevice.assignedRoute,
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

    /**
     * Assign route to device (without starting stream)
     * PUT /api/devices/:deviceId/route
     */
    async assignRoute(deviceId: string, routeId: string): Promise<Device> {
        const response = await axiosInstance.put<ApiResponse<BackendDevice>>(`/devices/${deviceId}/route`, {
            routeId
        });
        return transformDevice(response.data.data);
    },
};
