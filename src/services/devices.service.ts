import axiosInstance from '@/lib/axios';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Backend device format
export interface BackendDevice {
    deviceId: string;
    label?: string;          // Name given during enrollment
    platform: string;
    appVersion: string;
    registeredAt: string;
    lastSeenAt?: string;
    isConnected: boolean;
    user?: string;
    assignedRoute?: {
        id: string;
        name: string;
    };
}

// Frontend device format (mapped)
export interface Device {
    id: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE' | 'EXECUTING';
    lastSeen: Date | null;
    createdAt: Date;
    updatedAt: Date;
    platform?: string;
    appVersion?: string;
    assignedRoute?: {
        id: string;
        name: string;
    };
}

// Transform backend device to frontend format
function transformDevice(backendDevice: BackendDevice): Device {
    // Sanity check: If device is "Connected" but hasn't been seen in > 2 minutes, it's a ghost connection.
    const lastSeen = backendDevice.lastSeenAt ? new Date(backendDevice.lastSeenAt) : null;
    const isStale = lastSeen && (new Date().getTime() - lastSeen.getTime() > 2 * 60 * 1000); // 2 minutes tolerance
    const status = (backendDevice.isConnected && !isStale) ? 'ONLINE' : 'OFFLINE';

    return {
        id: backendDevice.deviceId,
        // Use enrollment label if available, fall back to deviceId
        name: backendDevice.label || backendDevice.deviceId,
        status: status,
        lastSeen: lastSeen,
        createdAt: new Date(backendDevice.registeredAt),
        updatedAt: new Date(backendDevice.registeredAt),
        platform: backendDevice.platform,
        appVersion: backendDevice.appVersion,
        assignedRoute: backendDevice.assignedRoute,
    };
}

/**
 * Normalizes a serverBaseUrl to always include the correct port.
 *
 * Rules:
 *  - Trim whitespace
 *  - If no scheme ("http://" or "https://"), prefix "http://"
 *  - Remove trailing slash
 *  - If scheme is "http:" AND there is no explicit port → append ":4000"
 *
 * Returns { normalizedUrl, portFixed } where portFixed indicates that
/**
 * Normalizes a serverBaseUrl to its clean origin.
 * Removes any trailing slashes and paths (like /api).
 */
export function normalizeServerBaseUrl(input: string): string {
    const raw = input.trim().replace(/\/+$/, '');
    try {
        const u = new URL(raw);
        return u.origin; // e.g., https://api.trustygps.app
    } catch {
        // Fallback for simple strings that don't satisfy URL API (rare in practice)
        return raw.split('/')[0] + '//' + raw.split('/')[2];
    }
}

export const devicesService = {
    /**
     * Register a new device
     * POST /api/devices/register
     */
    async registerDevice(deviceId: string, platform: string = 'web', appVersion: string = '1.0.0'): Promise<Device> {
        const response = await axiosInstance.post<ApiResponse<BackendDevice>>('/devices/register', {
            deviceId,
            platform,
            appVersion,
        });
        return transformDevice(response.data.data);
    },

    /**
     * Get all devices
     * GET /api/devices
     * @param activeWithinSeconds Optional filter to get only recently active devices
     */
    async getDevices(activeWithinSeconds?: number): Promise<Device[]> {
        const params = activeWithinSeconds ? { activeWithinSeconds } : {};
        const response = await axiosInstance.get<ApiResponse<BackendDevice[]>>('/devices', { params });

        // Handle various response formats
        let devices: BackendDevice[] = [];

        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            devices = response.data.data;
        } else if (Array.isArray(response.data)) {
            devices = response.data as unknown as BackendDevice[];
        }

        const mappedDevices = devices.map(transformDevice);

        // Client-side fallback filtering
        // If the backend ignores the param, we filter here to ensure UI is clean
        if (activeWithinSeconds) {
            const threshold = new Date(Date.now() - activeWithinSeconds * 1000);
            return mappedDevices.filter(d => {
                // Keep if status is ONLINE or EXECUTING
                if (d.status === 'ONLINE' || d.status === 'EXECUTING') return true;
                // Or if seen recently
                return d.lastSeen && d.lastSeen > threshold;
            });
        }

        return mappedDevices;
    },

    /**
     * Get my devices
     * GET /api/devices/me
     */
    async getMyDevices(): Promise<Device[]> {
        const response = await axiosInstance.get<ApiResponse<BackendDevice[]>>('/devices/me');

        let devices: BackendDevice[] = [];
        if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
            devices = response.data.data;
        }

        return devices.map(transformDevice);
    },

    /**
     * Get device by ID
     * GET /api/devices/:deviceId
     */
    async getDeviceById(deviceId: string): Promise<Device> {
        const response = await axiosInstance.get<ApiResponse<BackendDevice>>(`/devices/${deviceId}`);
        return transformDevice(response.data.data);
    },

    /**
     * Delete device
     * DELETE /api/devices/:deviceId
     */
    async deleteDevice(deviceId: string): Promise<{ success: boolean }> {
        const response = await axiosInstance.delete<ApiResponse<any>>(`/devices/${deviceId}`);
        return { success: response.data.success };
    },

    /**
     * Assign route to device (without starting stream)
     * PUT /api/devices/:deviceId/route
     */
    async assignRoute(deviceId: string, routeId: string): Promise<Device> {
        const response = await axiosInstance.put<ApiResponse<BackendDevice>>(`/devices/${deviceId}/route`, {
            routeId
        });
        return transformDevice(response.data.data);
    },

    /**
     * Enroll a new device (Admin)
     * POST /api/devices/enroll
     *
     * QR payload: { enrollmentCode, expiresAt, deviceId, serverBaseUrl }
     * serverBaseUrl is ALWAYS derived from NEXT_PUBLIC_API_URL.
     * window.location is strictly forbidden as a source.
     */
    async enrollDevice(label: string): Promise<{
        enrollmentCode: string;
        expiresAt: string;
        deviceId: string;
        qrPayload: string;
        normalizedServerBaseUrl: string;
    }> {
        const response = await axiosInstance.post<ApiResponse<{
            enrollmentCode: string;
            expiresAt: string;
            deviceId: string;
            serverBaseUrl?: string; // Backend fallback
        }>>('/devices/enroll', { label });

        const rawData = response.data.data;
        const { enrollmentCode, expiresAt, deviceId } = rawData;

        // ── 1. Determine serverBaseUrl ──────────────────────────────────────────
        // ONLY source: NEXT_PUBLIC_API_URL. window.location is FORBIDDEN.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
            throw new Error(
                "[EnrollDevice] NEXT_PUBLIC_API_URL is not set. Cannot generate QR code. " +
                "Set this env var to the public API origin (e.g. https://api.trustygps.app)."
            );
        }

        // ── 2. Normalize to pure origin (removes /api, trailing slashes, etc.) ──
        const normalizedUrl = normalizeServerBaseUrl(apiUrl);

        // ── 3. Dev-only logging ─────────────────────────────────────────────────
        if (process.env.NODE_ENV !== 'production') {
            console.log('[ENROLL_QR] NEXT_PUBLIC_API_URL=', apiUrl);
            console.log('[ENROLL_QR] normalized serverBaseUrl=', normalizedUrl);
        }

        // ── 4. Build JSON QR payload ────────────────────────────────────────────
        const payloadObject = {
            enrollmentCode,
            expiresAt,
            deviceId,
            serverBaseUrl: normalizedUrl,
        };

        if (process.env.NODE_ENV !== 'production') {
            console.log('[ENROLL_QR] QR payload=', payloadObject);
        }

        const qrPayload = JSON.stringify(payloadObject);

        return {
            enrollmentCode,
            expiresAt,
            deviceId,
            qrPayload,
            normalizedServerBaseUrl: normalizedUrl,
        };
    },
    async cleanupStaleDevices(olderThanSeconds: number = 2592000): Promise<{ count: number }> {
        const response = await axiosInstance.post<ApiResponse<{ count: number }>>('/devices/cleanup-stale', {
            olderThanSeconds
        });
        return response.data.data;
    },
};
