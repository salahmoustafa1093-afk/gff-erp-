import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(Box, { sx: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            px: 3,
            py: 8,
        }, children: _jsx(Fade, { in: true, timeout: 500, children: _jsx(Card, { sx: {
                    maxWidth: 520,
                    width: '100%',
                    textAlign: 'center',
                    borderRadius: 3,
                    boxShadow: (theme) => theme.shadows[4],
                }, children: _jsxs(CardContent, { sx: { p: 6 }, children: [_jsxs(Box, { sx: { mb: 3, position: 'relative', display: 'inline-block' }, children: [_jsx(Typography, { variant: "h1", sx: {
                                        fontSize: '8rem',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        opacity: 0.9,
                                    }, children: "404" }), _jsx(Box, { sx: {
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
                                    }, children: _jsx(SearchIcon, { sx: { color: 'white', fontSize: 20 } }) })] }), _jsx(Typography, { variant: "h4", fontWeight: 600, gutterBottom: true, children: "Page Not Found" }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 1, maxWidth: 400, mx: 'auto' }, children: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable." }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: {
                                mb: 4,
                                p: 1.5,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                            }, children: window.location.pathname }), _jsxs(Box, { sx: { display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }, children: [_jsx(Button, { component: Link, to: "/dashboard", variant: "contained", startIcon: _jsx(HomeIcon, {}), size: "large", sx: { borderRadius: 2, px: 3 }, children: "Back to Dashboard" }), _jsx(Button, { onClick: () => window.history.back(), variant: "outlined", startIcon: _jsx(ArrowBackIcon, {}), size: "large", sx: { borderRadius: 2, px: 3 }, children: "Go Back" })] }), _jsxs(Box, { sx: { mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mb: 2, display: 'block' }, children: "Popular pages" }), _jsx(Box, { sx: { display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }, children: [
                                        { label: 'Dashboard', path: '/dashboard' },
                                        { label: 'Sales', path: '/sales/orders' },
                                        { label: 'Inventory', path: '/inventory/products' },
                                        { label: 'Reports', path: '/reports' },
                                        { label: 'Settings', path: '/settings' },
                                    ].map((link) => (_jsx(Button, { component: Link, to: link.path, size: "small", variant: "text", sx: { textTransform: 'none', fontWeight: 500 }, children: link.label }, link.path))) })] })] }) }) }) }));
}
