'use client';

import React from 'react';
import { Polyline, CircleMarker, Popup, Marker } from 'react-leaflet';
import { Route } from '@/types';
import L from 'leaflet';

interface RoutePolylineProps {
    route: Route;
    color?: string;
    weight?: number;
}

const getWaypointLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D...
};

const createWaypointIcon = (label: string, color: string) => {
    return L.divIcon({
        className: 'custom-waypoint-marker',
        html: `
            <div style="
                position: relative;
                width: 40px;
                height: 40px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, ${color}, ${color}dd);
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    color: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    font-family: Arial, sans-serif;
                ">
                    ${label}
                </div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};

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

    // Identify waypoints (points with waitDuration > 0)
    const waypoints = route.points
        .map((point, index) => ({ point, originalIndex: index }))
        .filter(({ point }) => (point.waitDuration || point.dwellSeconds || 0) > 0);

    // Get first and last points
    const startPoint = route.points[0];
    const endPoint = route.points[route.points.length - 1];
    const isCircularRoute = startPoint === endPoint;

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

            {/* Waypoint markers with labels */}
            {waypoints.length > 0 ? (
                // Show labeled waypoints if they exist
                waypoints.map(({ point, originalIndex }, waypointIndex) => {
                    const isStart = originalIndex === 0;
                    const isEnd = originalIndex === (route.points?.length || 0) - 1;

                    let markerColor = '#3b82f6'; // blue for intermediate stops
                    if (isStart) markerColor = '#10b981'; // green for start
                    if (isEnd && !isCircularRoute) markerColor = '#ef4444'; // red for end

                    const label = getWaypointLabel(waypointIndex);
                    const waitTotal = point.waitDuration || point.dwellSeconds || 0;
                    const waitMinutes = (waitTotal / 60).toFixed(1);

                    return (
                        <Marker
                            key={`waypoint-${originalIndex}`}
                            position={[point.latitude, point.longitude]}
                            icon={createWaypointIcon(label, markerColor)}
                        >
                            <Popup>
                                <div className="p-2 min-w-[180px]">
                                    <h4 className="font-bold text-lg mb-1">
                                        {isStart && '🟢 '}
                                        {isEnd && !isCircularRoute && '🔴 '}
                                        {!isStart && !isEnd && '🔵 '}
                                        Parada {label}
                                    </h4>
                                    <p className="text-sm text-gray-700 font-medium mb-2">
                                        {route.name}
                                    </p>
                                    <div className="text-xs text-gray-600 space-y-1 border-t pt-2">
                                        <div>
                                            <strong>Coordenadas:</strong>
                                            <br />
                                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                                        </div>
                                        <div className="text-blue-600 font-semibold">
                                            ⏱️ Tiempo de espera: {waitMinutes} min
                                        </div>
                                        <div className="text-gray-500">
                                            {isStart && 'Punto de inicio del recorrido'}
                                            {isEnd && !isCircularRoute && 'Punto final del recorrido'}
                                            {!isStart && !isEnd && 'Parada intermedia'}
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })
            ) : (
                // Fallback to simple start/end markers if no waypoints
                <>
                    {/* Start marker (green) */}
                    <CircleMarker
                        center={[startPoint.latitude, startPoint.longitude]}
                        radius={8}
                        pathOptions={{
                            color: '#10b981',
                            fillColor: '#10b981',
                            fillOpacity: 1,
                            weight: 3,
                        }}
                    >
                        <Popup>
                            <div className="p-2">
                                <h4 className="font-semibold">🟢 Inicio</h4>
                                <p className="text-sm text-gray-600">{route.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {startPoint.latitude.toFixed(6)}, {startPoint.longitude.toFixed(6)}
                                </p>
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
                                weight: 3,
                            }}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h4 className="font-semibold">🔴 Fin</h4>
                                    <p className="text-sm text-gray-600">{route.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {endPoint.latitude.toFixed(6)}, {endPoint.longitude.toFixed(6)}
                                    </p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    )}
                </>
            )}
        </>
    );
};
