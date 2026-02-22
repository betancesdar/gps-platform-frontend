'use client';

import React, { useState } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useRoutesStore } from '@/store/useRoutesStore';
import { EnrollDeviceModal } from '@/components/devices/EnrollDeviceModal';
import { devicesService } from '@/services/devices.service';
import { motion } from 'framer-motion';
import {
    Plus,
    Trash2,
    Activity,
    Smartphone,
    WifiOff,
    Map as MapIcon,
    Server,
    History
} from 'lucide-react';

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
            const res = await devicesService.cleanupStaleDevices(0);
            alert(`✅ Database wiped. Removed ${res.count} devices.`);
            await useDevicesStore.getState().loadDevices();
        } catch (e) {
            console.error(e);
            alert('Cleanup failed. Check console for details.');
        } finally {
            setIsCleaning(false);
        }
    };

    const StatCard = ({ label, value, icon: Icon, color, delay }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="flex-1 min-w-[140px] p-4 rounded-2xl glass-card border border-white/50 relative overflow-hidden group hover:bg-white/90 transition-all"
        >
            <div className={`absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className={`text-3xl font-bold mb-1 tracking-tight ${color.replace('bg-', 'text-')}`}>
                    {value}
                </div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                </div>
            </div>
        </motion.div>
    );

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden"
            >
                {/* Ambient Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />

                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                    {/* Left Section: Status & Title */}
                    <div className="flex items-center gap-6 w-full lg:w-auto">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Server className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Control Center</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-gray-500">System Operational</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Stats Grid */}
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto flex-1 justify-center px-4">
                        <StatCard
                            label="Online"
                            value={onlineCount}
                            icon={Activity}
                            color="text-green-600"
                            delay={0.1}
                        />
                        <StatCard
                            label="Running"
                            value={executingCount}
                            icon={Smartphone}
                            color="text-blue-600"
                            delay={0.2}
                        />
                        <StatCard
                            label="Offline"
                            value={offlineCount}
                            icon={WifiOff}
                            color="text-gray-400"
                            delay={0.3}
                        />
                        <StatCard
                            label="Routes"
                            value={safeRoutes.length}
                            icon={MapIcon}
                            color="text-purple-600"
                            delay={0.4}
                        />
                    </div>

                    {/* Right Section: Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-white border border-gray-200/50 transition-all select-none group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={useDevicesStore((state) => state.showOfflineHistory)}
                                    onChange={() => useDevicesStore.getState().toggleShowOfflineHistory()}
                                />
                                <div className="block bg-gray-300 w-10 h-6 rounded-full peer-checked:bg-blue-500 transition-colors" />
                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                History
                            </span>
                        </label>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsEnrollOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Enroll</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCleanup}
                                disabled={isCleaning}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-red-500 font-semibold border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Wipe</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <EnrollDeviceModal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} />
        </>
    );
};
