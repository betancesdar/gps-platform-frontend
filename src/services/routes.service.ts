import axiosInstance from '@/lib/axios';
import { Route, RoutePointDto } from '@/types';

export interface RouteConfig {
    speed?: number; // m/s
    loop?: boolean;
}

export const routesService = {
    /**
     * Get all routes
     * GET /api/routes
     */
    async getRoutes(): Promise<Route[]> {
        const response = await axiosInstance.get<Route[]>('/routes');
        return response.data;
    },

    /**
     * Get route by ID
     * GET /api/routes/:id
     */
    async getRouteById(routeId: string): Promise<Route> {
        const response = await axiosInstance.get<Route>(`/routes/${routeId}`);
        return response.data;
    },

    /**
     * Create route from points array
     * POST /api/routes/from-points
     */
    async createFromPoints(name: string, points: RoutePointDto[]): Promise<Route> {
        const response = await axiosInstance.post<Route>('/routes/from-points', {
            name,
            points,
        });
        return response.data;
    },

    /**
     * Create route from GPX file
     * POST /api/routes/from-gpx
     */
    async createFromGPX(file: File, name: string): Promise<Route> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);

        const response = await axiosInstance.post<Route>('/routes/from-gpx', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Update route configuration (speed, loop)
     * PUT /api/routes/:id/config
     */
    async updateConfig(routeId: string, config: RouteConfig): Promise<Route> {
        const response = await axiosInstance.put<Route>(`/routes/${routeId}/config`, config);
        return response.data;
    },

    /**
     * Delete route
     * DELETE /api/routes/:id
     */
    async deleteRoute(routeId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<{ success: boolean }>(`/routes/${routeId}`);
        return response.data;
    },
};
