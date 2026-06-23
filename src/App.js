import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import LoadingScreen from '@/components/common/LoadingScreen';
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ModuleRoutes = ({ module }) => {
    const modulePages = {
        sales: lazy(() => import('@/pages/NotFoundPage')),
        purchases: lazy(() => import('@/pages/NotFoundPage')),
        inventory: lazy(() => import('@/pages/NotFoundPage')),
        products: lazy(() => import('@/pages/NotFoundPage')),
        warehouses: lazy(() => import('@/pages/NotFoundPage')),
        branches: lazy(() => import('@/pages/NotFoundPage')),
        customers: lazy(() => import('@/pages/NotFoundPage')),
        suppliers: lazy(() => import('@/pages/NotFoundPage')),
        treasury: lazy(() => import('@/pages/NotFoundPage')),
        banks: lazy(() => import('@/pages/NotFoundPage')),
        cashboxes: lazy(() => import('@/pages/NotFoundPage')),
        accounting: lazy(() => import('@/pages/NotFoundPage')),
        hr: lazy(() => import('@/pages/NotFoundPage')),
        crm: lazy(() => import('@/pages/NotFoundPage')),
        logistics: lazy(() => import('@/pages/NotFoundPage')),
        production: lazy(() => import('@/pages/NotFoundPage')),
        'feed-formulation': lazy(() => import('@/pages/NotFoundPage')),
        poultry: lazy(() => import('@/pages/NotFoundPage')),
        chicks: lazy(() => import('@/pages/NotFoundPage')),
        eggs: lazy(() => import('@/pages/NotFoundPage')),
        reports: lazy(() => import('@/pages/NotFoundPage')),
        settings: lazy(() => import('@/pages/settings/SettingsPage')),
    };
    const ModulePage = modulePages[module] || NotFoundPage;
    return (_jsx(Suspense, { fallback: _jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }, children: _jsx(CircularProgress, {}) }), children: _jsx(ModulePage, {}) }));
};
function App() {
    return (_jsx(Suspense, { fallback: _jsx(LoadingScreen, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/sales/*", element: _jsx(ModuleRoutes, { module: "sales" }) }), _jsx(Route, { path: "/purchases/*", element: _jsx(ModuleRoutes, { module: "purchases" }) }), _jsx(Route, { path: "/inventory/*", element: _jsx(ModuleRoutes, { module: "inventory" }) }), _jsx(Route, { path: "/products/*", element: _jsx(ModuleRoutes, { module: "products" }) }), _jsx(Route, { path: "/warehouses/*", element: _jsx(ModuleRoutes, { module: "warehouses" }) }), _jsx(Route, { path: "/branches/*", element: _jsx(ModuleRoutes, { module: "branches" }) }), _jsx(Route, { path: "/customers/*", element: _jsx(ModuleRoutes, { module: "customers" }) }), _jsx(Route, { path: "/suppliers/*", element: _jsx(ModuleRoutes, { module: "suppliers" }) }), _jsx(Route, { path: "/treasury/*", element: _jsx(ModuleRoutes, { module: "treasury" }) }), _jsx(Route, { path: "/banks/*", element: _jsx(ModuleRoutes, { module: "banks" }) }), _jsx(Route, { path: "/cashboxes/*", element: _jsx(ModuleRoutes, { module: "cashboxes" }) }), _jsx(Route, { path: "/accounting/*", element: _jsx(ModuleRoutes, { module: "accounting" }) }), _jsx(Route, { path: "/hr/*", element: _jsx(ModuleRoutes, { module: "hr" }) }), _jsx(Route, { path: "/crm/*", element: _jsx(ModuleRoutes, { module: "crm" }) }), _jsx(Route, { path: "/logistics/*", element: _jsx(ModuleRoutes, { module: "logistics" }) }), _jsx(Route, { path: "/production/*", element: _jsx(ModuleRoutes, { module: "production" }) }), _jsx(Route, { path: "/feed-formulation/*", element: _jsx(ModuleRoutes, { module: "feed-formulation" }) }), _jsx(Route, { path: "/poultry/*", element: _jsx(ModuleRoutes, { module: "poultry" }) }), _jsx(Route, { path: "/chicks/*", element: _jsx(ModuleRoutes, { module: "chicks" }) }), _jsx(Route, { path: "/eggs/*", element: _jsx(ModuleRoutes, { module: "eggs" }) }), _jsx(Route, { path: "/reports/*", element: _jsx(ModuleRoutes, { module: "reports" }) }), _jsx(Route, { path: "/settings/*", element: _jsx(SettingsPage, {}) })] }) }), _jsx(Route, { element: _jsx(ProtectedRoute, { requiredRoles: ['ADMIN', 'SUPER_ADMIN'] }), children: _jsx(Route, { element: _jsx(MainLayout, {}), children: _jsx(Route, { path: "/admin/*", element: _jsx(NotFoundPage, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }));
}
export default App;
