'use client';

import React, { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useDevicesLocationStore, isLocationStale } from '@/store/useDevicesLocationStore';
import { DeviceLocationState } from '@/types/geocode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create device marker icon with rotation and stale indication
function createDeviceIcon(bearing: number, isStale: boolean) {
    const opacity = isStale ? 0.4 : 1;

    return L.divIcon({
        className: 'custom-device-marker',
        html: `
            <div style="
                width: 32px;
                height: 32px;
                transform: rotate(${bearing}deg);
                display: flex;
                align-items: center;
                justify-content: center;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                opacity: ${opacity};
                transition: all 0.3s ease;
            ">
                <div style="font-size: 28px;">
                    🚗
                </div>
            </div>
            ${isStale ? `
                <div style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ef4444;
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">!</div>
            ` : ''}
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
}

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
            map.panTo([location.lat, location.lng], { animate: true, duration: 0.5 });
        }
    }, [location, shouldFollow, map]);

    return null;
}

interface LiveDeviceMapProps {
    className?: string;
}

export const LiveDeviceMap: React.FC<LiveDeviceMapProps> = ({ className = '' }) => {
    const devices = useDevicesStore((state) => state.devices);
    const locationsByDeviceId = useDevicesLocationStore((state) => state.locationsByDeviceId);
    const selectedDeviceId = useDevicesLocationStore((state) => state.selectedDeviceId);
    const followSelected = useDevicesLocationStore((state) => state.followSelected);
    const setSelectedDeviceId = useDevicesLocationStore((state) => state.setSelectedDeviceId);
    const setFollowSelected = useDevicesLocationStore((state) => state.setFollowSelected);

    // Get online devices
    const onlineDevices = devices.filter((d) => d.status === 'ONLINE' || d.status === 'EXECUTING');

    // Get selected device location
    const selectedLocation = selectedDeviceId ? locationsByDeviceId[selectedDeviceId] : null;

    // Default center (New York)
    const defaultCenter: [number, number] = [40.7128, -74.0060];

    // Device locations to display
    const deviceLocations = selectedDeviceId
        ? selectedDeviceId in locationsByDeviceId
            ? { [selectedDeviceId]: locationsByDeviceId[selectedDeviceId] }
            : {}
        : locationsByDeviceId;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Controls */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                        📍 Live Device Tracking
                    </h3>
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                        <span className="text-sm font-medium text-blue-700">
                            {Object.keys(locationsByDeviceId).length} rastreando
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Device Selector */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seleccionar Dispositivo
                        </label>
                        <select
                            value={selectedDeviceId || ''}
                            onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all hover:border-gray-400"
                        >
                            <option value="">Todos los Dispositivos</option>
                            {onlineDevices.map((device) => (
                                <option key={device.id} value={device.id}>
                                    {device.name} {device.status === 'EXECUTING' ? '🏃' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Follow Camera Toggle */}
                    <div className="flex items-center gap-2 mt-6">
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={followSelected}
                                onChange={(e) => setFollowSelected(e.target.checked)}
                                disabled={!selectedDeviceId}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 font-medium">📹 Seguir Cámara</span>
                        </label>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Activo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Inactivo (&gt;10s)</span>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="h-96 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-2xl">
                <LeafletMapContainer
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                    />

                    {/* Device Markers */}
                    {Object.entries(deviceLocations).map(([deviceId, location]) => {
                        const device = devices.find((d) => d.id === deviceId);
                        const stale = isLocationStale(location);

                        return (
                            <Marker
                                key={deviceId}
                                position={[location.lat, location.lng]}
                                icon={createDeviceIcon(location.bearing, stale)}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[200px]">
                                        <h4 className="font-bold text-lg mb-2 text-gray-900">
                                            {device?.name || deviceId}
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <div>
                                                <strong>Estado:</strong>{' '}
                                                <span className={stale ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                    {stale ? '⚠️ Inactivo' : '✅ Activo'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong>Ubicación:</strong><br />
                                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                            </div>
                                            <div>
                                                <strong>Velocidad:</strong> {(location.speed * 3.6).toFixed(1)} km/h
                                            </div>
                                            <div>
                                                <strong>Dirección:</strong> {location.bearing.toFixed(0)}°
                                            </div>
                                            <div>
                                                <strong>Precisión:</strong> ±{location.accuracy.toFixed(1)}m
                                            </div>
                                            <div className="text-xs text-gray-500 pt-1 border-t mt-1">
                                                Actualizado: {Math.round((Date.now() - location.updatedAt) / 1000)}s atrás
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Camera Follower */}
                    <CameraFollower
                        location={selectedLocation}
                        shouldFollow={followSelected && selectedDeviceId !== null}
                    />
                </LeafletMapContainer>
            </div>
        </div>
    );
};
