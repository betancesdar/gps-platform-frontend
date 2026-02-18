import axiosInstance from '@/lib/axios';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface StreamOptions {
    speed?: number;
    accuracy?: number;
    loop?: boolean;
}

export interface StreamStatus {
    deviceId: string;
    routeId: string;
    status: 'running' | 'paused' | 'stopped';
    speed: number;
    loop: boolean;
    currentIndex?: number;
    totalPoints?: number;
}

export const streamService = {
    /**
     * Start a stream
     * POST /api/stream/start
     */
    async start(deviceId: string, routeId?: string, options?: StreamOptions): Promise<StreamStatus> {
        const payload: any = {
            deviceId,
            speed: options?.speed || 30,
            loop: options?.loop || false,
            accuracy: options?.accuracy || 10,
        };

        if (routeId) {
            payload.routeId = routeId;
        }

        const response = await axiosInstance.post<ApiResponse<StreamStatus>>('/stream/start', payload);
        return response.data.data;
    },

    /**
     * Pause a stream
     * POST /api/stream/pause
     */
    async pause(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.post<ApiResponse<any>>('/stream/pause', {
            deviceId,
        });
        return { success: response.data.success };
    },

    /**
     * Resume a stream
     * POST /api/stream/resume
     */
    async resume(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.post<ApiResponse<any>>('/stream/resume', {
            deviceId,
        });
        return { success: response.data.success };
    },

    /**
     * Stop a stream
     * POST /api/stream/stop
     */
    async stop(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.post<ApiResponse<any>>('/stream/stop', {
            deviceId,
        });
        return { success: response.data.success };
    },

    /**
     * Get stream status for a device
     * GET /api/stream/status/:deviceId
     */
    async getStatus(deviceId: string): Promise<StreamStatus | null> {
        try {
            const response = await axiosInstance.get<ApiResponse<StreamStatus>>(`/stream/status/${deviceId}`);
            return response.data.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Get all active streams
     * GET /api/stream/all
     */
    async getAllActive(): Promise<StreamStatus[]> {
        const response = await axiosInstance.get<ApiResponse<StreamStatus[]>>('/stream/all');
        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    },

    /**
     * Get stream history for a device
     * GET /api/stream/history/:deviceId
     */
    async getHistory(deviceId: string, limit: number = 10): Promise<StreamStatus[]> {
        const response = await axiosInstance.get<ApiResponse<StreamStatus[]>>(`/stream/history/${deviceId}?limit=${limit}`);
        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    },
};
