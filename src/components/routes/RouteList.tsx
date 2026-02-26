'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
    const inFlightDeleteByRouteId = useRoutesStore((state) => state.inFlightDeleteByRouteId);

    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Show 6 per page to keep the list from growing too tall

    const handleSelect = (routeId: string) => {
        setSelectedRoute(routeId === selectedRouteId ? null : routeId);
        onSelectRoute?.(routeId);
    };

    // Filter routes by search term
    const filteredRoutes = useMemo(() => {
        if (!Array.isArray(routes)) return [];
        if (!search.trim()) return routes;
        const lower = search.toLowerCase();
        return routes.filter(r =>
            r.name?.toLowerCase().includes(lower) ||
            r.description?.toLowerCase().includes(lower)
        );
    }, [routes, search]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Paginate filtered routes
    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
    const paginatedRoutes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRoutes.slice(start, start + itemsPerPage);
    }, [filteredRoutes, currentPage]);

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
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar ruta por nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm text-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
            </div>

            {filteredRoutes.length === 0 && search.trim() !== '' ? (
                <Card>
                    <div className="text-center py-6 text-gray-500 text-sm">
                        No se encontraron rutas que coincidan con "{search}"
                    </div>
                </Card>
            ) : (
                <div className="space-y-3">
                    {paginatedRoutes.map((route, index) => {
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
                                            disabled={inFlightDeleteByRouteId[routeId]}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`¿Eliminar ruta "${route.name}"?`)) {
                                                    onDeleteRoute?.(routeId);
                                                }
                                            }}
                                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                                        >
                                            {inFlightDeleteByRouteId[routeId] ? (
                                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                '🗑️ Eliminar'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center pt-2 mt-4 px-1">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4"
                    >
                        Anterior
                    </Button>
                    <span className="text-xs font-semibold text-gray-500">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4"
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    );
};
