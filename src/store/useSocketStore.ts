import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    connectionError: string | null;

    // Actions
    setSocket: (socket: Socket | null) => void;
    setConnected: (isConnected: boolean) => void;
    setConnectionError: (error: string | null) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    socket: null,
    isConnected: false,
    connectionError: null,

    setSocket: (socket) => set({ socket }),

    setConnected: (isConnected) => set({ isConnected }),

    setConnectionError: (error) => set({ connectionError: error }),
}));
