'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoutesStore } from '@/store/useRoutesStore';
import { routesService } from '@/services/routes.service';
import { RouteList } from '@/components/routes/RouteList';
import { RouteForm } from '@/components/routes/RouteForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Route, CreateRouteRequest } from '@/types';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Route as RouteIcon, ArrowLeft, Plus } from 'lucide-react';

const RoutePreviewPlayer = dynamic(
    () => import('@/components/routes/RoutePreviewPlayer').then((mod) => mod.RoutePreviewPlayer),
    { ssr: false }
);

export default function RoutesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, initAuth, user } = useAuthStore();
    const { routes, setRoutes, addRoute, removeRoute, setLoading, inFlightDeleteByRouteId } = useRoutesStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [previewRoute, setPreviewRoute] = useState<Route | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize auth
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'ADMIN' && user?.role !== 'admin') {
                router.push('/');
            }
        }
    }, [isAuthenticated, authLoading, router, user]);

    // Load routes
    useEffect(() => {
        const loadRoutes = async () => {
            if (!isAuthenticated) return;

            try {
                setLoading(true);
                const data = await routesService.getRoutes();
                setRoutes(data);
            } catch (error) {
                console.error('Error loading routes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRoutes();
    }, [isAuthenticated, setRoutes, setLoading]);

    const handleCreateRoute = async (data: CreateRouteRequest) => {
        setIsSaving(true);
        try {
            console.log('Creating route with data:', JSON.stringify(data, null, 2));
            const newRoute = await routesService.createRoute(data);
            addRoute(newRoute);
            setIsCreateModalOpen(false);
        } catch (error: any) {
            console.error('Error creating route:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
            alert(`Error al crear la ruta: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditRoute = async (data: CreateRouteRequest) => {
        if (!editingRoute) return;

        setIsSaving(true);
        try {
            await routesService.updateRoute({
                id: editingRoute.id,
                ...data,
            });

            // Reload routes
            const updatedRoutes = await routesService.getRoutes();
            setRoutes(updatedRoutes);

            setIsEditModalOpen(false);
            setEditingRoute(null);
        } catch (error) {
            console.error('Error updating route:', error);
            alert('Failed to update route');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRoute = async (routeId: string) => {
        const result = await useRoutesStore.getState().deleteRoute(routeId);
        if (!result.success) {
            alert(result.message || 'Failed to delete route');
        }
    };

    const openEditModal = async (route: Route) => {
        try {
            setLoading(true);
            const fullRoute = await routesService.getRouteById(route.id);
            setEditingRoute(fullRoute);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error fetching full route for edit:', error);
            alert('Failed to load route details for editing');
        } finally {
            setLoading(false);
        }
    };

    const handleAddressRouteCreated = async (routeId: string) => {
        try {
            // Fetch the full route with points
            const fullRoute = await routesService.getRouteById(routeId);

            // Add to routes list
            addRoute(fullRoute);

            // Close create modal
            setIsCreateModalOpen(false);

            // Open preview modal
            setPreviewRoute(fullRoute);
            setIsPreviewModalOpen(true);
        } catch (error) {
            console.error('Error loading created route:', error);
            // Still refresh routes list
            const updatedRoutes = await routesService.getRoutes();
            setRoutes(updatedRoutes);
            setIsCreateModalOpen(false);
        }
    };

    const handlePreviewRoute = async (route: Route) => {
        try {
            // Fetch full route with all points if not already loaded
            if (!route.points || route.points.length === 0) {
                const fullRoute = await routesService.getRouteById(route.id);
                setPreviewRoute(fullRoute);
            } else {
                setPreviewRoute(route);
            }
            setIsPreviewModalOpen(true);
        } catch (error) {
            console.error('Error loading route for preview:', error);
            alert('Failed to load route for preview');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6] relative overflow-x-hidden">
            {/* Abstract Background Shapes */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>
            </div>

            {/* Header (Floating Glass) */}
            <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 mb-8">
                <div className="max-w-7xl mx-auto glass rounded-2xl shadow-lg shadow-gray-200/50 p-3 sm:px-6 flex items-center justify-between border border-white/60">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <RouteIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                Route Management
                            </h1>
                            <p className="text-xs text-indigo-600 font-medium tracking-wide uppercase">
                                Create and manage GPS routes
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Available Routes <span className="text-gray-400 text-lg font-normal">({routes.length})</span>
                            </h2>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-shadow hover:shadow-blue-500/40"
                        >
                            <Plus className="w-4 h-4" /> Create Route
                        </Button>
                    </div>

                    <RouteList
                        onEditRoute={openEditModal}
                        onDeleteRoute={handleDeleteRoute}
                        onPreviewRoute={handlePreviewRoute}
                    />
                </motion.div>
            </main>

            {/* Create Route Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Route"
                size="xl"
            >
                <RouteForm
                    onSubmit={handleCreateRoute}
                    onAddressRouteCreated={handleAddressRouteCreated}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isLoading={isSaving}
                />
            </Modal>

            {/* Edit Route Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingRoute(null);
                }}
                title="Edit Route"
                size="xl"
            >
                {editingRoute && (
                    <RouteForm
                        onSubmit={handleEditRoute}
                        onCancel={() => {
                            setIsEditModalOpen(false);
                            setEditingRoute(null);
                        }}
                        initialData={{
                            id: editingRoute.id,
                            name: editingRoute.name,
                            points: editingRoute.points,
                            waypoints: (editingRoute as any).waypoints, // Passed from fetched full route
                            metadata: editingRoute.metadata,
                        }}
                        isLoading={isSaving}
                    />
                )}
            </Modal>

            {/* Route Preview Modal */}
            <Modal
                isOpen={isPreviewModalOpen}
                onClose={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewRoute(null);
                }}
                title="Route Preview"
                size="xl"
            >
                {previewRoute && (
                    <RoutePreviewPlayer route={previewRoute} />
                )}
            </Modal>
        </div>
    );
}
