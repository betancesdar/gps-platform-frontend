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
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
                opacity: ${opacity};
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
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                        📍 Live Device Tracking
                    </h3>
                    <div className="text-sm text-gray-600">
                        {Object.keys(locationsByDeviceId).length} device(s) tracked
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Device Selector */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Device
                        </label>
                        <select
                            value={selectedDeviceId || ''}
                            onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Devices</option>
                            {onlineDevices.map((device) => (
                                <option key={device.id} value={device.id}>
                                    {device.name} {device.status === 'EXECUTING' ? '🏃' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Follow Camera Toggle */}
                    <div className="flex items-center gap-2 mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={followSelected}
                                onChange={(e) => setFollowSelected(e.target.checked)}
                                disabled={!selectedDeviceId}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700">📹 Follow Camera</span>
                        </label>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Stale (&gt;10s)</span>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
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
                                        <h4 className="font-bold text-lg mb-2">
                                            {device?.name || deviceId}
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <div>
                                                <strong>Status:</strong>{' '}
                                                <span className={stale ? 'text-red-600' : 'text-green-600'}>
                                                    {stale ? '⚠️ Stale' : '✅ Active'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong>Location:</strong><br />
                                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                            </div>
                                            <div>
                                                <strong>Speed:</strong> {(location.speed * 3.6).toFixed(1)} km/h
                                            </div>
                                            <div>
                                                <strong>Bearing:</strong> {location.bearing.toFixed(0)}°
                                            </div>
                                            <div>
                                                <strong>Accuracy:</strong> ±{location.accuracy.toFixed(1)}m
                                            </div>
                                            <div className="text-xs text-gray-500 pt-1 border-t mt-1">
                                                Updated: {Math.round((Date.now() - location.updatedAt) / 1000)}s ago
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
