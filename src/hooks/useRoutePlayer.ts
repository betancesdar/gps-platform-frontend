import { useState, useEffect, useRef } from 'react';
import { RoutePoint } from '@/types';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

export type PlaybackState = 'stopped' | 'playing' | 'paused';

interface UseRoutePlayerOptions {
    points: RoutePoint[];
    onComplete?: () => void;
    loop?: boolean;
}

interface UseRoutePlayerResult {
    state: PlaybackState;
    currentIndex: number;
    currentPoint: RoutePoint | null;
    speed: PlaybackSpeed;
    progress: number; // 0-100

    // Actions
    play: () => void;
    pause: () => void;
    stop: () => void;
    setSpeed: (speed: PlaybackSpeed) => void;
    setLoop: (enabled: boolean) => void;
}

/**
 * Hook to manage route playback animation
 * Optimized for NYC routes with configurable speed and smooth animation
 */
export function useRoutePlayer({
    points,
    onComplete,
    loop = false,
}: UseRoutePlayerOptions): UseRoutePlayerResult {
    const [state, setState] = useState<PlaybackState>('stopped');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [speed, setSpeed] = useState<PlaybackSpeed>(1);
    const [isLooping, setIsLooping] = useState(loop);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate points to skip per tick based on speed
    const getPointsPerTick = (speedMultiplier: PlaybackSpeed): number => {
        switch (speedMultiplier) {
            case 0.5: return 1;
            case 1: return 2;
            case 2: return 5;
            case 4: return 10;
            default: return 2;
        }
    };

    // Tick interval (200-500ms for smooth animation)
    const TICK_INTERVAL = 300;

    const play = () => {
        if (points.length === 0) return;
        setState('playing');
    };

    const pause = () => {
        setState('paused');
    };

    const stop = () => {
        setState('stopped');
        setCurrentIndex(0);
    };

    const updateSpeed = (newSpeed: PlaybackSpeed) => {
        setSpeed(newSpeed);
    };

    const setLoopEnabled = (enabled: boolean) => {
        setIsLooping(enabled);
    };

    // Animation loop
    useEffect(() => {
        if (state !== 'playing' || points.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const pointsPerTick = getPointsPerTick(speed);

        intervalRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = prevIndex + pointsPerTick;

                // Check if we've reached the end
                if (nextIndex >= points.length - 1) {
                    if (isLooping) {
                        return 0; // Loop back to start
                    } else {
                        setState('stopped');
                        if (onComplete) onComplete();
                        return points.length - 1;
                    }
                }

                return nextIndex;
            });
        }, TICK_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [state, speed, points.length, isLooping, onComplete]);

    // Calculate progress
    const progress = points.length > 0 ? (currentIndex / (points.length - 1)) * 100 : 0;

    const currentPoint = points[currentIndex] || null;

    return {
        state,
        currentIndex,
        currentPoint,
        speed,
        progress,
        play,
        pause,
        stop,
        setSpeed: updateSpeed,
        setLoop: setLoopEnabled,
    };
}
