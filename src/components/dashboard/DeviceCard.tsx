'use client';

import React, { useState } from 'react';
import { Device } from '@/services/devices.service';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useDeviceControl } from '@/hooks/useDeviceControl';
import { useRoutesStore } from '@/store/useRoutesStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useDevicesLocationStore } from '@/store/useDevicesLocationStore';
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
    deviceId: string;
    onSelect?: (deviceId: string) => void;
    isSelected?: boolean;
}

const DeviceCardComponent: React.FC<DeviceCardProps> = ({
    deviceId,
    onSelect,
    isSelected = false,
}) => {
    const device = useDevicesStore(state => state.devicesById[deviceId]);
    const wsConnected = useDevicesStore(state => state.wsConnected);
    const location = useDevicesLocationStore(state => state.locationsByDeviceId[deviceId]);
    const { startDevice, pauseDevice, resumeDevice, stopDevice, skipDwell, extendDwell, isLoading, isDevicePending } = useDeviceControl();

    // Safety check if device was deleted but list hasn't updated
    if (!device) return null;

    const isPending = isDevicePending(deviceId);

    const routes = useRoutesStore((state) => state.routes);
    const safeRoutes = Array.isArray(routes) ? routes : [];

    const selectedRouteId = useDevicesStore((state) => state.selectedRouteIds[device.id] || '');
    const setSelectedRouteId = (routeId: string) => useDevicesStore.getState().setSelectedRouteId(device.id, routeId);

    const [speed, setSpeed] = useState<number>(30); // km/h
    const [isHovered, setIsHovered] = useState(false);
    const [streamInfo, setStreamInfo] = useState<{
        speedApplied?: number;
        engineMode?: string;
        status?: string;
        state?: string;
        dwellRemainingSeconds?: number;
    } | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const routeOptions = React.useMemo(() => safeRoutes.map(r => ({
        id: r.id,
        label: `${r.name} (${r.pointCount || (r as any).totalPoints || (r as any).pointsCount || 0} pts)`
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
                            status: res.status,
                            state: res.state,
                            dwellRemainingSeconds: res.dwellRemainingSeconds,
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
        if (isPending) return; // Prevent double submit

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
                    status: result.status,
                    state: result.state,
                    dwellRemainingSeconds: result.dwellRemainingSeconds,
                });
            } else if (action === 'stop') {
                setStreamInfo(null);
                // Force reset local store so location state doesn't keep showing as WAIT
                useDevicesLocationStore.getState().updateLocation(device.id, {
                    ...useDevicesLocationStore.getState().locationsByDeviceId[device.id],
                    state: 'MOVE',
                    dwellRemainingSeconds: undefined,
                    dwellWaypointKind: undefined,
                    dwellWaypointLabel: undefined
                });
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

    const streamStatus = location?.streamStatus || 'stopped';
    const streamState = location?.state || 'MOVE';
    const dwellRemaining = location?.dwellRemainingSeconds ?? null;

    // UI calculation for stream mode logic from SSOT
    const isStreamPaused = streamStatus === 'paused' || streamState === 'PAUSED';
    const isStreamWaiting = streamStatus === 'running' && streamState === 'WAIT';

    let displayBadge: string = device.status;
    if (isExecuting) {
        if (isStreamWaiting) displayBadge = 'WAIT';
        else if (streamStatus === 'running') displayBadge = 'RUNNING';
        else if (streamStatus === 'paused') displayBadge = 'PAUSED';
        else if (streamStatus === 'stopped') displayBadge = 'STOPPED';
    }

    const activeRouteName = safeRoutes.find(r => r.id === selectedRouteId)?.name || 'Ruta Desconocida';

    return (
        <div
            onClick={() => onSelect?.(deviceId)}
            id={`device-card-${deviceId}`}
            className={`
                relative rounded-3xl border transition-all duration-200 cursor-pointer
                ${isHovered || isSelected ? 'z-50' : 'z-10'}
                ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg bg-white'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Gradient Accent */}
            <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-3xl transition-colors duration-300 ${isExecuting ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                isOnline ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                    'bg-gradient-to-r from-gray-300 to-gray-400'
                }`} />

            <div className="p-6 space-y-5">
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
                        <button
                            onClick={handleDelete}
                            className="p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                            title="Delete Device"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last Seen</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {device.lastSeen ? dayjs(device.lastSeen).fromNow() : 'Never'}
                            </span>
                        </div>
                    </div>

                    <div className={`p-3 rounded-2xl border flex items-center justify-center gap-2 ${isExecuting ? 'bg-green-50/80 border-green-100' :
                        isOnline ? 'bg-blue-50/80 border-blue-100' :
                            'bg-gray-50/80 border-gray-100'
                        }`}>
                        <StatusBadge status={displayBadge} />
                    </div>
                </div>

                {/* Controls Area */}
                {streamStatus === 'stopped' || !isExecuting ? (
                    <div
                        className="space-y-4 pt-4 border-t border-gray-100"
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

                        <button
                            className={`
                                    w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors
                                    ${isOffline
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                }
                                `}
                            onClick={handleStart}
                            disabled={isPending || !selectedRouteId || isOffline}
                        >
                            {isPending ? (
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
                        </button>

                        {actionError && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                                {actionError}
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className="flex flex-col gap-3 pt-4 border-t border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1.5 shadow-sm">
                            <div className="text-xs font-bold flex justify-between items-center text-gray-800 bg-white p-2 rounded-lg border border-blue-100/50">
                                <span className="flex items-center gap-1 text-blue-600 uppercase tracking-widest text-[10px]"><Navigation className="w-3 h-3" /> Ruta</span>
                                <span className="truncate max-w-[150px]" title={activeRouteName}>{activeRouteName}</span>
                            </div>
                            <div className="text-xs font-semibold text-blue-800 flex justify-between px-1 pt-1">
                                <span>Speed Configured:</span>
                                <span>{speed} km/h</span>
                            </div>
                            {streamInfo?.speedApplied !== undefined && (
                                <div className="text-xs font-semibold text-emerald-700 flex justify-between">
                                    <span>Speed Applied:</span>
                                    <span>{streamInfo.speedApplied} km/h</span>
                                </div>
                            )}
                            <div className="text-xs font-medium text-gray-500 mt-1 uppercase flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    Engine: {streamInfo?.engineMode || 'distance'}
                                    {!wsConnected && (
                                        <span className="bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-[9px] animate-pulse normal-case">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Reconectando...
                                        </span>
                                    )}
                                </span>
                                {isStreamPaused && (
                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                        PAUSED
                                    </span>
                                )}
                                {isStreamWaiting && !isStreamPaused && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all">
                                            <Clock className="w-3 h-3" />
                                            Stop: {dwellRemaining ?? 'WAIT'}
                                        </span>
                                        {location?.dwellWaypointLabel && (
                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold text-[10px] truncate max-w-[80px]" title={location.dwellWaypointLabel}>
                                                {location.dwellWaypointLabel}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            {isStreamWaiting && !isStreamPaused && process.env.NEXT_PUBLIC_ENABLE_SKIP_WAIT !== 'false' && (
                                <>
                                    <button
                                        className="col-span-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            setActionError(null);
                                            try { await skipDwell(device.id); }
                                            catch (err: any) { setActionError(err.message); }
                                        }}
                                        disabled={isPending}
                                    >
                                        <Play className="w-4 h-4 fill-current" /> Skip Dwell
                                    </button>
                                    <button
                                        className="col-span-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-semibold text-sm border border-purple-100 hover:bg-purple-100 transition-colors"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            setActionError(null);
                                            try { await extendDwell(device.id, 10); }
                                            catch (err: any) { setActionError(err.message); }
                                        }}
                                        disabled={isPending}
                                    >
                                        <Clock className="w-4 h-4" /> +10s
                                    </button>
                                </>
                            )}

                            {streamStatus === 'running' && !isStreamPaused && (
                                <button
                                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-semibold text-sm border border-amber-100 hover:bg-amber-100 transition-colors"
                                    onClick={(e) => handleControl(e, 'pause')}
                                    disabled={isPending}
                                >
                                    <Pause className="w-4 h-4 fill-current" /> Pause
                                </button>
                            )}

                            {(streamStatus === 'paused' || isStreamPaused) && (
                                <button
                                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
                                    onClick={(e) => handleControl(e, 'resume')}
                                    disabled={isPending}
                                >
                                    <Play className="w-4 h-4 fill-current" /> Resume
                                </button>
                            )}

                            <button
                                className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm border border-red-100 hover:bg-red-100 transition-colors"
                                onClick={(e) => handleControl(e, 'stop')}
                                disabled={isPending}
                            >
                                <Square className="w-4 h-4 fill-current" /> Stop Simulation
                            </button>
                        </div>

                        {actionError && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                                {actionError}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const DeviceCard = React.memo(DeviceCardComponent, (prevProps, nextProps) => {
    return (
        prevProps.deviceId === nextProps.deviceId &&
        prevProps.isSelected === nextProps.isSelected
    );
});
