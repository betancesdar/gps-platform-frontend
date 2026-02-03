'use client';

import React, { useState } from 'react';
import { Device } from '@/services/devices.service';
import { speedHelpers } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useDeviceControl } from '@/hooks/useDeviceControl';
import { useRoutesStore } from '@/store/useRoutesStore';
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
    const [speed, setSpeed] = useState<number>(1.4); // m/s, default walking speed

    const handleStart = async () => {
        if (!selectedRouteId) {
            alert('Por favor selecciona una ruta primero');
            return;
        }
        try {
            await startDevice(device.id, selectedRouteId, speed);
        } catch (error) {
            console.error('Failed to start device:', error);
        }
    };

    const handlePause = async () => {
        try {
            await pauseDevice(device.id);
        } catch (error) {
            console.error('Failed to pause device:', error);
        }
    };

    const handleResume = async () => {
        try {
            await resumeDevice(device.id);
        } catch (error) {
            console.error('Failed to resume device:', error);
        }
    };

    const handleStop = async () => {
        try {
            await stopDevice(device.id);
        } catch (error) {
            console.error('Failed to stop device:', error);
        }
    };

    const isExecuting = device.status === 'EXECUTING';
    const isOnline = device.status === 'ONLINE';

    return (
        <Card
            className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            hover
            onClick={() => onSelect?.(device.id)}
        >
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                            {device.name || 'Dispositivo sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            ID: {device.id ? device.id.slice(0, 8) : 'N/A'}...
                        </p>
                    </div>
                    <StatusBadge status={device.status} />
                </div>

                {/* Last Seen */}
                {device.lastSeen && (
                    <div className="text-xs text-gray-500">
                        Última conexión: {dayjs(device.lastSeen).fromNow()}
                    </div>
                )}

                {/* Route Selection (only when ONLINE and not EXECUTING) */}
                {isOnline && !isExecuting && (
                    <div className="py-2 border-t border-gray-100 space-y-2">
                        <label className="text-sm text-gray-600 block">Seleccionar Ruta:</label>
                        <select
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">-- Selecciona una ruta --</option>
                            {safeRoutes.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.name} ({route.points?.length || 0} puntos)
                                </option>
                            ))}
                        </select>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Velocidad: {speedHelpers.msToKmh(speed).toFixed(1)} km/h
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1.8 km/h</span>
                                <span>18 km/h</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {!isExecuting ? (
                        <Button
                            variant="success"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStart();
                            }}
                            disabled={!isOnline || !selectedRouteId || isLoading}
                            isLoading={isLoading}
                            className="flex-1"
                        >
                            ▶ Iniciar Ruta
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePause();
                                }}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                ⏸ Pausar
                            </Button>
                            <Button
                                variant="success"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResume();
                                }}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                ▶ Reanudar
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStop();
                                }}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                ⏹ Detener
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};
