'use client';

import React, { useState } from 'react';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useRoutesStore } from '@/store/useRoutesStore';
import { devicesService } from '@/services/devices.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { VirtualSelect } from '../ui/VirtualSelect';

export const RouteAssignment: React.FC = () => {
    const devices = useDevicesStore((state) => state.devices);
    const routes = useRoutesStore((state) => state.routes);
    const updateDevice = useDevicesStore((state) => state.updateDevice);

    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const deviceOptions = React.useMemo(() => devices.map(d => ({
        id: d.id,
        label: `${d.name} (${d.status})${d.assignedRoute ? ` - Current: ${d.assignedRoute.name}` : ''}`
    })), [devices]);

    const routeOptions = React.useMemo(() => routes.map(route => ({
        id: route.id,
        label: `${route.name} (${route.points?.length || 0} points, ${route.speed} km/h)`
    })), [routes]);

    const handleAssign = async () => {
        if (!selectedDeviceId || !selectedRouteId) {
            setError('Please select both a device and a route');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const route = routes.find(r => r.id === selectedRouteId);
            const speed = route?.speed || 40; // Default to 40km/h if not set

            const updatedDevice = await devicesService.assignRoute(selectedDeviceId, selectedRouteId);

            updateDevice(selectedDeviceId, {
                assignedRoute: updatedDevice.assignedRoute,
            });

            setSuccess('Route assigned successfully!');
            setSelectedDeviceId('');
            setSelectedRouteId('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign route');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assign Route to Device
            </h2>

            <div className="space-y-4">
                {/* Device Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Device
                    </label>
                    <VirtualSelect
                        options={deviceOptions}
                        value={selectedDeviceId}
                        onChange={setSelectedDeviceId}
                        placeholder="-- Select a device --"
                    />
                </div>

                {/* Route Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Route
                    </label>
                    <VirtualSelect
                        options={routeOptions}
                        value={selectedRouteId}
                        onChange={setSelectedRouteId}
                        placeholder="-- Select a route --"
                    />
                </div>

                {/* Preview */}
                {selectedDeviceId && selectedRouteId && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Assignment Preview</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                            <div>
                                <strong>Device:</strong>{' '}
                                {devices.find((d) => d.id === selectedDeviceId)?.name}
                            </div>
                            <div>
                                <strong>Route:</strong>{' '}
                                {routes.find((r) => r.id === selectedRouteId)?.name}
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        ❌ {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                        ✅ {success}
                    </div>
                )}

                {/* Action Button */}
                <Button
                    variant="primary"
                    onClick={handleAssign}
                    disabled={!selectedDeviceId || !selectedRouteId || isLoading}
                    isLoading={isLoading}
                    className="w-full"
                >
                    Assign Route
                </Button>
            </div>

            {/* Current Assignments */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Current Assignments</h3>
                <div className="space-y-2">
                    {devices
                        .filter((d) => d.assignedRoute)
                        .map((device) => (
                            <div
                                key={device.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{device.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {device.assignedRoute?.name}
                                    </div>
                                </div>
                                <StatusBadge status={device.status} size="sm" />
                            </div>
                        ))}
                    {devices.filter((d) => d.assignedRoute).length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                            No routes assigned yet
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
