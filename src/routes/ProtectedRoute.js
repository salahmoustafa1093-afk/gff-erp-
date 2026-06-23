import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/common/LoadingScreen';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';
export default function ProtectedRoute({ requiredRoles, requiredPermissions, children, }) {
    const location = useLocation();
    const { isAuthenticated, isLoading, hasRole, hasAnyPermission } = useAuth();
    const authError = useAppSelector((state) => state.auth.error);
    // Show loading screen while checking authentication
    if (isLoading) {
        return (_jsx(LoadingScreen, { message: "Authenticating...", subMessage: "Please wait while we verify your credentials", fullScreen: true }));
    }
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        // Store the intended URL for redirect after login
        return _jsx(Navigate, { to: "/login", state: { from: location.pathname }, replace: true });
    }
    // Check required roles
    if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = hasRole(requiredRoles);
        if (!hasRequiredRole) {
            return _jsx(AccessDeniedPage, {});
        }
    }
    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
        const hasRequiredPermission = hasAnyPermission(requiredPermissions);
        if (!hasRequiredPermission) {
            return _jsx(AccessDeniedPage, {});
        }
    }
    // Authenticated and authorized
    return children ? _jsx(_Fragment, { children: children }) : _jsx(Outlet, {});
}
// ============================================
// Access Denied Page
// ============================================
function AccessDeniedPage() {
    return (_jsx(Box, { sx: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            px: 3,
        }, children: _jsxs(Box, { sx: {
                maxWidth: 480,
                textAlign: 'center',
                p: 4,
            }, children: [_jsx(Box, { sx: {
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: 'warning.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                    }, children: _jsx(LockIcon, { sx: { fontSize: 40, color: 'warning.main' } }) }), _jsx(Typography, { variant: "h4", fontWeight: 600, gutterBottom: true, children: "Access Denied" }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 3 }, children: "You don't have permission to access this page. If you believe this is an error, please contact your system administrator." }), _jsx(Button, { component: Link, to: "/dashboard", variant: "contained", startIcon: _jsx(HomeIcon, {}), size: "large", sx: { borderRadius: 2, px: 4 }, children: "Back to Dashboard" })] }) }));
}
export { AccessDeniedPage };
