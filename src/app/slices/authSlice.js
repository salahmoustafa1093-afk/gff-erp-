import { createSlice } from '@reduxjs/toolkit';
const initialState = {
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
        setCredentials: (state, action) => {
            const { user, token, refreshToken } = action.payload;
            state.user = user;
            state.token = token;
            if (refreshToken) {
                state.refreshToken = refreshToken;
            }
            state.isAuthenticated = true;
            state.error = null;
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        updateUser: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        setToken: (state, action) => {
            state.token = action.payload;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
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
        addPermission: (state, action) => {
            if (state.user && !state.user.permissions.includes(action.payload)) {
                state.user.permissions.push(action.payload);
            }
        },
        removePermission: (state, action) => {
            if (state.user) {
                state.user.permissions = state.user.permissions.filter((p) => p !== action.payload);
            }
        },
    },
});
export const { setCredentials, setUser, updateUser, setToken, setLoading, setError, clearCredentials, addPermission, removePermission, } = authSlice.actions;
export default authSlice.reducer;
