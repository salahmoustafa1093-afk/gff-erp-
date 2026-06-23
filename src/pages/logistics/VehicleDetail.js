import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button, IconButton, Chip, Skeleton, Alert, Paper, Divider, Avatar } from '@mui/material';
import { ArrowBack, Edit, Build, LocalGasStation, LocalShipping, Speed, Today } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiService } from '../../services/api';
const statusColors = {
    ACTIVE: '#2e7d32',
    MAINTENANCE: '#ed6c02',
    RETIRED: '#d32f2f',
    IN_USE: '#0288d1',
};
const TabPanel = ({ children, value, index }) => (value === index ? _jsx(Box, { sx: { py: 3 }, children: children }) : null);
const InfoRow = ({ label, value }) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.75, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: value || '-' })] }));
const VehicleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const { data: vehicle, isLoading, error } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: () => apiService.getVehicle(id),
        enabled: !!id,
    });
    const { data: fuelEfficiency } = useQuery({
        queryKey: ['fuel-efficiency', id],
        queryFn: () => apiService.getFuelEfficiency(id),
        enabled: !!id && activeTab === 2,
    });
    const tripColumns = [
        { field: 'tripNumber', headerName: 'Trip #', width: 120 },
        { field: 'driverName', headerName: 'Driver', width: 140 },
        { field: 'type', headerName: 'Type', width: 100 },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", color: params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'default', variant: "outlined" })),
        },
        {
            field: 'startDate',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString(),
        },
        { field: 'distance', headerName: 'Distance (km)', width: 110, type: 'number' },
        { field: 'fuelCost', headerName: 'Fuel Cost', width: 90, type: 'number', valueFormatter: (v) => v ? `$${v.toFixed(2)}` : '-' },
        { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
    ];
    const fuelColumns = [
        { field: 'date', headerName: 'Date', width: 120, valueFormatter: (value) => new Date(value).toLocaleDateString() },
        { field: 'odometer', headerName: 'Odometer', width: 100, type: 'number' },
        { field: 'fuelAmount', headerName: 'Amount (L)', width: 110, type: 'number' },
        { field: 'fuelPrice', headerName: 'Price/L', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        { field: 'station', headerName: 'Station', width: 140 },
    ];
    const maintenanceColumns = [
        { field: 'type', headerName: 'Type', width: 120 },
        { field: 'description', headerName: 'Description', flex: 1 },
        { field: 'cost', headerName: 'Cost', width: 100, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        { field: 'serviceDate', headerName: 'Date', width: 120, valueFormatter: (value) => new Date(value).toLocaleDateString() },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", color: params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'warning', variant: "outlined" })),
        },
        { field: 'serviceProvider', headerName: 'Provider', width: 140 },
    ];
    const mockTrips = vehicle ? [
        { id: '1', tripNumber: 'TRP-001', driverName: 'John Doe', type: 'DELIVERY', status: 'COMPLETED', startDate: new Date().toISOString(), distance: 150, fuelCost: 45, totalCost: 120 },
        { id: '2', tripNumber: 'TRP-002', driverName: 'Jane Smith', type: 'PICKUP', status: 'COMPLETED', startDate: new Date().toISOString(), distance: 80, fuelCost: 25, totalCost: 80 },
    ] : [];
    const mockFuelLogs = vehicle ? [
        { id: '1', date: new Date().toISOString(), odometer: 45200, fuelAmount: 45, fuelPrice: 1.2, totalCost: 54, station: 'Shell Station 1' },
        { id: '2', date: new Date().toISOString(), odometer: 45000, fuelAmount: 38, fuelPrice: 1.15, totalCost: 43.7, station: 'Total Station' },
    ] : [];
    const mockMaintenance = vehicle ? [
        { id: '1', type: 'OIL_CHANGE', description: 'Regular oil change and filter replacement', cost: 85, serviceDate: new Date().toISOString(), status: 'COMPLETED', serviceProvider: 'Auto Service Center' },
        { id: '2', type: 'INSPECTION', description: 'Annual safety inspection', cost: 40, serviceDate: new Date().toISOString(), status: 'COMPLETED', serviceProvider: 'City Inspection Station' },
    ] : [];
    const costData = [
        { category: 'Fuel', amount: 2500 },
        { category: 'Maintenance', amount: 850 },
        { category: 'Insurance', amount: 1200 },
        { category: 'Other', amount: 300 },
    ];
    if (error)
        return _jsx(Alert, { severity: "error", sx: { m: 3 }, children: "Failed to load vehicle details." });
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(IconButton, { onClick: () => navigate('/vehicles'), children: _jsx(ArrowBack, {}) }), _jsx(Typography, { variant: "h4", fontWeight: 700, children: "Vehicle Details" })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(Edit, {}), onClick: () => navigate(`/vehicles/edit/${id}`), children: "Edit" })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: isLoading ? _jsx(Skeleton, { height: 80 }) : vehicle ? (_jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Avatar, { sx: { width: 60, height: 60, bgcolor: statusColors[vehicle.status], fontSize: 28 }, children: _jsx(LocalShipping, {}) }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h5", fontWeight: 700, children: vehicle.code }), _jsxs(Typography, { variant: "body1", color: "text.secondary", children: [vehicle.make, " ", vehicle.model, " (", vehicle.year, ")"] }), _jsxs(Box, { display: "flex", gap: 1, mt: 0.5, children: [_jsx(Chip, { label: vehicle.status, size: "small", sx: { bgcolor: `${statusColors[vehicle.status]}15`, color: statusColors[vehicle.status], fontWeight: 600 } }), _jsx(Chip, { label: vehicle.type, size: "small", variant: "outlined" }), _jsx(Chip, { label: vehicle.fuelType, size: "small", variant: "outlined" })] })] })] }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Box, { display: "flex", flexWrap: "wrap", gap: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "License Plate" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: vehicle.licensePlate })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Mileage" }), _jsxs(Typography, { variant: "body2", fontWeight: 600, children: [vehicle.currentMileage?.toLocaleString(), " km"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Branch" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: vehicle.branch })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Capacity" }), _jsxs(Typography, { variant: "body2", fontWeight: 600, children: [vehicle.capacity, " kg"] })] })] }) })] })) : null }) }), _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: (_, v) => setActiveTab(v), variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { label: "Overview", icon: _jsx(Speed, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Trips", icon: _jsx(LocalShipping, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Fuel Logs", icon: _jsx(LocalGasStation, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Maintenance", icon: _jsx(Build, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Cost Analysis", icon: _jsx(Today, { fontSize: "small" }), iconPosition: "start" })] }), _jsxs(CardContent, { children: [_jsx(TabPanel, { value: activeTab, index: 0, children: isLoading ? _jsx(Skeleton, { height: 200 }) : vehicle && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Vehicle Information" }), _jsx(InfoRow, { label: "Code", value: vehicle.code }), _jsx(InfoRow, { label: "Type", value: vehicle.type }), _jsx(InfoRow, { label: "Make / Model", value: `${vehicle.make} ${vehicle.model}` }), _jsx(InfoRow, { label: "Year", value: vehicle.year }), _jsx(InfoRow, { label: "License Plate", value: vehicle.licensePlate }), _jsx(InfoRow, { label: "Chassis Number", value: vehicle.chassisNumber }), _jsx(InfoRow, { label: "Engine Number", value: vehicle.engineNumber })] }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Specifications" }), _jsx(InfoRow, { label: "Capacity", value: `${vehicle.capacity} kg` }), _jsx(InfoRow, { label: "Fuel Type", value: vehicle.fuelType }), _jsx(InfoRow, { label: "Fuel Capacity", value: `${vehicle.fuelCapacity} L` }), _jsx(InfoRow, { label: "Current Mileage", value: `${vehicle.currentMileage?.toLocaleString()} km` }), _jsx(InfoRow, { label: "Purchase Date", value: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "Purchase Cost", value: vehicle.purchaseCost ? `$${vehicle.purchaseCost.toLocaleString()}` : '-' }), _jsx(InfoRow, { label: "Branch", value: vehicle.branch })] }) }), fuelEfficiency && (_jsx(Grid, { size: { xs: 12 }, children: _jsx(Paper, { variant: "outlined", sx: { p: 2, bgcolor: 'primary.50' }, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 4 }, textAlign: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Avg. Fuel Consumption" }), _jsxs(Typography, { variant: "h5", fontWeight: 700, color: "primary.main", children: [fuelEfficiency.avgConsumption.toFixed(1), " L/100km"] })] }), _jsxs(Grid, { size: { xs: 4 }, textAlign: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Fuel Cost" }), _jsxs(Typography, { variant: "h5", fontWeight: 700, color: "error.main", children: ["$", fuelEfficiency.totalCost.toLocaleString()] })] }), _jsxs(Grid, { size: { xs: 4 }, textAlign: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Distance" }), _jsxs(Typography, { variant: "h5", fontWeight: 700, color: "success.main", children: [fuelEfficiency.totalDistance.toLocaleString(), " km"] })] })] }) }) }))] })) }), _jsx(TabPanel, { value: activeTab, index: 1, children: _jsx(DataGrid, { rows: mockTrips, columns: tripColumns, pageSizeOptions: [10, 25], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true }) }), _jsx(TabPanel, { value: activeTab, index: 2, children: _jsx(DataGrid, { rows: mockFuelLogs, columns: fuelColumns, pageSizeOptions: [10, 25], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true }) }), _jsx(TabPanel, { value: activeTab, index: 3, children: _jsx(DataGrid, { rows: mockMaintenance, columns: maintenanceColumns, pageSizeOptions: [10, 25], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true }) }), _jsx(TabPanel, { value: activeTab, index: 4, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Cost Breakdown" }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: costData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "category" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, { formatter: (value) => `$${value}` }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "amount", fill: "#2e7d32", radius: [4, 4, 0, 0], name: "Cost ($)" })] }) }) })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Summary" }), _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [costData.map((item) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 1, children: [_jsx(Typography, { variant: "body2", children: item.category }), _jsxs(Typography, { variant: "body2", fontWeight: 600, children: ["$", item.amount.toLocaleString()] })] }, item.category))), _jsx(Divider, { sx: { my: 1 } }), _jsxs(Box, { display: "flex", justifyContent: "space-between", children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 700, children: "Total" }), _jsxs(Typography, { variant: "subtitle2", fontWeight: 700, color: "primary.main", children: ["$", costData.reduce((s, i) => s + i.amount, 0).toLocaleString()] })] })] })] })] }) })] })] })] }));
};
export default VehicleDetail;
