import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
export default function ConfirmDialog({ open, title, message, variant = 'warning', confirmLabel = 'Confirm', cancelLabel = 'Cancel', confirmColor = 'primary', onConfirm, onCancel, loading = false, maxWidth = 'sm', sx, }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        }
        finally {
            setIsConfirming(false);
        }
    };
    const handleClose = (_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            if (!isConfirming && !loading) {
                onCancel();
            }
            return;
        }
        onCancel();
    };
    const iconConfig = {
        danger: { icon: DeleteIcon, color: '#D32F2F', bgColor: '#FFEBEE' },
        warning: { icon: WarningIcon, color: '#ED6C02', bgColor: '#FFF3E0' },
        info: { icon: InfoIcon, color: '#0288D1', bgColor: '#E3F2FD' },
    };
    const config = iconConfig[variant];
    const IconComponent = config.icon;
    return (_jsxs(Dialog, { open: open, onClose: handleClose, maxWidth: maxWidth, fullWidth: true, PaperProps: {
            sx: {
                borderRadius: 3,
                ...(sx || {}),
            },
        }, children: [_jsxs(DialogTitle, { sx: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: 1,
                }, children: [_jsx(Box, { sx: {
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: config.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(IconComponent, { sx: { color: config.color } }) }), _jsx(Typography, { variant: "h6", component: "span", fontWeight: 600, children: title })] }), _jsx(DialogContent, { children: _jsx(DialogContentText, { component: "div", sx: {
                        color: 'text.primary',
                        mt: 1,
                        typography: 'body1',
                    }, children: message }) }), _jsxs(DialogActions, { sx: { px: 3, pb: 2.5, gap: 1 }, children: [_jsx(Button, { onClick: onCancel, disabled: isConfirming || loading, variant: "outlined", color: "inherit", children: cancelLabel }), _jsx(Button, { onClick: handleConfirm, disabled: isConfirming || loading, variant: "contained", color: confirmColor, startIcon: (isConfirming || loading) ? (_jsx(CircularProgress, { size: 16, color: "inherit" })) : undefined, children: isConfirming || loading ? 'Processing...' : confirmLabel })] })] }));
}
