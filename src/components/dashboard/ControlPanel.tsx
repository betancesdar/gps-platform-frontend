'use client';

import React, { useState } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useRoutesStore } from '@/store/useRoutesStore';
import { EnrollDeviceModal } from '@/components/devices/EnrollDeviceModal';
import { devicesService } from '@/services/devices.service';

export const ControlPanel: React.FC = () => {
    const devices = useDevicesStore((state) => state.devices);
    const routes = useRoutesStore((state) => state.routes);

    // Enroll Modal State
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    const safeDevices = Array.isArray(devices) ? devices : [];
    const safeRoutes = Array.isArray(routes) ? routes : [];

    const onlineCount = safeDevices.filter(d => d.status === 'ONLINE').length;
    const executingCount = safeDevices.filter(d => d.status === 'EXECUTING').length;
    const offlineCount = safeDevices.filter(d => d.status === 'OFFLINE').length;

    const handleCleanup = async () => {
        const confirmMsg = '⚠️ DANGER ZONE ⚠️\n\nThis will delete ALL devices from the database.\nAre you sure you want to start from scratch?';
        if (!confirm(confirmMsg)) return;

        setIsCleaning(true);
        try {
            // Passing 0 seconds means "delete everything that hasn't been seen in 0 seconds"
            // Effectively wiping the database of devices
            const res = await devicesService.cleanupStaleDevices(0);
            alert(`✅ Database wiped. Removed ${res.count} devices.`);

            // Refresh devices list using store action to respect filters
            await useDevicesStore.getState().loadDevices();
        } catch (e) {
            console.error(e);
            alert('Cleanup failed. Check console for details.');
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Connection Status */}
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">API REST:</span>
                        <StatusBadge status="ONLINE" size="sm" />
                        <span className="text-xs text-green-600">
                            ✓ Conectado
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors select-none">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            checked={useDevicesStore((state) => state.showOfflineHistory)}
                            onChange={() => useDevicesStore.getState().toggleShowOfflineHistory()}
                        />
                        <span className="text-xs font-medium text-gray-700">Historial (Offline)</span>
                    </label>

                    <Button onClick={() => setIsEnrollOpen(true)} size="sm" variant="primary">
                        + Enroll Device
                    </Button>
                    <Button onClick={handleCleanup} isLoading={isCleaning} size="sm" variant="danger">
                        🧹 Cleanup
                    </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
                        <div className="text-xs text-gray-500">Online</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{executingCount}</div>
                        <div className="text-xs text-gray-500">Ejecutando</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{offlineCount}</div>
                        <div className="text-xs text-gray-500">Offline</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{safeRoutes.length}</div>
                        <div className="text-xs text-gray-500">Rutas</div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    ℹ️ <strong>Control via REST API</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    El frontend controla streams usando la API REST. Los dispositivos Android reciben ubicaciones via WebSocket.
                </p>
            </div>

            <EnrollDeviceModal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} />
        </div>
    );
};
