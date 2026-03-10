import axiosInstance from '@/lib/axios';

export interface User {
    id: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    _count?: {
        devices: number;
    };
}

export const usersService = {
    getAllUsers: async (): Promise<User[]> => {
        const response = await axiosInstance.get('/users');
        return response.data.data;
    },

    toggleUserStatus: async (id: string, isActive: boolean): Promise<User> => {
        const response = await axiosInstance.put(`/users/${id}/status`, { isActive });
        return response.data.data;
    }
};
