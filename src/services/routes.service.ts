import axiosInstance from '@/lib/axios';
import { Route, CreateRouteRequest, UpdateRouteRequest, RoutePointDto } from '@/types';

export const routesService = {
    /**
     * Get all routes (sin points para performance)
     */
    async getRoutes(): Promise<Route[]> {
        const response = await axiosInstance.get<Route[]>('/routes');
        return response.data;
    },

    /**
     * Get route by ID (con todos los points)
     */
    async getRouteById(routeId: string): Promise<Route> {
        const response = await axiosInstance.get<Route>(`/routes/${routeId}`);
        return response.data;
    },

    /**
     * Create new route
     */
    async createRoute(data: CreateRouteRequest): Promise<Route> {
        const response = await axiosInstance.post<Route>('/routes', data);
        return response.data;
    },

    /**
     * Update route (solo name y metadata)
     */
    async updateRoute(data: UpdateRouteRequest): Promise<Route> {
        const { id, ...updateData } = data;
        const response = await axiosInstance.patch<Route>(`/routes/${id}`, updateData);
        return response.data;
    },

    /**
     * Update stop duration for a specific point
     */
    async updatePointStop(
        routeId: string,
        pointIndex: number,
        waitDuration: number
    ): Promise<Route> {
        const response = await axiosInstance.patch<Route>(
            `/routes/${routeId}/points/${pointIndex}/stop`,
            { waitDuration }
        );
        return response.data;
    },

    /**
     * Delete route
     */
    async deleteRoute(routeId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<{ success: boolean }>(`/routes/${routeId}`);
        return response.data;
    },

    /**
     * Upload GPX file
     * IMPORTANTE: El endpoint es /routes/upload (NO /routes/upload-gpx)
     */
    async uploadGPX(file: File, name: string, metadata?: any): Promise<Route> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await axiosInstance.post<Route>('/routes/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
