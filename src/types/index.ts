// Device types (backend real)
export interface Device {
    id: string; // UUID
    name: string;
    status: 'ONLINE' | 'OFFLINE' | 'EXECUTING';
    lastSeen: Date | null;
    createdAt: Date;
    updatedAt: Date;
    streamStatus?: 'running' | 'paused' | 'stopped';
    streamState?: 'MOVE' | 'WAIT' | 'PAUSED' | 'FINISHED';
    dwellRemainingSeconds?: number | null;
}

export interface Position {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number; // m/s
    bearing?: number;
}

// Route types (backend real)
export interface Route {
    id: string; // UUID (mapped from routeId)
    name: string;
    points?: RoutePoint[]; // Optional - only included when getting single route
    distance?: number; // meters
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    // Backend specific fields
    pointCount?: number;
    sourceType?: 'points' | 'gpx';
    speed?: number;
    loop?: boolean;
    description?: string;
}

export interface RoutePoint {
    id: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    waitDuration?: number; // seconds
    index: number;
    routeId: string;
}

export interface Stop {
    id: string;
    position: Position;
    duration: number; // seconds
    name?: string;
    description?: string;
}

// Execution types (backend real)
export interface ExecutionPlan {
    routeId: string;
    routeName: string;
    deviceId: string;
    points: ExecutionPoint[];
    totalDistance: number;
    totalDuration: number; // seconds
    averageSpeed: number; // m/s
    startTime: number; // timestamp
}

export interface ExecutionPoint {
    latitude: number;
    longitude: number;
    elevation?: number;
    waitDuration: number;
    timestamp: number; // when should arrive at this point
    distanceFromPrevious: number;
}

export interface ExecutionState {
    deviceId: string;
    routeId: string;
    status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
    currentPointIndex: number;
    startTime: number;
    currentSpeed: number;
    lastUpdate: string;
    pausedAt?: number;
    resumedAt?: number;
    stoppedAt?: number;
    completedAt?: number;
}

// WebSocket event types (backend real events)
export interface DeviceOnlineEvent {
    deviceId: string;
    deviceName: string;
    timestamp: string;
}

export interface DeviceOfflineEvent {
    deviceId: string;
    timestamp: string;
}

export interface DeviceStatusUpdateEvent {
    deviceId: string;
    status: string;
    timestamp: string;
    [key: string]: any;
}

export interface ExecutionProgressUpdateEvent {
    deviceId: string;
    currentPointIndex: number;
    timestamp: string;
    [key: string]: any;
}

// WebSocket emit payloads
export interface StartRoutePayload {
    deviceId: string;
    routeId: string;
    speed?: number; // m/s, default: 1.4
}

export interface PauseRoutePayload {
    deviceId: string;
}

export interface ResumeRoutePayload {
    deviceId: string;
}

export interface StopRoutePayload {
    deviceId: string;
}

export interface UpdateSpeedPayload {
    deviceId: string;
    speed: number; // m/s
}

// WebSocket response types
export interface SocketResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    executionPlan?: ExecutionPlan;
    state?: ExecutionState;
}

// API Response types
export interface ApiResponse<T> {
    success?: boolean;
    data?: T;
    message?: string;
}

export interface LoginRequest {
    adminId: string; // backend usa adminId, no email/password
}

export interface LoginResponse {
    access_token: string;
    type: 'ADMIN';
}

export interface User {
    id: string;
    name: string;
    role: string;
}

// Route creation/update types
export interface CreateRouteRequest {
    name: string;
    points: RoutePointDto[];
    metadata?: any;
}

export interface RoutePointDto {
    latitude: number;
    longitude: number;
    elevation?: number;
    waitDuration?: number;
    index: number;
}

export interface UpdateRouteRequest {
    id: string;
    name?: string;
    metadata?: any;
}

// GPX Upload
export interface UploadGPXRequest {
    file: File;
    name: string;
    metadata?: string; // JSON string
}

// Utility: Speed conversion helpers
export const speedHelpers = {
    msToKmh: (ms: number): number => ms * 3.6,
    kmhToMs: (kmh: number): number => kmh * 0.277778,
};
