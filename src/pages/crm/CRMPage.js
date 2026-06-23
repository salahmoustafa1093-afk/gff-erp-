import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Skeleton, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Chip } from '@mui/material';
import { People, TrendingUp, AttachMoney, PendingActions, CheckCircle, Warning, Star, Schedule } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiService } from '../../services/api';
const COLORS = ['#2e7d32', '#ed6c02', '#0288d1', '#d32f2f', '#9c27b0', '#757575'];
const FUNNEL_COLORS = ['#2e7d32', '#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'];
const KPICard = ({ title, value, icon, color, subtitle, loading }) => (_jsx(Card, { sx: { height: '100%' }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { flex: 1, children: [_jsx(Typography, { color: "text.secondary", variant: "body2", fontWeight: 500, gutterBottom: true, children: title }), loading ? (_jsx(Skeleton, { variant: "text", width: 80, height: 40 })) : (_jsx(Typography, { variant: "h4", fontWeight: 700, color: color, children: value })), subtitle && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: subtitle }))] }), _jsx(Avatar, { sx: { bgcolor: `${color}15`, color, width: 48, height: 48 }, children: icon })] }) }) }));
const CRMPage = () => {
    const { data: dashboard, isLoading, error } = useQuery({
        queryKey: ['crm-dashboard'],
        queryFn: () => apiService.getCRMDashboard(),
        refetchInterval: 300000,
    });
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { m: 2 }, children: "Failed to load CRM dashboard data." }));
    }
    const kpiData = [
        {
            title: 'Total Leads',
            value: dashboard?.totalLeads ?? 0,
            icon: _jsx(People, {}),
            color: '#2e7d32',
            subtitle: 'All time leads',
        },
        {
            title: 'New This Month',
            value: dashboard?.newLeadsThisMonth ?? 0,
            icon: _jsx(TrendingUp, {}),
            color: '#ed6c02',
            subtitle: 'New leads added',
        },
        {
            title: 'Conversion Rate',
            value: `${(dashboard?.conversionRate ?? 0).toFixed(1)}%`,
            icon: _jsx(CheckCircle, {}),
            color: '#0288d1',
            subtitle: 'Lead to customer',
        },
        {
            title: 'Won Deals Value',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(dashboard?.wonDealsValue ?? 0),
            icon: _jsx(AttachMoney, {}),
            color: '#2e7d32',
            subtitle: 'Total won deals',
        },
        {
            title: 'Pending Activities',
            value: dashboard?.pendingActivities ?? 0,
            icon: _jsx(PendingActions, {}),
            color: '#d32f2f',
            subtitle: 'Require attention',
        },
    ];
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "CRM Dashboard" }), _jsx(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: kpiData.map((kpi) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4, lg: true }, children: _jsx(KPICard, { ...kpi, loading: isLoading }) }, kpi.title))) }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { sx: { height: '100%' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Lead Source Breakdown" }), _jsx(Box, { height: 280, children: isLoading ? (_jsx(Skeleton, { variant: "circular", width: 280, height: 280, sx: { mx: 'auto' } })) : (_jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: dashboard?.leadSourceBreakdown || [], cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 100, paddingAngle: 2, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: (dashboard?.leadSourceBreakdown || []).map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, index))) }), _jsx(RechartsTooltip, {})] }) })) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { sx: { height: '100%' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Lead Status Pipeline" }), _jsx(Box, { height: 280, children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", width: "100%", height: 280 })) : (_jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: dashboard?.leadStatusDistribution || [], layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category", width: 80 }), _jsx(RechartsTooltip, {}), _jsx(Bar, { dataKey: "value", radius: [0, 4, 4, 0], children: (dashboard?.leadStatusDistribution || []).map((_, index) => (_jsx(Cell, { fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length] }, index))) })] }) })) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { sx: { height: '100%' }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Top Sales Reps" }), isLoading ? (Array.from({ length: 5 }).map((_, i) => (_jsx(Skeleton, { height: 50, sx: { mb: 1 } }, i)))) : (_jsx(List, { dense: true, children: (dashboard?.topSalesReps || []).map((rep, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: { bgcolor: idx === 0 ? '#ffb300' : idx === 1 ? '#9e9e9e' : idx === 2 ? '#cd7f32' : 'primary.main', width: 36, height: 36 }, children: _jsx(Star, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: rep.name, secondary: `${rep.deals} deals won \u00b7 ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rep.value)}` }), _jsx(Chip, { label: `#${idx + 1}`, size: "small", color: idx === 0 ? 'warning' : 'default' })] }), idx < (dashboard?.topSalesReps?.length || 0) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, idx))) }))] }) }) })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Recent Activities" }), isLoading ? (Array.from({ length: 5 }).map((_, i) => (_jsx(Skeleton, { height: 60, sx: { mb: 1 } }, i)))) : (_jsx(List, { dense: true, children: (dashboard?.recentActivities || []).map((activity, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: { bgcolor: 'primary.50', color: 'primary.main', width: 32, height: 32 }, children: _jsx(Schedule, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: activity.subject, secondary: `${activity.type} \u00b7 ${activity.relatedToName} \u00b7 ${new Date(activity.createdAt).toLocaleDateString()}` }), _jsx(Chip, { label: activity.status, size: "small", color: activity.status === 'COMPLETED' ? 'success' : activity.status === 'OVERDUE' ? 'error' : 'warning', variant: "outlined" })] }), idx < (dashboard?.recentActivities?.length || 0) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, activity.id))) }))] }) }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "Overdue Activities" }), _jsx(Chip, { label: dashboard?.overdueActivities?.length || 0, color: "error", size: "small" })] }), isLoading ? (Array.from({ length: 5 }).map((_, i) => (_jsx(Skeleton, { height: 60, sx: { mb: 1 } }, i)))) : (_jsx(List, { dense: true, children: (dashboard?.overdueActivities || []).slice(0, 5).map((activity, idx) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { children: [_jsx(ListItemAvatar, { children: _jsx(Avatar, { sx: { bgcolor: 'error.50', color: 'error.main', width: 32, height: 32 }, children: _jsx(Warning, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: activity.subject, secondary: `${activity.type} \u00b7 ${activity.relatedToName} \u00b7 Due: ${new Date(activity.dueDate).toLocaleDateString()}` }), _jsx(Chip, { label: "OVERDUE", size: "small", color: "error" })] }), idx < Math.min((dashboard?.overdueActivities?.length || 0), 5) - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, activity.id))) }))] }) }) })] })] }));
};
export default CRMPage;
