'use client';

import React from 'react';
import { useRoutesStore } from '@/store/useRoutesStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Route } from '@/types';
import dayjs from 'dayjs';

interface RouteListProps {
    onSelectRoute?: (routeId: string) => void;
    onEditRoute?: (route: Route) => void;
    onDeleteRoute?: (routeId: string) => void;
}

export const RouteList: React.FC<RouteListProps> = ({
    onSelectRoute,
    onEditRoute,
    onDeleteRoute,
}) => {
    const routes = useRoutesStore((state) => state.routes);
    const selectedRouteId = useRoutesStore((state) => state.selectedRouteId);
    const setSelectedRoute = useRoutesStore((state) => state.setSelectedRoute);

    const handleSelect = (routeId: string) => {
        setSelectedRoute(routeId === selectedRouteId ? null : routeId);
        onSelectRoute?.(routeId);
    };

    if (routes.length === 0) {
        return (
            <Card>
                <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">No routes available</div>
                    <div className="text-gray-500 text-sm">
                        Create a new route to get started
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {routes.map((route) => (
                <Card
                    key={route.id}
                    className={`cursor-pointer transition-all ${selectedRouteId === route.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                    hover
                    onClick={() => handleSelect(route.id)}
                >
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {route.name}
                                </h3>
                                {route.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {route.description}
                                    </p>
                                )}
                            </div>
                            {route.loop && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    🔄 Loop
                                </span>
                            )}
                        </div>

                        {/* Route Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                                <div className="text-gray-600">Points</div>
                                <div className="font-semibold text-gray-900">
                                    {route.points.length}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Stops</div>
                                <div className="font-semibold text-gray-900">
                                    {route.stops.length}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Speed</div>
                                <div className="font-semibold text-blue-600">
                                    {route.speed} km/h
                                </div>
                            </div>
                            {route.distance && (
                                <div>
                                    <div className="text-gray-600">Distance</div>
                                    <div className="font-semibold text-gray-900">
                                        {(route.distance / 1000).toFixed(2)} km
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                            Created {dayjs(route.createdAt).format('MMM D, YYYY')}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditRoute?.(route);
                                }}
                                className="flex-1"
                            >
                                ✏️ Edit
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete route "${route.name}"?`)) {
                                        onDeleteRoute?.(route.id);
                                    }
                                }}
                                className="flex-1"
                            >
                                🗑️ Delete
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
