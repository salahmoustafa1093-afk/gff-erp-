import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import InboxIcon from '@mui/icons-material/Inbox';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
const variantConfig = {
    default: { icon: InboxIcon, color: '#9E9E9E' },
    search: { icon: SearchIcon, color: '#0288D1' },
    folder: { icon: FolderOpenIcon, color: '#F9A825' },
    error: { icon: ErrorOutlineIcon, color: '#D32F2F' },
};
export default function EmptyState({ title = 'No data found', description = 'There are no items to display at the moment.', icon, variant = 'default', actionLabel, action, secondaryActionLabel, secondaryAction, minHeight = '300px', }) {
    const config = variantConfig[variant];
    const IconComponent = icon || config.icon;
    return (_jsx(Fade, { in: true, timeout: 400, children: _jsxs(Box, { sx: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight,
                py: 6,
                px: 3,
                textAlign: 'center',
            }, children: [_jsx(Box, { sx: {
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: `${config.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2.5,
                    }, children: _jsx(IconComponent, { sx: {
                            fontSize: 40,
                            color: config.color,
                            opacity: 0.8,
                        } }) }), _jsx(Typography, { variant: "h6", fontWeight: 600, color: "text.primary", gutterBottom: true, children: title }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { maxWidth: 360, mb: 3 }, children: description }), _jsxs(Box, { sx: { display: 'flex', gap: 1.5 }, children: [action && actionLabel && (_jsx(Button, { variant: "contained", size: "small", onClick: action, children: actionLabel })), secondaryAction && secondaryActionLabel && (_jsx(Button, { variant: "outlined", size: "small", onClick: secondaryAction, children: secondaryActionLabel }))] })] }) }));
}
