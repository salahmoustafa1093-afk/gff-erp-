import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 3,
        py: 8,
      }}
    >
      <Fade in timeout={500}>
        <Card
          sx={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: (theme) => theme.shadows[4],
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {/* 404 Illustration */}
            <Box sx={{ mb: 3, position: 'relative', display: 'inline-block' }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: '8rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  opacity: 0.9,
                }}
              >
                404
              </Typography>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '15%',
                  right: '-10%',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 2s infinite',
                }}
              >
                <SearchIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
            </Box>

            <Typography variant="h4" fontWeight={600} gutterBottom>
              Page Not Found
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 1, maxWidth: 400, mx: 'auto' }}>
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 4,
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {window.location.pathname}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/dashboard"
                variant="contained"
                startIcon={<HomeIcon />}
                size="large"
                sx={{ borderRadius: 2, px: 3 }}
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                size="large"
                sx={{ borderRadius: 2, px: 3 }}
              >
                Go Back
              </Button>
            </Box>

            {/* Quick Links */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Popular pages
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: 'Dashboard', path: '/dashboard' },
                  { label: 'Sales', path: '/sales/orders' },
                  { label: 'Inventory', path: '/inventory/products' },
                  { label: 'Reports', path: '/reports' },
                  { label: 'Settings', path: '/settings' },
                ].map((link) => (
                  <Button
                    key={link.path}
                    component={Link}
                    to={link.path}
                    size="small"
                    variant="text"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}