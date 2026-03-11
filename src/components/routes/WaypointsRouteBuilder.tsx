'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useGeocodeAutocomplete } from '@/hooks/useGeocodeAutocomplete';
import { routesService } from '@/services/routes.service';
import { WaypointInput } from '@/types/routeWaypoints';

// Dynamic import for the Map component
const RouteBuilderMap = dynamic(
    () => import('./RouteBuilderMap').then((mod) => mod.RouteBuilderMap),
    { ssr: false, loading: () => <Skeleton height={400} /> }
);

interface WaypointsRouteBuilderProps {
    onRouteCreated: (routeId: string) => void;
    onCancel: () => void;
    initialData?: any;
}

// Fixed Icons
const Icons = {
    MapPin: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Map: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>,
    Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Clock: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
};

// --- Extracted WaypointRow Component ---
interface WaypointRowProps {
    label: string;
    waypoint: WaypointInput;
    onChange: (w: WaypointInput) => void;
    isActive: boolean;
    onActivate: () => void;
    onRemove?: () => void;
    colorClass: string;
    showLine?: boolean;
}

const WaypointRow: React.FC<WaypointRowProps> = ({
    label,
    waypoint,
    onChange,
    isActive,
    onActivate,
    onRemove,
    colorClass,
    showLine
}) => {
    const { suggestions, isLoading } = useGeocodeAutocomplete(waypoint.mode === 'address' ? waypoint.text || '' : '', 400);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative pl-8">
            {/* Timeline Line */}
            {showLine && (
                <div className="absolute left-3.5 top-8 bottom-[-24px] w-0.5 bg-gray-200 z-0"></div>
            )}

            {/* Timeline Dot */}
            <div className={`absolute left-0 top-3 w-7 h-7 rounded-full border-2 bg-white flex items-center justify-center z-10 ${isActive ? `border-${colorClass} shadow-md scale-110` : 'border-gray-300'}`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-${colorClass}`}></div>
            </div>

            <div className={`relative p-4 rounded-xl border transition-all duration-200 group ${isActive ? `border-${colorClass} bg-blue-50/30 shadow-sm` : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">{label}</span>
                    <div className="flex items-center gap-2">
                        {/* Mode Toggle */}
                        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={() => onChange({ ...waypoint, mode: 'address' })}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${waypoint.mode === 'address' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Icons.Search /> Address
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange({ ...waypoint, mode: 'manual' })}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${waypoint.mode === 'manual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Icons.Map /> Map
                            </button>
                        </div>

                        {onRemove && (
                            <button
                                onClick={onRemove}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1"
                                title="Remove stop"
                            >
                                <Icons.Trash />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1" ref={inputRef}>
                        {waypoint.mode === 'address' ? (
                            <>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Icons.MapPin />
                                </div>
                                <input
                                    type="text"
                                    value={waypoint.text || ''}
                                    onChange={(e) => {
                                        onChange({ ...waypoint, text: e.target.value });
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 placeholder:text-gray-300 shadow-sm"
                                    placeholder="Search location..."
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl max-h-60 overflow-y-auto mt-1 rounded-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                                        {suggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm flex items-center gap-3 border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    onChange({ ...waypoint, text: s.label, lat: s.lat, lng: s.lng });
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <span className="text-gray-400"><Icons.MapPin /></span>
                                                <span className="text-gray-700">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Button
                                type="button"
                                variant={isActive ? 'primary' : 'secondary'}
                                onClick={onActivate}
                                className={`w-full justify-start pl-3 py-2.5 font-medium shadow-sm transition-all text-left ${isActive ? 'ring-2 ring-blue-500/20 border-blue-500' : 'border-gray-200'}`}
                            >
                                <span className={`mr-2 ${isActive ? 'text-white' : 'text-blue-500'}`}><Icons.MapPin /></span>
                                {waypoint.lat ? (
                                    <span className="truncate">{waypoint.text || `${waypoint.lat.toFixed(5)}, ${waypoint.lng?.toFixed(5)}`}</span>
                                ) : (
                                    <span className={isActive ? 'opacity-90' : 'text-gray-400'}>Click on map to pick location...</span>
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 w-[80px]">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-t-lg border border-gray-200 border-b-0">
                            <span className="text-gray-400"><Icons.Clock /></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Wait</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                value={waypoint.dwellSeconds || 0}
                                onChange={(e) => onChange({ ...waypoint, dwellSeconds: parseInt(e.target.value) || 0 })}
                                className="w-full pl-2 pr-6 py-2 bg-white border border-gray-200 rounded-b-lg rounded-tr-lg text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">s</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export const WaypointsRouteBuilder: React.FC<WaypointsRouteBuilderProps> = ({
    onRouteCreated,
    onCancel,
    initialData,
}) => {
    // --- State ---
    const [routeName, setRouteName] = useState('');
    const [profile, setProfile] = useState<'driving-car' | 'driving-hgv' | 'foot-walking' | 'cycling-regular'>('driving-car');
    const [pointSpacing, setPointSpacing] = useState(20);

    // Waypoints state
    const [origin, setOrigin] = useState<WaypointInput>({ kind: 'origin', mode: 'address', text: '', dwellSeconds: 0 });
    const [destination, setDestination] = useState<WaypointInput>({ kind: 'destination', mode: 'address', text: '', dwellSeconds: 0 });
    const [stops, setStops] = useState<WaypointInput[]>([]);

    // UI State
    const [activeField, setActiveField] = useState<'origin' | 'destination' | number | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Post-creation state
    const [createdRouteId, setCreatedRouteId] = useState<string | null>(null);

    // Initialization Effect for Edit Mode
    useEffect(() => {
        if (initialData && initialData.waypoints && initialData.waypoints.length >= 2) {
            setRouteName(initialData.name || '');
            
            const wps = initialData.waypoints;
            
            // First waypoint is origin
            const startWp = wps[0];
            setOrigin({
                kind: 'origin',
                mode: startWp.mode || 'manual',
                text: startWp.text || '',
                lat: startWp.lat,
                lng: startWp.lng,
                dwellSeconds: startWp.dwellSeconds || 0
            });
            
            // Last waypoint is destination
            const endWp = wps[wps.length - 1];
            setDestination({
                kind: 'destination',
                mode: endWp.mode || 'manual',
                text: endWp.text || '',
                lat: endWp.lat,
                lng: endWp.lng,
                dwellSeconds: endWp.dwellSeconds || 0
            });
            
            // Middle waypoints are stops
            if (wps.length > 2) {
                const middleWps = wps.slice(1, wps.length - 1).map((wp: any) => ({
                    kind: 'stop' as const,
                    mode: wp.mode || 'manual',
                    text: wp.text || '',
                    lat: wp.lat,
                    lng: wp.lng,
                    dwellSeconds: wp.dwellSeconds || 30
                }));
                setStops(middleWps);
            }
        }
    }, [initialData]);

    // --- Handlers ---
    const handleMapClick = (lat: number, lng: number) => {
        if (activeField === 'origin') {
            setOrigin({ ...origin, mode: 'manual', lat, lng, text: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } else if (activeField === 'destination') {
            setDestination({ ...destination, mode: 'manual', lat, lng, text: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } else if (typeof activeField === 'number') {
            const newStops = [...stops];
            newStops[activeField] = { ...newStops[activeField], mode: 'manual', lat, lng, text: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
            setStops(newStops);
        }
        setActiveField(null); // Stop selecting after pick
    };

    const addStop = () => {
        setStops([...stops, { kind: 'stop', mode: 'manual', text: '', dwellSeconds: 30 }]);
    };

    const removeStop = (index: number) => {
        setStops(stops.filter((_, i) => i !== index));
    };

    const updateStop = (index: number, updates: Partial<WaypointInput>) => {
        const newStops = [...stops];
        newStops[index] = { ...newStops[index], ...updates };
        setStops(newStops);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            if ((origin.mode === 'address' && !origin.text) || (origin.mode === 'manual' && !origin.lat)) throw new Error('Origin is required');
            if ((destination.mode === 'address' && !destination.text) || (destination.mode === 'manual' && !destination.lat)) throw new Error('Destination is required');

            const finalName = routeName.trim() || `Route: ${origin.text?.split(',')[0] || 'Origin'} ➔ ${destination.text?.split(',')[0] || 'Destination'}`;

            const payload = {
                name: finalName,
                profile,
                pointSpacingMeters: pointSpacing,
                waypoints: [origin, ...stops, destination]
            };

            let response;
            if (initialData?.id) {
                response = await routesService.updateRouteFromWaypoints(initialData.id, payload);
            } else {
                response = await routesService.createRouteFromWaypoints(payload);
            }
            
            setCreatedRouteId(response.routeId);
        } catch (error: any) {
            console.error(error);
            alert(`Error creating route: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    // --- Render View ---
    if (createdRouteId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[400px] animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white ring-1 ring-gray-100">
                    <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Route {initialData?.id ? 'Updated' : 'Created'}!</h3>
                <p className="text-gray-500 mb-8 max-w-xs text-center">Your route formulation has been saved successfully.</p>

                <div className="w-full max-w-sm">
                    <Button onClick={() => onRouteCreated(createdRouteId)} variant="primary" className="w-full py-3 shadow-lg shadow-blue-500/20 text-sm font-bold">
                        Return to List
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[650px] bg-white rounded-xl overflow-hidden">
            {/* Form Side */}
            <div className="flex flex-col h-full overflow-y-auto pr-3 pl-1 pt-1 space-y-5 custom-scrollbar">
                <div>
                    <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        className="w-full text-xl font-bold border-b border-gray-100 py-3 outline-none focus:border-blue-500 placeholder-gray-300 transition-colors bg-transparent"
                        placeholder="Name your route (optional)..."
                    />
                </div>

                <div className="space-y-4">
                    <WaypointRow
                        label="ORIGIN"
                        waypoint={origin}
                        onChange={setOrigin}
                        isActive={activeField === 'origin'}
                        onActivate={() => setActiveField(activeField === 'origin' ? null : 'origin')}
                        colorClass="green-500"
                        showLine={true}
                    />

                    <div className="relative">
                        {stops.map((stop, i) => (
                            <WaypointRow
                                key={i}
                                label={`STOP ${i + 1}`}
                                waypoint={stop}
                                onChange={(val) => updateStop(i, val)}
                                isActive={activeField === i}
                                onActivate={() => setActiveField(activeField === i ? null : i)}
                                onRemove={() => removeStop(i)}
                                colorClass="blue-500"
                                showLine={true}
                            />
                        ))}
                    </div>

                    <div className="pl-8 relative">
                        <div className="absolute left-3.5 top-0 bottom-6 w-0.5 bg-gray-200 z-0"></div>
                        <button
                            type="button"
                            onClick={addStop}
                            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 z-10 relative transition-all bg-blue-50 border-2 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-400 hover:shadow-sm"
                        >
                            <Icons.Plus /> Add Intermediate Stop
                        </button>
                    </div>

                    <WaypointRow
                        label="DESTINATION"
                        waypoint={destination}
                        onChange={setDestination}
                        isActive={activeField === 'destination'}
                        onActivate={() => setActiveField(activeField === 'destination' ? null : 'destination')}
                        colorClass="red-500"
                        showLine={false}
                    />
                </div>

                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 grid grid-cols-2 gap-5 mt-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Vehicle Profile</label>
                        <select
                            value={profile}
                            onChange={(e) => setProfile(e.target.value as any)}
                            className="w-full text-sm bg-white border border-gray-200 rounded-lg p-2.5 focus:border-blue-500 outline-none shadow-sm"
                        >
                            <option value="driving-car">🚗 Car</option>
                            <option value="driving-hgv">🚚 Truck</option>
                            <option value="foot-walking">🚶 Walk</option>
                            <option value="cycling-regular">🚴 Bike</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Point Spacing (m)</label>
                        <input
                            type="number"
                            value={pointSpacing}
                            onChange={(e) => setPointSpacing(Number(e.target.value))}
                            className="w-full text-sm bg-white border border-gray-200 rounded-lg p-2.5 focus:border-blue-500 outline-none shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4 mt-auto sticky bottom-0 bg-white/95 backdrop-blur py-4 border-t border-gray-100 z-20">
                    <Button onClick={handleSubmit} isLoading={isCreating} variant="primary" className="flex-1 shadow-lg shadow-blue-500/20 py-3 text-sm font-bold">
                        {isCreating ? 'Saving...' : initialData?.id ? 'Save Changes' : 'Create Route'}
                    </Button>
                    <Button onClick={onCancel} variant="secondary" className="px-6">
                        Cancel
                    </Button>
                </div>
            </div>

            {/* Map Side */}
            <div className="h-full rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner bg-gray-50">
                <RouteBuilderMap
                    origin={origin.lat ? { lat: origin.lat, lng: origin.lng! } : undefined}
                    destination={destination.lat ? { lat: destination.lat, lng: destination.lng! } : undefined}
                    stops={stops
                        .map((s, i) => s.lat ? { lat: s.lat, lng: s.lng!, index: i } : null)
                        .filter((s): s is { lat: number, lng: number, index: number } => s !== null)
                    }
                    onMapClick={handleMapClick}
                    selectingMode={activeField as any}
                />

                {activeField !== null && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl z-[1000] text-sm font-bold flex items-center gap-3 animate-bounce border border-white/20">
                        <span className="text-xl">📍</span>
                        <span>Click map to set {typeof activeField === 'number' ? `Stop ${activeField + 1}` : activeField.toUpperCase()}</span>
                        <button onClick={() => setActiveField(null)} className="ml-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">✕</button>
                    </div>
                )}
            </div>
        </div>
    );
};
