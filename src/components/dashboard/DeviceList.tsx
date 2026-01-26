'use client';

import React, { useState, useMemo } from 'react';
import { useDevicesStore } from '@/store/useDevicesStore';
import { DeviceCard } from './DeviceCard';

export const DeviceList: React.FC = () => {
    const devices = useDevicesStore((state) => state.devices);
    const selectedDeviceId = useDevicesStore((state) => state.selectedDeviceId);
    const setSelectedDevice = useDevicesStore((state) => state.setSelectedDevice);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

    // Filter devices
    const filteredDevices = useMemo(() => {
        return devices.filter((device) => {
            const matchesSearch =
                device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                device.androidId.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || device.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [devices, searchQuery, statusFilter]);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: devices.length,
            online: devices.filter((d) => d.status === 'online').length,
            offline: devices.filter((d) => d.status === 'offline').length,
            running: devices.filter((d) => d.routeStatus === 'running').length,
        };
    }, [devices]);

    return (
        <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Devices</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.online}</div>
                    <div className="text-sm text-gray-600">Online</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-600">{stats.offline}</div>
                    <div className="text-sm text-gray-600">Offline</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
                    <div className="text-sm text-gray-600">Running</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search devices..."
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
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('online')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'online'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Online
                        </button>
                        <button
                            onClick={() => setStatusFilter('offline')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'offline'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Offline
                        </button>
                    </div>
                </div>
            </div>

            {/* Device Grid */}
            {filteredDevices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDevices.map((device) => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            onSelect={setSelectedDevice}
                            isSelected={selectedDeviceId === device.id}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-400 text-lg">No devices found</div>
                    <div className="text-gray-500 text-sm mt-2">
                        {searchQuery
                            ? 'Try adjusting your search or filters'
                            : 'Connect devices to see them here'}
                    </div>
                </div>
            )}
        </div>
    );
};
