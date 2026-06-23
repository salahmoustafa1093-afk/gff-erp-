import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, CircularProgress, } from '@mui/material';
import { Search, Download, Print, Warning } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, downloadCSV, printWindow } from '../../utils/formatters';
const TrialBalancePage = () => {
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ['trial-balance', dateFrom, dateTo],
        queryFn: () => accountingService.getTrialBalance({
            dateFrom: dateFrom.toISOString().split('T')[0],
            dateTo: dateTo.toISOString().split('T')[0],
        }),
        enabled: submitted && !!dateFrom && !!dateTo,
    });
    const rows = data?.rows ?? [];
    const isBalanced = data?.isBalanced ?? true;
    const handleExportCSV = () => {
        if (!rows.length)
            return;
        const exportData = rows.map((r) => ({
            'Account Code': r.accountCode,
            'Account Name': r.accountName,
            'Opening Dr': r.openingBalanceDebit,
            'Opening Cr': r.openingBalanceCredit,
            'Movement Dr': r.movementsDebit,
            'Movement Cr': r.movementsCredit,
            'Closing Dr': r.closingBalanceDebit,
            'Closing Cr': r.closingBalanceCredit,
        }));
        downloadCSV(exportData, `trial-balance-${dateFrom?.toISOString().split('T')[0]}-to-${dateTo?.toISOString().split('T')[0]}.csv`);
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: "Trial Balance" }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Button, { variant: "contained", startIcon: _jsx(Search, {}), onClick: () => setSubmitted(true), disabled: !dateFrom || !dateTo, fullWidth: true, children: "Generate Report" }) })] }) }) }), submitted && isLoading && (_jsx(Box, { display: "flex", justifyContent: "center", py: 4, children: _jsx(CircularProgress, {}) })), submitted && !isLoading && data && (_jsxs(_Fragment, { children: [!isBalanced && (_jsxs(Alert, { severity: "error", icon: _jsx(Warning, {}), sx: { mb: 2 }, children: ["Trial balance is NOT balanced! Difference: ", formatCurrency(Math.abs((data.totalDebit ?? 0) - (data.totalCredit ?? 0)))] })), isBalanced && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, children: "Trial balance is balanced." })), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, children: [_jsx(Button, { size: "small", startIcon: _jsx(Download, {}), onClick: handleExportCSV, variant: "outlined", children: "Export CSV" }), _jsx(Button, { size: "small", startIcon: _jsx(Print, {}), onClick: () => printWindow('trial-balance-print'), variant: "outlined", children: "Print" })] }), _jsx("div", { id: "trial-balance-print", children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Trial Balance" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: ["Period: ", formatDate(dateFrom), " to ", formatDate(dateTo)] }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5' }, children: [_jsx(TableCell, { children: "Code" }), _jsx(TableCell, { children: "Account Name" }), _jsx(TableCell, { align: "right", children: "Opening Dr" }), _jsx(TableCell, { align: "right", children: "Opening Cr" }), _jsx(TableCell, { align: "right", children: "Movement Dr" }), _jsx(TableCell, { align: "right", children: "Movement Cr" }), _jsx(TableCell, { align: "right", children: "Closing Dr" }), _jsx(TableCell, { align: "right", children: "Closing Cr" })] }) }), _jsxs(TableBody, { children: [rows.map((row) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: row.accountCode }), _jsx(TableCell, { children: row.accountName }), _jsx(TableCell, { align: "right", children: row.openingBalanceDebit > 0 ? formatCurrency(row.openingBalanceDebit) : '-' }), _jsx(TableCell, { align: "right", children: row.openingBalanceCredit > 0 ? formatCurrency(row.openingBalanceCredit) : '-' }), _jsx(TableCell, { align: "right", children: row.movementsDebit > 0 ? formatCurrency(row.movementsDebit) : '-' }), _jsx(TableCell, { align: "right", children: row.movementsCredit > 0 ? formatCurrency(row.movementsCredit) : '-' }), _jsx(TableCell, { align: "right", children: row.closingBalanceDebit > 0 ? formatCurrency(row.closingBalanceDebit) : '-' }), _jsx(TableCell, { align: "right", children: row.closingBalanceCredit > 0 ? formatCurrency(row.closingBalanceCredit) : '-' })] }, row.accountId))), _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5', fontWeight: 'bold' }, children: [_jsx(TableCell, { colSpan: 2, align: "right", children: _jsx("strong", { children: "TOTALS" }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(data.totalDebit ?? 0) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(data.totalCredit ?? 0) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.movementsDebit, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.movementsCredit, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.closingBalanceDebit, 0)) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(rows.reduce((s, r) => s + r.closingBalanceCredit, 0)) }) })] })] })] }) })] }) }) })] }))] }) }));
};
export default TrialBalancePage;
