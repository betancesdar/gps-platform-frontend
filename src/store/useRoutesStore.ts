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
            // Backend execution
            const { routesService } = await import('@/services/routes.service');
            await routesService.deleteRoute(routeId);

            // If OK -> Remove local immediately
            set((state) => ({
                routes: state.routes.filter(r => (r.id || (r as any).routeId) !== routeId)
            }));

            // Reconciliation
            get().fetchRoutes().catch(() => { });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete route:', error);
            const status = error.response?.status ? `[${error.response.status}] ` : '';
            const msg = error.response?.data?.message || error.message || 'Failed to delete route';
            return { success: false, message: `${status}${msg}` };
        } finally {
            get().setInFlightDelete(routeId, false);
        }
    },
}));
