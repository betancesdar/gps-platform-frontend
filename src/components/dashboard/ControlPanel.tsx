'use client';

import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { useSocketStore } from '@/store/useSocketStore';

export const ControlPanel: React.FC = () => {
    const isConnected = useSocketStore((state) => state.isConnected);
    const connectionError = useSocketStore((state) => state.connectionError);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Connection Status */}
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-900">Estado de Conexión</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">WebSocket:</span>
                        <StatusBadge
                            status={isConnected ? 'ONLINE' : 'OFFLINE'}
                            size="sm"
                        />
                        {isConnected && (
                            <span className="text-xs text-green-600">
                                ✓ Conectado a /devices
                            </span>
                        )}
                        {connectionError && (
                            <span className="text-xs text-red-600">
                                Error: {connectionError}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-sm text-gray-600">
                    <p>Control de dispositivos via WebSocket</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Eventos: START_ROUTE, PAUSE_ROUTE, STOP_ROUTE
                    </p>
                </div>
            </div>

            {/* Warning Message */}
            {!isConnected && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        ⚠️ WebSocket desconectado. Intentando reconectar...
                    </p>
                </div>
            )}
        </div>
    );
};
