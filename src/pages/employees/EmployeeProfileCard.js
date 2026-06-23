import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, Box, Avatar, Typography, Chip, Skeleton, Divider, Tooltip, IconButton } from '@mui/material';
import { Email, Phone, Business, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
const statusColors = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    TERMINATED: 'error',
    ON_LEAVE: 'info',
    SUSPENDED: 'warning',
};
const EmployeeProfileCard = ({ employee, loading = false, showActions = true, compact = false, }) => {
    const navigate = useNavigate();
    if (loading) {
        return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, mb: 2, children: [_jsx(Skeleton, { variant: "circular", width: 64, height: 64 }), _jsxs(Box, { flex: 1, children: [_jsx(Skeleton, { width: 150, height: 24 }), _jsx(Skeleton, { width: 100, height: 18 })] })] }), _jsx(Skeleton, { width: "100%", height: 20 }), _jsx(Skeleton, { width: "80%", height: 20 })] }) }));
    }
    if (!employee) {
        return (_jsx(Card, { children: _jsx(CardContent, { children: _jsx(Typography, { color: "text.secondary", align: "center", py: 3, children: "No employee selected" }) }) }));
    }
    return (_jsx(Card, { sx: {
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            '&:hover': showActions ? { boxShadow: 4 } : undefined,
        }, onClick: () => showActions && navigate(`/employees/${employee.id}`), children: _jsxs(CardContent, { sx: { p: compact ? 2 : 3 }, children: [_jsxs(Box, { display: "flex", alignItems: "flex-start", gap: 2, mb: 2, children: [_jsxs(Avatar, { src: employee.photoUrl, alt: `${employee.firstName} ${employee.lastName}`, sx: {
                                width: compact ? 48 : 64,
                                height: compact ? 48 : 64,
                                fontSize: compact ? 20 : 28,
                                bgcolor: 'primary.main',
                            }, children: [employee.firstName?.[0], employee.lastName?.[0]] }), _jsxs(Box, { flex: 1, minWidth: 0, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { minWidth: 0, children: [_jsxs(Typography, { variant: compact ? 'subtitle1' : 'h6', fontWeight: 700, noWrap: true, title: `${employee.firstName} ${employee.lastName}`, children: [employee.firstName, " ", employee.lastName] }), _jsx(Typography, { variant: "body2", color: "text.secondary", noWrap: true, children: employee.jobTitle })] }), showActions && (_jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                                    e.stopPropagation();
                                                    navigate(`/employees/edit/${employee.id}`);
                                                }, children: _jsx(Edit, { fontSize: "small" }) }) }))] }), _jsx(Box, { mt: 0.5, children: _jsx(Chip, { label: employee.status, color: statusColors[employee.status] || 'default', size: "small", variant: "outlined", sx: { fontWeight: 600, fontSize: '0.7rem' } }) })] })] }), !compact && _jsx(Divider, { sx: { my: 1.5 } }), _jsxs(Box, { display: "flex", flexDirection: "column", gap: compact ? 0.5 : 1, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Business, { fontSize: "small", sx: { color: 'text.secondary', fontSize: 16 } }), _jsx(Typography, { variant: "body2", color: "text.secondary", noWrap: true, children: employee.department })] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Email, { fontSize: "small", sx: { color: 'text.secondary', fontSize: 16 } }), _jsx(Typography, { variant: "body2", color: "text.secondary", noWrap: true, title: employee.email, children: employee.email })] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Phone, { fontSize: "small", sx: { color: 'text.secondary', fontSize: 16 } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: employee.phone })] })] }), !compact && (_jsxs(_Fragment, { children: [_jsx(Divider, { sx: { my: 1.5 } }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: employee.employeeNumber }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: employee.branch })] })] }))] }) }));
};
export default EmployeeProfileCard;
