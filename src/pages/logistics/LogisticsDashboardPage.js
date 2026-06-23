import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Skeleton, Alert, Avatar, LinearProgress, Chip, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { LocalShipping, DeliveryDining, PendingActions, DirectionsCar, Person, LocalGasStation, Warning, CheckCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { apiService } from '../../services/api';
const VEHICLE_COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1'];
const TRIP_COLORS = ['#2e7d32', '#0288d1', '#ed6c02', '#d32f2f'];
const KPICard = ({ title, value, icon, color, subtitle, loading }) => (_jsx(Card, { sx: { height: '100%' }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { flex: 1, children: [_jsx(Typography, { color: "text.secondary", variant: "body2", fontWeight: 500, gutterBottom: true, children: title }), loading ? (_jsx(Skeleton, { variant: "text", width: 80, height: 40 })) : (_jsx(Typography, { variant: "h4", fontWeight: 700, color: color, children: value })), subtitle && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: subtitle }))] }), _jsx(Avatar, { sx: { bgcolor: `${color}15`, color, width: 48, height: 48 }, children: icon })] }) }) }));
const LogisticsDashboardPage = () => {
    const { data: dashboard, isLoading, error } = useQuery({
        queryKey: ['logistics-dashboard'],
        queryFn: () => apiService.getLogisticsDashboard(),
        refetchInterval: 300000,
    });
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { m: 2 }, children: "Failed to load logistics dashboard." }));
    }
    const kpiData = [
        {
            title: 'Active Trips',
            value: dashboard?.activeTrips ?? 0,
            icon: _jsx(LocalShipping, {}),
            color: '#2e7d32',
            subtitle: 'In progress',
        },
        {
            title: 'Today Deliveries',
            value: dashboard?.todayDeliveries ?? 0,
            icon: _jsx(DeliveryDining, {}),
            color: '#0288d1',
            subtitle: 'Completed today',
        },
        {
            title: 'Pending Deliveries',
            value: dashboard?.pendingDeliveries ?? 0,
            icon: _jsx(PendingActions, {}),
            color: '#ed6c02',
            subtitle: 'Scheduled',
        },
        {
            title: 'Available Vehicles',
            value: dashboard?.availableVehicles ?? 0,
            icon: _jsx(DirectionsCar, {}),
            color: '#2e7d32',
            subtitle: 'Ready for dispatch',
        },
        {
            title: 'Available Drivers',
            value: dashboard?.availableDrivers ?? 0,
            icon: _jsx(Person, {}),
            color: '#0288d1',
            subtitle: 'On duty',
        },
        {
            title: 'Fuel Cost Today',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(dashboard?.fuelCostToday ?? 0),
            icon: _jsx(LocalGasStation, {}),
            color: '#ed6c02',
            subtitle: 'Total fuel spend',
        },
    ];
    const deliveryPerformance = dashboard?.deliveryPerformance;
    const onTimeRate = deliveryPerformance?.total
        ? ((deliveryPerformance.onTime / deliveryPerformance.total) * 100).toFixed(0)
        : 0;
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Logistics Dashboard" }), _jsx(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: kpiData.map((kpi) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4, lg: 2 }, children: _jsx(KPICard, { ...kpi, loading: isLoading }) }, kpi.title))) }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(Card, { sx: { height: '100%' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Vehicle Status" }), _jsx(Box, { height: 250, children: isLoading ? (_jsx(Skeleton, { variant: "circular", width: 200, height: 200, sx: { mx: 'auto' } })) : (_jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: dashboard?.vehicleStatusDistribution || [], cx: "50%", cy: "50%", outerRadius: 90, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: (dashboard?.vehicleStatusDistribution || []).map((_, index) => (_jsx(Cell, { fill: VEHICLE_COLORS[index % VEHICLE_COLORS.length] }, index))) }), _jsx(RechartsTooltip, {})] }) })) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(Card, { sx: { height: '100%' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Trip Status" }), _jsx(Box, { height: 250, children: isLoading ? (_jsx(Skeleton, { variant: "circular", width: 200, height: 200, sx: { mx: 'auto' } })) : (_jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: dashboard?.tripStatusDistribution || [], cx: "50%", cy: "50%", outerRadius: 90, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: (dashboard?.tripStatusDistribution || []).map((_, index) => (_jsx(Cell, { fill: TRIP_COLORS[index % TRIP_COLORS.length] }, index))) }), _jsx(RechartsTooltip, {})] }) })) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { sx: { height: '100%' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Fuel Consumption Trend" }), _jsx(Box, { height: 250, children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", width: "100%", height: 250 })) : (_jsx(ResponsiveContainer, { children: _jsxs(LineChart, { data: dashboard?.fuelConsumptionTrend || [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tickFormatter: (v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "cost", name: "Cost ($)", stroke: "#d32f2f", strokeWidth: 2, dot: false }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "liters", name: "Liters", stroke: "#0288d1", strokeWidth: 2, dot: false })] }) })) })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Recent Trips" }), isLoading ? (Array.from({ length: 5 }).map((_, i) => _jsx(Skeleton, { height: 50, sx: { mb: 1 } }, i))) : (_jsx(List, { dense: true, children: (dashboard?.recentTrips || []).map((trip, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { secondaryAction: _jsx(Chip, { label: trip.status, size: "small", color: trip.status === 'COMPLETED' ? 'success' : trip.status === 'IN_PROGRESS' ? 'primary' : 'default', variant: "outlined" }), children: [_jsx(ListItemIcon, { sx: { minWidth: 36 }, children: _jsx(LocalShipping, { fontSize: "small", color: "action" }) }), _jsx(ListItemText, { primary: `${trip.tripNumber} - ${trip.vehicleCode}`, secondary: `${trip.driverName} | ${trip.distance}km | $${trip.totalCost?.toFixed(2)}` })] }), idx < (dashboard?.recentTrips?.length || 0) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, trip.id))) }))] }) }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Maintenance Alerts" }), isLoading ? (Array.from({ length: 3 }).map((_, i) => _jsx(Skeleton, { height: 50, sx: { mb: 1 } }, i))) : (_jsxs(List, { dense: true, children: [(dashboard?.maintenanceAlerts || []).map((alert, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { children: [_jsx(ListItemIcon, { sx: { minWidth: 36 }, children: _jsx(Warning, { fontSize: "small", color: alert.status === 'SCHEDULED' ? 'warning' : 'error' }) }), _jsx(ListItemText, { primary: `${alert.vehicleCode} - ${alert.type}`, secondary: `${alert.description} | ${new Date(alert.serviceDate).toLocaleDateString()}` })] }), idx < (dashboard?.maintenanceAlerts?.length || 0) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, alert.id))), (dashboard?.maintenanceAlerts || []).length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", py: 2, children: "No maintenance alerts" }))] })), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, gutterBottom: true, children: "Delivery Performance" }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Box, { flex: 1, children: _jsx(LinearProgress, { variant: "determinate", value: Number(onTimeRate), sx: {
                                                        height: 12,
                                                        borderRadius: 6,
                                                        bgcolor: 'error.100',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: Number(onTimeRate) >= 90 ? 'success.main' : Number(onTimeRate) >= 70 ? 'warning.main' : 'error.main',
                                                            borderRadius: 6,
                                                        }
                                                    } }) }), _jsxs(Typography, { variant: "h6", fontWeight: 700, color: Number(onTimeRate) >= 90 ? 'success.main' : Number(onTimeRate) >= 70 ? 'warning.main' : 'error.main', children: [onTimeRate, "%"] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", mt: 0.5, children: [_jsxs(Typography, { variant: "caption", color: "success.main", children: [_jsx(CheckCircle, { fontSize: "inherit" }), " On Time: ", deliveryPerformance?.onTime || 0] }), _jsxs(Typography, { variant: "caption", color: "error.main", children: ["Delayed: ", deliveryPerformance?.delayed || 0] })] })] }) }) })] })] }));
};
export default LogisticsDashboardPage;
