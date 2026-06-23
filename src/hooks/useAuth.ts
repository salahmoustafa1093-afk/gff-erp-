import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, clearCredentials, setLoading, setError } from '@/app/slices/authSlice';
import type { User } from '@/app/slices/authSlice';
import type { RootState } from '@/app/store';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const email = credentials.email.toLowerCase().trim();
        let userData: User;

        if (email === 'admin@gff.com' && credentials.password === 'admin123') {
          userData = {
            id: '1',
            email: 'admin@gff.com',
            firstName: 'Admin',
            lastName: 'GFF',
            role: 'admin',
            permissions: ['all'],
            isActive: true,
            branchId: 'main',
            department: 'Management',
            phone: '+20 100 000 0000',
            lastLogin: new Date().toISOString(),
          };
        } else if (email === 'salah@gff.com' && credentials.password === 'salah123') {
          userData = {
            id: '2',
            email: 'salah@gff.com',
            firstName: 'Salah',
            lastName: 'Moustafa',
            role: 'admin',
            permissions: ['all'],
            isActive: true,
            branchId: 'main',
            department: 'Management',
            phone: '+20 111 149 4777',
            lastLogin: new Date().toISOString(),
          };
        } else {
          throw new Error('Invalid email or password');
        }

        const token = 'demo-token-' + Date.now();
        localStorage.setItem('auth_token', token);

        dispatch(
          setCredentials({
            user: userData,
            token: token,
          })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        dispatch(setError(message));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('remember_me');
    dispatch(clearCredentials());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };
}
