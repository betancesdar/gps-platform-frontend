'use client';

import React, { useEffect } from 'react';
import { useMapEvents, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue
import 'leaflet/dist/leaflet.css';

// Custom icons
import { MapContainer } from '../map/MapContainer';

const createIcon = (color: string, label?: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${label || ''}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

const originIcon = createIcon('#10b981', 'A'); // Green
const destIcon = createIcon('#ef4444', 'B');   // Red
const stopIcon = (index: number) => createIcon('#3b82f6', String(index + 1)); // Blue

interface MapPoint {
    lat: number;
    lng: number;
}

interface RouteBuilderMapProps {
    origin?: MapPoint | null;
    destination?: MapPoint | null;
    stops?: Array<MapPoint & { index: number }>;
    routePreview?: any; // Start simple, verify shape later
    onMapClick?: (lat: number, lng: number) => void;
    selectingMode?: 'origin' | 'destination' | 'stop' | null;
}

// Component to handle map clicks
const MapEvents = ({ onClick, selectingMode }: { onClick?: (lat: number, lng: number) => void, selectingMode: any }) => {
    const map = useMapEvents({
        click(e) {
            if (onClick && selectingMode) {
                onClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    // Change cursor based on mode
    useEffect(() => {
        if (selectingMode) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = 'grab';
        }
    }, [selectingMode, map]);

    return null;
};

export const RouteBuilderMap: React.FC<RouteBuilderMapProps> = ({
    origin,
    destination,
    stops = [],
    routePreview,
    onMapClick,
    selectingMode
}) => {
    return (
        <MapContainer className="h-full w-full">
            <MapEvents onClick={onMapClick} selectingMode={selectingMode} />

            {/* Origin Marker */}
            {origin && (
                <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
                    <Popup>Origin</Popup>
                </Marker>
            )}

            {/* Destination Marker */}
            {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                    <Popup>Destination</Popup>
                </Marker>
            )}

            {/* Stops Markers */}
            {stops.map((stop, i) => (
                <Marker
                    key={`stop-${stop.index}`}
                    position={[stop.lat, stop.lng]}
                    icon={stopIcon(i)}
                >
                    <Popup>Stop {i + 1}</Popup>
                </Marker>
            ))}

            {/* Route Polyline Preview */}
            {routePreview && routePreview.geometry && (
                <Polyline
                    positions={routePreview.geometry.map((p: any) => [p[1], p[0]])}
                    color="#6366f1"
                    weight={4}
                    opacity={0.7}
                />
            )}
        </MapContainer>
    );
};
