import { create } from 'zustand';
import { Route } from '@/types';

interface RoutesState {
    routes: Route[];
    selectedRouteId: string | null;
    isLoading: boolean;

    // Actions
    setRoutes: (routes: Route[]) => void;
    addRoute: (route: Route) => void;
    updateRoute: (routeId: string, updates: Partial<Route>) => void;
    removeRoute: (routeId: string) => void;
    setSelectedRoute: (routeId: string | null) => void;
    getRouteById: (routeId: string) => Route | undefined;
    setLoading: (isLoading: boolean) => void;
}

export const useRoutesStore = create<RoutesState>((set, get) => ({
    routes: [],
    selectedRouteId: null,
    isLoading: false,

    setRoutes: (routes) => set({ routes }),

    addRoute: (route) => set((state) => ({
        routes: [...state.routes, route],
    })),

    updateRoute: (routeId, updates) => set((state) => ({
        routes: state.routes.map((route) =>
            route.id === routeId ? { ...route, ...updates } : route
        ),
    })),

    removeRoute: (routeId) => set((state) => ({
        routes: state.routes.filter((route) => route.id !== routeId),
        selectedRouteId: state.selectedRouteId === routeId ? null : state.selectedRouteId,
    })),

    setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),

    getRouteById: (routeId) => {
        return get().routes.find((route) => route.id === routeId);
    },

    setLoading: (isLoading) => set({ isLoading }),
}));
