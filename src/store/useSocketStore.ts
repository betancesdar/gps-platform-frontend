import { create } from 'zustand';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface SocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    connectionError: string | null;

    // Actions
    setSocket: (socket: WebSocket | null) => void;
    setConnectionStatus: (status: ConnectionStatus, error?: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    socket: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    connectionError: null,

    setSocket: (socket) => set({ socket }),

    setConnectionStatus: (status, error) => set({
        connectionStatus: status,
        isConnected: status === 'connected',
        connectionError: status === 'error' ? (error || 'Unknown error') : null,
    }),
}));
