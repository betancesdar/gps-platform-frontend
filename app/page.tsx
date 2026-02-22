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
import { Map as MapIcon, LogOut, Route as RouteIcon, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic imports to avoid SSR issues
const LiveDeviceMap = dynamic(
  () => import('@/components/live/LiveDeviceMap').then((mod) => ({ default: mod.LiveDeviceMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-50/50 backdrop-blur-sm rounded-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Loading Live Map...</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative glass p-8 rounded-3xl shadow-xl border border-white/60">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-800 text-lg font-bold">GPS Platform</p>
            <p className="text-gray-500 text-sm mt-1">Initializing Secure Environment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-[#f3f4f6] relative overflow-x-hidden">
        {/* Abstract Background Shapes */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>
        </div>

        {/* Modern Header (Floating Glass) */}
        <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 mb-8">
          <div className="max-w-7xl mx-auto glass rounded-2xl shadow-lg shadow-gray-200/50 p-3 sm:px-6 flex items-center justify-between border border-white/60">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  GPS Platform
                </h1>
                <p className="text-xs text-blue-600 font-medium tracking-wide uppercase">
                  Enterprise Command Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-gray-50/80 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-gray-700">{user.name}</p>
                    <p className="text-gray-400">Admin</p>
                  </div>
                </div>
              )}

              <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/routes')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
              >
                <RouteIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Routes</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 border border-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Control Panel */}
            <ControlPanel />

            {/* Map & List Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Map Section - Takes up 2/3 on large screens */}
              <motion.div
                layout
                transition={{ type: "spring", bounce: 0.2 }}
                className={`xl:col-span-3 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-white/50 relative bg-white transition-all duration-500 ease-in-out ${showMap ? 'h-[700px]' : 'h-20'}`}
              >
                {/* Map Toggle Button Absolute */}
                <div className="absolute top-4 right-4 z-[500]">
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="glass-card px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-white transition-colors flex items-center gap-2"
                  >
                    <MapIcon className="w-4 h-4" />
                    {showMap ? 'Minimize Map' : 'Maximize Map'}
                  </button>
                </div>

                {showMap ? (
                  <LiveDeviceMap className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-gray-500 font-medium text-sm">Map is running in background...</span>
                  </div>
                )}
              </motion.div>

              {/* Device List - Takes full width below */}
              <div className="xl:col-span-3">
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">Active Fleet</h2>
                </div>

                <DeviceList />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </SocketProvider>
  );
}
