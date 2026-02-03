import axiosInstance from '@/lib/axios';
import { Route, CreateRouteRequest, UpdateRouteRequest } from '@/types';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Backend route format
interface BackendRoute {
    routeId: string;
    name: string;
    pointCount: number;
    sourceType: 'points' | 'gpx';
    createdAt: string;
    points?: Array<{
        seq: number;
        lat: number;
        lng: number;
        speed?: number;
        bearing?: number;
        accuracy?: number;
    }>;
}

// Backend route point format for creation
interface BackendRoutePoint {
    lat: number;
    lng: number;
}

export interface RouteConfig {
    speed?: number;
    accuracy?: number;
    loop?: boolean;
}

// Transform backend route to frontend format
function transformRoute(backendRoute: BackendRoute): Route {
    return {
        id: backendRoute.routeId,
        name: backendRoute.name,
        points: backendRoute.points?.map((p, index) => ({
            id: `point-${index}`,
            latitude: p.lat,
            longitude: p.lng,
            elevation: 0,
            index: p.seq || index,
            routeId: backendRoute.routeId,
        })) || [],
        distance: 0,
        metadata: {
            sourceType: backendRoute.sourceType,
            pointCount: backendRoute.pointCount,
        },
        createdAt: new Date(backendRoute.createdAt),
        updatedAt: new Date(backendRoute.createdAt),
    };
}

export const routesService = {
    /**
     * Get all routes
     * GET /api/routes
     */
    async getRoutes(): Promise<Route[]> {
        const response = await axiosInstance.get<ApiResponse<BackendRoute[]>>('/routes');

        let backendRoutes: BackendRoute[] = [];
        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            backendRoutes = response.data.data;
        } else if (Array.isArray(response.data)) {
            backendRoutes = response.data as unknown as BackendRoute[];
        }

        return backendRoutes.map(transformRoute);
    },

    /**
     * Get route by ID (includes all points)
     * GET /api/routes/:id
     */
    async getRouteById(routeId: string): Promise<Route> {
        const response = await axiosInstance.get<ApiResponse<BackendRoute>>(`/routes/${routeId}`);
        return transformRoute(response.data.data);
    },

    /**
     * Create route from points
     * POST /api/routes/from-points
     * Backend expects: { name: string, points: [{ lat, lng }] }
     */
    async createRoute(data: CreateRouteRequest): Promise<Route> {
        // Transform points to backend format: lat/lng instead of latitude/longitude
        const backendPoints: BackendRoutePoint[] = data.points.map((point) => ({
            lat: point.latitude,
            lng: point.longitude,
        }));

        const requestBody = {
            name: data.name,
            points: backendPoints,
        };

        console.log('Creating route:', requestBody);

        try {
            const response = await axiosInstance.post<ApiResponse<BackendRoute>>('/routes/from-points', requestBody);
            return transformRoute(response.data.data);
        } catch (error: any) {
            console.error('Backend error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.response?.data?.message || error.message,
            });
            throw error;
        }
    },

    /**
     * Create route from GPX content
     * POST /api/routes/from-gpx
     * Backend expects: { name: string, gpxContent: string }
     */
    async createFromGPX(name: string, gpxContent: string): Promise<Route> {
        const response = await axiosInstance.post<ApiResponse<BackendRoute>>('/routes/from-gpx', {
            name,
            gpxContent,
        });
        return transformRoute(response.data.data);
    },

    /**
     * Update route config
     * PUT /api/routes/:id/config
     */
    async updateRoute(data: UpdateRouteRequest): Promise<Route> {
        const response = await axiosInstance.put<ApiResponse<BackendRoute>>(`/routes/${data.id}/config`, {
            name: data.name,
        });
        return transformRoute(response.data.data);
    },

    /**
     * Update route configuration (speed, accuracy, loop)
     * PUT /api/routes/:id/config
     */
    async updateConfig(routeId: string, config: RouteConfig): Promise<Route> {
        const response = await axiosInstance.put<ApiResponse<BackendRoute>>(`/routes/${routeId}/config`, config);
        return transformRoute(response.data.data);
    },

    /**
     * Delete route
     * DELETE /api/routes/:id
     */
    async deleteRoute(routeId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<ApiResponse<any>>(`/routes/${routeId}`);
        return { success: response.data.success };
    },
};
