import axiosInstance from '@/lib/axios';
import { Device } from '@/types';

export const devicesService = {
    /**
     * Register a new device (authorize for WebSocket)
     * POST /api/devices/register
     */
    async registerDevice(deviceId: string, name?: string): Promise<Device> {
        const response = await axiosInstance.post<Device>('/devices/register', {
            deviceId,
            name: name || deviceId,
        });
        return response.data;
    },

    /**
     * Get all devices
     * GET /api/devices
     */
    async getDevices(): Promise<Device[]> {
        const response = await axiosInstance.get<Device[]>('/devices');
        return response.data;
    },

    /**
     * Get device by ID
     * GET /api/devices/:id
     */
    async getDeviceById(deviceId: string): Promise<Device> {
        const response = await axiosInstance.get<Device>(`/devices/${deviceId}`);
        return response.data;
    },

    /**
     * Delete device
     * DELETE /api/devices/:id
     */
    async deleteDevice(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<{ success: boolean }>(`/devices/${deviceId}`);
        return response.data;
    },
};
