import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Dialog, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, Edit, Build, LocalGasStation, Clear } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import VehicleForm from './VehicleForm';
const statusColors = {
    ACTIVE: 'success',
    MAINTENANCE: 'warning',
    RETIRED: 'error',
    IN_USE: 'info',
};
const VehiclesPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({ search: '', type: '', status: '', fuelType: '', branch: '', page: 1, limit: 25 });
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['vehicles', filters],
        queryFn: () => apiService.getVehicles(filters),
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => apiService.deleteVehicle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        },
    });
    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
    }, []);
    const handleClear = useCallback(() => {
        setFilters({ search: '', type: '', status: '', fuelType: '', branch: '', page: 1, limit: 25 });
    }, []);
    const columns = [
        { field: 'code', headerName: 'Code', width: 100, renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 600, fontFamily: "monospace", children: params.value })) },
        { field: 'type', headerName: 'Type', width: 100 },
        { field: 'make', headerName: 'Make', width: 100 },
        { field: 'model', headerName: 'Model', width: 120 },
        { field: 'year', headerName: 'Year', width: 80, type: 'number' },
        { field: 'licensePlate', headerName: 'License Plate', width: 120 },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, color: statusColors[params.value] || 'default', size: "small", variant: "outlined" })),
        },
        { field: 'currentMileage', headerName: 'Mileage', width: 100, type: 'number', valueFormatter: (v) => v?.toLocaleString() },
        { field: 'fuelType', headerName: 'Fuel', width: 90 },
        { field: 'branch', headerName: 'Branch', width: 110 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/vehicles/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => { setEditingId(params.row.id); setFormOpen(true); }, children: _jsx(Edit, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Maintenance", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/maintenance?vehicleId=${params.row.id}`), children: _jsx(Build, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Fuel Logs", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/fuel-logs/${params.row.id}`), children: _jsx(LocalGasStation, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Vehicles" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => { setEditingId(null); setFormOpen(true); }, children: "Add Vehicle" })] }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", placeholder: "Search code, plate, make, model...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 2 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: filters.type, label: "Type", onChange: (e) => handleFilterChange('type', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "TRUCK", children: "Truck" }), _jsx(MenuItem, { value: "VAN", children: "Van" }), _jsx(MenuItem, { value: "CAR", children: "Car" }), _jsx(MenuItem, { value: "MOTORCYCLE", children: "Motorcycle" }), _jsx(MenuItem, { value: "BUS", children: "Bus" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 2 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status, label: "Status", onChange: (e) => handleFilterChange('status', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "ACTIVE", children: "Active" }), _jsx(MenuItem, { value: "MAINTENANCE", children: "Maintenance" }), _jsx(MenuItem, { value: "IN_USE", children: "In Use" }), _jsx(MenuItem, { value: "RETIRED", children: "Retired" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 2 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Fuel" }), _jsxs(Select, { value: filters.fuelType, label: "Fuel", onChange: (e) => handleFilterChange('fuelType', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "DIESEL", children: "Diesel" }), _jsx(MenuItem, { value: "PETROL", children: "Petrol" }), _jsx(MenuItem, { value: "ELECTRIC", children: "Electric" }), _jsx(MenuItem, { value: "HYBRID", children: "Hybrid" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 3 }, children: _jsx(Button, { size: "small", onClick: handleClear, startIcon: _jsx(Clear, {}), children: "Clear" }) })] }) }) }), _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, onPaginationModelChange: (model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize })), disableRowSelectionOnClick: true, density: "compact" }), _jsx(Dialog, { open: formOpen, onClose: () => { setFormOpen(false); setEditingId(null); }, maxWidth: "md", fullWidth: true, fullScreen: isMobile, children: _jsx(VehicleForm, { vehicleId: editingId, onClose: () => { setFormOpen(false); setEditingId(null); refetch(); } }) })] }));
};
export default VehiclesPage;
