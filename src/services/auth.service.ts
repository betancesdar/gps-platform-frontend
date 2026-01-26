import axiosInstance from '@/lib/axios';
import { LoginRequest, LoginResponse, ApiResponse, User } from '@/types';

export const authService = {
    /**
     * Admin login (backend real)
     * POST /auth/admin/login
     */
    async login(adminId: string): Promise<LoginResponse> {
        const response = await axiosInstance.post<LoginResponse>(
            '/auth/admin/login',
            { adminId }
        );
        return response.data;
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        // El backend no tiene endpoint de logout específico
        // Solo limpiamos el token localmente
        return Promise.resolve();
    },

    /**
     * Verify token (opcional, si el backend lo implementa)
     */
    async verifyToken(): Promise<boolean> {
        try {
            // Intentar obtener dispositivos como verificación
            await axiosInstance.get('/devices');
            return true;
        } catch (error) {
            return false;
        }
    },
};
