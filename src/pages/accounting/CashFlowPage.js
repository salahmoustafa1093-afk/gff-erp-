import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableRow, CircularProgress, } from '@mui/material';
import { Search, Download, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, printWindow } from '../../utils/formatters';
const CashFlowSection = ({ title, items, subtotal }) => (_jsxs(Box, { mb: 3, children: [_jsx(Box, { sx: { backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, mb: 1 }, children: _jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: title }) }), _jsx(TableContainer, { children: _jsx(Table, { size: "small", children: _jsx(TableBody, { children: items.map((item, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { sx: { pl: 4 }, children: item.description }), _jsx(TableCell, { align: "right", width: 150, children: formatCurrency(item.amount) })] }, idx))) }) }) }), _jsxs(Box, { display: "flex", justifyContent: "space-between", sx: { borderTop: '2px solid #e0e0e0', mt: 1, pt: 1 }, children: [_jsxs(Typography, { variant: "subtitle2", fontWeight: "bold", sx: { pl: 4 }, children: ["Net ", title] }), _jsx(Typography, { variant: "subtitle2", fontWeight: "bold", color: subtotal >= 0 ? 'success.main' : 'error.main', children: formatCurrency(subtotal) })] })] }));
const CashFlowPage = () => {
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ['cash-flow', dateFrom, dateTo],
        queryFn: () => accountingService.getCashFlow({
            dateFrom: dateFrom.toISOString().split('T')[0],
            dateTo: dateTo.toISOString().split('T')[0],
        }),
        enabled: submitted && !!dateFrom && !!dateTo,
    });
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: "Cash Flow Statement" }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Button, { variant: "contained", startIcon: _jsx(Search, {}), onClick: () => setSubmitted(true), disabled: !dateFrom || !dateTo, fullWidth: true, children: "Generate Report" }) })] }) }) }), submitted && isLoading && (_jsx(Box, { display: "flex", justifyContent: "center", py: 4, children: _jsx(CircularProgress, {}) })), submitted && !isLoading && data && (_jsxs(_Fragment, { children: [_jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, children: [_jsx(Button, { size: "small", startIcon: _jsx(Download, {}), variant: "outlined", children: "Export CSV" }), _jsx(Button, { size: "small", startIcon: _jsx(Print, {}), onClick: () => printWindow('cash-flow-print'), variant: "outlined", children: "Print" })] }), _jsx("div", { id: "cash-flow-print", children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", align: "center", gutterBottom: true, fontWeight: "bold", children: "Cash Flow Statement" }), _jsxs(Typography, { variant: "subtitle1", align: "center", color: "text.secondary", gutterBottom: true, children: [formatDate(dateFrom), " to ", formatDate(dateTo)] }), _jsx(CashFlowSection, { title: "Cash Flow from Operating Activities", items: data.operating.items, subtotal: data.operating.subtotal }), _jsx(CashFlowSection, { title: "Cash Flow from Investing Activities", items: data.investing.items, subtotal: data.investing.subtotal }), _jsx(CashFlowSection, { title: "Cash Flow from Financing Activities", items: data.financing.items, subtotal: data.financing.subtotal }), _jsxs(Box, { sx: {
                                                backgroundColor: '#e3f2fd',
                                                p: 2,
                                                borderRadius: 1,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                mb: 2,
                                            }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Net Change in Cash" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: data.netChange >= 0 ? 'success.main' : 'error.main', children: formatCurrency(data.netChange) })] }), _jsxs(Box, { sx: { borderTop: '2px solid #000', pt: 2 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", mb: 1, children: [_jsx(Typography, { variant: "subtitle1", children: "Opening Cash Balance" }), _jsx(Typography, { variant: "subtitle1", fontWeight: "medium", children: formatCurrency(data.openingBalance) })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", sx: { backgroundColor: '#2e7d32', color: 'white', p: 2, borderRadius: 1 }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Closing Cash Balance" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(data.closingBalance) })] })] })] }) }) })] }))] }) }));
};
export default CashFlowPage;
