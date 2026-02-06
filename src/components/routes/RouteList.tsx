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
    onPreviewRoute?: (route: Route) => void;
}

export const RouteList: React.FC<RouteListProps> = ({
    onSelectRoute,
    onEditRoute,
    onDeleteRoute,
    onPreviewRoute,
}) => {
    const routes = useRoutesStore((state) => state.routes);
    const selectedRouteId = useRoutesStore((state) => state.selectedRouteId);
    const setSelectedRoute = useRoutesStore((state) => state.setSelectedRoute);

    const handleSelect = (routeId: string) => {
        setSelectedRoute(routeId === selectedRouteId ? null : routeId);
        onSelectRoute?.(routeId);
    };

    // Safe check for routes array
    if (!Array.isArray(routes) || routes.length === 0) {
        return (
            <Card>
                <div className="text-center py-8">
                    <div className="text-4xl mb-3">🗺️</div>
                    <div className="text-gray-600 text-lg mb-2">No hay rutas disponibles</div>
                    <div className="text-gray-500 text-sm">
                        Crea una nueva ruta para comenzar
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {routes.map((route, index) => {
                // Get route ID safely - backend uses routeId, frontend might use id
                const routeId = route.id || (route as any).routeId || `route-${index}`;

                // Get point count safely - backend uses pointCount, frontend uses points.length
                const pointCount = (route as any).pointCount ?? route.points?.length ?? 0;

                return (
                    <Card
                        key={routeId}
                        className={`cursor-pointer transition-all ${selectedRouteId === routeId ? 'ring-2 ring-blue-500' : ''
                            }`}
                        hover
                        onClick={() => handleSelect(routeId)}
                    >
                        <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        {route.name || 'Ruta sin nombre'}
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <div className="text-gray-600">Puntos</div>
                                    <div className="font-semibold text-gray-900">
                                        {pointCount}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Tipo</div>
                                    <div className="font-semibold text-gray-900">
                                        {(route as any).sourceType === 'gpx' ? '📄 GPX' : '📍 Puntos'}
                                    </div>
                                </div>
                                {route.speed && (
                                    <div>
                                        <div className="text-gray-600">Velocidad</div>
                                        <div className="font-semibold text-blue-600">
                                            {route.speed} km/h
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                                Creada {route.createdAt ? dayjs(route.createdAt).format('DD MMM YYYY') : 'recientemente'}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPreviewRoute?.(route);
                                    }}
                                    className="flex-1"
                                >
                                    👁️ Preview
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditRoute?.(route);
                                    }}
                                    className="flex-1"
                                >
                                    ✏️ Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`¿Eliminar ruta "${route.name}"?`)) {
                                            onDeleteRoute?.(routeId);
                                        }
                                    }}
                                    className="flex-1"
                                >
                                    🗑️ Eliminar
                                </Button>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
