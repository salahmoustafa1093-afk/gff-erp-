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

interface ProtectedRouteProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  children?: React.ReactNode;
}

export default function ProtectedRoute({
  requiredRoles,
  requiredPermissions,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasRole, hasAnyPermission } = useAuth();
  const authError = useAppSelector((state) => state.auth.error);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <LoadingScreen
        message="Authenticating..."
        subMessage="Please wait while we verify your credentials"
        fullScreen
      />
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // Store the intended URL for redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = hasRole(requiredRoles);
    if (!hasRequiredRole) {
      return <AccessDeniedPage />;
    }
  }

  // Check required permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermission = hasAnyPermission(requiredPermissions);
    if (!hasRequiredPermission) {
      return <AccessDeniedPage />;
    }
  }

  // Authenticated and authorized
  return children ? <>{children}</> : <Outlet />;
}

// ============================================
// Access Denied Page
// ============================================

function AccessDeniedPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          textAlign: 'center',
          p: 4,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <LockIcon sx={{ fontSize: 40, color: 'warning.main' }} />
        </Box>

        <Typography variant="h4" fontWeight={600} gutterBottom>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don&apos;t have permission to access this page. If you believe this is an error,
          please contact your system administrator.
        </Typography>

        <Button
          component={Link}
          to="/dashboard"
          variant="contained"
          startIcon={<HomeIcon />}
          size="large"
          sx={{ borderRadius: 2, px: 4 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
}

export { AccessDeniedPage };