import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
export default function PageHeader({ title, subtitle, breadcrumbs = [], onBack, onAdd, onExport, onPrint, onRefresh, addButtonLabel = 'Add New', exportButtonLabel = 'Export', hideAddButton = false, hideExportButton = false, hidePrintButton = false, hideRefreshButton = false, additionalActions, }) {
    const navigate = useNavigate();
    return (_jsxs(Box, { sx: { mb: 3 }, children: [breadcrumbs.length > 0 && (_jsxs(Breadcrumbs, { sx: { mb: 1 }, separator: "\u203A", "aria-label": "breadcrumb", children: [_jsx(Link, { underline: "hover", color: "inherit", sx: { cursor: 'pointer' }, onClick: () => navigate('/dashboard'), children: "Dashboard" }), breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return isLast || !crumb.path ? (_jsx(Typography, { color: "text.primary", fontWeight: 500, children: crumb.label }, index)) : (_jsx(Link, { underline: "hover", color: "inherit", sx: { cursor: 'pointer' }, onClick: () => crumb.path && navigate(crumb.path), children: crumb.label }, index));
                    })] })), _jsxs(Box, { sx: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1.5 }, children: [onBack && (_jsx(Tooltip, { title: "Go back", children: _jsx(IconButton, { onClick: onBack, size: "small", sx: { mr: 0.5 }, children: _jsx(ArrowBackIcon, {}) }) })), _jsxs(Box, { children: [_jsx(Typography, { variant: "h4", component: "h1", fontWeight: 600, gutterBottom: false, children: title }), subtitle && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: subtitle }))] })] }), _jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: [!hideRefreshButton && onRefresh && (_jsx(Tooltip, { title: "Refresh", children: _jsx(IconButton, { onClick: onRefresh, size: "small", color: "primary", children: _jsx(RefreshIcon, {}) }) })), !hidePrintButton && onPrint && (_jsx(Tooltip, { title: "Print", children: _jsx(IconButton, { onClick: onPrint, size: "small", color: "primary", children: _jsx(PrintIcon, {}) }) })), !hideExportButton && onExport && (_jsx(Button, { variant: "outlined", startIcon: _jsx(FileDownloadIcon, {}), onClick: onExport, size: "small", children: exportButtonLabel })), !hideAddButton && onAdd && (_jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: onAdd, size: "small", children: addButtonLabel })), additionalActions] })] })] }));
}
