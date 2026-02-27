'use client';

import React, { useEffect, useMemo, memo } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useDevicesLocationStore, isLocationStale } from '@/store/useDevicesLocationStore';
import { DeviceLocationState } from '@/types/geocode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Maximize2, Crosshair, Map as MapIcon, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

// --- HELPERS ---

// Create device marker icon with rotation and stale indication
// Memoized inside the component to avoid recreation unless needed
const createDeviceIcon = (bearing: number, isStale: boolean, state?: 'MOVE' | 'WAIT', type: 'android' | 'web' = 'android') => {
    const opacity = isStale ? 0.6 : 1;
    const isWaiting = state === 'WAIT';
    // Use slightly different colors/icons for web vs android if needed, or just status
    const color = isStale ? '#ef4444' : isWaiting ? '#f59e0b' : '#3b82f6';

    return L.divIcon({
        className: 'custom-device-marker',
        html: `
            <div style="
                position: relative;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: ${opacity};
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <div style="
                    transform: rotate(${bearing}deg);
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 24px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                ">
                    ${isWaiting ? '🛑' : (type === 'web' ? '💻' : '🚗')}
                </div>
                
                ${isStale ? `
                    <div style="
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 12px;
                        height: 12px;
                        background: #ef4444;
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                        z-index: 10;
                    "></div>
                ` : ''}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};

// --- SUB-COMPONENTS ---

// Memoized Marker Component to prevent re-renders of ALL markers when one changes
const DeviceMarker = memo(({
    deviceId,
    location,
    device
}: {
    deviceId: string,
    location: DeviceLocationState,
    device: any
}) => {
    const stale = isLocationStale(location);
    const icon = useMemo(
        () => createDeviceIcon(location.bearing, stale, location.state as 'MOVE' | 'WAIT' | undefined, device?.platform?.toLowerCase().includes('web') ? 'web' : 'android'),
        [location.bearing, stale, location.state, device?.platform]
    );

    return (
        <Marker
            position={[location.lat, location.lng]}
            icon={icon}
        >
            <Popup className="glass-popup">
                <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                            {device?.platform === 'web' ? '💻' : '📱'} {device?.name || deviceId.slice(0, 8)}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stale
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : location.state === 'WAIT'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                            {stale ? 'STALE' : location.state || 'MOVING'}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex justify-between">
                            <span>Speed:</span>
                            <span className="font-mono font-medium text-gray-900">{location.speed.toFixed(1)} km/h</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Heading:</span>
                            <span className="font-mono font-medium text-gray-900">{location.bearing.toFixed(0)}°</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Accuracy:</span>
                            <span className="font-mono font-medium text-gray-900">±{location.accuracy.toFixed(1)}m</span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-1 text-[10px] text-gray-400 text-right">
                            {Math.round((Date.now() - location.updatedAt) / 1000)}s ago
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}, (prev, next) => {
    // Custom comparison function for performance
    // Only re-render if location (lat/lng/bearing/state) changes significantly or device status changes
    return (
        prev.location.lat === next.location.lat &&
        prev.location.lng === next.location.lng &&
        prev.location.bearing === next.location.bearing &&
        prev.location.state === next.location.state &&
        prev.location.updatedAt === next.location.updatedAt && // crucial for 'stale' calculation
        prev.device?.status === next.device?.status
    );
});

DeviceMarker.displayName = 'DeviceMarker';

// Component to handle camera follow
function CameraFollower({
    location,
    shouldFollow
}: {
    location: DeviceLocationState | null;
    shouldFollow: boolean;
}) {
    const map = useMap();

    useEffect(() => {
        if (shouldFollow && location) {
            map.panTo([location.lat, location.lng], { animate: true, duration: 0.8, easeLinearity: 0.5 });
        }
    }, [location, shouldFollow, map]);

    return null;
}

// --- MAIN COMPONENT ---

interface LiveDeviceMapProps {
    className?: string;
}

export const LiveDeviceMap: React.FC<LiveDeviceMapProps> = ({ className = '' }) => {
    // Optimization: Select only necessary state
    const devices = useDevicesStore((state) => state.devices);
    const locationsByDeviceId = useDevicesLocationStore((state) => state.locationsByDeviceId);
    const selectedDeviceId = useDevicesLocationStore((state) => state.selectedDeviceId);
    const followSelected = useDevicesLocationStore((state) => state.followSelected);
    const setSelectedDeviceId = useDevicesLocationStore((state) => state.setSelectedDeviceId);
    const setFollowSelected = useDevicesLocationStore((state) => state.setFollowSelected);

    // Derived state
    const onlineDevices = useMemo(() =>
        devices.filter((d) => d.status === 'ONLINE' || d.status === 'EXECUTING'),
        [devices]);

    const selectedLocation = selectedDeviceId ? locationsByDeviceId[selectedDeviceId] : null;
    const defaultCenter: [number, number] = [40.7128, -74.0060];

    // Filter locations to show
    const deviceIdsToShow = useMemo(() => {
        return selectedDeviceId
            ? (selectedDeviceId in locationsByDeviceId ? [selectedDeviceId] : [])
            : Object.keys(locationsByDeviceId);
    }, [selectedDeviceId, locationsByDeviceId]);

    return (
        <div className={`space-y-4 ${className} relative group`}>

            {/* Floating Controls (Glassmorphism) */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none"
            >
                <div
                    className="glass-card p-3 rounded-2xl flex flex-col md:flex-row items-center gap-4 pointer-events-auto max-w-4xl mx-auto backdrop-blur-xl"
                    onPointerDown={(e) => e.stopPropagation()}
                >

                    {/* Title & Count */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-blue-100/50 p-2 rounded-xl text-blue-600">
                            <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 leading-none">Live Map</h3>
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                {Object.keys(locationsByDeviceId).length} active
                            </span>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

                    {/* Device Selector */}
                    <div className="flex-1 w-full md:w-auto">
                        <div className="relative">
                            <select
                                value={selectedDeviceId || ''}
                                onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="">👀 Show All Devices</option>
                                {onlineDevices.map((device) => (
                                    <option key={device.id} value={device.id}>
                                        {device.status === 'EXECUTING' ? '🏃' : '📍'} {device.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <Navigation className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>

                    {/* Follow Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFollowSelected(!followSelected)}
                        disabled={!selectedDeviceId}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border
                            ${followSelected && selectedDeviceId
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }
                            ${!selectedDeviceId && 'opacity-50 cursor-not-allowed'}
                        `}
                    >
                        <Crosshair className={`w-4 h-4 ${followSelected ? 'animate-spin-slow' : ''}`} />
                        {followSelected ? 'Locked' : 'Follow'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Map Container */}
            <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-gray-200/50 shadow-2xl relative z-0">
                <LeafletMapContainer
                    key="live-map-container"
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        maxZoom={20}
                    />

                    {/* Render Memoized Markers */}
                    {deviceIdsToShow.map((deviceId) => {
                        const location = locationsByDeviceId[deviceId];
                        const device = devices.find(d => d.id === deviceId);

                        if (!location) return null;

                        return (
                            <DeviceMarker
                                key={deviceId}
                                deviceId={deviceId}
                                location={location}
                                device={device}
                            />
                        );
                    })}

                    <CameraFollower
                        location={selectedLocation}
                        shouldFollow={followSelected && selectedDeviceId !== null}
                    />
                </LeafletMapContainer>
            </div>
        </div>
    );
};
