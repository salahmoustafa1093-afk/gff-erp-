import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Typography, Card, CardContent, Grid, List, ListItem, ListItemText, ListItemButton, Chip, } from '@mui/material';
import { ShoppingCart, Inventory, AccountBalance, Factory, Egg, People, LocalShipping, Assessment, } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
const reportCategories = [
    {
        title: 'Sales Reports',
        icon: _jsx(ShoppingCart, {}),
        color: '#4caf50',
        path: '/reports/sales',
        reports: ['Daily Sales', 'Monthly Summary', 'By Product', 'By Customer', 'By Sales Rep'],
    },
    {
        title: 'Purchase Reports',
        icon: _jsx(ShoppingCart, {}),
        color: '#ff9800',
        path: '/reports/purchases',
        reports: ['Purchase Orders', 'Supplier Analysis', 'Price Trends'],
    },
    {
        title: 'Inventory Reports',
        icon: _jsx(Inventory, {}),
        color: '#2196f3',
        path: '/reports/inventory',
        reports: ['Stock Valuation', 'Aging', 'Stock Levels', 'Movement Summary'],
    },
    {
        title: 'Financial Reports',
        icon: _jsx(AccountBalance, {}),
        color: '#9c27b0',
        path: '/reports/financial',
        reports: ['Trial Balance', 'Balance Sheet', 'Income Statement', 'Cash Flow'],
    },
    {
        title: 'Production Reports',
        icon: _jsx(Factory, {}),
        color: '#795548',
        path: '/reports/production',
        reports: ['Production Orders', 'Efficiency', 'Cost Analysis'],
    },
    {
        title: 'Poultry Reports',
        icon: _jsx(Egg, {}),
        color: '#607d8b',
        path: '/reports/poultry',
        reports: ['Flock Performance', 'Mortality', 'Feed Consumption'],
    },
    {
        title: 'HR Reports',
        icon: _jsx(People, {}),
        color: '#e91e63',
        path: '/reports/hr',
        reports: ['Attendance', 'Payroll', 'Leave Summary'],
    },
    {
        title: 'Logistics Reports',
        icon: _jsx(LocalShipping, {}),
        color: '#00bcd4',
        path: '/reports/logistics',
        reports: ['Delivery Performance', 'Fleet Utilization', 'Route Analysis'],
    },
];
const recentReports = [
    { name: 'Monthly Sales Report - June 2024', date: '2024-07-01', type: 'Sales' },
    { name: 'Q2 Balance Sheet', date: '2024-07-02', type: 'Financial' },
    { name: 'Inventory Valuation', date: '2024-07-03', type: 'Inventory' },
    { name: 'Cash Flow - June 2024', date: '2024-07-03', type: 'Financial' },
];
const ReportsDashboardPage = () => {
    const navigate = useNavigate();
    return (_jsxs(Box, { p: 3, children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: [_jsx(Assessment, { sx: { mr: 1, verticalAlign: 'middle' } }), "Reports Dashboard"] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, lg: 9 }, children: _jsx(Grid, { container: true, spacing: 2, children: reportCategories.map((cat) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(Card, { sx: {
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4,
                                        },
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }, onClick: () => navigate(cat.path), children: _jsxs(CardContent, { sx: { flex: 1 }, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1.5, mb: 2, children: [_jsx(Box, { sx: {
                                                            backgroundColor: `${cat.color}15`,
                                                            borderRadius: 2,
                                                            p: 1,
                                                            display: 'flex',
                                                        }, children: React.cloneElement(cat.icon, {
                                                            sx: { color: cat.color },
                                                        }) }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: cat.title })] }), _jsx(List, { dense: true, disablePadding: true, children: cat.reports.map((report) => (_jsx(ListItem, { disablePadding: true, sx: { py: 0.25 }, children: _jsx(ListItemText, { primary: report, primaryTypographyProps: {
                                                            variant: 'body2',
                                                            color: 'text.secondary',
                                                        } }) }, report))) })] }) }) }, cat.title))) }) }), _jsxs(Grid, { size: { xs: 12, lg: 3 }, children: [_jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Recent Reports" }), _jsx(List, { dense: true, children: recentReports.map((report, idx) => (_jsx(ListItem, { disablePadding: true, sx: { py: 0.5 }, children: _jsxs(ListItemButton, { onClick: () => { }, children: [_jsx(ListItemText, { primary: report.name, secondary: report.date, primaryTypographyProps: { variant: 'body2' }, secondaryTypographyProps: { variant: 'caption' } }), _jsx(Chip, { label: report.type, size: "small", variant: "outlined", sx: { height: 20, fontSize: '0.65rem' } })] }) }, idx))) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Saved Reports" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No saved reports yet. Generate and save custom report templates for quick access." })] }) })] })] })] }));
};
export default ReportsDashboardPage;
