'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useDevicesWebSocket } from '@/hooks/useDevicesWebSocket';
import dynamic from 'next/dynamic';

const LiveDeviceMap = dynamic(
    () => import('@/components/live/LiveDeviceMap').then((mod) => mod.LiveDeviceMap),
    { ssr: false }
);
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

    // Load devices with polling
    useEffect(() => {
        const loadDevices = async () => {
            if (!isAuthenticated) return;

            try {
                // Only show loading spinner on first load if we don't have devices
                if (devices.length === 0) setLoading(true);

                const data = await devicesService.getDevices();
                setDevices(data);
            } catch (error) {
                console.error('Error loading devices:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDevices();

        // Poll every 15 seconds to reconcile state
        const intervalId = setInterval(loadDevices, 15000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, setDevices, setLoading, devices.length]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl mb-6 shadow-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                    </div>
                    <p className="text-white text-xl font-semibold">Cargando Live Tracking...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-white/95 animate-fade-in">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Live Device Tracking
                            </h1>
                            <p className="text-sm text-gray-600">
                                Monitoreo GPS en tiempo real
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* WebSocket Status */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} animate-pulse`}></div>
                                <span className="text-sm font-medium text-gray-700">
                                    {isConnected ? 'Conectado' : 'Desconectado'}
                                </span>
                            </div>

                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-sm"
                            >
                                ← Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="animate-fade-in animation-delay-100">
                    <LiveDeviceMap />
                </div>

                {/* Device List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 animate-fade-in animation-delay-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Dispositivos Conectados ({devices.filter(d => d.status === 'ONLINE' || d.status === 'EXECUTING').length})
                    </h3>

                    {devices.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm">No hay dispositivos conectados</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {devices.map((device, index) => (
                                <div
                                    key={device.id}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover-lift ${device.status === 'ONLINE' || device.status === 'EXECUTING'
                                        ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100'
                                        : 'border-gray-300 bg-gray-50 opacity-60'
                                        } animate-scale-in`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-900">{device.name}</span>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${device.status === 'EXECUTING' ? 'bg-blue-100 text-blue-800 shadow-sm' :
                                            device.status === 'ONLINE' ? 'bg-green-100 text-green-800 shadow-sm' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {device.status === 'EXECUTING' ? '🏃 Ejecutando' :
                                                device.status === 'ONLINE' ? '✓ En línea' :
                                                    'Desconectado'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            {device.platform} • {device.appVersion}
                                        </div>
                                        {device.lastSeen && (
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {new Date(device.lastSeen).toLocaleTimeString()}
                                            </div>
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
