'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CreateRouteRequest, Stop, RoutePoint } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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
    const [formData, setFormData] = useState<CreateRouteRequest>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        points: initialData?.points || [],
        stops: initialData?.stops || [],
        speed: initialData?.speed || 50,
        loop: initialData?.loop || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleGPXUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const gpxContent = event.target?.result as string;
            // Parse GPX (simplified - in production use a proper GPX parser)
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');
            const trackPoints = xmlDoc.getElementsByTagName('trkpt');

            const points: RoutePoint[] = Array.from(trackPoints).map((trkpt, index) => ({
                latitude: parseFloat(trkpt.getAttribute('lat') || '0'),
                longitude: parseFloat(trkpt.getAttribute('lon') || '0'),
                elevation: parseFloat(trkpt.getElementsByTagName('ele')[0]?.textContent || '0'),
                index,
            }));

            setFormData((prev) => ({ ...prev, points }));
        };
        reader.readAsText(file);
    };

    const addStop = () => {
        const newStop: Stop = {
            id: uuidv4(),
            position: {
                latitude: 0,
                longitude: 0,
                timestamp: new Date().toISOString(),
            },
            duration: 60, // 1 minute default
            name: `Stop ${formData.stops.length + 1}`,
        };
        setFormData((prev) => ({
            ...prev,
            stops: [...prev.stops, newStop],
        }));
    };

    const removeStop = (stopId: string) => {
        setFormData((prev) => ({
            ...prev,
            stops: prev.stops.filter((s) => s.id !== stopId),
        }));
    };

    const updateStop = (stopId: string, updates: Partial<Stop>) => {
        setFormData((prev) => ({
            ...prev,
            stops: prev.stops.map((s) =>
                s.id === stopId ? { ...s, ...updates } : s
            ),
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Route Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter route name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter route description"
                        rows={3}
                    />
                </div>
            </div>

            {/* GPX Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload GPX File
                </label>
                <input
                    type="file"
                    accept=".gpx"
                    onChange={handleGPXUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.points.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                        ✓ {formData.points.length} points loaded
                    </p>
                )}
            </div>

            {/* Speed */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Speed (km/h) *
                </label>
                <input
                    type="number"
                    required
                    min="1"
                    max="200"
                    value={formData.speed}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, speed: parseInt(e.target.value) }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Loop */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="loop"
                    checked={formData.loop}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, loop: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="loop" className="text-sm font-medium text-gray-700">
                    Loop route (repeat continuously)
                </label>
            </div>

            {/* Stops */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Stops
                    </label>
                    <Button type="button" variant="secondary" size="sm" onClick={addStop}>
                        + Add Stop
                    </Button>
                </div>

                {formData.stops.length > 0 && (
                    <div className="space-y-3">
                        {formData.stops.map((stop, index) => (
                            <div
                                key={stop.id}
                                className="p-4 border border-gray-200 rounded-lg space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-900">Stop {index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => removeStop(stop.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Latitude
                                        </label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={stop.position.latitude}
                                            onChange={(e) =>
                                                updateStop(stop.id, {
                                                    position: {
                                                        ...stop.position,
                                                        latitude: parseFloat(e.target.value),
                                                    },
                                                })
                                            }
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Longitude
                                        </label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={stop.position.longitude}
                                            onChange={(e) =>
                                                updateStop(stop.id, {
                                                    position: {
                                                        ...stop.position,
                                                        longitude: parseFloat(e.target.value),
                                                    },
                                                })
                                            }
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Duration (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stop.duration}
                                        onChange={(e) =>
                                            updateStop(stop.id, {
                                                duration: parseInt(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading || formData.points.length === 0}
                    className="flex-1"
                >
                    Save Route
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
};
