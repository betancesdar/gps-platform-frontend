'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useRoutesStore } from '@/store/useRoutesStore';

// Dynamically import map components to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import('./MapContainer').then((mod) => mod.MapContainer),
    { ssr: false }
);

const DeviceMarker = dynamic(
    () => import('./DeviceMarker').then((mod) => mod.DeviceMarker),
    { ssr: false }
);

const RoutePolyline = dynamic(
    () => import('./RoutePolyline').then((mod) => mod.RoutePolyline),
    { ssr: false }
);

interface MapViewProps {
    className?: string;
}

export const MapView: React.FC<MapViewProps> = ({ className }) => {
    const devices = useDevicesStore((state) => state.devices);
    const routes = useRoutesStore((state) => state.routes);
    const selectedRouteId = useRoutesStore((state) => state.selectedRouteId);

    // Get center from first device with position or use default
    const mapCenter = useMemo(() => {
        const deviceWithPosition = devices.find((d) => d.currentPosition);
        if (deviceWithPosition?.currentPosition) {
            return [
                deviceWithPosition.currentPosition.latitude,
                deviceWithPosition.currentPosition.longitude,
            ] as [number, number];
        }
        return [
            parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '40.4168'),
            parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-3.7038'),
        ] as [number, number];
    }, [devices]);

    const mapZoom = useMemo(() => {
        return parseInt(process.env.NEXT_PUBLIC_MAP_ZOOM || '13');
    }, []);

    // Get unique routes from devices
    const activeRoutes = useMemo(() => {
        const routeIds = new Set(
            devices
                .filter((d) => d.assignedRoute)
                .map((d) => d.assignedRoute!.id)
        );
        return routes.filter((r) => routeIds.has(r.id));
    }, [devices, routes]);

    // Get selected route if any
    const selectedRoute = useMemo(() => {
        if (!selectedRouteId) return null;
        return routes.find((r) => r.id === selectedRouteId);
    }, [selectedRouteId, routes]);

    return (
        <div className={className}>
            <MapContainer center={mapCenter} zoom={mapZoom}>
                {/* Render all device markers */}
                {devices.map((device) => (
                    <DeviceMarker key={device.id} device={device} />
                ))}

                {/* Render active routes */}
                {activeRoutes.map((route, index) => (
                    <RoutePolyline
                        key={route.id}
                        route={route}
                        color={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                        weight={3}
                    />
                ))}

                {/* Render selected route with highlight */}
                {selectedRoute && (
                    <RoutePolyline
                        route={selectedRoute}
                        color="#ef4444"
                        weight={5}
                    />
                )}
            </MapContainer>
        </div>
    );
};
