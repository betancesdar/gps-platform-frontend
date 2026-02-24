'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useGeocodeAutocomplete } from '@/hooks/useGeocodeAutocomplete';
import { geocodeService } from '@/services/geocode.service';
import { GeoSuggestion } from '@/types/geocode';

// Dynamic import for the Map component
const RouteBuilderMap = dynamic(
    () => import('./RouteBuilderMap').then((mod) => mod.RouteBuilderMap),
    { ssr: false, loading: () => <Skeleton height={400} /> }
);

interface AddressRouteBuilderProps {
    onRouteCreated: (routeId: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

interface LocationInput {
    type: 'address' | 'coords';
    value: string | { lat: number; lng: number };
    label?: string;
    waitSeconds?: number;
}

// --- Sub-Components ---

const LocationInputRow = ({
    label,
    field,
    onChange,
    onActivate,
    isActive,
    inputRef,
    onRemove
}: {
    label: string;
    field: LocationInput;
    onChange: (val: LocationInput) => void;
    onActivate: () => void;
    isActive: boolean;
    inputRef?: any;
    onRemove?: () => void;
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const query = field.type === 'address' && typeof field.value === 'string' ? field.value : '';
    const { suggestions, isLoading } = useGeocodeAutocomplete(query, 400);

    const handleSelect = (s: GeoSuggestion) => {
        onChange({ ...field, type: 'address', value: s.label, label: s.label });
        setShowSuggestions(false);
    };

    return (
        <div className={`relative p-4 rounded-xl border transition-all duration-200 group ${isActive ? 'border-blue-500 bg-blue-50/50 shadow-md transform scale-[1.01]' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    {label}
                    {field.type === 'coords' && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">COORDS</span>}
                </label>
                {onRemove && (
                    <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1" ref={inputRef}>
                    <input
                        type="text"
                        value={field.type === 'address' ? (field.value as string) : field.label || 'Selected on Map'}
                        onChange={(e) => {
                            onChange({ ...field, type: 'address', value: e.target.value, label: e.target.value });
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        disabled={field.type === 'coords'}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500 shadow-sm"
                        placeholder="Search address or pick on map..."
                    />

                    {field.type === 'coords' && (
                        <button
                            type="button"
                            onClick={() => onChange({ ...field, type: 'address', value: '', label: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Clear
                        </button>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && field.type === 'address' && suggestions.length > 0 && (
                        <div className="absolute z-[2000] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {isLoading && <div className="p-3 text-xs text-gray-500 text-center">Loading suggestions...</div>}
                            {!isLoading && suggestions.map((s, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-3 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-2"
                                    onClick={() => handleSelect(s)}
                                >
                                    <span className="text-gray-400">📍</span>
                                    <span className="text-gray-700">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button
                    type="button"
                    variant={isActive ? 'primary' : 'secondary'}
                    onClick={onActivate}
                    className={`shrink-0 transition-all ${isActive ? 'shadow-blue-500/25 shadow-lg' : ''}`}
                >
                    {isActive ? 'Cancel' : '🗺️ Map'}
                </Button>
            </div>

            {typeof field.waitSeconds !== 'undefined' && (
                <div className="mt-3 flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100 w-fit">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Wait Duration
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={field.waitSeconds}
                        onChange={(e) => onChange({ ...field, waitSeconds: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">sec</span>
                </div>
            )}
        </div>
    );
};

export const AddressRouteBuilder: React.FC<AddressRouteBuilderProps> = ({
    onRouteCreated,
    onCancel,
    isLoading = false,
}) => {
    // --- State ---
    const [routeName, setRouteName] = useState('');
    const [origin, setOrigin] = useState<LocationInput>({ type: 'address', value: '' });
    const [destination, setDestination] = useState<LocationInput>({ type: 'address', value: '' });
    const [stops, setStops] = useState<LocationInput[]>([]);
    const [profile, setProfile] = useState<'driving-car' | 'driving-hgv' | 'foot-walking' | 'cycling-regular'>('driving-car');
    const [pointSpacing, setPointSpacing] = useState(20);
    const [waitAtEnd, setWaitAtEnd] = useState(0);
    const [activeField, setActiveField] = useState<'origin' | 'destination' | number | null>(null);
    const [routePreview, setRoutePreview] = useState<any>(null);

    // Workflow State
    const [isCreating, setIsCreating] = useState(false);
    const [createdRouteId, setCreatedRouteId] = useState<string | null>(null);

    const originInputRef = useRef<HTMLInputElement>(null);
    const destInputRef = useRef<HTMLInputElement>(null);

    // --- Helpers ---

    const updateStop = (index: number, updates: Partial<LocationInput>) => {
        const newStops = [...stops];
        newStops[index] = { ...newStops[index], ...updates };
        setStops(newStops);
    };

    const addStop = () => setStops([...stops, { type: 'address', value: '', waitSeconds: 60 }]);
    const removeStop = (index: number) => setStops(stops.filter((_, i) => i !== index));

    const handleMapClick = (lat: number, lng: number) => {
        if (activeField === 'origin') {
            setOrigin({ type: 'coords', value: { lat, lng }, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } else if (activeField === 'destination') {
            setDestination({ type: 'coords', value: { lat, lng }, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } else if (typeof activeField === 'number') {
            updateStop(activeField, { type: 'coords', value: { lat, lng }, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
        setActiveField(null);
    };

    // --- Post-Creation Workflow ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const finalName = routeName.trim() || `Route: ${origin.label || 'Origin'} -> ${destination.label || 'Destination'}`;

            const formatStop = (input: LocationInput, wait: number) => {
                const isCoords = input.type === 'coords';
                let lat: number | undefined;
                let lng: number | undefined;

                if (isCoords) {
                    if (typeof input.value === 'object' && input.value !== null && 'lat' in input.value) {
                        lat = (input.value as { lat: number, lng: number }).lat;
                        lng = (input.value as { lat: number, lng: number }).lng;
                    } else if (typeof input.value === 'string' && input.value.includes(',')) {
                        const parts = input.value.split(',');
                        lat = parseFloat(parts[0]);
                        lng = parseFloat(parts[1]);
                    }
                }

                return {
                    text: !isCoords ? (input.value as string) : undefined,
                    lat, lng,
                    label: input.label || (isCoords ? 'Manual Location' : input.value as string),
                    waitSeconds: wait
                };
            };

            const payload = {
                name: finalName,
                stops: [
                    formatStop(origin, 0),
                    ...stops.map(s => formatStop(s, s.waitSeconds || 0)),
                    formatStop(destination, waitAtEnd)
                ],
                profile,
                pointSpacingMeters: pointSpacing
            };

            const response = await geocodeService.createRouteWithStops(payload as any);

            if (response.success && response.data) {
                setCreatedRouteId(response.data.routeId);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Failed: ${error.message}`);
            setIsCreating(false);
        }
    };

    if (createdRouteId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-gray-100 min-h-[400px] animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">Route Ready!</h3>
                <p className="text-gray-500 mb-8 text-center max-w-md">Your route has been structured and generated successfully.</p>

                <div className="w-full max-w-sm">
                    <Button
                        onClick={() => onRouteCreated(createdRouteId)}
                        variant="primary"
                        className="w-full justify-center shadow-lg shadow-blue-500/20 py-3"
                    >
                        Return to Routes List
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[650px]">
            {/* Left Column: Form */}
            <div className="flex flex-col h-full overflow-y-auto pr-2 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-full px-0 py-2 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none text-xl font-bold placeholder-gray-300 bg-transparent transition-colors"
                            placeholder="Name your route (optional)"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">A</div>
                            <h4 className="font-semibold text-gray-800">Origin</h4>
                        </div>
                        <LocationInputRow
                            label="Start Location"
                            field={origin}
                            onChange={setOrigin}
                            isActive={activeField === 'origin'}
                            onActivate={() => setActiveField(activeField === 'origin' ? null : 'origin')}
                            inputRef={originInputRef}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">...</div>
                                <h4 className="font-semibold text-gray-800">Stops</h4>
                            </div>
                            <Button type="button" size="sm" variant="secondary" onClick={addStop} className="text-xs">+ Add Stop</Button>
                        </div>

                        <div className="space-y-3 pl-3 border-l-2 border-gray-100 ml-3">
                            {stops.map((stop, index) => (
                                <LocationInputRow
                                    key={index}
                                    label={`Stop ${index + 1}`}
                                    field={stop}
                                    onChange={(val) => updateStop(index, val)}
                                    isActive={activeField === index}
                                    onActivate={() => setActiveField(activeField === index ? null : index)}
                                    onRemove={() => removeStop(index)}
                                />
                            ))}
                            {stops.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No intermediate stops added.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">B</div>
                            <h4 className="font-semibold text-gray-800">Destination</h4>
                        </div>
                        <LocationInputRow
                            label="End Location"
                            field={destination}
                            onChange={setDestination}
                            isActive={activeField === 'destination'}
                            onActivate={() => setActiveField(activeField === 'destination' ? null : 'destination')}
                            inputRef={destInputRef}
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Configuration</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Profile</label>
                                <select value={profile} onChange={(e) => setProfile(e.target.value as any)} className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none">
                                    <option value="driving-car">🚗 Car</option>
                                    <option value="driving-hgv">🚚 Truck</option>
                                    <option value="foot-walking">🚶 Walk</option>
                                    <option value="cycling-regular">🚴 Bike</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Spacing (meters)</label>
                                <input type="number" value={pointSpacing} onChange={(e) => setPointSpacing(Number(e.target.value))} className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3 sticky bottom-0 bg-white py-4 border-t border-gray-100">
                        <Button type="submit" variant="primary" isLoading={isCreating} className="flex-1 shadow-lg shadow-blue-500/20 py-3">
                            {isCreating ? 'Generating Route...' : 'Generate Route'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onCancel} disabled={isCreating}>Cancel</Button>
                    </div>
                </form>
            </div>

            {/* Right Column: Map */}
            <div className="h-full rounded-2xl overflow-hidden border border-gray-200 shadow-lg relative">
                <RouteBuilderMap
                    origin={origin.type === 'coords' ? (origin.value as { lat: number; lng: number }) : undefined}
                    destination={destination.type === 'coords' ? (destination.value as { lat: number; lng: number }) : undefined}
                    stops={stops
                        .map((s, i) => s.type === 'coords'
                            ? { ...(s.value as { lat: number; lng: number }), index: i }
                            : null
                        )
                        .filter((s): s is { lat: number; lng: number; index: number } => s !== null)
                    }
                    routePreview={routePreview}
                    onMapClick={handleMapClick}
                    selectingMode={activeField as any}
                />

                {activeField !== null && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-blue-600/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl z-[1000] animate-bounce flex items-center gap-2 border border-white/20">
                        <span className="animate-pulse">📍</span>
                        Click map to set {typeof activeField === 'number' ? `Stop ${activeField + 1}` : activeField}
                        <button onClick={() => setActiveField(null)} className="ml-2 hover:bg-white/20 rounded-full p-0.5">✕</button>
                    </div>
                )}
            </div>
        </div>
    );
};
