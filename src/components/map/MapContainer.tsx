'use client';

import React from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
    children?: React.ReactNode;
    center?: [number, number];
    zoom?: number;
    className?: string;
}

export const MapContainer: React.FC<MapContainerProps> = ({
    children,
    center = [40.4168, -3.7038], // Madrid by default
    zoom = 13,
    className = 'h-full w-full',
}) => {
    return (
        <LeafletMapContainer
            center={center}
            zoom={zoom}
            className={className}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
            />
            {children}
        </LeafletMapContainer>
    );
};
