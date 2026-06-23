import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import { keyframes } from '@mui/system';
const pulseAnimation = keyframes `
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;
const spinAnimation = keyframes `
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
export default function LoadingScreen({ message = 'Loading...', subMessage, fullScreen = true, minHeight = '100vh', showLogo = true, }) {
    return (_jsx(Fade, { in: true, timeout: 400, children: _jsxs(Box, { sx: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: fullScreen ? '100vh' : minHeight,
                width: '100%',
                bgcolor: 'background.default',
                position: fullScreen ? 'fixed' : 'relative',
                top: fullScreen ? 0 : undefined,
                left: fullScreen ? 0 : undefined,
                right: fullScreen ? 0 : undefined,
                bottom: fullScreen ? 0 : undefined,
                zIndex: fullScreen ? 9999 : undefined,
            }, children: [showLogo && (_jsx(Box, { sx: {
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        animation: `${pulseAnimation} 2s ease-in-out infinite`,
                        boxShadow: (theme) => theme.shadows[4],
                    }, children: _jsx(Typography, { sx: {
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            letterSpacing: '0.05em',
                        }, children: "GFF" }) })), _jsxs(Box, { sx: { position: 'relative', mb: 2 }, children: [_jsx(CircularProgress, { size: 48, thickness: 3, sx: {
                                color: 'primary.main',
                                animation: `${spinAnimation} 1s linear infinite`,
                            } }), _jsx(Box, { sx: {
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }, children: _jsx(Box, { sx: {
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: 'secondary.main',
                                } }) })] }), _jsx(Typography, { variant: "h6", fontWeight: 500, color: "text.primary", align: "center", gutterBottom: true, children: message }), subMessage && (_jsx(Typography, { variant: "body2", color: "text.secondary", align: "center", sx: { maxWidth: 300 }, children: subMessage })), _jsx(Box, { sx: { display: 'flex', gap: 0.5, mt: 2 }, children: [0, 1, 2].map((i) => (_jsx(Box, { sx: {
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            animation: `${pulseAnimation} 1.4s ease-in-out ${i * 0.2}s infinite`,
                        } }, i))) }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 3, opacity: 0.6 }, children: "GFF ERP Enterprise" })] }) }));
}
