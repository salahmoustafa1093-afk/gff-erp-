import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import BugReportIcon from '@mui/icons-material/BugReport';
export default class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
        this.handleReset = () => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            this.props.onReset?.();
        };
        this.handleGoHome = () => {
            window.location.href = '/dashboard';
        };
        this.handleReload = () => {
            window.location.reload();
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo: errorInfo.componentStack,
        });
        // Log to error tracking service in production
        if (import.meta.env.PROD) {
            // eslint-disable-next-line no-console
            console.error('Production error - should be sent to error tracking:', {
                error: error.toString(),
                componentStack: errorInfo.componentStack,
                url: window.location.href,
                timestamp: new Date().toISOString(),
            });
        }
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            const isDev = import.meta.env.DEV;
            return (_jsx(Box, { sx: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    p: 3,
                }, children: _jsxs(Paper, { elevation: 2, sx: {
                        maxWidth: 600,
                        width: '100%',
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 3,
                    }, children: [_jsx(Box, { sx: {
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                backgroundColor: 'error.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }, children: _jsx(ErrorOutlineIcon, { sx: { fontSize: 36, color: 'error.main' } }) }), _jsx(Typography, { variant: "h5", fontWeight: 600, gutterBottom: true, children: "Something went wrong" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "We apologize for the inconvenience. An unexpected error has occurred. Our team has been notified and is working to fix the issue." }), isDev && this.state.error && (_jsxs(Paper, { variant: "outlined", sx: {
                                p: 2,
                                mb: 3,
                                textAlign: 'left',
                                backgroundColor: '#FFEBEE',
                                borderColor: '#EF9A9A',
                                borderRadius: 2,
                                maxHeight: 300,
                                overflow: 'auto',
                            }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1, mb: 1 }, children: [_jsx(BugReportIcon, { fontSize: "small", color: "error" }), _jsx(Typography, { variant: "subtitle2", color: "error", fontWeight: 600, children: "Development Error Details" })] }), _jsx(Typography, { variant: "caption", component: "pre", sx: {
                                        fontFamily: 'monospace',
                                        color: '#C62828',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }, children: this.state.error.toString() }), this.state.errorInfo && (_jsx(Typography, { variant: "caption", component: "pre", sx: {
                                        fontFamily: 'monospace',
                                        color: '#D32F2F',
                                        mt: 1,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        opacity: 0.8,
                                    }, children: this.state.errorInfo }))] })), _jsxs(Box, { sx: { display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(RefreshIcon, {}), onClick: this.handleReload, children: "Reload Page" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(HomeIcon, {}), onClick: this.handleGoHome, children: "Go to Dashboard" }), _jsx(Button, { variant: "outlined", color: "secondary", onClick: this.handleReset, children: "Try Again" })] })] }) }));
        }
        return this.props.children;
    }
}
