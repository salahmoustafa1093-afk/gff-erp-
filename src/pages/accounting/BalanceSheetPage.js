import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableRow, Alert, Collapse, IconButton, CircularProgress, } from '@mui/material';
import { Search, Download, Print, ExpandMore, ExpandLess, CheckCircle, } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, printWindow } from '../../utils/formatters';
const BalanceSheetSection = ({ title, items, subtotal, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (_jsxs(Box, { mb: 2, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", sx: { backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, cursor: 'pointer' }, onClick: () => setExpanded(!expanded), children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: title }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: formatCurrency(subtotal) }), _jsx(IconButton, { size: "small", children: expanded ? _jsx(ExpandLess, {}) : _jsx(ExpandMore, {}) })] })] }), _jsx(Collapse, { in: expanded, children: _jsx(TableContainer, { children: _jsx(Table, { size: "small", children: _jsx(TableBody, { children: items.map((item, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { sx: { pl: 4 }, children: item.accountName }), _jsx(TableCell, { align: "right", children: formatCurrency(item.amount) })] }, idx))) }) }) }) })] }));
};
const BalanceSheetPage = () => {
    const [asOfDate, setAsOfDate] = useState(new Date());
    const [submitted, setSubmitted] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ['balance-sheet', asOfDate],
        queryFn: () => accountingService.getBalanceSheet({
            asOfDate: asOfDate.toISOString().split('T')[0],
        }),
        enabled: submitted && !!asOfDate,
    });
    const handlePrint = () => printWindow('balance-sheet-print');
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: "Balance Sheet" }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "As of Date", value: asOfDate, onChange: setAsOfDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Button, { variant: "contained", startIcon: _jsx(Search, {}), onClick: () => setSubmitted(true), disabled: !asOfDate, fullWidth: true, children: "Generate Report" }) })] }) }) }), submitted && isLoading && (_jsx(Box, { display: "flex", justifyContent: "center", py: 4, children: _jsx(CircularProgress, {}) })), submitted && !isLoading && data && (_jsxs(_Fragment, { children: [data.isBalanced ? (_jsx(Alert, { severity: "success", icon: _jsx(CheckCircle, {}), sx: { mb: 2 }, children: "Balance Sheet is balanced: Assets = Liabilities + Equity" })) : (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Balance Sheet is NOT balanced! Difference:", ' ', formatCurrency(Math.abs(data.totalAssets - data.totalLiabilities - data.totalEquity))] })), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, children: [_jsx(Button, { size: "small", startIcon: _jsx(Download, {}), variant: "outlined", children: "Export CSV" }), _jsx(Button, { size: "small", startIcon: _jsx(Print, {}), onClick: handlePrint, variant: "outlined", children: "Print" })] }), _jsx("div", { id: "balance-sheet-print", children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", align: "center", gutterBottom: true, fontWeight: "bold", children: "Balance Sheet" }), _jsxs(Typography, { variant: "subtitle1", align: "center", color: "text.secondary", gutterBottom: true, children: ["As of ", formatDate(asOfDate)] }), _jsx(BalanceSheetSection, { title: "ASSETS", items: data.assets.items, subtotal: data.assets.subtotal }), _jsx(BalanceSheetSection, { title: "LIABILITIES", items: data.liabilities.items, subtotal: data.liabilities.subtotal }), _jsx(BalanceSheetSection, { title: "EQUITY", items: data.equity.items, subtotal: data.equity.subtotal }), _jsxs(Box, { sx: {
                                                mt: 3,
                                                p: 2,
                                                backgroundColor: '#e8f5e9',
                                                borderRadius: 1,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Total Assets" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "success.main", children: formatCurrency(data.totalAssets) })] }), _jsxs(Box, { sx: {
                                                mt: 1,
                                                p: 2,
                                                backgroundColor: '#fce4ec',
                                                borderRadius: 1,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Total Liabilities + Equity" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(data.totalLiabilities + data.totalEquity) })] })] }) }) })] }))] }) }));
};
export default BalanceSheetPage;
