import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Tabs, Tab, CircularProgress, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Download, BarChart as BarChartIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';
// API integration - this would normally come from a service
const useSalesReport = (type, dateFrom, dateTo) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const fetch = () => {
        setIsLoading(true);
        // Replace with actual API call
        setTimeout(() => {
            setData([]);
            setIsLoading(false);
        }, 500);
    };
    return { data, isLoading, fetch };
};
const reportTypes = ['Daily', 'Monthly', 'Yearly', 'By Product', 'By Customer', 'By Sales Rep'];
const SalesReportsPage = () => {
    const [tab, setTab] = useState(0);
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const { data: reportData, isLoading, fetch } = useSalesReport(reportTypes[tab], dateFrom, dateTo);
    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 110,
            renderCell: (params) => formatDate(params.row.date),
        },
        { field: 'invoiceNumber', headerName: 'Invoice #', width: 120 },
        { field: 'customerName', headerName: 'Customer', width: 150, flex: 1 },
        { field: 'productName', headerName: 'Product', width: 150 },
        {
            field: 'quantity',
            headerName: 'Qty',
            width: 80,
            align: 'right',
            headerAlign: 'right',
        },
        {
            field: 'unitPrice',
            headerName: 'Unit Price',
            width: 110,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.unitPrice),
        },
        {
            field: 'totalAmount',
            headerName: 'Total',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.totalAmount),
        },
        { field: 'salesRep', headerName: 'Sales Rep', width: 120 },
    ];
    const chartData = [
        { label: 'Week 1', revenue: 45000, target: 40000 },
        { label: 'Week 2', revenue: 52000, target: 40000 },
        { label: 'Week 3', revenue: 38000, target: 40000 },
        { label: 'Week 4', revenue: 61000, target: 40000 },
    ];
    const totalRevenue = reportData.reduce((s, r) => s + r.totalAmount, 0);
    const totalInvoices = reportData.length;
    const avgOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: "Sales Reports" }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", children: [_jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(Button, { variant: "contained", onClick: fetch, disabled: !dateFrom || !dateTo || isLoading, children: isLoading ? _jsx(CircularProgress, { size: 20 }) : 'Generate' }), _jsx(Box, { flex: 1 }), _jsx(Button, { size: "small", startIcon: _jsx(Download, {}), variant: "outlined", onClick: () => downloadCSV(reportData, 'sales-report.csv'), children: "Export" })] }) }) }), _jsxs(Box, { display: "flex", gap: 2, mb: 3, children: [_jsx(Card, { sx: { minWidth: 160 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Revenue" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "success.main", children: formatCurrency(totalRevenue) })] }) }), _jsx(Card, { sx: { minWidth: 160 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Invoices" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary.main", children: totalInvoices })] }) }), _jsx(Card, { sx: { minWidth: 160 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Avg Order Value" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(avgOrderValue) })] }) })] }), _jsx(Tabs, { value: tab, onChange: (_, v) => setTab(v), sx: { mb: 2 }, children: reportTypes.map((t) => (_jsx(Tab, { label: t }, t))) }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "h6", gutterBottom: true, children: [_jsx(BarChartIcon, { sx: { mr: 1, verticalAlign: 'middle' } }), "Revenue Trend"] }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "label" }), _jsx(YAxis, { tickFormatter: (v) => `EGP ${(v / 1000).toFixed(0)}K` }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "revenue", fill: "#4caf50", name: "Revenue" }), _jsx(Bar, { dataKey: "target", fill: "#ff9800", name: "Target" })] }) }) })] }) }), _jsx(Card, { children: _jsx(CardContent, { children: _jsx(DataGrid, { rows: reportData, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [10, 25, 50, 100], loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (_, index) => index }) }) })] }) }));
};
export default SalesReportsPage;
