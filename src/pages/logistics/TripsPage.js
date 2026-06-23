import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, IconButton, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, PlayArrow, CheckCircle, Cancel, ViewKanban, ViewList } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
const statusColors = {
    SCHEDULED: '#0288d1',
    IN_PROGRESS: '#ed6c02',
    COMPLETED: '#2e7d32',
    CANCELLED: '#d32f2f',
};
const KANBAN_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TripsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('list');
    const [filters, setFilters] = useState({ type: '', status: '', vehicleId: '', driverId: '', startDate: '', endDate: '', page: 1, limit: 25 });
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['trips', filters],
        queryFn: () => apiService.getTrips(filters),
    });
    const startMutation = useMutation({
        mutationFn: (id) => apiService.startTrip(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
    });
    const completeMutation = useMutation({
        mutationFn: (id) => apiService.completeTrip(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
    });
    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
    }, []);
    const columns = [
        { field: 'tripNumber', headerName: 'Trip #', width: 120, renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 600, fontFamily: "monospace", children: params.value })) },
        { field: 'vehicleCode', headerName: 'Vehicle', width: 120 },
        { field: 'driverName', headerName: 'Driver', width: 140 },
        { field: 'type', headerName: 'Type', width: 100 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", sx: { bgcolor: `${statusColors[params.value]}15`, color: statusColors[params.value], fontWeight: 600, border: `1px solid ${statusColors[params.value]}40` } })),
        },
        { field: 'startDate', headerName: 'Start', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString() },
        { field: 'distance', headerName: 'Dist. (km)', width: 90, type: 'number' },
        { field: 'fuelCost', headerName: 'Fuel', width: 80, type: 'number', valueFormatter: (v) => v ? `$${v.toFixed(2)}` : '-' },
        { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(IconButton, { size: "small", onClick: () => navigate(`/trips/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }), params.row.status === 'SCHEDULED' && (_jsx(IconButton, { size: "small", color: "primary", onClick: () => startMutation.mutate(params.row.id), children: _jsx(PlayArrow, { fontSize: "small" }) })), params.row.status === 'IN_PROGRESS' && (_jsx(IconButton, { size: "small", color: "success", onClick: () => completeMutation.mutate(params.row.id), children: _jsx(CheckCircle, { fontSize: "small" }) })), params.row.status === 'SCHEDULED' && (_jsx(IconButton, { size: "small", color: "error", onClick: () => apiService.cancelTrip(params.row.id), children: _jsx(Cancel, { fontSize: "small" }) }))] })),
        },
    ];
    const kanbanTrips = (status) => (data?.data || []).filter((t) => t.status === status);
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Trips" }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "outlined", size: "small", startIcon: viewMode === 'list' ? _jsx(ViewKanban, {}) : _jsx(ViewList, {}), onClick: () => setViewMode(viewMode === 'list' ? 'kanban' : 'list'), children: viewMode === 'list' ? 'Kanban' : 'List' }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/trips/new'), children: "Create Trip" })] })] }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: filters.type, label: "Type", onChange: (e) => handleFilterChange('type', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "DELIVERY", children: "Delivery" }), _jsx(MenuItem, { value: "PICKUP", children: "Pickup" }), _jsx(MenuItem, { value: "TRANSFER", children: "Transfer" }), _jsx(MenuItem, { value: "SERVICE", children: "Service" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status, label: "Status", onChange: (e) => handleFilterChange('status', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "SCHEDULED", children: "Scheduled" }), _jsx(MenuItem, { value: "IN_PROGRESS", children: "In Progress" }), _jsx(MenuItem, { value: "COMPLETED", children: "Completed" }), _jsx(MenuItem, { value: "CANCELLED", children: "Cancelled" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(DatePicker, { label: "From", value: startDate, onChange: (v) => { setStartDate(v); setFilters((p) => ({ ...p, startDate: v ? v.toISOString() : '' })); }, slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(DatePicker, { label: "To", value: endDate, onChange: (v) => { setEndDate(v); setFilters((p) => ({ ...p, endDate: v ? v.toISOString() : '' })); }, slotProps: { textField: { fullWidth: true, size: 'small' } } }) })] }) }) }), viewMode === 'list' ? (_jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, onPaginationModelChange: (model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize })), disableRowSelectionOnClick: true, density: "compact" })) : (_jsx(Box, { sx: { display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 'calc(100vh - 300px)' }, children: KANBAN_STATUSES.map((status) => (_jsxs(Box, { sx: { minWidth: 280, maxWidth: 320, flex: 1 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 700, color: statusColors[status], children: status }), _jsx(Chip, { label: kanbanTrips(status).length, size: "small", sx: { bgcolor: `${statusColors[status]}15`, color: statusColors[status], fontWeight: 600 } })] }), _jsx(Box, { sx: { bgcolor: 'grey.50', borderRadius: 2, p: 1, minHeight: 400 }, children: kanbanTrips(status).map((trip) => (_jsx(Card, { sx: { mb: 1, cursor: 'pointer', borderLeft: 3, borderColor: statusColors[status], '&:hover': { boxShadow: 2 } }, onClick: () => navigate(`/trips/${trip.id}`), children: _jsxs(CardContent, { sx: { p: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: trip.tripNumber }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [trip.vehicleCode, " | ", trip.driverName] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5, children: [_jsx(Chip, { label: trip.type, size: "small", variant: "outlined", sx: { fontSize: '0.6rem', height: 18 } }), _jsx(Typography, { variant: "caption", color: "success.main", fontWeight: 600 }), "\">$", trip.totalCost?.toFixed(2)] })] }) }, trip.id))) }), "))}"] }, status))) })), ")}"] }), ")}"] }));
};
LocalizationProvider >
;
;
;
export default TripsPage;
