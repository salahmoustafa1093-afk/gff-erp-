import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableRow, LinearProgress, CircularProgress, } from '@mui/material';
import { Search, Download, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, formatPercentage, printWindow } from '../../utils/formatters';
const IncomeSection = ({ title, items, subtotal, isDeduction }) => (_jsxs(Box, { mb: 2, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", sx: { backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: title }), _jsx(Typography, { variant: "subtitle1", fontWeight: "bold", color: isDeduction && subtotal > 0 ? 'error.main' : 'inherit', children: formatCurrency(subtotal) })] }), _jsx(TableContainer, { children: _jsx(Table, { size: "small", children: _jsx(TableBody, { children: items.map((item, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { sx: { pl: 4 }, children: item.accountName }), _jsx(TableCell, { align: "right", children: formatCurrency(item.amount) })] }, idx))) }) }) })] }));
const IncomeStatementPage = () => {
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ['income-statement', dateFrom, dateTo],
        queryFn: () => accountingService.getIncomeStatement({
            dateFrom: dateFrom.toISOString().split('T')[0],
            dateTo: dateTo.toISOString().split('T')[0],
        }),
        enabled: submitted && !!dateFrom && !!dateTo,
    });
    const revenue = data?.revenue.subtotal ?? 0;
    const cogs = data?.cogs.subtotal ?? 0;
    const grossProfit = data?.grossProfit ?? 0;
    const operatingExpenses = data?.operatingExpenses.subtotal ?? 0;
    const netOperatingIncome = data?.netOperatingIncome ?? 0;
    const netIncome = data?.netIncome ?? 0;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
    const chartData = data?.revenueChart ?? [];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: "Income Statement" }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Button, { variant: "contained", startIcon: _jsx(Search, {}), onClick: () => setSubmitted(true), disabled: !dateFrom || !dateTo, fullWidth: true, children: "Generate Report" }) })] }) }) }), submitted && isLoading && (_jsx(Box, { display: "flex", justifyContent: "center", py: 4, children: _jsx(CircularProgress, {}) })), submitted && !isLoading && data && (_jsxs(_Fragment, { children: [_jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, children: [_jsx(Button, { size: "small", startIcon: _jsx(Download, {}), variant: "outlined", children: "Export CSV" }), _jsx(Button, { size: "small", startIcon: _jsx(Print, {}), onClick: () => printWindow('income-statement-print'), variant: "outlined", children: "Print" })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, lg: 8 }, children: _jsx("div", { id: "income-statement-print", children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", align: "center", gutterBottom: true, fontWeight: "bold", children: "Income Statement" }), _jsxs(Typography, { variant: "subtitle1", align: "center", color: "text.secondary", gutterBottom: true, children: [formatDate(dateFrom), " to ", formatDate(dateTo)] }), _jsx(IncomeSection, { title: "REVENUE", items: data.revenue.items, subtotal: revenue }), _jsx(IncomeSection, { title: "COST OF GOODS SOLD", items: data.cogs.items, subtotal: cogs, isDeduction: true }), _jsxs(Box, { sx: {
                                                            backgroundColor: '#e3f2fd',
                                                            p: 1.5,
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            mb: 2,
                                                        }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Gross Profit" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary.main", children: formatCurrency(grossProfit) })] }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Gross Margin: ", formatPercentage(grossMargin)] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(grossMargin, 100), sx: { mt: 0.5, height: 8, borderRadius: 4 } })] }), _jsx(IncomeSection, { title: "OPERATING EXPENSES", items: data.operatingExpenses.items, subtotal: operatingExpenses, isDeduction: true }), _jsxs(Box, { sx: {
                                                            backgroundColor: '#e8f5e9',
                                                            p: 1.5,
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            mb: 2,
                                                        }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Net Operating Income" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "success.main", children: formatCurrency(netOperatingIncome) })] }), data.otherIncome.items.length > 0 && (_jsx(IncomeSection, { title: "OTHER INCOME", items: data.otherIncome.items, subtotal: data.otherIncome.subtotal })), data.otherExpenses.items.length > 0 && (_jsx(IncomeSection, { title: "OTHER EXPENSES", items: data.otherExpenses.items, subtotal: data.otherExpenses.subtotal, isDeduction: true })), _jsxs(Box, { sx: {
                                                            backgroundColor: '#2e7d32',
                                                            color: 'white',
                                                            p: 2,
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            mt: 3,
                                                        }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "NET INCOME" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(netIncome) })] }), _jsxs(Box, { sx: { mt: 1 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Net Margin: ", formatPercentage(netMargin)] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(netMargin, 100), color: "success", sx: { mt: 0.5, height: 8, borderRadius: 4 } })] })] }) }) }) }), _jsxs(Grid, { size: { xs: 12, lg: 4 }, children: [_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Revenue vs Expenses" }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 10 } }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "revenue", fill: "#4caf50", name: "Revenue" }), _jsx(Bar, { dataKey: "expense", fill: "#f44336", name: "Expenses" })] }) }) })] }) }), _jsx(Card, { sx: { mt: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Key Metrics" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { size: { xs: 6 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Gross Margin" }), _jsx(Typography, { variant: "h5", color: "primary", fontWeight: "bold", children: formatPercentage(grossMargin) })] }), _jsxs(Grid, { size: { xs: 6 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Net Margin" }), _jsx(Typography, { variant: "h5", color: "success.main", fontWeight: "bold", children: formatPercentage(netMargin) })] }), _jsxs(Grid, { size: { xs: 6 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Operating Margin" }), _jsx(Typography, { variant: "h6", children: formatPercentage(revenue > 0 ? (netOperatingIncome / revenue) * 100 : 0) })] }), _jsxs(Grid, { size: { xs: 6 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Revenue" }), _jsx(Typography, { variant: "h6", children: formatCurrency(revenue) })] })] })] }) })] })] })] }))] }) }));
};
export default IncomeStatementPage;
