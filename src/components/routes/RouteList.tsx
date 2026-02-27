'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRoutesStore } from '@/store/useRoutesStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Route } from '@/types';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { Search, Map as MapIcon, RefreshCw, Eye, Edit2, Trash2, FileText, MapPin } from 'lucide-react';

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

    if (!Array.isArray(routes) || routes.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-3xl text-center border border-white/60 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4 shadow-inner">
                    <MapIcon className="w-10 h-10 text-blue-500" />
                </div>
                <div className="text-gray-800 text-xl font-bold mb-2 tracking-tight">No hay rutas disponibles</div>
                <div className="text-gray-500 text-sm font-medium">
                    Crea una nueva ruta para comenzar la simulación
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative group">
                <input
                    type="text"
                    placeholder="Buscar ruta por nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-2xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm hover:bg-white text-sm font-medium text-gray-700 placeholder-gray-400"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Search className="w-5 h-5" />
                </span>
            </div>

            {filteredRoutes.length === 0 && search.trim() !== '' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-8 text-gray-500 text-sm rounded-2xl border border-gray-200 border-dashed">
                    No se encontraron rutas que coincidan con <span className="font-bold text-gray-700">"{search}"</span>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {paginatedRoutes.map((route, index) => {
                        // Get route ID safely - backend uses routeId, frontend might use id
                        const routeId = route.id || (route as any).routeId || `route-${index}`;

                        // Get point count safely - backend uses pointCount, frontend uses points.length
                        const pointCount = (route as any).pointCount ?? route.points?.length ?? 0;

                        return (
                            <motion.div
                                key={routeId}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`
                                    cursor-pointer p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5
                                    ${selectedRouteId === routeId
                                        ? 'border-blue-500 bg-white ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/10'
                                        : 'border-white/60 bg-white/80 hover:border-blue-300 backdrop-blur-md shadow-sm'
                                    }
                                `}
                                onClick={() => handleSelect(routeId)}
                            >
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-4">
                                            <h3 className="font-bold text-lg text-gray-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
                                                {route.name || 'Ruta sin nombre'}
                                            </h3>
                                            {route.description && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                    {route.description}
                                                </p>
                                            )}
                                        </div>
                                        {route.loop && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border border-purple-200/50">
                                                <RefreshCw className="w-3 h-3" /> Loop
                                            </span>
                                        )}
                                    </div>

                                    {/* Route Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Puntos</div>
                                            <div className="font-mono font-semibold text-gray-800">
                                                {pointCount}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tipo</div>
                                            <div className="font-medium text-gray-800 flex items-center gap-1.5 text-sm">
                                                {(route as any).sourceType === 'gpx' ? <><FileText className="w-3.5 h-3.5 text-blue-500" /> GPX</> : <><MapPin className="w-3.5 h-3.5 text-emerald-500" /> Puntos</>}
                                            </div>
                                        </div>
                                        {route.speed && (
                                            <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Velocidad</div>
                                                <div className="font-semibold text-blue-600">
                                                    {route.speed} <span className="text-xs font-medium text-blue-400">km/h</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="text-xs font-medium text-gray-400 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        Creada {route.createdAt ? dayjs(route.createdAt).format('DD MMM YYYY') : 'recientemente'}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPreviewRoute?.(route);
                                            }}
                                            className="flex-1 font-semibold flex items-center justify-center gap-1.5 hover:bg-white border-white border text-gray-600 shadow-sm"
                                        >
                                            <Eye className="w-4 h-4" /> Preview
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditRoute?.(route);
                                            }}
                                            className="flex-1 font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-50 border-blue-100 border text-blue-700 shadow-sm"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
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
                                            className="flex-1 font-semibold flex items-center justify-center gap-1.5 text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 disabled:opacity-50 shadow-sm"
                                        >
                                            {inFlightDeleteByRouteId[routeId] ? (
                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <><Trash2 className="w-4 h-4" /> Eliminar</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
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
