'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { Device } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';

interface DeviceMarkerProps {
    device: Device;
}

export const DeviceMarker: React.FC<DeviceMarkerProps> = ({ device }) => {
    if (!device.currentPosition) return null;

    const { latitude, longitude } = device.currentPosition;

    // Create custom icon based on device status
    const getMarkerIcon = () => {
        const color = device.status === 'online' ? '#10b981' : '#6b7280';
        const isRunning = device.routeStatus === 'running';

        const iconHtml = `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isRunning ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : ''}
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;

        return new DivIcon({
            html: iconHtml,
            className: 'custom-device-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
        });
    };

    return (
        <Marker position={[latitude, longitude]} icon={getMarkerIcon()}>
            <Popup>
                <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-2">{device.name}</h3>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Status:</span>
                            <StatusBadge status={device.status} size="sm" />
                        </div>

                        {device.routeStatus && device.routeStatus !== 'idle' && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Route:</span>
                                <StatusBadge status={device.routeStatus} size="sm" />
                            </div>
                        )}

                        {device.currentSpeed !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Speed:</span>
                                <span className="font-medium">{device.currentSpeed.toFixed(1)} km/h</span>
                            </div>
                        )}

                        {device.assignedRoute && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Route:</span>
                                <span className="font-medium truncate max-w-[120px]">
                                    {device.assignedRoute.name}
                                </span>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                                ID: {device.androidId}
                            </div>
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};
