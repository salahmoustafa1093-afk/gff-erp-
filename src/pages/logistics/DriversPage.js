import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, TextField, Grid, useTheme, useMediaQuery, Rating, Avatar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, LocalShipping, Speed, Warning } from '@mui/icons-material';
import { differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
const statusColors = {
    AVAILABLE: 'success',
    ON_TRIP: 'primary',
    OFF_DUTY: 'default',
    SUSPENDED: 'error',
};
const DriversPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 25 });
    const { data, isLoading } = useQuery({
        queryKey: ['drivers', filters],
        queryFn: () => apiService.getDrivers(filters),
    });
    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
    }, []);
    const columns = [
        {
            field: 'name',
            headerName: 'Driver',
            width: 180,
            valueGetter: (_, row) => `${row.firstName} ${row.lastName}`,
            renderCell: (params) => (_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsxs(Avatar, { sx: { width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }, children: [params.row.firstName?.[0], params.row.lastName?.[0]] }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value })] })),
        },
        { field: 'licenseNumber', headerName: 'License #', width: 130 },
        {
            field: 'licenseExpiry',
            headerName: 'License Expiry',
            width: 130,
            renderCell: (params) => {
                const daysLeft = differenceInDays(new Date(params.value), new Date());
                return (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", children: new Date(params.value).toLocaleDateString() }), daysLeft < 30 && (_jsx(Chip, { label: `${daysLeft}d left`, size: "small", color: "error", variant: "outlined", icon: _jsx(Warning, { fontSize: "small" }), sx: { mt: 0.5, fontSize: '0.65rem' } }))] }));
            },
        },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 120,
            renderCell: (params) => (_jsx(Rating, { value: params.value || 0, readOnly: true, size: "small", precision: 0.5 })),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, color: statusColors[params.value] || 'default', size: "small", variant: "outlined" })),
        },
        { field: 'yearsExperience', headerName: 'Exp. (Years)', width: 100, type: 'number' },
        { field: 'branch', headerName: 'Branch', width: 110 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/drivers/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Trips", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/trips?driverId=${params.row.id}`), children: _jsx(LocalShipping, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Performance", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/drivers/${params.row.id}?tab=performance`), children: _jsx(Speed, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Drivers" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/drivers/new'), children: "Add Driver" })] }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", placeholder: "Search name, license...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status, label: "Status", onChange: (e) => handleFilterChange('status', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "AVAILABLE", children: "Available" }), _jsx(MenuItem, { value: "ON_TRIP", children: "On Trip" }), _jsx(MenuItem, { value: "OFF_DUTY", children: "Off Duty" }), _jsx(MenuItem, { value: "SUSPENDED", children: "Suspended" })] })] }) })] }) }) }), _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, onPaginationModelChange: (model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize })), disableRowSelectionOnClick: true, density: "compact" })] }));
};
export default DriversPage;
