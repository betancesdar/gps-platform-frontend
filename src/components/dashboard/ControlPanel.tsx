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
        if (!confirm('Remove devices inactive for more than 30 days?')) return;
        setIsCleaning(true);
        try {
            const res = await devicesService.cleanupStaleDevices();
            alert(`Cleaned up ${res.count} stale devices.`);
            // Optionally refresh devices list
            devicesService.getDevices().then(useDevicesStore.getState().setDevices);
        } catch (e) {
            alert('Cleanup failed');
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
                <div className="flex gap-2">
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
