'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useGeocodeAutocomplete } from '@/hooks/useGeocodeAutocomplete';
import { geocodeService } from '@/services/geocode.service';
import { GeoSuggestion } from '@/types/geocode';

interface AddressRouteBuilderProps {
    onRouteCreated: (routeId: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const AddressRouteBuilder: React.FC<AddressRouteBuilderProps> = ({
    onRouteCreated,
    onCancel,
    isLoading = false,
}) => {
    const [routeName, setRouteName] = useState('');
    const [originText, setOriginText] = useState('');
    const [destinationText, setDestinationText] = useState('');
    const [profile, setProfile] = useState<'driving-car' | 'driving-hgv' | 'foot-walking' | 'cycling-regular'>('driving-car');
    const [pointSpacing, setPointSpacing] = useState(20);
    const [waitAtEnd, setWaitAtEnd] = useState(0);
    const [isCreating, setIsCreating] = useState(false);

    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);

    const originInputRef = useRef<HTMLInputElement>(null);
    const destInputRef = useRef<HTMLInputElement>(null);

    // Autocomplete hooks
    const originAutocomplete = useGeocodeAutocomplete(originText);
    const destAutocomplete = useGeocodeAutocomplete(destinationText);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (originInputRef.current && !originInputRef.current.contains(e.target as Node)) {
                setShowOriginDropdown(false);
            }
            if (destInputRef.current && !destInputRef.current.contains(e.target as Node)) {
                setShowDestDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOriginSelect = (suggestion: GeoSuggestion) => {
        setOriginText(suggestion.label);
        setShowOriginDropdown(false);
    };

    const handleDestSelect = (suggestion: GeoSuggestion) => {
        setDestinationText(suggestion.label);
        setShowDestDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!originText || !destinationText) {
            alert('Please enter both origin and destination addresses');
            return;
        }

        setIsCreating(true);

        try {
            // Generate route name if empty
            const finalName = routeName.trim() || `Route: ${originText.split(',')[0]} → ${destinationText.split(',')[0]}`;

            const response = await geocodeService.createRouteFromAddresses({
                name: finalName,
                originText,
                destinationText,
                profile,
                pointSpacingMeters: pointSpacing,
                waitAtEndSeconds: waitAtEnd,
            });

            if (response.success && response.data) {
                // Show success toast
                const { distanceM, durationS, pointsCount } = response.data;
                const distanceKm = (distanceM / 1000).toFixed(2);
                const durationMin = Math.round(durationS / 60);

                alert(
                    `✓ Route created successfully!\n\n` +
                    `Distance: ${distanceKm} km\n` +
                    `Duration: ${durationMin} min\n` +
                    `Points: ${pointsCount}`
                );

                onRouteCreated(response.data.routeId);
            }
        } catch (error: any) {
            console.error('Error creating route from addresses:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to create route: ${errorMessage}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route Name (optional)
                </label>
                <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-generate from addresses
                </p>
            </div>

            {/* Origin Address with Autocomplete */}
            <div className="relative" ref={originInputRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origin Address *
                </label>
                <input
                    type="text"
                    required
                    value={originText}
                    onChange={(e) => {
                        setOriginText(e.target.value);
                        setShowOriginDropdown(true);
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1411 Franklin Ave, Bronx, NY"
                />

                {/* Autocomplete Dropdown */}
                {showOriginDropdown && originText.length >= 3 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {originAutocomplete.isLoading && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                Loading suggestions...
                            </div>
                        )}
                        {!originAutocomplete.isLoading && originAutocomplete.suggestions.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                No suggestions found
                            </div>
                        )}
                        {originAutocomplete.suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleOriginSelect(suggestion)}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                            >
                                {suggestion.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Destination Address with Autocomplete */}
            <div className="relative" ref={destInputRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Address *
                </label>
                <input
                    type="text"
                    required
                    value={destinationText}
                    onChange={(e) => {
                        setDestinationText(e.target.value);
                        setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Astoria, Queens, NY"
                />

                {/* Autocomplete Dropdown */}
                {showDestDropdown && destinationText.length >= 3 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {destAutocomplete.isLoading && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                Loading suggestions...
                            </div>
                        )}
                        {!destAutocomplete.isLoading && destAutocomplete.suggestions.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                No suggestions found
                            </div>
                        )}
                        {destAutocomplete.suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleDestSelect(suggestion)}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                            >
                                {suggestion.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Travel Profile
                </label>
                <select
                    value={profile}
                    onChange={(e) => setProfile(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="driving-car">🚗 Driving - Car</option>
                    <option value="driving-hgv">🚚 Driving - Heavy Vehicle</option>
                    <option value="foot-walking">🚶 Walking</option>
                    <option value="cycling-regular">🚴 Cycling</option>
                </select>
            </div>

            {/* Point Spacing */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Point Spacing (meters)
                </label>
                <input
                    type="number"
                    min="15"
                    max="30"
                    value={pointSpacing}
                    onChange={(e) => setPointSpacing(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Recommended: 15-30 meters for realistic car movement in NYC
                </p>
            </div>

            {/* Wait at End */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wait at End (seconds)
                </label>
                <input
                    type="number"
                    min="0"
                    value={waitAtEnd}
                    onChange={(e) => setWaitAtEnd(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isCreating || isLoading}
                    disabled={isCreating || isLoading || !originText || !destinationText}
                    className="flex-1"
                >
                    🗺️ Generate Route
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isCreating || isLoading}
                    className="flex-1"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
};
