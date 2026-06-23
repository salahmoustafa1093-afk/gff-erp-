import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Skeleton, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Chip, IconButton, Tooltip } from '@mui/material';
import { People, PersonOff, TrendingUp, WorkOutline, AttachMoney, Celebration, Event, CheckCircle, PendingActions } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';
const COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#9c27b0', '#757575'];
const STATUS_COLORS = {
    ACTIVE: '#2e7d32',
    INACTIVE: '#757575',
    TERMINATED: '#d32f2f',
    ON_LEAVE: '#0288d1',
    SUSPENDED: '#ed6c02',
};
const KPICard = ({ title, value, icon, color, subtitle, loading }) => (_jsx(Card, { sx: { height: '100%' }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { flex: 1, children: [_jsx(Typography, { color: "text.secondary", variant: "body2", fontWeight: 500, gutterBottom: true, children: title }), loading ? (_jsx(Skeleton, { variant: "text", width: 80, height: 40 })) : (_jsx(Typography, { variant: "h4", fontWeight: 700, color: color, children: value })), subtitle && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: subtitle }))] }), _jsx(Avatar, { sx: { bgcolor: `${color}15`, color, width: 48, height: 48 }, children: icon })] }) }) }));
const HRDashboardPage = () => {
    const [selectedDept, setSelectedDept] = useState(null);
    const { data: dashboard, isLoading, error } = useQuery({
        queryKey: ['hr-dashboard'],
        queryFn: () => apiService.getHRDashboard(),
        refetchInterval: 300000,
    });
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { m: 2 }, children: "Failed to load dashboard data. Please try again later." }));
    }
    const kpiData = [
        {
            title: 'Total Employees',
            value: dashboard?.totalEmployees ?? 0,
            icon: _jsx(People, {}),
            color: '#2e7d32',
            subtitle: `${dashboard?.activeEmployees ?? 0} active`,
        },
        {
            title: 'On Leave',
            value: dashboard?.onLeave ?? 0,
            icon: _jsx(PersonOff, {}),
            color: '#ed6c02',
            subtitle: 'Currently on leave',
        },
        {
            title: 'Attendance Rate',
            value: `${dashboard?.attendanceRate ?? 0}%`,
            icon: _jsx(TrendingUp, {}),
            color: '#0288d1',
            subtitle: 'Today\'s rate',
        },
        {
            title: 'Open Positions',
            value: dashboard?.openPositions ?? 0,
            icon: _jsx(WorkOutline, {}),
            color: '#9c27b0',
            subtitle: 'Active job openings',
        },
        {
            title: 'Payroll This Month',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: dashboard?.currentPayrollPeriod?.currency || 'USD',
                maximumFractionDigits: 0,
            }).format(dashboard?.payrollThisMonth ?? 0),
            icon: _jsx(AttachMoney, {}),
            color: '#2e7d32',
            subtitle: dashboard?.currentPayrollPeriod?.name || 'Current period',
        },
        {
            title: 'Pending Leaves',
            value: dashboard?.pendingLeaveRequests?.length ?? 0,
            icon: _jsx(PendingActions, {}),
            color: '#d32f2f',
            subtitle: 'Awaiting approval',
        },
    ];
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "HR Dashboard" }), _jsx(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: kpiData.map((kpi) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4, lg: 2 }, children: _jsx(KPICard, { ...kpi, loading: isLoading }) }, kpi.title))) }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Department Distribution" }), _jsx(Box, { height: 280, children: isLoading ? (_jsx(Skeleton, { variant: "circular", width: 280, height: 280, sx: { mx: 'auto' } })) : (_jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: dashboard?.departmentDistribution || [], cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 100, paddingAngle: 2, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: (dashboard?.departmentDistribution || []).map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(RechartsTooltip, {})] }) })) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Gender Distribution" }), _jsx(Box, { height: 280, children: isLoading ? (_jsx(Skeleton, { variant: "circular", width: 280, height: 280, sx: { mx: 'auto' } })) : (_jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: dashboard?.genderDistribution || [], cx: "50%", cy: "50%", outerRadius: 110, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: (dashboard?.genderDistribution || []).map((entry, index) => (_jsx(Cell, { fill: entry.name === 'MALE' ? '#0288d1' : entry.name === 'FEMALE' ? '#d32f2f' : '#757575' }, `cell-${index}`))) }), _jsx(RechartsTooltip, {}), _jsx(Legend, {})] }) })) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Employee Status" }), _jsx(Box, { height: 280, children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", width: "100%", height: 280 })) : (_jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: dashboard?.statusDistribution || [], layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category", width: 80 }), _jsx(RechartsTooltip, {}), _jsx(Bar, { dataKey: "value", radius: [0, 4, 4, 0], children: (dashboard?.statusDistribution || []).map((entry) => (_jsx(Cell, { fill: STATUS_COLORS[entry.name] || '#757575' }, entry.name))) })] }) })) })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Upcoming Birthdays" }), isLoading ? (Array.from({ length: 3 }).map((_, i) => (_jsx(Skeleton, { height: 60, sx: { mb: 1 } }, i)))) : (_jsxs(List, { dense: true, children: [(dashboard?.upcomingBirthdays || []).map((bday, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: { bgcolor: '#e91e6315', color: '#e91e63' }, children: _jsx(Celebration, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: bday.name, secondary: `${bday.department} \u00b7 ${new Date(bday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` })] }), idx < (dashboard?.upcomingBirthdays?.length || 0) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, idx))), (dashboard?.upcomingBirthdays || []).length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", py: 2, children: "No upcoming birthdays" }))] }))] }) }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Work Anniversaries" }), isLoading ? (Array.from({ length: 3 }).map((_, i) => (_jsx(Skeleton, { height: 60, sx: { mb: 1 } }, i)))) : (_jsxs(List, { dense: true, children: [(dashboard?.upcomingAnniversaries || []).map((anniv, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: { bgcolor: '#2e7d3215', color: '#2e7d32' }, children: _jsx(Event, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: anniv.name, secondary: `${anniv.years} years \u00b7 ${new Date(anniv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` })] }), idx < (dashboard?.upcomingAnniversaries?.length || 0) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, idx))), (dashboard?.upcomingAnniversaries || []).length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", py: 2, children: "No upcoming anniversaries" }))] }))] }) }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "Pending Leaves" }), _jsx(Chip, { label: dashboard?.pendingLeaveRequests?.length || 0, color: "warning", size: "small" })] }), isLoading ? (Array.from({ length: 3 }).map((_, i) => (_jsx(Skeleton, { height: 60, sx: { mb: 1 } }, i)))) : (_jsxs(List, { dense: true, children: [(dashboard?.pendingLeaveRequests || []).slice(0, 5).map((leave) => (_jsx(ListItem, { secondaryAction: _jsx(Box, { display: "flex", gap: 0.5, children: _jsx(Tooltip, { title: "Approve", children: _jsx(IconButton, { size: "small", color: "success", onClick: () => apiService.approveLeave(leave.id, true), children: _jsx(CheckCircle, { fontSize: "small" }) }) }) }), children: _jsx(ListItemText, { primary: leave.employeeName, secondary: `${leave.leaveType} \u00b7 ${leave.days} days \u00b7 ${new Date(leave.startDate).toLocaleDateString()}` }) }, leave.id))), (dashboard?.pendingLeaveRequests || []).length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", py: 2, children: "No pending requests" }))] }))] }) }) })] })] }));
};
export default HRDashboardPage;
