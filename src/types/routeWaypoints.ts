export type WaypointMode = "address" | "manual";
export type WaypointKind = "origin" | "stop" | "destination";

export interface WaypointInput {
    kind: WaypointKind;
    mode: WaypointMode;
    label?: string;          // "Pickup", "Stop 1", "Dropoff"
    text?: string;           // when mode=address
    lat?: number;            // when mode=manual
    lng?: number;            // when mode=manual
    dwellSeconds?: number;   // default 0
}

export interface CreateRouteFromWaypointsRequest {
    name: string;
    profile?: string; // default driving-car
    pointSpacingMeters?: number; // default 20-30
    waypoints: WaypointInput[];
}

export interface CreateRouteResponse {
    routeId: string;
    name: string;
    distanceM: number;
    durationS: number;
    pointsCount: number;
    pointSpacingMeters: number;
    waypoints?: any;
}
