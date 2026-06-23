import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, } from 'recharts';
import { FileDownload as ExportIcon, Refresh as RefreshIcon, TrendingUp as TrendIcon, ShoppingCart as OrderIcon, MonetizationOn as MoneyIcon, Percent as ProfitIcon, } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import api from '../../app/api';
const reportTypeLabels = {
    DAILY: 'Daily Sales',
    MONTHLY: 'Monthly Sales',
    YEARLY: 'Yearly Sales',
    BY_PRODUCT: 'By Product',
    BY_CUSTOMER: 'By Customer',
    BY_SALES_REP: 'By Sales Rep',
};
const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0', '#00bcd4', '#ff5722', '#795548'];
const SalesReportsPage = () => {
    const [reportType, setReportType] = useState('MONTHLY');
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1));
    const [toDate, setToDate] = useState(new Date());
    const [chartType, setChartType] = useState('bar');
    const { data: reportData, isLoading, refetch } = useQuery({
        queryKey: ['salesReport', reportType, fromDate, toDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('type', reportType);
            if (fromDate)
                params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
            if (toDate)
                params.append('toDate', format(toDate, 'yyyy-MM-dd'));
            const response = await api.get(`/sales/reports?${params.toString()}`);
            return response.data;
        },
        enabled: Boolean(fromDate && toDate),
    });
    const handleExport = async () => {
        const params = new URLSearchParams();
        params.append('type', reportType);
        if (fromDate)
            params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
        if (toDate)
            params.append('toDate', format(toDate, 'yyyy-MM-dd'));
        const response = await api.get(`/sales/reports/export?${params.toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const summary = reportData?.summary || { totalOrders: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, avgOrderValue: 0 };
    const rows = reportData?.rows || [];
    const chartData = rows.map((row) => ({
        name: row.period,
        orders: row.orderCount,
        revenue: row.total,
        profit: row.profit,
    }));
    const pieData = rows.slice(0, 8).map((row, idx) => ({
        name: row.period,
        value: row.total,
        color: COLORS[idx % COLORS.length],
    }));
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Sales Reports" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export" }), _jsx(IconButton, { onClick: () => refetch(), children: _jsx(RefreshIcon, {}) })] })] }), _jsx(Paper, { sx: { p: 2, mb: 3 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { select: true, label: "Report Type", fullWidth: true, size: "small", value: reportType, onChange: (e) => setReportType(e.target.value), children: Object.entries(reportTypeLabels).map(([key, label]) => (_jsx(MenuItem, { value: key, children: label }, key))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(DatePicker, { label: "From Date", value: fromDate, onChange: setFromDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(DatePicker, { label: "To Date", value: toDate, onChange: setToDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(TextField, { select: true, label: "Chart Type", fullWidth: true, size: "small", value: chartType, onChange: (e) => setChartType(e.target.value), children: [_jsx(MenuItem, { value: "bar", children: "Bar Chart" }), _jsx(MenuItem, { value: "line", children: "Line Chart" }), _jsx(MenuItem, { value: "pie", children: "Pie Chart" })] }) })] }) }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: '4px solid #4caf50' }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Orders" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalOrders.toLocaleString() })] }), _jsx(OrderIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: '4px solid #2196f3' }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Revenue" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.totalRevenue) })] }), _jsx(MoneyIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: '4px solid #4caf50' }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Profit" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: formatCurrency(summary.totalProfit) })] }), _jsx(TrendIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: '4px solid #ff9800' }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Avg Order Value" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.avgOrderValue) })] }), _jsx(ProfitIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), rows.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(Paper, { sx: { p: 2, mb: 3, height: 400 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Sales Chart" }), _jsxs(ResponsiveContainer, { width: "100%", height: "90%", children: [chartType === 'bar' && (_jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "revenue", fill: "#4caf50", name: "Revenue" }), _jsx(Bar, { dataKey: "profit", fill: "#2196f3", name: "Profit" })] })), chartType === 'line' && (_jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "revenue", stroke: "#4caf50", name: "Revenue", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "orders", stroke: "#ff9800", name: "Orders", strokeWidth: 2 })] })), chartType === 'pie' && (_jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", outerRadius: 120, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, children: pieData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) })] }))] })] }), _jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Report Data" }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: 'primary.main' }, children: [_jsx(TableCell, { sx: { color: 'white' }, children: "Period" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Orders" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Items" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Subtotal" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Discount" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Tax" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Total" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Profit" })] }) }), _jsxs(TableBody, { children: [rows.map((row, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { fontWeight: "medium", children: row.period }), _jsx(TableCell, { align: "right", children: row.orderCount.toLocaleString() }), _jsx(TableCell, { align: "right", children: row.itemCount.toLocaleString() }), _jsx(TableCell, { align: "right", children: formatCurrency(row.subtotal) }), _jsx(TableCell, { align: "right", children: formatCurrency(row.discount) }), _jsx(TableCell, { align: "right", children: formatCurrency(row.tax) }), _jsx(TableCell, { align: "right", fontWeight: "medium", children: formatCurrency(row.total) }), _jsx(TableCell, { align: "right", sx: { color: row.profit >= 0 ? 'success.main' : 'error.main' }, children: formatCurrency(row.profit) })] }, idx))), _jsxs(TableRow, { sx: { backgroundColor: 'action.hover', fontWeight: 'bold' }, children: [_jsx(TableCell, { children: _jsx("strong", { children: "Total" }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: rows.reduce((s, r) => s + r.orderCount, 0).toLocaleString() }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: rows.reduce((s, r) => s + r.itemCount, 0).toLocaleString() }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.subtotal, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.discount, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.tax, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.total, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.profit, 0)) }) })] })] })] }) })] })] })), rows.length === 0 && !isLoading && (_jsx(Paper, { sx: { p: 4, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "No data available for the selected criteria" }) }))] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default SalesReportsPage;
