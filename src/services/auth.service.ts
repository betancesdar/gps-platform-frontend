import axiosInstance from '@/lib/axios';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: {
            username: string;
            role: string;
        };
    };
}

export const authService = {
    /**
     * Admin login
     * POST /api/auth/login
     * Body: { username, password }
     */
    async login(username: string, password: string): Promise<LoginResponse> {
        const response = await axiosInstance.post<LoginResponse>(
            '/auth/login',
            { username, password }
        );
        return response.data;
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        return Promise.resolve();
    },

    /**
     * Verify token
     */
    async verifyToken(): Promise<boolean> {
        try {
            await axiosInstance.get('/devices');
            return true;
        } catch (error) {
            return false;
        }
    },
};
