'use client';

import React, { useState, useMemo } from 'react';
import { useDevicesStore } from '@/store/useDevicesStore';
import { DeviceCard } from './DeviceCard';

export const DeviceList: React.FC = () => {
    const devices = useDevicesStore((state) => state.devices);
    const selectedDeviceId = useDevicesStore((state) => state.selectedDeviceId);
    const setSelectedDevice = useDevicesStore((state) => state.setSelectedDevice);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ONLINE' | 'OFFLINE'>('all');

    // Safely get devices array
    const safeDevices = useMemo(() => {
        if (!Array.isArray(devices)) return [];
        return devices;
    }, [devices]);

    // Filter devices
    const filteredDevices = useMemo(() => {
        return safeDevices.filter((device) => {
            if (!device) return false;

            const deviceName = device.name || device.id || '';
            const deviceId = device.id || '';

            const matchesSearch =
                deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                deviceId.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || device.status === statusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            // Sort: ONLINE/EXECUTING first, then OFFLINE
            const scoreA = (a.status === 'ONLINE' || a.status === 'EXECUTING') ? 1 : 0;
            const scoreB = (b.status === 'ONLINE' || b.status === 'EXECUTING') ? 1 : 0;
            return scoreB - scoreA;
        });
    }, [safeDevices, searchQuery, statusFilter]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: safeDevices.length,
            online: safeDevices.filter((d) => d?.status === 'ONLINE').length,
            offline: safeDevices.filter((d) => d?.status === 'OFFLINE').length,
            executing: safeDevices.filter((d) => d?.status === 'EXECUTING').length,
        };
    }, [safeDevices]);

    return (
        <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Dispositivos</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.online}</div>
                    <div className="text-sm text-gray-600">En Línea</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-500">{stats.offline}</div>
                    <div className="text-sm text-gray-600">Desconectados</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.executing}</div>
                    <div className="text-sm text-gray-600">Ejecutando</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar dispositivos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('ONLINE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'ONLINE'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            En Línea
                        </button>
                        <button
                            onClick={() => setStatusFilter('OFFLINE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'OFFLINE'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Desconectados
                        </button>
                    </div>
                </div>
            </div>

            {/* Device Grid */}
            {filteredDevices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDevices.map((device, index) => (
                        <DeviceCard
                            key={device.id || `device-${index}`}
                            device={device}
                            onSelect={setSelectedDevice}
                            isSelected={selectedDeviceId === device.id}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-400 text-lg">No hay dispositivos</div>
                    <div className="text-gray-500 text-sm mt-2">
                        {searchQuery
                            ? 'Intenta ajustar tu búsqueda'
                            : 'Los dispositivos aparecerán aquí cuando se conecten'}
                    </div>
                </div>
            )}
        </div>
    );
};
