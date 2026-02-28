// Geocoding and Address Route Types

export interface GeoSuggestion {
    label: string;
    lat: number;
    lng: number;
    confidence?: number;
}

export interface GeocodeAutocompleteResponse {
    success: boolean;
    data: {
        suggestions: GeoSuggestion[];
    };
}

export interface CreateFromAddressesRequest {
    name?: string;
    originText: string;
    destinationText: string;
    profile?: 'driving-car' | 'driving-hgv' | 'foot-walking' | 'cycling-regular';
    pointSpacingMeters?: number;
    waitAtEndSeconds?: number;
}

export interface CreateFromAddressesResponse {
    success: boolean;
    data: {
        routeId: string;
        distanceM: number;
        durationS: number;
        pointsCount: number;
        pointSpacingMeters: number;
    };
}

// WebSocket Mock Location Message
export interface WsMockLocationMessage {
    type: 'MOCK_LOCATION';
    data: {
        latitude: number;
        longitude: number;
        speed: number;
        bearing: number;
        accuracy: number;
        deviceId?: string;
        state?: 'MOVE' | 'WAIT';
    };
}

// Device Location State for Live Tracking
export interface DeviceLocationState {
    lat: number;
    lng: number;
    bearing: number;
    speed: number;
    accuracy: number;
    state?: 'MOVE' | 'WAIT' | 'PAUSED';
    dwellRemainingSeconds?: number;
    dwellWaypointKind?: 'START' | 'STOP' | 'END' | string;
    dwellWaypointLabel?: string;
    updatedAt: number; // timestamp
}
