'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDevicesStore } from '@/store/useDevicesStore';
import { useRoutesStore } from '@/store/useRoutesStore';
import { devicesService } from '@/services/devices.service';
import { routesService } from '@/services/routes.service';
import { useDevicesWebSocket } from '@/hooks/useDevicesWebSocket';

// Dynamic imports to avoid SSR issues
const LiveDeviceMap = dynamic(
  () => import('@/components/live/LiveDeviceMap').then((mod) => ({ default: mod.LiveDeviceMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando mapa en tiempo real...</p>
        </div>
      </div>
    )
  }
);

const DeviceList = dynamic(
  () => import('@/components/dashboard/DeviceList').then((mod) => ({ default: mod.DeviceList })),
  { ssr: false }
);

const ControlPanel = dynamic(
  () => import('@/components/dashboard/ControlPanel').then((mod) => ({ default: mod.ControlPanel })),
  { ssr: false }
);

// Socket hook with dynamic import
const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    import('@/hooks/useSocket').then(({ useSocket }) => {
      // Socket will be initialized
    });
  }, []);

  return <>{children}</>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading: authLoading, initAuth, logout, user } = useAuthStore();
  const { setDevices, setLoading: setDevicesLoading } = useDevicesStore();
  const { setRoutes, setLoading: setRoutesLoading } = useRoutesStore();

  const [showMap, setShowMap] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Connect to WebSocket for live updates on dashboard
  useDevicesWebSocket({ autoConnect: isAuthenticated });

  useEffect(() => {
    setMounted(true);
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, authLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!mounted || !isAuthenticated) return;

      try {
        setDevicesLoading(true);
        setRoutesLoading(true);

        const [devices, routes] = await Promise.all([
          devicesService.getDevices(),
          routesService.getRoutes(),
        ]);

        setDevices(devices);
        setRoutes(routes);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setDevicesLoading(false);
        setRoutesLoading(false);
        setIsInitializing(false);
      }
    };

    loadData();
  }, [mounted, isAuthenticated, setDevices, setRoutes, setDevicesLoading, setRoutesLoading]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted || authLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl mb-6 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-white text-xl font-semibold">Cargando GPS Platform...</p>
          <p className="text-white/80 text-sm mt-2">Preparando tu dashboard</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Modern Header with Gradient */}
        <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    GPS Platform
                  </h1>
                  <p className="text-sm text-gray-600">
                    Control en tiempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user && (
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name || user.id}</span>
                  </div>
                )}

                <button
                  onClick={() => router.push('/routes')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Rutas
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Control Panel */}
            <ControlPanel />

            {/* Map Section with Toggle */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Mapa en Tiempo Real</h2>
                    <p className="text-sm text-gray-600">Visualización de dispositivos y rutas</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                >
                  {showMap ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Ocultar Mapa
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Mostrar Mapa
                    </>
                  )}
                </button>
              </div>

              {showMap && (
                <div className="h-[600px]">
                  <LiveDeviceMap className="h-full w-full" />
                </div>
              )}
            </div>

            {/* Device List */}
            <DeviceList />
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}
