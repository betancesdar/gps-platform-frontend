'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useDevicesWebSocket } from '@/hooks/useDevicesWebSocket';
import { LiveDeviceMap } from '@/components/live/LiveDeviceMap';
import { devicesService } from '@/services/devices.service';

export default function LiveTrackingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, initAuth } = useAuthStore();
    const { devices, setDevices, setLoading } = useDevicesStore();

    // Initialize WebSocket connection
    const { isConnected } = useDevicesWebSocket({ autoConnect: true });

    // Initialize auth
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    // Load devices
    useEffect(() => {
        const loadDevices = async () => {
            if (!isAuthenticated) return;

            try {
                setLoading(true);
                const data = await devicesService.getDevices();
                setDevices(data);
            } catch (error) {
                console.error('Error loading devices:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDevices();
    }, [isAuthenticated, setDevices, setLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Live Device Tracking
                            </h1>
                            <p className="text-sm text-gray-600">
                                Real-time GPS location monitoring
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* WebSocket Status */}
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                <span className="text-sm text-gray-600">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>

                            <button
                                onClick={() => router.push('/')}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <LiveDeviceMap />

                {/* Device List */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Connected Devices ({devices.filter(d => d.status === 'ONLINE' || d.status === 'EXECUTING').length})
                    </h3>

                    {devices.length === 0 ? (
                        <p className="text-gray-500 text-sm">No devices found</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {devices.map((device) => (
                                <div
                                    key={device.id}
                                    className={`p-3 rounded-lg border-2 ${device.status === 'ONLINE' || device.status === 'EXECUTING'
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900">{device.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${device.status === 'EXECUTING' ? 'bg-blue-100 text-blue-800' :
                                                device.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {device.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <div>{device.platform} • {device.appVersion}</div>
                                        {device.lastSeen && (
                                            <div>Last seen: {new Date(device.lastSeen).toLocaleTimeString()}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
