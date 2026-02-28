import { useEffect, useRef } from 'react';
import { useDevicesLocationStore } from '@/store/useDevicesLocationStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { WsMockLocationMessage } from '@/types/geocode';
import { buildWsUrl } from '@/lib/socket';

interface UseDevicesWebSocketOptions {
    autoConnect?: boolean;
}

/**
 * Hook to manage WebSocket connection for live device tracking using native WebSocket API
 */
export function useDevicesWebSocket(options: UseDevicesWebSocketOptions = {}) {
    const { autoConnect = true } = options;
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 10;
    const BASE_RECONNECT_DELAY = 1000;
    const MAX_RECONNECT_DELAY = 15000;

    const updateLocation = useDevicesLocationStore((state) => state.updateLocation);

    useEffect(() => {
        if (!autoConnect) return;

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No auth token found, cannot connect to WebSocket');
            return;
        }

        const connectWebSocket = () => {
            // buildWsUrl reads NEXT_PUBLIC_API_URL, converts http→ws/https→wss,
            // uses the real host:port, and appends /ws path.
            const wsUrl = buildWsUrl(token);

            if (process.env.NODE_ENV !== 'production') {
                console.log('[DASH_WS] Connecting to wsUrl=', wsUrl.replace(token, token.slice(0, 8) + '…'));
            }

            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('✅ Connected to devices WebSocket');
                reconnectAttempts.current = 0;

                // On initial connect/reconnect, silently fetch full state
                import('@/services/devices.service').then(({ devicesService }) => {
                    devicesService.getDevices().then(devices => {
                        useDevicesStore.getState().setDevices(devices);
                    }).catch(err => console.error("WS initial sync failed", err));
                });
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error('Failed to parse WS message:', e);
                }
            };

            socket.onclose = (event) => {
                if (!socketRef.current) return;
                const maskedUrl = wsUrl.replace(token, token.slice(0, 8) + '…');
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`[DASH_WS] Closed (code=${event.code}) url=${maskedUrl}`);
                }
                socketRef.current = null;

                // Stop reconnecting on application/auth errors
                if (event.code === 1008 || event.code >= 4000) {
                    console.error(`[DASH_WS] Fatal connection error (code=${event.code}). Stopping reconnect attempts.`);
                    return;
                }

                attemptReconnect();
            };

            socket.onerror = () => {
                // onerror gives no useful details; onclose fires next with code+reason.
                if (process.env.NODE_ENV !== 'production') {
                    const maskedUrl = wsUrl.replace(token, token.slice(0, 8) + '…');
                    console.warn('[DASH_WS] Error on', maskedUrl);
                }
            };
        };

        const attemptReconnect = () => {
            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(
                    BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts.current),
                    MAX_RECONNECT_DELAY
                );

                console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttempts.current++;
                    connectWebSocket();
                }, delay);
            }
        };

        const handleMessage = (payload: any) => {
            const { event, data } = payload;

            if (event === 'MOCK_LOCATION') {
                const message = data as WsMockLocationMessage['data'];
                const meta = payload.meta;
                const deviceId = message.deviceId || data.deviceId;
                if (!deviceId) return;

                updateLocation(deviceId, {
                    lat: message.latitude,
                    lng: message.longitude,
                    bearing: message.bearing,
                    // The backend already sends speed in m/s. UI needs km/h.
                    speed: message.speed * 3.6,
                    accuracy: message.accuracy,
                    state: message.state,
                    dwellRemainingSeconds: meta?.dwellRemainingSeconds
                });
            } else if (event === 'DEVICE_ONLINE' || event === 'DEVICE_CONNECTED') {
                console.log('✅ Device Online:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, 'ONLINE');
                useDevicesStore.getState().updateDevice(data.deviceId, {
                    status: 'ONLINE',
                    lastSeen: new Date()
                });
            } else if (event === 'DEVICE_OFFLINE' || event === 'DEVICE_DISCONNECTED') {
                console.log('❌ Device Offline:', data);
                useDevicesStore.getState().updateDeviceStatus(data.deviceId, 'OFFLINE');
                useDevicesStore.getState().updateDevice(data.deviceId, {
                    status: 'OFFLINE'
                });
            } else if (event === 'STREAM_WAITING_START' || event === 'STREAM_WAITING_TICK' || event === 'STREAM_WAITING_EXTENDED') {
                const deviceId = data.deviceId;
                if (!deviceId) return;

                // Directly update the store's location sub-state to force dwell remaining seconds update
                updateLocation(deviceId, {
                    ...useDevicesLocationStore.getState().locationsByDeviceId[deviceId],
                    state: 'WAIT', // ensure it remains WAIT
                    dwellRemainingSeconds: Math.round((data.remainingMs || data.newRemainingMs || 0) / 1000),
                    dwellWaypointKind: data.kind || useDevicesLocationStore.getState().locationsByDeviceId[deviceId]?.dwellWaypointKind,
                    dwellWaypointLabel: data.label || useDevicesLocationStore.getState().locationsByDeviceId[deviceId]?.dwellWaypointLabel,
                });

            } else if (event === 'STREAM_WAITING_SKIPPED') {
                const deviceId = data.deviceId;
                if (!deviceId) return;

                updateLocation(deviceId, {
                    ...useDevicesLocationStore.getState().locationsByDeviceId[deviceId],
                    state: 'MOVE',
                    dwellRemainingSeconds: undefined,
                    dwellWaypointKind: undefined,
                    dwellWaypointLabel: undefined
                });
            } else {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[WS Event] ${event}`, data);
                }
            }
        };



        connectWebSocket();

        // Background polling for HTTP reconciliation of ONLINE/OFFLINE
        const fallBackStatusPoller = setInterval(() => {
            useDevicesStore.getState().syncDeviceStatuses();
        }, 5000);

        // Cleanup
        return () => {
            clearInterval(fallBackStatusPoller);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [autoConnect, updateLocation]);

    // Native WS doesn't expose a simple "isConnected" property that updates React state,
    // but line 153 in previous code used ref.current.connected. 
    // WebSocket has readyState.
    return {
        socket: socketRef.current,
        // This is not reactive, but matches previous implementation style
        isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    };
}
