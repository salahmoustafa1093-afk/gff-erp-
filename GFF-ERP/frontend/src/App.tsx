import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

const ModuleRoutes = ({ module }: { module: string }) => {
  const modulePages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
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

  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      }
    >
      <ModulePage />
    </Suspense>
  );
};

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Module Routes - dynamically loaded */}
            <Route path="/sales/*" element={<ModuleRoutes module="sales" />} />
            <Route path="/purchases/*" element={<ModuleRoutes module="purchases" />} />
            <Route path="/inventory/*" element={<ModuleRoutes module="inventory" />} />
            <Route path="/products/*" element={<ModuleRoutes module="products" />} />
            <Route path="/warehouses/*" element={<ModuleRoutes module="warehouses" />} />
            <Route path="/branches/*" element={<ModuleRoutes module="branches" />} />
            <Route path="/customers/*" element={<ModuleRoutes module="customers" />} />
            <Route path="/suppliers/*" element={<ModuleRoutes module="suppliers" />} />
            <Route path="/treasury/*" element={<ModuleRoutes module="treasury" />} />
            <Route path="/banks/*" element={<ModuleRoutes module="banks" />} />
            <Route path="/cashboxes/*" element={<ModuleRoutes module="cashboxes" />} />
            <Route path="/accounting/*" element={<ModuleRoutes module="accounting" />} />
            <Route path="/hr/*" element={<ModuleRoutes module="hr" />} />
            <Route path="/crm/*" element={<ModuleRoutes module="crm" />} />
            <Route path="/logistics/*" element={<ModuleRoutes module="logistics" />} />
            <Route path="/production/*" element={<ModuleRoutes module="production" />} />
            <Route path="/feed-formulation/*" element={<ModuleRoutes module="feed-formulation" />} />
            <Route path="/poultry/*" element={<ModuleRoutes module="poultry" />} />
            <Route path="/chicks/*" element={<ModuleRoutes module="chicks" />} />
            <Route path="/eggs/*" element={<ModuleRoutes module="eggs" />} />
            <Route path="/reports/*" element={<ModuleRoutes module="reports" />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin/*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;