'use client';

import React, { useState, useMemo } from 'react';
import { useDevicesStore } from '@/store/useDevicesStore';
import { DeviceCard } from './DeviceCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Smartphone, WifiOff, Activity } from 'lucide-react';

export const DeviceList: React.FC = () => {
    const devices = useDevicesStore((state) => state.devices);
    const selectedDeviceId = useDevicesStore((state) => state.selectedDeviceId);
    const setSelectedDevice = useDevicesStore((state) => state.setSelectedDevice);

    const handleSelectDevice = (id: string) => {
        setSelectedDevice(id);
    };

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

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between"
            >
                {/* Search */}
                <div className="relative w-full md:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search devices by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50 w-full md:w-auto overflow-x-auto">
                    {[
                        { id: 'all', label: 'All', icon: Filter },
                        { id: 'ONLINE', label: 'Online', icon: Activity },
                        { id: 'OFFLINE', label: 'Offline', icon: WifiOff },
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                                ${statusFilter === filter.id
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }
                            `}
                        >
                            <filter.icon className={`w-4 h-4 ${statusFilter === filter.id ? 'text-blue-500' : ''}`} />
                            {filter.label}
                            <span className={`ml-1.5 py-0.5 px-2 rounded-md text-[10px] ${statusFilter === filter.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {filter.id === 'all'
                                    ? safeDevices.length
                                    : safeDevices.filter(d => d.status === filter.id).length
                                }
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                <AnimatePresence mode='popLayout'>
                    {filteredDevices.length > 0 ? (
                        filteredDevices.map((device) => (
                            <DeviceCard
                                key={device.id}
                                deviceId={device.id}
                                onSelect={handleSelectDevice}
                                isSelected={selectedDeviceId === device.id}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full py-12 flex flex-col items-center justify-center text-center glass rounded-3xl border-dashed border-2 border-gray-200"
                        >
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Smartphone className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No matching devices found</h3>
                            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                                {searchQuery
                                    ? `We couldn't find any device matching "${searchQuery}"`
                                    : "Waiting for devices to connect..."}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-blue-600 font-medium hover:text-blue-700 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
