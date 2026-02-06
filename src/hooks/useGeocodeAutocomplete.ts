import { useState, useEffect, useRef } from 'react';
import { GeoSuggestion } from '@/types/geocode';
import { geocodeService } from '@/services/geocode.service';

interface UseGeocodeAutocompleteResult {
    suggestions: GeoSuggestion[];
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook for geocoding autocomplete with debounce and abort control
 * @param inputValue - The search query
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns suggestions array, loading state, and error
 */
export function useGeocodeAutocomplete(
    inputValue: string,
    debounceMs: number = 300
): UseGeocodeAutocompleteResult {
    const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Reset if input is too short
        if (!inputValue || inputValue.length < 3) {
            setSuggestions([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        // Set loading state
        setIsLoading(true);
        setError(null);

        // Debounce the search
        timeoutRef.current = setTimeout(async () => {
            try {
                // Create new abort controller for this request
                abortControllerRef.current = new AbortController();

                const results = await geocodeService.getAutocomplete(inputValue);

                // Check if request wasn't aborted
                if (!abortControllerRef.current.signal.aborted) {
                    setSuggestions(results);
                    setIsLoading(false);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Autocomplete error:', err);
                    setError('Failed to load suggestions');
                    setSuggestions([]);
                    setIsLoading(false);
                }
            }
        }, debounceMs);

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [inputValue, debounceMs]);

    return { suggestions, isLoading, error };
}
