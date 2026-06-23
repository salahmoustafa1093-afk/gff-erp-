import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  branchId?: string;
  department?: string;
  phone?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      if (refreshToken) {
        state.refreshToken = refreshToken;
      }
      state.isAuthenticated = true;
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    addPermission: (state, action: PayloadAction<string>) => {
      if (state.user && !state.user.permissions.includes(action.payload)) {
        state.user.permissions.push(action.payload);
      }
    },
    removePermission: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.permissions = state.user.permissions.filter((p) => p !== action.payload);
      }
    },
  },
});

export const {
  setCredentials,
  setUser,
  updateUser,
  setToken,
  setLoading,
  setError,
  clearCredentials,
  addPermission,
  removePermission,
} = authSlice.actions;

export default authSlice.reducer;