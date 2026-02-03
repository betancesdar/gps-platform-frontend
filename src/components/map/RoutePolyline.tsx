'use client';

import React from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { Route } from '@/types';

interface RoutePolylineProps {
    route: Route;
    color?: string;
    weight?: number;
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
    route,
    color = '#3b82f6',
    weight = 4,
}) => {
    // Safety check for points
    if (!route.points || !Array.isArray(route.points) || route.points.length === 0) {
        return null;
    }

    const positions = route.points.map((point) => [
        point.latitude,
        point.longitude,
    ]) as [number, number][];

    // Get first and last points for markers
    const startPoint = route.points[0];
    const endPoint = route.points[route.points.length - 1];

    return (
        <>
            {/* Route line */}
            <Polyline
                positions={positions}
                pathOptions={{
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />

            {/* Start marker (green) */}
            <CircleMarker
                center={[startPoint.latitude, startPoint.longitude]}
                radius={8}
                pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 1,
                }}
            >
                <Popup>
                    <div className="p-2">
                        <h4 className="font-semibold">Inicio</h4>
                        <p className="text-sm text-gray-600">{route.name}</p>
                    </div>
                </Popup>
            </CircleMarker>

            {/* End marker (red) */}
            {endPoint !== startPoint && (
                <CircleMarker
                    center={[endPoint.latitude, endPoint.longitude]}
                    radius={8}
                    pathOptions={{
                        color: '#ef4444',
                        fillColor: '#ef4444',
                        fillOpacity: 1,
                    }}
                >
                    <Popup>
                        <div className="p-2">
                            <h4 className="font-semibold">Fin</h4>
                            <p className="text-sm text-gray-600">{route.name}</p>
                        </div>
                    </Popup>
                </CircleMarker>
            )}
        </>
    );
};
