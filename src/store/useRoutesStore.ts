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

    // Async complex actions
    fetchRoutes: () => Promise<void>;
    deleteRoute: (routeId: string) => Promise<{ success: boolean; message?: string }>;

    // Single-flight
    inFlightDeleteByRouteId: Record<string, boolean>;
    setInFlightDelete: (routeId: string, isPending: boolean) => void;
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
            (route.id || (route as any).routeId) === routeId ? { ...route, ...updates } : route
        ),
    })),

    removeRoute: (routeId) => set((state) => ({
        routes: state.routes.filter((route) => (route.id || (route as any).routeId) !== routeId),
        selectedRouteId: state.selectedRouteId === routeId ? null : state.selectedRouteId,
    })),

    setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),

    getRouteById: (routeId) => {
        return get().routes.find((route) => (route.id || (route as any).routeId) === routeId);
    },

    setLoading: (isLoading) => set({ isLoading }),

    // Single Flight state
    inFlightDeleteByRouteId: {},
    setInFlightDelete: (routeId, isPending) => set((state) => ({
        inFlightDeleteByRouteId: {
            ...state.inFlightDeleteByRouteId,
            [routeId]: isPending
        }
    })),

    // Advanced Actions
    fetchRoutes: async () => {
        set({ isLoading: true });
        try {
            const { routesService } = await import('@/services/routes.service');
            const data = await routesService.getRoutes();
            set({ routes: data });
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    deleteRoute: async (routeId) => {
        if (get().inFlightDeleteByRouteId[routeId]) {
            return { success: false, message: 'Delete already in progress' };
        }

        get().setInFlightDelete(routeId, true);
        try {
            // Optimistic Store update
            const previousRoutes = get().routes;
            const previousSelected = get().selectedRouteId;
            set((state) => ({
                routes: state.routes.filter(r => (r.id || (r as any).routeId) !== routeId),
                selectedRouteId: state.selectedRouteId === routeId ? null : state.selectedRouteId
            }));

            // Backend execution
            const { routesService } = await import('@/services/routes.service');
            await routesService.deleteRoute(routeId);

            // Reconciliation
            get().fetchRoutes();

            return { success: true };
        } catch (error: any) {
            // Revert changes on fail and reconcile
            get().fetchRoutes();
            const msg = error.response?.data?.message || error.message || 'Failed to delete route';
            return { success: false, message: msg };
        } finally {
            get().setInFlightDelete(routeId, false);
        }
    },
}));
