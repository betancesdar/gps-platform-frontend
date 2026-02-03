'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoutesStore } from '@/store/useRoutesStore';
import { routesService } from '@/services/routes.service';
import { RouteList } from '@/components/routes/RouteList';
import { RouteForm } from '@/components/routes/RouteForm';
import { RouteAssignment } from '@/components/routes/RouteAssignment';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Route, CreateRouteRequest } from '@/types';

export default function RoutesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, initAuth } = useAuthStore();
    const { routes, setRoutes, addRoute, removeRoute, setLoading } = useRoutesStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize auth
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

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
        try {
            await routesService.deleteRoute(routeId);
            removeRoute(routeId);
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Failed to delete route');
        }
    };

    const openEditModal = (route: Route) => {
        setEditingRoute(route);
        setIsEditModalOpen(true);
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Route Management
                            </h1>
                            <p className="text-sm text-gray-600">
                                Create and manage GPS routes
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                            >
                                ← Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Routes List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Available Routes ({routes.length})
                            </h2>
                            <Button
                                variant="primary"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                + Create Route
                            </Button>
                        </div>

                        <RouteList
                            onEditRoute={openEditModal}
                            onDeleteRoute={handleDeleteRoute}
                        />
                    </div>

                    {/* Route Assignment */}
                    <div className="lg:col-span-1">
                        <RouteAssignment />
                    </div>
                </div>
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
                            name: editingRoute.name,
                            points: editingRoute.points,
                            metadata: editingRoute.metadata,
                        }}
                        isLoading={isSaving}
                    />
                )}
            </Modal>
        </div>
    );
}
