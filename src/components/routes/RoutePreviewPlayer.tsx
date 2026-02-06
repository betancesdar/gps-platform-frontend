'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Button } from '../ui/Button';
import { RoutePolyline } from '../map/RoutePolyline';
import { useRoutePlayer, PlaybackSpeed } from '@/hooks/useRoutePlayer';
import { Route, RoutePoint } from '@/types';
import { routesService } from '@/services/routes.service';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoutePreviewPlayerProps {
    routeId?: string;
    route?: Route;
}

// Calculate bearing between two points
function calculateBearing(from: RoutePoint, to: RoutePoint): number {
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

// Create car icon with rotation
function createCarIcon(bearing: number) {
    return L.divIcon({
        className: 'custom-car-marker',
        html: `
            <div style="
                width: 30px;
                height: 30px;
                transform: rotate(${bearing}deg);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    font-size: 24px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                ">
                    🚗
                </div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

// Component to handle map fitBounds
function MapController({ route, shouldFit }: { route: Route; shouldFit: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (shouldFit && route.points && route.points.length > 0) {
            const bounds = L.latLngBounds(
                route.points.map((p) => [p.latitude, p.longitude] as [number, number])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [shouldFit, route, map]);

    return null;
}

export const RoutePreviewPlayer: React.FC<RoutePreviewPlayerProps> = ({ routeId, route: initialRoute }) => {
    const [route, setRoute] = useState<Route | null>(initialRoute || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shouldFitBounds, setShouldFitBounds] = useState(true);

    // Load route if only routeId is provided
    useEffect(() => {
        if (routeId && !initialRoute) {
            const loadRoute = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const loadedRoute = await routesService.getRouteById(routeId);
                    setRoute(loadedRoute);
                } catch (err: any) {
                    console.error('Error loading route:', err);
                    setError('Failed to load route');
                } finally {
                    setIsLoading(false);
                }
            };
            loadRoute();
        }
    }, [routeId, initialRoute]);

    // Route player hook
    const player = useRoutePlayer({
        points: route?.points || [],
        onComplete: () => console.log('Playback completed'),
        loop: false,
    });

    // Calculate bearing for current point
    const currentBearing = route?.points && player.currentIndex < route.points.length - 1
        ? calculateBearing(route.points[player.currentIndex], route.points[player.currentIndex + 1])
        : 0;

    // Handle play button - fit bounds when starting
    const handlePlay = () => {
        setShouldFitBounds(true);
        player.play();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading route...</p>
                </div>
            </div>
        );
    }

    if (error || !route) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-600">{error || 'No route available'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {route.name}
                    </h3>
                    <div className="text-sm text-gray-600">
                        {route.points?.length || 0} points
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        variant={player.state === 'playing' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={handlePlay}
                        disabled={player.state === 'playing'}
                    >
                        ▶️ Play
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={player.pause}
                        disabled={player.state !== 'playing'}
                    >
                        ⏸️ Pause
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={player.stop}
                    >
                        ⏹️ Stop
                    </Button>

                    {/* Speed Control */}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-600">Speed:</span>
                        {([0.5, 1, 2, 4] as PlaybackSpeed[]).map((speedOption) => (
                            <button
                                key={speedOption}
                                onClick={() => player.setSpeed(speedOption)}
                                className={`
                                    px-3 py-1 text-sm rounded
                                    ${player.speed === speedOption
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }
                                `}
                            >
                                {speedOption}x
                            </button>
                        ))}
                    </div>

                    {/* Loop Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            onChange={(e) => player.setLoop(e.target.checked)}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-600">Loop</span>
                    </label>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{player.currentIndex + 1} / {route.points?.length || 0} ({player.progress.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${player.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <LeafletMapContainer
                    center={route.points?.[0] ? [route.points[0].latitude, route.points[0].longitude] : [40.7128, -74.0060]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                    />

                    {/* Route Polyline */}
                    <RoutePolyline route={route} color="#3b82f6" weight={4} />

                    {/* Animated Car Marker */}
                    {player.currentPoint && (
                        <Marker
                            position={[player.currentPoint.latitude, player.currentPoint.longitude]}
                            icon={createCarIcon(currentBearing)}
                        />
                    )}

                    {/* Map Controller */}
                    <MapController route={route} shouldFit={shouldFitBounds && player.state === 'playing'} />
                </LeafletMapContainer>
            </div>
        </div>
    );
};
