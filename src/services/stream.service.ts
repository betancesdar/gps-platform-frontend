import axiosInstance from '@/lib/axios';

export interface StreamStatus {
    deviceId: string;
    routeId: string;
    status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
    currentPointIndex: number;
    progress: number; // 0-100
}

export interface StartStreamRequest {
    routeId: string;
    deviceId: string;
    speed?: number; // m/s, default: 1.4 (~5 km/h walking)
}

export const streamService = {
    /**
     * Start streaming location to a device
     * POST /api/stream/start
     */
    async start(data: StartStreamRequest): Promise<StreamStatus> {
        const response = await axiosInstance.post<StreamStatus>('/stream/start', data);
        return response.data;
    },

    /**
     * Pause streaming
     * POST /api/stream/pause
     */
    async pause(deviceId: string): Promise<StreamStatus> {
        const response = await axiosInstance.post<StreamStatus>('/stream/pause', { deviceId });
        return response.data;
    },

    /**
     * Resume streaming
     * POST /api/stream/resume
     */
    async resume(deviceId: string): Promise<StreamStatus> {
        const response = await axiosInstance.post<StreamStatus>('/stream/resume', { deviceId });
        return response.data;
    },

    /**
     * Stop streaming
     * POST /api/stream/stop
     */
    async stop(deviceId: string): Promise<StreamStatus> {
        const response = await axiosInstance.post<StreamStatus>('/stream/stop', { deviceId });
        return response.data;
    },

    /**
     * Get stream status for a device
     * GET /api/stream/status/:deviceId
     */
    async getStatus(deviceId: string): Promise<StreamStatus> {
        const response = await axiosInstance.get<StreamStatus>(`/stream/status/${deviceId}`);
        return response.data;
    },

    /**
     * Get all active streams
     * GET /api/stream/all
     */
    async getAll(): Promise<StreamStatus[]> {
        const response = await axiosInstance.get<StreamStatus[]>('/stream/all');
        return response.data;
    },
};
