'use client';

import React, { useState } from 'react';
import { Device } from '@/services/devices.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useDeviceControl } from '@/hooks/useDeviceControl';
import { useRoutesStore } from '@/store/useRoutesStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

interface DeviceCardProps {
    device: Device;
    onSelect?: (deviceId: string) => void;
    isSelected?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
    device,
    onSelect,
    isSelected = false,
}) => {
    const { startDevice, pauseDevice, resumeDevice, stopDevice, isLoading } = useDeviceControl();
    const routes = useRoutesStore((state) => state.routes);
    const safeRoutes = Array.isArray(routes) ? routes : [];

    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [speed, setSpeed] = useState<number>(30); // km/h

    const handleStart = async () => {
        if (!selectedRouteId) {
            alert('Por favor selecciona una ruta primero');
            return;
        }
        try {
            await startDevice(device.id, selectedRouteId, speed);
        } catch (err: any) {
            alert(`Error al iniciar: ${err.message}`);
        }
    };

    const handleControl = async (action: 'pause' | 'resume' | 'stop') => {
        try {
            if (action === 'pause') await pauseDevice(device.id);
            if (action === 'resume') await resumeDevice(device.id);
            if (action === 'stop') await stopDevice(device.id);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this device? This cannot be undone.')) {
            try {
                await useDevicesStore.getState().deleteDevice(device.id);
            } catch (error) {
                alert('Failed to delete device');
            }
        }
    };

    const isExecuting = device.status === 'EXECUTING';
    const isOnline = device.status === 'ONLINE';
    const isOffline = device.status === 'OFFLINE';

    return (
        <Card
            className={`cursor-pointer transition-all duration-300 transform ${isSelected ? 'ring-2 ring-blue-500 scale-[1.02] shadow-xl' : 'hover:shadow-lg hover:-translate-y-1'}`}
            // hover // Handled manually for better control
            onClick={() => onSelect?.(device.id)}
        >
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${isOnline || isExecuting ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {device.platform?.toLowerCase().includes('web') ? '💻' : '📱'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">
                                {device.name || 'Dispositivo sin nombre'}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {device.id?.slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={device.status} />
                        {/* Delete Button (Icon) */}
                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Device"
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Device Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold">Platform</span>
                        {device.platform || 'Unknown'} {device.appVersion && `v${device.appVersion}`}
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold">Last Seen</span>
                        {device.lastSeen ? dayjs(device.lastSeen).fromNow() : 'Never'}
                    </div>
                </div>

                {/* Controls Area */}
                {!isExecuting ? (
                    <div
                        className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Route</label>
                            <div className="relative">
                                <select
                                    value={selectedRouteId}
                                    onChange={(e) => setSelectedRouteId(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border-0 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                                    disabled={safeRoutes.length === 0}
                                >
                                    <option value="">
                                        {safeRoutes.length === 0 ? '-- No routes available --' : 'Select a route to run...'}
                                    </option>
                                    {safeRoutes.map((route) => (
                                        <option key={route.id} value={route.id}>
                                            📍 {route.name} ({route.pointCount || 0} pts)
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Speed</label>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{speed} km/h</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="120"
                                step="5"
                                value={speed}
                                onChange={(e) => setSpeed(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <Button
                            variant="success"
                            className="w-full justify-center shadow-lg shadow-green-500/20 py-2.5 font-bold"
                            onClick={handleStart}
                            disabled={isLoading || !selectedRouteId || isOffline}
                        >
                            {isOffline ? 'Device Offline' : '▶️ Start Simulation'}
                        </Button>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-2 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-center font-semibold"
                            onClick={() => handleControl('pause')}
                            disabled={isLoading}
                        >
                            ⏸️ Pause
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full justify-center font-semibold"
                            onClick={() => handleControl('resume')}
                            disabled={isLoading}
                        >
                            ▶️ Resume
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            className="col-span-2 w-full justify-center shadow-lg shadow-red-500/20 py-2 font-bold"
                            onClick={() => handleControl('stop')}
                            disabled={isLoading}
                        >
                            ⏹️ Stop Simulation
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};
