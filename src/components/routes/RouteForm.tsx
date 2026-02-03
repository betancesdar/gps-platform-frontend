'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CreateRouteRequest, RoutePointDto } from '@/types';

interface RouteFormProps {
    onSubmit: (data: CreateRouteRequest) => void;
    onCancel: () => void;
    initialData?: Partial<CreateRouteRequest>;
    isLoading?: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [points, setPoints] = useState<RoutePointDto[]>(initialData?.points || []);
    const [manualPoint, setManualPoint] = useState({ latitude: '', longitude: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (points.length < 2) {
            alert('Necesitas al menos 2 puntos para crear una ruta');
            return;
        }

        onSubmit({
            name,
            points,
            metadata: {},
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
                    setPoints(parsedPoints);
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

    const addManualPoint = () => {
        const lat = parseFloat(manualPoint.latitude);
        const lng = parseFloat(manualPoint.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            alert('Por favor ingresa coordenadas válidas');
            return;
        }

        const newPoint: RoutePointDto = {
            latitude: lat,
            longitude: lng,
            index: points.length,
        };

        setPoints([...points, newPoint]);
        setManualPoint({ latitude: '', longitude: '' });
    };

    const removePoint = (index: number) => {
        const newPoints = points.filter((_, i) => i !== index).map((p, i) => ({ ...p, index: i }));
        setPoints(newPoints);
    };

    return (
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

            {/* GPX Upload */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    📁 Cargar archivo GPX
                </label>
                <input
                    type="file"
                    accept=".gpx"
                    onChange={handleGPXUpload}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Sube un archivo GPX para importar los puntos de la ruta automáticamente
                </p>
            </div>

            {/* OR Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o añade puntos manualmente</span>
                </div>
            </div>

            {/* Manual Point Entry */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Añadir punto manualmente
                </label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        step="0.000001"
                        placeholder="Latitud"
                        value={manualPoint.latitude}
                        onChange={(e) => setManualPoint({ ...manualPoint, latitude: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="number"
                        step="0.000001"
                        placeholder="Longitud"
                        value={manualPoint.longitude}
                        onChange={(e) => setManualPoint({ ...manualPoint, longitude: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addManualPoint}>
                        + Añadir
                    </Button>
                </div>
            </div>

            {/* Points Preview */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                        Puntos de la ruta ({points.length})
                    </label>
                    {points.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setPoints([])}
                            className="text-xs text-red-600 hover:text-red-700"
                        >
                            Limpiar todos
                        </button>
                    )}
                </div>

                {points.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Latitud</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Longitud</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {points.slice(0, 20).map((point, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                                        <td className="px-3 py-2 text-gray-900">{point.latitude.toFixed(6)}</td>
                                        <td className="px-3 py-2 text-gray-900">{point.longitude.toFixed(6)}</td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removePoint(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {points.length > 20 && (
                            <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-50">
                                ... y {points.length - 20} puntos más
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        No hay puntos. Sube un archivo GPX o añade puntos manualmente.
                    </div>
                )}
            </div>

            {/* Validation Message */}
            {points.length > 0 && points.length < 2 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    ⚠️ Necesitas al menos 2 puntos para crear una ruta válida
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading || !name || points.length < 2}
                    className="flex-1"
                >
                    💾 Guardar Ruta
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
};
