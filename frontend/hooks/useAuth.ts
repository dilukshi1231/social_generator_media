/**
 * Custom hook for authentication
 * Manages user authentication state and operations
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { User } from '@/types';
import { STORAGE_KEYS, ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (!token) {
            setIsLoading(false);
            setIsAuthenticated(false);
            return;
        }

        try {
            const response = await authAPI.getCurrentUser();
            setUser(response.data);
            setIsAuthenticated(true);
        } catch {
            // Token is invalid
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await authAPI.login({ username, password });
            const { access_token, refresh_token } = response.data;

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

            await checkAuth();
            toast.success('Successfully logged in!');
            router.push(ROUTES.DASHBOARD);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err.response?.data?.detail || 'Login failed');
            throw error;
        }
    };

    const register = async (data: {
        email: string;
        username: string;
        password: string;
        full_name?: string;
    }) => {
        try {
            await authAPI.register(data);
            toast.success('Account created! Please log in.');
            router.push(ROUTES.LOGIN);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err.response?.data?.detail || 'Registration failed');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
        router.push(ROUTES.LOGIN);
    };

    return {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuth,
    };
}
