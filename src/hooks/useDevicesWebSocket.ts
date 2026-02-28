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
                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (!msg || typeof msg !== 'object') return;
                if (!msg.type) return;

                // MOCK_LOCATION uses msg.payload, broadcasts use msg.data.
                // We enforce having either payload or data for non-PING messages.
                if (msg.type !== 'PING' && !msg.payload && !msg.data) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn('[WS] Ignored malformed message (no payload/data):', msg.type);
                    }
                    return;
                }

                handleMessage(msg);
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

        const handleMessage = (wsMessage: any) => {
            const { type, payload, data, meta } = wsMessage;
            // Many broadcast messages use 'data' instead of 'payload'
            const msgData = payload || data;

            if (type === 'MOCK_LOCATION') {
                const deviceId = msgData.deviceId || meta?.deviceId;
                if (!deviceId) return;

                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, {
                    ...prevLoc,
                    lat: msgData.lat ?? msgData.latitude,
                    lng: msgData.lng ?? msgData.longitude,
                    bearing: msgData.bearing,
                    speed: (msgData.speed || 0) * 3.6,
                    accuracy: msgData.accuracy,
                    state: msgData.state ?? prevLoc?.state,
                    streamStatus: 'running',
                    dwellRemainingSeconds: meta?.dwellRemainingSeconds ?? prevLoc?.dwellRemainingSeconds ?? null,
                });
            } else if (type === 'DEVICE_ONLINE' || type === 'DEVICE_CONNECTED') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                useDevicesStore.getState().updateDeviceStatus(deviceId, 'ONLINE');
            } else if (type === 'DEVICE_OFFLINE' || type === 'DEVICE_DISCONNECTED') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                useDevicesStore.getState().updateDeviceStatus(deviceId, 'OFFLINE');
            } else if (type === 'STREAM_STARTED' || type === 'STREAM_RESUMED') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, { ...prevLoc, streamStatus: 'running' });
            } else if (type === 'STREAM_PAUSED') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, { ...prevLoc, streamStatus: 'paused', state: 'PAUSED' });
            } else if (type === 'STREAM_STOPPED') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, { ...prevLoc, streamStatus: 'stopped', dwellRemainingSeconds: null });
            } else if (type === 'STREAM_WAITING_START' || type === 'STREAM_WAITING_TICK') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, {
                    ...prevLoc,
                    state: 'WAIT',
                    streamStatus: 'running',
                    dwellRemainingSeconds: Math.round((msgData.remainingMs || 0) / 1000),
                });
            } else if (type === 'STREAM_WAITING_SKIPPED') {
                const deviceId = msgData.deviceId;
                if (!deviceId) return;
                const prevLoc = useDevicesLocationStore.getState().locationsByDeviceId[deviceId];
                updateLocation(deviceId, {
                    ...prevLoc,
                    state: 'MOVE',
                    streamStatus: 'running',
                    dwellRemainingSeconds: null,
                });
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
