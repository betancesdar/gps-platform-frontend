import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

// Create axios instance
// baseURL includes /api so service calls use relative paths like /auth/login
export const axiosInstance = axios.create({
    baseURL: `${API_BASE}/api`,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        // Handle network errors
        // Error will be rejected and handled by the caller
        if (!error.response) {
            // Network error occurred
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
