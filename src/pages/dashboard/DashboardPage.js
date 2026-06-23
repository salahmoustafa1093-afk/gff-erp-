import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAppSelector } from '@/app/hooks';
import { apiService } from '@/app/api';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
        boxShadow: theme.shadows[4],
    },
}));
const COLORS = ['#2E7D32', '#F9A825', '#0288D1', '#ED6C02', '#D32F2F', '#7B1FA2', '#5C6BC0', '#26A69A'];
const ACTIVITY_COLORS = {
    order: '#2E7D32',
    purchase: '#0288D1',
    inventory: '#F9A825',
    payment: '#7B1FA2',
    system: '#9E9E9E',
    alert: '#D32F2F',
};
export default function DashboardPage() {
    const navigate = useNavigate();
    const currentBranch = useAppSelector((state) => state.branch.currentBranch);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard', currentBranch?.id],
        queryFn: async () => {
            const params = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
            return apiService.get(`/dashboard${params}`);
        },
        staleTime: 2 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
    });
    const kpis = useMemo(() => data?.kpis || [], [data]);
    const salesChartData = useMemo(() => {
        if (!data?.salesChart)
            return [];
        return data.salesChart.labels.map((label, i) => ({
            name: label,
            sales: data.salesChart.datasets[0]?.data[i] || 0,
            ...(data.salesChart.datasets[1] ? { target: data.salesChart.datasets[1].data[i] } : {}),
        }));
    }, [data]);
    const branchPerformanceData = useMemo(() => {
        return data?.branchPerformance || [];
    }, [data]);
    const topProducts = useMemo(() => data?.topProducts || [], [data]);
    const topCustomers = useMemo(() => data?.topCustomers || [], [data]);
    const recentOrders = useMemo(() => data?.recentOrders || [], [data]);
    const recentPurchases = useMemo(() => data?.recentPurchases || [], [data]);
    const lowStockItems = useMemo(() => data?.lowStockAlerts || [], [data]);
    const activityFeed = useMemo(() => data?.activityFeed || [], [data]);
    const kpiCards = [
        {
            kpi: kpis[0],
            icon: PointOfSaleIcon,
            color: '#2E7D32',
            bgColor: '#E8F5E9',
        },
        {
            kpi: kpis[1],
            icon: ShoppingCartIcon,
            color: '#F9A825',
            bgColor: '#FFFDE7',
        },
        {
            kpi: kpis[2],
            icon: AccountBalanceWalletIcon,
            color: '#0288D1',
            bgColor: '#E3F2FD',
        },
        {
            kpi: kpis[3],
            icon: AccountBalanceIcon,
            color: '#7B1FA2',
            bgColor: '#F3E5F5',
        },
        {
            kpi: kpis[4],
            icon: InventoryIcon,
            color: '#ED6C02',
            bgColor: '#FFF3E0',
        },
        {
            kpi: kpis[5],
            icon: TrendingUpIcon,
            color: '#26A69A',
            bgColor: '#E0F2F1',
        },
    ];
    return (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", fontWeight: 600, children: "Dashboard" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [currentBranch ? `${currentBranch.name} — ` : '', formatDate(new Date().toISOString(), 'full')] })] }), _jsx(Tooltip, { title: "Refresh dashboard", children: _jsx(IconButton, { onClick: () => refetch(), color: "primary", children: _jsx(RefreshIcon, {}) }) })] }), _jsx(Grid, { container: true, spacing: 2.5, sx: { mb: 3 }, children: isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (_jsx(Grid, { item: true, xs: 12, sm: 6, lg: 4, xl: 2, children: _jsx(StyledCard, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Skeleton, { variant: "text", width: "60%", height: 20 }), _jsx(Skeleton, { variant: "text", width: "40%", height: 40, sx: { mt: 1 } }), _jsx(Skeleton, { variant: "text", width: "50%", height: 16 })] }) }) }, i)))
                    : kpiCards.map((item, index) => {
                        const IconComponent = item.icon;
                        const kpi = item.kpi;
                        return (_jsx(Grid, { item: true, xs: 12, sm: 6, lg: 4, xl: 2, children: _jsx(StyledCard, { variant: "outlined", sx: { cursor: kpi?.link ? 'pointer' : 'default' }, onClick: () => kpi?.link && navigate(kpi.link), children: _jsx(CardContent, { sx: { p: 2.5, '&:last-child': { pb: 2.5 } }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }, children: [_jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", fontWeight: 500, noWrap: true, children: kpi?.label || 'Loading...' }), _jsx(Typography, { variant: "h5", fontWeight: 600, sx: { mt: 0.5, fontSize: '1.5rem' }, children: kpi?.format === 'currency'
                                                            ? formatCurrency(Number(kpi?.value))
                                                            : formatNumber(Number(kpi?.value || 0)) }), kpi?.change !== undefined && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }, children: [_jsx(Chip, { label: `${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, size: "small", color: kpi.changeType === 'increase' ? 'success' : kpi.changeType === 'decrease' ? 'error' : 'default', sx: { height: 20, fontSize: '0.6875rem', fontWeight: 600 } }), kpi.changeLabel && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: kpi.changeLabel }))] }))] }), _jsx(Box, { sx: {
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    backgroundColor: item.bgColor,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }, children: _jsx(IconComponent, { sx: { fontSize: 22, color: item.color } }) })] }) }) }) }, index));
                    }) }), _jsxs(Grid, { container: true, spacing: 2.5, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, lg: 8, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Sales Trend", subheader: "Monthly sales performance", action: _jsx(Button, { size: "small", endIcon: _jsx(ArrowForwardIcon, {}), onClick: () => navigate('/reports/sales'), children: "Details" }), titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", height: 300, sx: { borderRadius: 2 } })) : salesChartData.length === 0 ? (_jsx(Box, { sx: { height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No sales data available" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: salesChartData, margin: { top: 5, right: 20, left: 0, bottom: 5 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "salesGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#2E7D32", stopOpacity: 0.2 }), _jsx("stop", { offset: "95%", stopColor: "#2E7D32", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E0E0E0" }), _jsx(XAxis, { dataKey: "name", tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 }, tickFormatter: (v) => formatCurrency(v, 'USD', 0) }), _jsx(RechartsTooltip, { formatter: (value) => formatCurrency(value), contentStyle: { borderRadius: 8, border: '1px solid #E0E0E0' } }), _jsx(Area, { type: "monotone", dataKey: "sales", stroke: "#2E7D32", strokeWidth: 2, fill: "url(#salesGradient)", name: "Sales" }), salesChartData[0]?.target !== undefined && (_jsx(Area, { type: "monotone", dataKey: "target", stroke: "#F9A825", strokeWidth: 2, fill: "none", strokeDasharray: "5 5", name: "Target" })), _jsx(Legend, {})] }) })) })] }) }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Branch Performance", subheader: "Sales by branch", titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", height: 300, sx: { borderRadius: 2 } })) : branchPerformanceData.length === 0 ? (_jsx(Box, { sx: { height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No branch data" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: branchPerformanceData.map((b) => ({
                                                name: b.branchName,
                                                sales: b.salesTotal,
                                                target: b.target,
                                            })), layout: "vertical", margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E0E0E0" }), _jsx(XAxis, { type: "number", tick: { fontSize: 12 }, tickFormatter: (v) => formatCurrency(v, 'USD', 0) }), _jsx(YAxis, { dataKey: "name", type: "category", tick: { fontSize: 11 }, width: 80 }), _jsx(RechartsTooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Bar, { dataKey: "sales", fill: "#2E7D32", radius: [0, 4, 4, 0], name: "Sales" }), _jsx(Bar, { dataKey: "target", fill: "#F9A825", radius: [0, 4, 4, 0], name: "Target" }), _jsx(Legend, {})] }) })) })] }) })] }), _jsxs(Grid, { container: true, spacing: 2.5, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, lg: 6, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Recent Sales Orders", action: _jsx(Button, { size: "small", endIcon: _jsx(ArrowForwardIcon, {}), onClick: () => navigate('/sales/orders'), children: "View All" }), titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { sx: { pt: 0, pb: '16px !important' }, children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", height: 250, sx: { borderRadius: 2 } })) : recentOrders.length === 0 ? (_jsx(Box, { sx: { py: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No recent orders" }) })) : (_jsx(TableContainer, { component: Paper, variant: "outlined", sx: { borderRadius: 2 }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Order #" }), _jsx(TableCell, { children: "Customer" }), _jsx(TableCell, { align: "right", children: "Amount" }), _jsx(TableCell, { children: "Status" })] }) }), _jsx(TableBody, { children: recentOrders.map((order) => (_jsxs(TableRow, { hover: true, sx: { cursor: 'pointer' }, onClick: () => navigate(`/sales/orders/${order.id}`), children: [_jsx(TableCell, { fontWeight: 500, children: order.orderNumber }), _jsx(TableCell, { children: order.customerName }), _jsx(TableCell, { align: "right", children: formatCurrency(order.totalAmount) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: order.status, size: "small" }) })] }, order.id))) })] }) })) })] }) }), _jsx(Grid, { item: true, xs: 12, lg: 6, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Recent Purchase Orders", action: _jsx(Button, { size: "small", endIcon: _jsx(ArrowForwardIcon, {}), onClick: () => navigate('/purchases/orders'), children: "View All" }), titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { sx: { pt: 0, pb: '16px !important' }, children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", height: 250, sx: { borderRadius: 2 } })) : recentPurchases.length === 0 ? (_jsx(Box, { sx: { py: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No recent purchases" }) })) : (_jsx(TableContainer, { component: Paper, variant: "outlined", sx: { borderRadius: 2 }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "PO #" }), _jsx(TableCell, { children: "Supplier" }), _jsx(TableCell, { align: "right", children: "Amount" }), _jsx(TableCell, { children: "Status" })] }) }), _jsx(TableBody, { children: recentPurchases.map((po) => (_jsxs(TableRow, { hover: true, sx: { cursor: 'pointer' }, onClick: () => navigate(`/purchases/orders/${po.id}`), children: [_jsx(TableCell, { fontWeight: 500, children: po.poNumber }), _jsx(TableCell, { children: po.supplierName }), _jsx(TableCell, { align: "right", children: formatCurrency(po.totalAmount) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: po.status, size: "small" }) })] }, po.id))) })] }) })) })] }) })] }), _jsxs(Grid, { container: true, spacing: 2.5, children: [_jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Top Products", subheader: "Best selling products this month", titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { children: isLoading ? (_jsx(Skeleton, { variant: "rectangular", height: 250 })) : topProducts.length === 0 ? (_jsx(Box, { sx: { py: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No product data" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: topProducts.slice(0, 5).map((p) => ({
                                                        name: p.name,
                                                        value: p.totalRevenue,
                                                    })), cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 100, paddingAngle: 2, dataKey: "value", children: topProducts.slice(0, 5).map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(RechartsTooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Legend, {})] }) })) })] }) }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Top Customers", action: _jsx(Button, { size: "small", endIcon: _jsx(ArrowForwardIcon, {}), onClick: () => navigate('/customers'), children: "All" }), titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { children: isLoading ? (_jsx(_Fragment, { children: [1, 2, 3, 4, 5].map((i) => (_jsx(Skeleton, { variant: "rectangular", height: 40, sx: { mb: 1 } }, i))) })) : (_jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Customer" }), _jsx(TableCell, { align: "right", children: "Orders" }), _jsx(TableCell, { align: "right", children: "Spent" })] }) }), _jsx(TableBody, { children: topCustomers.slice(0, 5).map((customer) => (_jsxs(TableRow, { hover: true, sx: { cursor: 'pointer' }, onClick: () => navigate(`/customers/${customer.id}`), children: [_jsxs(TableCell, { children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: customer.name }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Last: ", formatDate(customer.lastOrderDate)] })] }), _jsx(TableCell, { align: "right", children: customer.totalOrders }), _jsx(TableCell, { align: "right", children: formatCurrency(customer.totalSpent) })] }, customer.id))) })] }) })) })] }) }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: ["Low Stock Alerts", lowStockItems.length > 0 && (_jsx(Chip, { label: lowStockItems.length, size: "small", color: "error", sx: { height: 20, fontSize: '0.6875rem' } }))] }), action: _jsx(Button, { size: "small", endIcon: _jsx(ArrowForwardIcon, {}), onClick: () => navigate('/inventory/stock'), children: "View" }), titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { children: isLoading ? (_jsx(_Fragment, { children: [1, 2, 3].map((i) => (_jsx(Skeleton, { variant: "rectangular", height: 50, sx: { mb: 1 } }, i))) })) : lowStockItems.length === 0 ? (_jsx(Box, { sx: { py: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "success.main", fontWeight: 500, children: "All stock levels are healthy" }) })) : (_jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Product" }), _jsx(TableCell, { align: "right", children: "Stock" }), _jsx(TableCell, { align: "right", children: "Min" })] }) }), _jsx(TableBody, { children: lowStockItems.slice(0, 5).map((item) => (_jsxs(TableRow, { hover: true, sx: { cursor: 'pointer' }, onClick: () => navigate(`/inventory/products/${item.id}`), children: [_jsx(TableCell, { children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(WarningIcon, { fontSize: "small", color: "error" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: item.productName }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: item.sku })] })] }) }), _jsx(TableCell, { align: "right", children: _jsx(Typography, { color: "error", fontWeight: 600, children: item.currentStock }) }), _jsx(TableCell, { align: "right", children: item.reorderLevel })] }, item.id))) })] }) })) })] }) })] }), _jsx(Grid, { container: true, spacing: 2.5, sx: { mt: 0.5 }, children: _jsx(Grid, { item: true, xs: 12, children: _jsxs(StyledCard, { variant: "outlined", children: [_jsx(CardHeader, { title: "Recent Activity", titleTypographyProps: { variant: 'h6', fontWeight: 600, fontSize: '1rem' } }), _jsx(CardContent, { children: isLoading ? (_jsx(_Fragment, { children: [1, 2, 3, 4, 5].map((i) => (_jsx(Skeleton, { variant: "rectangular", height: 48, sx: { mb: 1 } }, i))) })) : activityFeed.length === 0 ? (_jsx(Box, { sx: { py: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No recent activity" }) })) : (_jsx(TableContainer, { children: _jsx(Table, { size: "small", children: _jsx(TableBody, { children: activityFeed.slice(0, 10).map((activity) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { width: 48, children: _jsx(Box, { sx: {
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: '50%',
                                                                backgroundColor: ACTIVITY_COLORS[activity.type] || '#9E9E9E',
                                                            } }) }), _jsxs(TableCell, { children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: activity.title }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: activity.description })] }), _jsx(TableCell, { align: "right", width: 120, children: _jsx(Typography, { variant: "caption", color: "text.secondary", children: activity.userName }) }), _jsx(TableCell, { align: "right", width: 100, children: _jsx(Typography, { variant: "caption", color: "text.secondary", children: formatDate(activity.timestamp, 'relative') }) })] }, activity.id))) }) }) })) })] }) }) })] }));
}
