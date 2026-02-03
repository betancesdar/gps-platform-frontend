'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRoutesStore } from '@/store/useRoutesStore';

// Dynamically import map components to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import('./MapContainer').then((mod) => mod.MapContainer),
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
    const routes = useRoutesStore((state) => state.routes);
    const selectedRouteId = useRoutesStore((state) => state.selectedRouteId);

    // Use default map center from environment variables
    const mapCenter = useMemo(() => {
        return [
            parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '18.4861'),
            parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-69.9312'),
        ] as [number, number];
    }, []);

    const mapZoom = useMemo(() => {
        return parseInt(process.env.NEXT_PUBLIC_MAP_ZOOM || '13');
    }, []);

    // Get all routes to display (with safety check)
    const displayRoutes = useMemo(() => {
        if (!Array.isArray(routes)) return [];
        return routes.filter(r => r && r.points && Array.isArray(r.points) && r.points.length > 0);
    }, [routes]);

    // Get selected route if any
    const selectedRoute = useMemo(() => {
        if (!selectedRouteId || !Array.isArray(routes)) return null;
        return routes.find((r) => r.id === selectedRouteId);
    }, [selectedRouteId, routes]);

    return (
        <div className={className}>
            <MapContainer center={mapCenter} zoom={mapZoom}>
                {/* Render all routes */}
                {displayRoutes.map((route, index) => (
                    <RoutePolyline
                        key={route.id}
                        route={route}
                        color={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                        weight={3}
                    />
                ))}

                {/* Render selected route with highlight */}
                {selectedRoute && selectedRoute.points && (
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
