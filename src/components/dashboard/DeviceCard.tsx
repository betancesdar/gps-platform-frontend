'use client';

import React, { useState } from 'react';
import { Device } from '@/services/devices.service';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useDeviceControl } from '@/hooks/useDeviceControl';
import { useRoutesStore } from '@/store/useRoutesStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { VirtualSelect } from '../ui/VirtualSelect';
import { streamService } from '@/services/stream.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    Monitor,
    Trash2,
    Play,
    Pause,
    Square,
    MapPin,
    Navigation,
    Clock,
    MoreVertical
} from 'lucide-react';

dayjs.extend(relativeTime);
dayjs.locale('es');

interface DeviceCardProps {
    device: Device;
    onSelect?: (deviceId: string) => void;
    isSelected?: boolean;
}

const DeviceCardComponent: React.FC<DeviceCardProps> = ({
    device,
    onSelect,
    isSelected = false,
}) => {
    const { startDevice, pauseDevice, resumeDevice, stopDevice, isLoading } = useDeviceControl();
    const routes = useRoutesStore((state) => state.routes);
    const safeRoutes = Array.isArray(routes) ? routes : [];

    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [speed, setSpeed] = useState<number>(30); // km/h
    const [isHovered, setIsHovered] = useState(false);
    const [streamInfo, setStreamInfo] = useState<{ speedApplied?: number; engineMode?: string; status?: string } | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const routeOptions = React.useMemo(() => safeRoutes.map(r => ({
        id: r.id,
        label: `${r.name} (${r.pointCount || 0} pts)`
    })), [safeRoutes]);

    const isExecuting = device.status === 'EXECUTING';

    React.useEffect(() => {
        if (isExecuting) {
            streamService.getStatus(device.id)
                .then(res => {
                    if (res) {
                        setStreamInfo({
                            speedApplied: res.speedApplied,
                            engineMode: res.engineMode,
                            status: res.status
                        });
                    }
                })
                .catch(() => { });
        } else {
            setStreamInfo(null);
        }
    }, [isExecuting, device.id]);

    const handleStart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setActionError(null);
        if (!selectedRouteId) {
            setActionError('Por favor selecciona una ruta primero');
            return;
        }
        if (isLoading) return; // Prevent double submit

        try {
            const result = await startDevice(device.id, selectedRouteId, speed);
            if (result) {
                setStreamInfo({ speedApplied: result.speedApplied, engineMode: result.engineMode, status: result.status });
            }
        } catch (err: any) {
            setActionError(`Error al iniciar: ${err.message}`);
        }
    };

    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleControl = async (e: React.MouseEvent, action: 'pause' | 'resume' | 'stop') => {
        e.stopPropagation();
        setActionError(null);
        setIsActionLoading(true);
        try {
            let result;
            if (action === 'pause') result = await pauseDevice(device.id);
            if (action === 'resume') result = await resumeDevice(device.id);
            if (action === 'stop') result = await stopDevice(device.id);

            if (result && action !== 'stop') {
                setStreamInfo({
                    speedApplied: result.speedApplied,
                    engineMode: result.engineMode,
                    status: result.status
                });
            } else if (action === 'stop') {
                setStreamInfo(null);
            }
        } catch (err: any) {
            setActionError(`Error: ${err.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setActionError(null);
        if (confirm('Are you sure you want to delete this device? This cannot be undone.')) {
            try {
                await useDevicesStore.getState().deleteDevice(device.id);
            } catch (error) {
                setActionError('Failed to delete device');
            }
        }
    };

    const isOnline = device.status === 'ONLINE';
    const isOffline = device.status === 'OFFLINE';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onSelect?.(device.id)}
            className={`
                relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-2xl shadow-blue-500/20 bg-white'
                    : 'border-white/40 bg-white/80 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/10 backdrop-blur-xl'
                }
            `}
        >
            {/* Background Gradient Accent */}
            <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-300 ${isExecuting ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                isOnline ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                    'bg-gradient-to-r from-gray-300 to-gray-400'
                }`} />

            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`
                            relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner
                            ${isOnline || isExecuting
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600'
                                : 'bg-gray-100/80 text-gray-400'
                            }
                        `}>
                            {device.platform?.toLowerCase().includes('web')
                                ? <Monitor className="w-6 h-6" />
                                : <Smartphone className="w-6 h-6" />
                            }

                            {/* Status Indicator Dot */}
                            <span className={`absolute -top-1 -right-1 flex h-3 w-3`}>
                                {(isOnline || isExecuting) && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/50 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${isExecuting ? 'bg-green-500' : isOnline ? 'bg-blue-500' : 'bg-gray-400'
                                    }`}></span>
                            </span>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight text-base tracking-tight">
                                {device.name || 'Unnamed Device'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
                                    {device.id?.slice(0, 8)}
                                </span>
                                {device.appVersion && (
                                    <span className="text-[10px] text-gray-500 bg-blue-50/50 px-1.5 py-0.5 rounded-md border border-blue-100/50">
                                        v{device.appVersion}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Delete Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: '#fee2e2', color: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDelete}
                            className="p-2 text-gray-400 rounded-xl transition-colors"
                            title="Delete Device"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Status & Last Seen */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last Seen</span>
                            <span className="text-xs font-medium text-gray-700">
                                {device.lastSeen ? dayjs(device.lastSeen).fromNow() : 'Never'}
                            </span>
                        </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 ${isExecuting ? 'bg-green-50/80 border-green-100' :
                        isOnline ? 'bg-blue-50/80 border-blue-100' :
                            'bg-gray-50/80 border-gray-100'
                        }`}>
                        <StatusBadge status={device.status} />
                    </div>
                </div>

                {/* Controls Area */}
                <AnimatePresence mode='wait'>
                    {!isExecuting ? (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 pt-2 border-t border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <Navigation className="w-3 h-3" /> Select Route
                                </label>
                                <div className="relative group w-full">
                                    <VirtualSelect
                                        options={routeOptions}
                                        value={selectedRouteId}
                                        onChange={setSelectedRouteId}
                                        placeholder={safeRoutes.length === 0 ? '-- No routes --' : 'Choose a route...'}
                                        disabled={safeRoutes.length === 0}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <Clock className="w-3 h-3" /> Speed
                                    </label>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                        {speed} km/h
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="120"
                                    step="5"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    w-full py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all
                                    ${isOffline
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40'
                                    }
                                `}
                                onClick={handleStart}
                                disabled={isLoading || !selectedRouteId || isOffline}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-2 border-green-200 border-t-white animate-spin" />
                                        Starting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Play className="w-4 h-4 fill-current" />
                                        {isOffline ? 'Device Offline' : 'Start Simulation'}
                                    </span>
                                )}
                            </motion.button>

                            {actionError && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                                    {actionError}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="controls"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col gap-3 pt-2 border-t border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {streamInfo && (
                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                                    <div className="text-xs font-semibold text-blue-800 flex justify-between">
                                        <span>Speed Configured:</span>
                                        <span>{speed} km/h</span>
                                    </div>
                                    {streamInfo.speedApplied !== undefined && (
                                        <div className="text-xs font-semibold text-emerald-700 flex justify-between">
                                            <span>Speed Applied:</span>
                                            <span>{streamInfo.speedApplied} km/h</span>
                                        </div>
                                    )}
                                    {streamInfo.engineMode && (
                                        <div className="text-xs font-medium text-gray-500 mt-1 uppercase">
                                            Engine: {streamInfo.engineMode}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                {streamInfo?.status !== 'paused' ? (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-semibold text-sm border border-amber-100 hover:bg-amber-100 transition-colors"
                                        onClick={(e) => handleControl(e, 'pause')}
                                        disabled={isActionLoading}
                                    >
                                        <Pause className="w-4 h-4 fill-current" /> Pause
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
                                        onClick={(e) => handleControl(e, 'resume')}
                                        disabled={isActionLoading}
                                    >
                                        <Play className="w-4 h-4 fill-current" /> Resume
                                    </motion.button>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: '#fee2e2' }}
                                    whileTap={{ scale: 0.98 }}
                                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm border border-red-100 hover:bg-red-100/80 transition-colors shadow-sm"
                                    onClick={(e) => handleControl(e, 'stop')}
                                    disabled={isActionLoading}
                                >
                                    <Square className="w-4 h-4 fill-current" /> Stop Simulation
                                </motion.button>
                            </div>

                            {actionError && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                                    {actionError}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export const DeviceCard = React.memo(DeviceCardComponent, (prevProps, nextProps) => {
    return (
        prevProps.device.id === nextProps.device.id &&
        prevProps.device.status === nextProps.device.status &&
        prevProps.device.lastSeen === nextProps.device.lastSeen &&
        prevProps.device.assignedRoute?.id === nextProps.device.assignedRoute?.id &&
        prevProps.isSelected === nextProps.isSelected
    );
});
