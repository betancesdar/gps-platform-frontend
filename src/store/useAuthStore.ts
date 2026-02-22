import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    initAuth: () => void;
}

/**
 * Decode a JWT payload without verifying signature.
 * Used client-side only to check expiration.
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch {
        return null;
    }
}

/**
 * Returns true if the JWT is expired (or cannot be decoded).
 */
function isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    // exp is in seconds; add 30s buffer for clock skew
    return payload.exp < Math.floor(Date.now() / 1000) + 30;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setToken: (token) => set({ token }),

    login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    initAuth: () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                // Check token expiry before restoring session
                if (isTokenExpired(token)) {
                    console.warn('[Auth] Stored token is expired — clearing session');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    set({ isLoading: false });
                    return;
                }

                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ isLoading: false });
        }
    },
}));
