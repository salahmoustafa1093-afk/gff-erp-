import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button, IconButton, Chip, Skeleton, Alert, Paper, Rating, Avatar } from '@mui/material';
import { ArrowBack, Edit, LocalShipping, Event, Phone, Email, Star, Verified } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '@mui/x-data-grid';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { apiService } from '../../services/api';
const statusColors = {
    AVAILABLE: '#2e7d32',
    ON_TRIP: '#0288d1',
    OFF_DUTY: '#757575',
    SUSPENDED: '#d32f2f',
};
const TabPanel = ({ children, value, index }) => value === index ? _jsx(Box, { sx: { py: 3 }, children: children }) : null;
const InfoRow = ({ label, value }) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.75, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: value || '-' })] }));
const DriverDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const { data: driver, isLoading, error } = useQuery({
        queryKey: ['driver', id],
        queryFn: () => apiService.getDriver(id),
        enabled: !!id,
    });
    if (error)
        return _jsx(Alert, { severity: "error", sx: { m: 3 }, children: "Failed to load driver details." });
    const performanceData = [
        { metric: 'Safety', score: 90 },
        { metric: 'Punctuality', score: 85 },
        { metric: 'Fuel Efficiency', score: 78 },
        { metric: 'Customer Service', score: 92 },
        { metric: 'Vehicle Care', score: 88 },
        { metric: 'Compliance', score: 95 },
    ];
    const tripColumns = [
        { field: 'tripNumber', headerName: 'Trip #', width: 120 },
        { field: 'vehicleCode', headerName: 'Vehicle', width: 120 },
        { field: 'type', headerName: 'Type', width: 100 },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", color: params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'default', variant: "outlined" })),
        },
        { field: 'startDate', headerName: 'Date', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString() },
        { field: 'distance', headerName: 'Distance', width: 100, type: 'number' },
        { field: 'totalCost', headerName: 'Cost', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
    ];
    const mockTrips = driver ? [
        { id: '1', tripNumber: 'TRP-001', vehicleId: 'v1', vehicleCode: 'VH-A001', vehicleName: 'Toyota Hilux', driverId: driver.id, driverName: `${driver.firstName} ${driver.lastName}`, type: 'DELIVERY', status: 'COMPLETED', startDate: new Date().toISOString(), expectedEndDate: new Date().toISOString(), distance: 120, fuelCost: 35, otherCosts: 10, totalCost: 85, notes: '', stops: [], createdAt: '' },
        { id: '2', tripNumber: 'TRP-015', vehicleId: 'v2', vehicleCode: 'VH-B003', vehicleName: 'Ford Transit', driverId: driver.id, driverName: `${driver.firstName} ${driver.lastName}`, type: 'PICKUP', status: 'COMPLETED', startDate: new Date().toISOString(), expectedEndDate: new Date().toISOString(), distance: 85, fuelCost: 22, otherCosts: 5, totalCost: 55, notes: '', stops: [], createdAt: '' },
    ] : [];
    const availabilityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const availabilityMap = { 'Mon': 'AVAILABLE', 'Tue': 'AVAILABLE', 'Wed': 'ON_TRIP', 'Thu': 'AVAILABLE', 'Fri': 'AVAILABLE', 'Sat': 'OFF_DUTY', 'Sun': 'OFF_DUTY' };
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(IconButton, { onClick: () => navigate('/drivers'), children: _jsx(ArrowBack, {}) }), _jsx(Typography, { variant: "h4", fontWeight: 700, children: "Driver Profile" })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(Edit, {}), onClick: () => navigate(`/drivers/edit/${id}`), children: "Edit" })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: isLoading ? _jsx(Skeleton, { height: 80 }) : driver ? (_jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsxs(Avatar, { sx: { width: 60, height: 60, bgcolor: statusColors[driver.status], fontSize: 28 }, children: [driver.firstName[0], driver.lastName[0]] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "h5", fontWeight: 700, children: [driver.firstName, " ", driver.lastName] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mt: 0.5, children: [_jsx(Chip, { label: driver.status, size: "small", sx: { bgcolor: `${statusColors[driver.status]}15`, color: statusColors[driver.status], fontWeight: 600 } }), _jsx(Rating, { value: driver.rating || 0, readOnly: true, size: "small", precision: 0.5 }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["(", driver.yearsExperience, " yrs exp)"] })] }), _jsx(Box, { display: "flex", gap: 1, mt: 0.5, children: driver.certifications?.map((cert, i) => (_jsx(Chip, { label: cert, size: "small", variant: "outlined", icon: _jsx(Verified, { fontSize: "small" }) }, i))) })] })] }) }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Box, { display: "flex", flexWrap: "wrap", gap: 3, children: _jsxs(Box, { children: [_jsx(Phone, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", driver.phone] }) }), _jsxs(Box, { children: [_jsx(Email, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "body2", children: driver.email })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Branch" }), _jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", driver.branch] })] })] }))
                        :
                 }) }), ") : null}"] }));
};
Card >
    _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: (_, v) => setActiveTab(v), variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { label: "Information", icon: _jsx(Phone, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Trips", icon: _jsx(LocalShipping, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Performance", icon: _jsx(Star, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Schedule", icon: _jsx(Event, { fontSize: "small" }), iconPosition: "start" })] }), _jsxs(CardContent, { children: [_jsx(TabPanel, { value: activeTab, index: 0, children: isLoading ? _jsx(Skeleton, { height: 200 }) : driver && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "License Information" }), _jsx(InfoRow, { label: "License Number", value: driver.licenseNumber }), _jsx(InfoRow, { label: "License Expiry", value: driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "License Class", value: driver.licenseClass }), _jsx(InfoRow, { label: "Years Experience", value: driver.yearsExperience })] }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Contact" }), _jsx(InfoRow, { label: "Phone", value: driver.phone }), _jsx(InfoRow, { label: "Email", value: driver.email }), _jsx(InfoRow, { label: "Date of Birth", value: driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "Hire Date", value: driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "Branch", value: driver.branch })] }) })] })) }), _jsx(TabPanel, { value: activeTab, index: 1, children: _jsx(DataGrid, { rows: mockTrips, columns: tripColumns, pageSizeOptions: [10, 25], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true }) }), _jsx(TabPanel, { value: activeTab, index: 2, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Performance Radar" }), _jsx(Box, { height: 350, children: _jsx(ResponsiveContainer, { children: _jsxs(RadarChart, { data: performanceData, children: [_jsx(PolarGrid, {}), _jsx(PolarAngleAxis, { dataKey: "metric" }), _jsx(PolarRadiusAxis, { angle: 30, domain: [0, 100] }), _jsx(Radar, { name: "Score", dataKey: "score", stroke: "#2e7d32", fill: "#2e7d32", fillOpacity: 0.3 })] }) }) })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Metrics" }), _jsx(Paper, { variant: "outlined", sx: { p: 2 }, children: performanceData.map((item) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, children: [_jsx(Typography, { variant: "body2", children: item.metric }), _jsx(Chip, { label: `${item.score}/100`, size: "small", color: item.score >= 90 ? 'success' : item.score >= 75 ? 'primary' : 'warning' })] }, item.metric))) })] })] }) }), _jsxs(TabPanel, { value: activeTab, index: 3, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Weekly Availability" }), _jsx(Grid, { container: true, spacing: 2, children: availabilityDays.map((day) => (_jsxs(Grid, { size: { xs: 6, sm: 4, md: true }, children: [_jsxs(Card, { variant: "outlined", sx: { textAlign: 'center', p: 1, bgcolor: availabilityMap[day] === 'AVAILABLE' ? 'success.50' : availabilityMap[day] === 'ON_TRIP' ? 'info.50' : 'grey.50' }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600 }), "\">", day] }), _jsx(Chip, { label: availabilityMap[day], size: "small", sx: { mt: 0.5, fontSize: '0.65rem' }, color: availabilityMap[day] === 'AVAILABLE' ? 'success' : availabilityMap[day] === 'ON_TRIP' ? 'primary' : 'default', variant: "outlined" })] }, day))) }), "))}"] })] })] });
Card >
;
Box >
;
;
;
export default DriverDetail;
