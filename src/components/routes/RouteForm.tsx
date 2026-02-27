'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { AddressRouteBuilder } from './AddressRouteBuilder';
import { WaypointsRouteBuilder } from './WaypointsRouteBuilder';
import { CreateRouteRequest, RoutePointDto } from '@/types';
import { MapPin, Clock, FolderOpen, AlertTriangle, ClipboardList, Save, Wand2, Map as MapIcon, Play, Square, CheckCircle2 } from 'lucide-react';

interface RouteFormProps {
    onSubmit: (data: CreateRouteRequest) => void;
    onCancel: () => void;
    onAddressRouteCreated?: (routeId: string) => void;
    initialData?: Partial<CreateRouteRequest>;
    isLoading?: boolean;
}

interface Waypoint {
    label: string;
    latitude: string;
    longitude: string;
    waitDuration: string; // in minutes
}

const getWaypointLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D...
};

export const RouteForm: React.FC<RouteFormProps> = ({
    onSubmit,
    onCancel,
    onAddressRouteCreated,
    initialData,
    isLoading = false,
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
        // Initialize from existing data if editing
        if (initialData?.points && initialData.points.length > 0) {
            // Only use points with waitDuration > 0 as waypoints
            const existingWaypoints = initialData.points
                .filter(p => (p.waitDuration || 0) > 0)
                .map((p, idx) => ({
                    label: getWaypointLabel(idx),
                    latitude: p.latitude.toString(),
                    longitude: p.longitude.toString(),
                    waitDuration: ((p.waitDuration || 0) / 60).toString(), // convert seconds to minutes
                }));

            return existingWaypoints.length > 0 ? existingWaypoints : [];
        }
        return [];
    });

    const [gpxPoints, setGpxPoints] = useState<RoutePointDto[]>(
        initialData?.points?.filter(p => !p.waitDuration || p.waitDuration === 0) || []
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (waypoints.length < 2) {
            alert('Necesitas al menos 2 waypoints (punto de inicio y fin)');
            return;
        }

        // Convert waypoints to RoutePointDto
        const waypointPoints: RoutePointDto[] = waypoints.map((wp, index) => ({
            latitude: parseFloat(wp.latitude),
            longitude: parseFloat(wp.longitude),
            waitDuration: parseFloat(wp.waitDuration) * 60, // convert minutes to seconds
            index,
        }));

        // Combine waypoints with GPX points if any
        // Waypoints take priority, GPX points fill in the trajectory
        const allPoints = [...waypointPoints];

        onSubmit({
            name,
            points: allPoints,
            metadata: {
                hasWaypoints: true,
                waypointCount: waypoints.length,
            },
        });
    };

    const handleGPXUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const gpxContent = event.target?.result as string;
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');
                const trackPoints = xmlDoc.getElementsByTagName('trkpt');

                const parsedPoints: RoutePointDto[] = Array.from(trackPoints).map((trkpt, index) => ({
                    latitude: parseFloat(trkpt.getAttribute('lat') || '0'),
                    longitude: parseFloat(trkpt.getAttribute('lon') || '0'),
                    elevation: parseFloat(trkpt.getElementsByTagName('ele')[0]?.textContent || '0'),
                    index,
                }));

                if (parsedPoints.length > 0) {
                    setGpxPoints(parsedPoints);
                    alert(`${parsedPoints.length} puntos importados desde GPX`);
                } else {
                    alert('No se encontraron puntos en el archivo GPX');
                }
            } catch (error) {
                console.error('Error parsing GPX:', error);
                alert('Error al parsear el archivo GPX');
            }
        };
        reader.readAsText(file);
    };

    const addWaypoint = () => {
        const newWaypoint: Waypoint = {
            label: getWaypointLabel(waypoints.length),
            latitude: '',
            longitude: '',
            waitDuration: '0',
        };
        setWaypoints([...waypoints, newWaypoint]);
    };

    const updateWaypoint = (index: number, field: keyof Waypoint, value: string) => {
        const updated = [...waypoints];
        updated[index] = { ...updated[index], [field]: value };
        setWaypoints(updated);
    };

    const removeWaypoint = (index: number) => {
        const updated = waypoints.filter((_, i) => i !== index);
        // Re-label waypoints
        const relabeled = updated.map((wp, idx) => ({
            ...wp,
            label: getWaypointLabel(idx),
        }));
        setWaypoints(relabeled);
    };

    const moveWaypoint = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === waypoints.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...waypoints];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

        // Re-label after reordering
        const relabeled = updated.map((wp, idx) => ({
            ...wp,
            label: getWaypointLabel(idx),
        }));
        setWaypoints(relabeled);
    };

    // Manual form content
    const manualFormContent = (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Ruta *
                </label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Ruta Centro - Norte"
                />
            </div>

            {/* Waypoints Section */}
            <div className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/60 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" /> Paradas de la Ruta (Waypoints)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            Define los puntos A, B, C... donde el vehículo se detendrá
                        </p>
                    </div>
                    <Button type="button" variant="primary" size="sm" onClick={addWaypoint}>
                        + Agregar Parada
                    </Button>
                </div>

                {waypoints.length === 0 ? (
                    <div className="text-center py-8 bg-white border-2 border-dashed border-blue-300 rounded-lg">
                        <p className="text-gray-500 mb-3">No hay paradas configuradas</p>
                        <Button type="button" variant="secondary" size="sm" onClick={addWaypoint}>
                            Agregar primera parada
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {waypoints.map((waypoint, index) => {
                            const isFirst = index === 0;
                            const isLast = index === waypoints.length - 1;

                            return (
                                <div
                                    key={index}
                                    className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Waypoint Label Badge */}
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                                                {waypoint.label}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => moveWaypoint(index, 'up')}
                                                    disabled={isFirst}
                                                    className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Mover arriba"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveWaypoint(index, 'down')}
                                                    disabled={isLast}
                                                    className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Mover abajo"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>

                                        {/* Waypoint Form Fields */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {/* Latitude */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Latitud *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    required
                                                    value={waypoint.latitude}
                                                    onChange={(e) => updateWaypoint(index, 'latitude', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ej: -33.4489"
                                                />
                                            </div>

                                            {/* Longitude */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Longitud *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    required
                                                    value={waypoint.longitude}
                                                    onChange={(e) => updateWaypoint(index, 'longitude', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ej: -70.6693"
                                                />
                                            </div>

                                            {/* Wait Duration */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Tiempo Espera (min) *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    required
                                                    value={waypoint.waitDuration}
                                                    onChange={(e) => updateWaypoint(index, 'waitDuration', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ej: 5"
                                                />
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeWaypoint(index)}
                                            className="mt-6 text-red-500 hover:text-red-700 font-bold text-lg"
                                            title="Eliminar parada"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Waypoint Info Footer */}
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold">
                                            {isFirst && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><Play className="w-3.5 h-3.5 fill-current" /> Inicio</span>}
                                            {isLast && !isFirst && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md"><Square className="w-3.5 h-3.5 fill-current" /> Fín</span>}
                                            {!isFirst && !isLast && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md"><MapPin className="w-3.5 h-3.5" /> Intermedio</span>}
                                        </div>
                                        {parseFloat(waypoint.waitDuration) > 0 && (
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                Espera {waypoint.waitDuration} min
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Optional: GPX Import Section */}
            <details className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl group transition-all">
                <summary className="cursor-pointer text-sm font-bold text-gray-600 group-hover:text-gray-900 flex items-center gap-2 select-none">
                    <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" /> Avanzado: Importar trayectoria desde GPX
                </summary>
                <div className="mt-4 space-y-3 pl-6">
                    <input
                        type="file"
                        accept=".gpx"
                        onChange={handleGPXUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition-colors cursor-pointer"
                    />
                    <p className="text-xs font-medium text-gray-400">
                        Importa puntos de trayectoria desde GPX. Los waypoints definidos arriba tendrán prioridad.
                    </p>
                    {gpxPoints.length > 0 && (
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> {gpxPoints.length} puntos importados exitosamente
                        </div>
                    )}
                </div>
            </details>

            {/* Validation Message */}
            {waypoints.length > 0 && waypoints.length < 2 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl text-sm font-semibold text-amber-800 flex items-center gap-2 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Necesitas al menos 2 waypoints (inicio y fin) para crear una ruta válida
                </div>
            )}

            {/* Summary */}
            {waypoints.length >= 2 && (
                <div className="p-5 bg-emerald-50 border border-emerald-200/60 rounded-2xl shadow-sm">
                    <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Resumen de la Ruta
                    </h4>
                    <ul className="text-sm font-medium text-emerald-800 space-y-1.5 opacity-90">
                        <li className="flex gap-2"><span>•</span> <span><strong>{waypoints.length}</strong> paradas configuradas</span></li>
                        <li className="flex gap-2"><span>•</span> <span>Recorrido: {waypoints.map(w => w.label).join(' → ')}</span></li>
                        <li className="flex gap-2"><span>•</span> <span>Tiempo total de espera: <strong>
                            {waypoints.reduce((sum, w) => sum + parseFloat(w.waitDuration || '0'), 0).toFixed(1)} minutos
                        </strong></span></li>
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-5 border-t border-gray-100">
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading || !name || waypoints.length < 2}
                    className="flex-1 font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                    <Save className="w-4 h-4" /> Guardar Ruta
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );

    // Address-based form content
    const addressFormContent = (
        <AddressRouteBuilder
            onRouteCreated={(routeId) => {
                if (onAddressRouteCreated) {
                    onAddressRouteCreated(routeId);
                }
            }}
            onCancel={onCancel}
            isLoading={isLoading}
        />
    );

    // Return tabs wrapper
    return (
        <Tabs
            tabs={[
                {
                    id: 'manual',
                    label: <span className="flex items-center gap-1.5 font-semibold tracking-wide"><MapPin className="w-4 h-4" /> Simple Waypoints</span> as any,
                    content: manualFormContent,
                },
                {
                    id: 'advanced',
                    label: <span className="flex items-center gap-1.5 font-semibold tracking-wide"><Wand2 className="w-4 h-4" /> Advanced Builder</span> as any,
                    content: (
                        <WaypointsRouteBuilder
                            onRouteCreated={(routeId) => {
                                if (onAddressRouteCreated) {
                                    onAddressRouteCreated(routeId);
                                }
                            }}
                            onCancel={onCancel}
                        />
                    ),
                },
                {
                    id: 'address',
                    label: <span className="flex items-center gap-1.5 font-semibold tracking-wide"><MapIcon className="w-4 h-4" /> From Address</span> as any,
                    content: addressFormContent,
                },
            ]}
            defaultTab="manual"
        />
    );
};
