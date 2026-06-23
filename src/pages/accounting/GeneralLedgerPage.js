import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, TextField as MuiTextField, CircularProgress, } from '@mui/material';
import { Search, Download, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { settingsService } from '../../services/settingsService';
import { formatCurrency, formatDate, downloadCSV, printWindow } from '../../utils/formatters';
const GeneralLedgerPage = () => {
    const [accountId, setAccountId] = useState(null);
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [branchId, setBranchId] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { data: accountsData } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: () => accountingService.getAccounts(),
    });
    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => settingsService.getBranches(),
    });
    const accounts = accountsData?.data ?? [];
    const branches = branchesData?.data ?? [];
    const { data: ledgerData, isLoading } = useQuery({
        queryKey: ['general-ledger', accountId, dateFrom, dateTo, branchId],
        queryFn: () => accountingService.getGeneralLedger({
            accountId: accountId ?? undefined,
            dateFrom: dateFrom.toISOString().split('T')[0],
            dateTo: dateTo.toISOString().split('T')[0],
            branchId: branchId || undefined,
            pageSize: 1000,
        }),
        enabled: submitted && !!dateFrom && !!dateTo,
    });
    const { data: summary } = useQuery({
        queryKey: ['general-ledger-summary', accountId, dateFrom, dateTo],
        queryFn: () => accountingService.getGeneralLedgerSummary({
            accountId: accountId ?? undefined,
            dateFrom: dateFrom.toISOString().split('T')[0],
            dateTo: dateTo.toISOString().split('T')[0],
        }),
        enabled: submitted && !!dateFrom && !!dateTo,
    });
    const entries = ledgerData?.data ?? [];
    const selectedAccount = accounts.find((a) => a.id === accountId);
    const handleExportCSV = () => {
        if (!entries.length)
            return;
        const data = entries.map((e) => ({
            Date: formatDate(e.date),
            Reference: e.reference,
            Description: e.description,
            Debit: e.debit,
            Credit: e.credit,
            Balance: e.runningBalance,
        }));
        downloadCSV(data, `general-ledger-${selectedAccount?.code ?? 'all'}-${dateFrom?.toISOString().split('T')[0]}.csv`);
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: "General Ledger" }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Autocomplete, { options: accounts, getOptionLabel: (a) => `${a.code} - ${a.name}`, value: selectedAccount ?? null, onChange: (_, val) => setAccountId(val?.id ?? null), renderInput: (params) => (_jsx(MuiTextField, { ...params, label: "Account (leave empty for all)", size: "small", fullWidth: true })) }) }), _jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsx(DatePicker, { label: "Date From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsx(DatePicker, { label: "Date To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 2 }, children: _jsx(Button, { variant: "contained", startIcon: _jsx(Search, {}), onClick: () => setSubmitted(true), disabled: !dateFrom || !dateTo, fullWidth: true, children: "Query" }) })] }) }) }), submitted && isLoading && (_jsx(Box, { display: "flex", justifyContent: "center", py: 4, children: _jsx(CircularProgress, {}) })), submitted && !isLoading && summary && (_jsxs(_Fragment, { children: [_jsx(Card, { sx: { mb: 2 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Opening Balance" }), _jsx(Typography, { variant: "h6", children: formatCurrency(summary.openingBalance) })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Debits" }), _jsx(Typography, { variant: "h6", color: "success.main", children: formatCurrency(summary.totalDebits) })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Credits" }), _jsx(Typography, { variant: "h6", color: "error.main", children: formatCurrency(summary.totalCredits) })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Closing Balance" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(summary.closingBalance) })] })] }) }) }), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, children: [_jsx(Button, { size: "small", startIcon: _jsx(Download, {}), onClick: handleExportCSV, variant: "outlined", children: "Export CSV" }), _jsx(Button, { size: "small", startIcon: _jsx(Print, {}), onClick: () => printWindow('general-ledger-print'), variant: "outlined", children: "Print" })] }), _jsx("div", { id: "general-ledger-print", children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : 'All Accounts' }), _jsxs(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: ["Period: ", formatDate(dateFrom), " to ", formatDate(dateTo)] }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5' }, children: [_jsx(TableCell, { children: "Date" }), _jsx(TableCell, { children: "Reference" }), _jsx(TableCell, { children: "Description" }), _jsx(TableCell, { align: "right", children: "Debit" }), _jsx(TableCell, { align: "right", children: "Credit" }), _jsx(TableCell, { align: "right", children: "Balance" })] }) }), _jsxs(TableBody, { children: [_jsxs(TableRow, { sx: { backgroundColor: '#fffde7' }, children: [_jsx(TableCell, { colSpan: 5, align: "right", children: _jsx("strong", { children: "Opening Balance" }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(summary.openingBalance) }) })] }), entries.map((entry) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: formatDate(entry.date) }), _jsx(TableCell, { children: entry.reference }), _jsx(TableCell, { children: entry.description }), _jsx(TableCell, { align: "right", children: entry.debit > 0 ? formatCurrency(entry.debit) : '-' }), _jsx(TableCell, { align: "right", children: entry.credit > 0 ? formatCurrency(entry.credit) : '-' }), _jsx(TableCell, { align: "right", fontWeight: "medium", children: formatCurrency(entry.runningBalance) })] }, entry.id))), _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5', fontWeight: 'bold' }, children: [_jsx(TableCell, { colSpan: 3, align: "right", children: _jsx("strong", { children: "Totals / Closing" }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(summary.totalDebits) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(summary.totalCredits) }) }), _jsx(TableCell, { align: "right", children: _jsx("strong", { children: formatCurrency(summary.closingBalance) }) })] })] })] }) }), entries.length === 0 && (_jsx(Box, { textAlign: "center", py: 4, children: _jsx(Typography, { color: "text.secondary", children: "No transactions found for the selected criteria" }) }))] }) }) })] }))] }) }));
};
export default GeneralLedgerPage;
