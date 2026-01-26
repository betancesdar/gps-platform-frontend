import axiosInstance from '@/lib/axios';
import { Device, ApiResponse } from '@/types';

export const devicesService = {
    /**
     * Get all devices
     */
    async getDevices(): Promise<Device[]> {
        const response = await axiosInstance.get<Device[]>('/devices');
        return response.data;
    },

    /**
     * Get online devices only
     */
    async getOnlineDevices(): Promise<Device[]> {
        const response = await axiosInstance.get<Device[]>('/devices/online');
        return response.data;
    },

    /**
     * Get device by ID
     */
    async getDeviceById(deviceId: string): Promise<Device> {
        const response = await axiosInstance.get<Device>(`/devices/${deviceId}`);
        return response.data;
    },

    /**
     * Get device status
     */
    async getDeviceStatus(deviceId: string): Promise<any> {
        const response = await axiosInstance.get(`/devices/${deviceId}/status`);
        return response.data;
    },

    /**
     * Create device
     */
    async createDevice(name: string): Promise<Device> {
        const response = await axiosInstance.post<Device>('/devices', { name });
        return response.data;
    },

    /**
     * Update device
     */
    async updateDevice(deviceId: string, data: { name?: string }): Promise<Device> {
        const response = await axiosInstance.patch<Device>(`/devices/${deviceId}`, data);
        return response.data;
    },

    /**
     * Delete device
     */
    async deleteDevice(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<{ success: boolean }>(`/devices/${deviceId}`);
        return response.data;
    },

    // NOTA: El backend NO tiene endpoints REST para control de ejecución
    // El control se hace SOLO via WebSocket (START_ROUTE, PAUSE_ROUTE, etc.)
    // Por lo tanto, estos métodos han sido ELIMINADOS:
    // - assignRoute (no existe en backend)
    // - startRoute (usar WebSocket START_ROUTE)
    // - pauseRoute (usar WebSocket PAUSE_ROUTE)
    // - stopRoute (usar WebSocket STOP_ROUTE)
    // - startAll (usar WebSocket para cada dispositivo)
    // - stopAll (usar WebSocket para cada dispositivo)
};
