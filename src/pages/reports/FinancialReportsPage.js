import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, } from '@mui/material';
import { Assessment, Print } from '@mui/icons-material';
import TrialBalancePage from '../accounting/TrialBalancePage';
import BalanceSheetPage from '../accounting/BalanceSheetPage';
import IncomeStatementPage from '../accounting/IncomeStatementPage';
import CashFlowPage from '../accounting/CashFlowPage';
import GeneralLedgerPage from '../accounting/GeneralLedgerPage';
const reportOptions = [
    { value: 'none', label: 'Select a report...' },
    { value: 'trial-balance', label: 'Trial Balance' },
    { value: 'balance-sheet', label: 'Balance Sheet' },
    { value: 'income-statement', label: 'Income Statement' },
    { value: 'cash-flow', label: 'Cash Flow Statement' },
    { value: 'general-ledger', label: 'General Ledger' },
];
const FinancialReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState('none');
    const renderReport = () => {
        switch (selectedReport) {
            case 'trial-balance':
                return _jsx(TrialBalancePage, {});
            case 'balance-sheet':
                return _jsx(BalanceSheetPage, {});
            case 'income-statement':
                return _jsx(IncomeStatementPage, {});
            case 'cash-flow':
                return _jsx(CashFlowPage, {});
            case 'general-ledger':
                return _jsx(GeneralLedgerPage, {});
            default:
                return null;
        }
    };
    return (_jsxs(Box, { children: [selectedReport === 'none' && (_jsxs(Box, { p: 3, children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: [_jsx(Assessment, { sx: { mr: 1, verticalAlign: 'middle' } }), "Financial Reports"] }), _jsx(Card, { sx: { maxWidth: 600, mx: 'auto', mt: 4 }, children: _jsxs(CardContent, { sx: { p: 4 }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, align: "center", children: "Select a Financial Report" }), _jsx(Typography, { variant: "body2", color: "text.secondary", align: "center", sx: { mb: 3 }, children: "Choose from the available financial reports to generate and view." }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Report Type" }), _jsx(Select, { value: selectedReport, label: "Report Type", onChange: (e) => setSelectedReport(e.target.value), children: reportOptions.map((opt) => (_jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))) })] }), _jsx(Grid, { container: true, spacing: 2, sx: { mt: 2 }, children: reportOptions.filter((o) => o.value !== 'none').map((opt) => (_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Card, { variant: "outlined", sx: {
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': { backgroundColor: '#f5f5f5', borderColor: 'primary.main' },
                                            }, onClick: () => setSelectedReport(opt.value), children: _jsx(CardContent, { sx: { textAlign: 'center', py: 2 }, children: _jsx(Typography, { variant: "subtitle1", fontWeight: "medium", children: opt.label }) }) }) }, opt.value))) })] }) })] })), selectedReport !== 'none' && (_jsxs(_Fragment, { children: [_jsxs(Box, { p: 2, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Button, { variant: "outlined", size: "small", onClick: () => setSelectedReport('none'), children: "Back to Report Selection" }), _jsx(Box, { display: "flex", gap: 1, children: _jsx(Button, { size: "small", startIcon: _jsx(Print, {}), variant: "outlined", children: "Print" }) })] }), renderReport()] }))] }));
};
export default FinancialReportsPage;
