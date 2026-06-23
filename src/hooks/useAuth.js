import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCredentials, clearCredentials, setLoading, setError, updateUser, } from '@/app/slices/authSlice';
import { apiService } from '@/app/api';
import { toast } from 'react-toastify';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_DAYS = 30;
const SESSION_DAYS = 1;
export function useAuth() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const isLoading = useAppSelector((state) => state.auth.isLoading);
    // Fetch current user profile
    const { isLoading: isUserLoading } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const storedToken = Cookies.get(TOKEN_KEY);
            if (!storedToken)
                return null;
            try {
                const data = await apiService.get('/auth/me');
                dispatch(setCredentials({ user: data, token: storedToken }));
                return data;
            }
            catch {
                // Token invalid, clear it
                Cookies.remove(TOKEN_KEY);
                Cookies.remove(REFRESH_TOKEN_KEY);
                dispatch(clearCredentials());
                return null;
            }
        },
        enabled: !user && !!Cookies.get(TOKEN_KEY),
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            dispatch(setLoading(true));
            dispatch(setError(null));
            const response = await apiService.post('/auth/login', credentials);
            return response;
        },
        onSuccess: (data, variables) => {
            const { user, token: authToken, refreshToken } = data;
            const expiresInDays = variables.rememberMe ? REMEMBER_ME_DAYS : SESSION_DAYS;
            Cookies.set(TOKEN_KEY, authToken, {
                expires: expiresInDays,
                secure: import.meta.env.PROD,
                sameSite: 'strict',
            });
            Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
                expires: REMEMBER_ME_DAYS,
                secure: import.meta.env.PROD,
                sameSite: 'strict',
            });
            dispatch(setCredentials({ user, token: authToken, refreshToken }));
            toast.success(`Welcome back, ${user.firstName}!`);
            navigate('/dashboard', { replace: true });
        },
        onError: (error) => {
            dispatch(setError(error.message || 'Login failed. Please check your credentials.'));
            toast.error(error.message || 'Login failed. Please check your credentials.');
        },
        onSettled: () => {
            dispatch(setLoading(false));
        },
    });
    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiService.post('/auth/logout', {});
        },
        onSettled: () => {
            Cookies.remove(TOKEN_KEY);
            Cookies.remove(REFRESH_TOKEN_KEY);
            dispatch(clearCredentials());
            queryClient.clear();
            toast.info('You have been logged out');
            navigate('/login', { replace: true });
        },
    });
    // Refresh token mutation
    const refreshTokenMutation = useMutation({
        mutationFn: async () => {
            const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
            if (!refreshToken)
                throw new Error('No refresh token');
            const response = await apiService.post('/auth/refresh', {
                refreshToken,
            });
            return response;
        },
        onSuccess: (data) => {
            const { token: newToken, refreshToken: newRefreshToken } = data;
            Cookies.set(TOKEN_KEY, newToken, {
                expires: SESSION_DAYS,
                secure: import.meta.env.PROD,
                sameSite: 'strict',
            });
            Cookies.set(REFRESH_TOKEN_KEY, newRefreshToken, {
                expires: REMEMBER_ME_DAYS,
                secure: import.meta.env.PROD,
                sameSite: 'strict',
            });
            dispatch(setCredentials({ user: data.user, token: newToken, refreshToken: newRefreshToken }));
        },
        onError: () => {
            Cookies.remove(TOKEN_KEY);
            Cookies.remove(REFRESH_TOKEN_KEY);
            dispatch(clearCredentials());
            navigate('/login');
        },
    });
    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (data) => {
            await apiService.post('/auth/change-password', data);
        },
        onSuccess: () => {
            toast.success('Password changed successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to change password');
        },
    });
    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiService.patch('/auth/profile', data);
            return response;
        },
        onSuccess: (data) => {
            dispatch(updateUser(data));
            toast.success('Profile updated successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });
    // Computed properties
    const userFullName = useMemo(() => {
        if (!user)
            return '';
        return `${user.firstName} ${user.lastName}`.trim();
    }, [user]);
    const userInitials = useMemo(() => {
        if (!user)
            return '';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }, [user]);
    // Permission checks
    const hasPermission = useCallback((permission) => {
        if (!user)
            return false;
        if (user.role === 'SUPER_ADMIN')
            return true;
        return user.permissions.includes(permission);
    }, [user]);
    const hasRole = useCallback((roles) => {
        if (!user)
            return false;
        if (user.role === 'SUPER_ADMIN')
            return true;
        return roles.includes(user.role);
    }, [user]);
    const hasAnyPermission = useCallback((permissions) => {
        if (!user)
            return false;
        if (user.role === 'SUPER_ADMIN')
            return true;
        return permissions.some((p) => user.permissions.includes(p));
    }, [user]);
    // Actions
    const login = useCallback(async (credentials) => {
        await loginMutation.mutateAsync(credentials);
    }, [loginMutation]);
    const logout = useCallback(() => {
        logoutMutation.mutate();
    }, [logoutMutation]);
    const refreshToken = useCallback(() => {
        refreshTokenMutation.mutate();
    }, [refreshTokenMutation]);
    const changePassword = useCallback(async (data) => {
        await changePasswordMutation.mutateAsync(data);
    }, [changePasswordMutation]);
    const updateProfile = useCallback(async (data) => {
        await updateProfileMutation.mutateAsync(data);
    }, [updateProfileMutation]);
    return {
        // State
        user,
        token,
        isAuthenticated,
        isLoading: isLoading || isUserLoading || loginMutation.isPending,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        error: useAppSelector((state) => state.auth.error),
        // Computed
        userFullName,
        userInitials,
        // Permission checks
        hasPermission,
        hasRole,
        hasAnyPermission,
        // Actions
        login,
        logout,
        refreshToken,
        changePassword,
        updateProfile,
    };
}
export default useAuth;
