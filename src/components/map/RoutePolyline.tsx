'use client';

import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
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
    const positions = route.points.map((point) => [
        point.latitude,
        point.longitude,
    ]) as [number, number][];

    // Create icon for stops
    const stopIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
        <rect x="8" y="8" width="8" height="8" fill="white" rx="1"/>
      </svg>
    `),
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });

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

            {/* Stop markers */}
            {route.stops.map((stop) => (
                <Marker
                    key={stop.id}
                    position={[stop.position.latitude, stop.position.longitude]}
                    icon={stopIcon}
                >
                    <Popup>
                        <div className="p-2">
                            <h4 className="font-semibold mb-1">
                                {stop.name || 'Stop'}
                            </h4>
                            {stop.description && (
                                <p className="text-sm text-gray-600 mb-2">{stop.description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                                Duration: {Math.floor(stop.duration / 60)} min {stop.duration % 60} sec
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};
