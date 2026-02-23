import axiosInstance from '@/lib/axios';
import {
    GeoSuggestion,
    GeocodeAutocompleteResponse,
    CreateFromAddressesRequest,
    CreateFromAddressesResponse,
} from '@/types/geocode';

export const geocodeService = {
    /**
     * Get autocomplete suggestions for a location query
     * Uses Next.js API proxy to keep backend secure
     */
    async getAutocomplete(query: string, limit: number = 6): Promise<GeoSuggestion[]> {
        if (!query || query.length < 3) {
            return [];
        }

        try {
            // axiosInstance baseURL is already ${NEXT_PUBLIC_API_URL}/api
            // so this resolves to: https://api.trustygps.app/api/geocode/autocomplete
            // Authorization header is added automatically by the axios request interceptor
            const response = await axiosInstance.get<GeocodeAutocompleteResponse>(
                '/geocode/autocomplete',
                { params: { q: query, limit } }
            );

            if (response.data?.success && response.data?.data?.suggestions) {
                return response.data.data.suggestions;
            }

            return [];
        } catch (error: any) {
            console.error('Autocomplete error:', error);
            // Return empty array instead of throwing to allow graceful degradation
            return [];
        }
    },

    /**
     * Create a route from origin and destination addresses
     * POST /api/routes/from-addresses
     */
    async createRouteFromAddresses(
        params: CreateFromAddressesRequest
    ): Promise<CreateFromAddressesResponse> {
        const response = await axiosInstance.post<CreateFromAddressesResponse>(
            '/routes/from-addresses',
            params
        );

        return response.data;
    },

    /**
     * Create a route with multiple stops (mixed addresses/coords)
     * POST /api/routes/from-addresses-with-stops
     */
    // Updated interface based on backend guide
    async createRouteWithStops(params: {
        name?: string;
        profile?: string;
        pointSpacingMeters?: number;
        stops: Array<{
            text?: string;       // Address to geocode (Optional if lat/lng provided)
            lat?: number;        // Manual Latitude (Optional if text provided)
            lng?: number;        // Manual Longitude (Optional if text provided)
            label?: string;      // UI Label for the stop
            waitSeconds?: number; // Duration to wait at this stop (seconds)
        }>;
    }): Promise<CreateFromAddressesResponse> {
        const response = await axiosInstance.post<CreateFromAddressesResponse>(
            '/routes/from-addresses-with-stops',
            params
        );
        return response.data;
    },
};
