import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer, { authSlice } from './slices/authSlice';
import appReducer, { appSlice } from './slices/appSlice';
import branchReducer, { branchSlice } from './slices/branchSlice';
const rootReducer = combineReducers({
    auth: authReducer,
    app: appReducer,
    branch: branchReducer,
});
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: [
                'auth/setUser',
                'auth/setCredentials',
                'auth/clearCredentials',
            ],
            ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
        },
        immutableCheck: true,
        thunk: true,
    }),
    devTools: import.meta.env.DEV,
});
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
export { authSlice, appSlice, branchSlice };
export default store;
