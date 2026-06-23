import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, IconButton, Tooltip, } from '@mui/material';
import { ArrowBack, CheckCircle, LinkOff, PlayArrow, DoneAll, CompareArrows, } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { bankService } from '../../services/bankService';
import { formatCurrency, formatDate } from '../../utils/formatters';
const BankReconciliationPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [statementDate, setStatementDate] = useState(new Date());
    const [statementBalance, setStatementBalance] = useState('');
    const [selectedReconId, setSelectedReconId] = useState(null);
    const { data: account } = useQuery({
        queryKey: ['bank-account', id],
        queryFn: () => bankService.getAccountById(id),
        enabled: !!id,
    });
    const { data: reconciliations, isLoading: reconLoading } = useQuery({
        queryKey: ['reconciliations', id],
        queryFn: () => bankService.getReconciliations(id),
        enabled: !!id,
    });
    const { data: activeReconciliation } = useQuery({
        queryKey: ['reconciliation-detail', selectedReconId],
        queryFn: () => bankService.getReconciliationById(selectedReconId),
        enabled: !!selectedReconId,
    });
    const startMutation = useMutation({
        mutationFn: () => bankService.createReconciliation(id, statementDate.toISOString().split('T')[0], Number(statementBalance)),
        onSuccess: (data) => {
            setStartDialogOpen(false);
            setSelectedReconId(data.id);
            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
        },
    });
    const matchMutation = useMutation({
        mutationFn: ({ bankTxId, sysTxId }) => bankService.matchTransaction(selectedReconId, bankTxId, sysTxId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reconciliation-detail'] });
        },
    });
    const unmatchMutation = useMutation({
        mutationFn: (itemId) => bankService.unmatchTransaction(selectedReconId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reconciliation-detail'] });
        },
    });
    const completeMutation = useMutation({
        mutationFn: () => bankService.completeReconciliation(selectedReconId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
            queryClient.invalidateQueries({ queryKey: ['reconciliation-detail'] });
        },
    });
    const reconList = reconciliations?.data ?? [];
    const currentRecon = activeReconciliation ?? reconList.find((r) => r.status === 'IN_PROGRESS');
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Button, { startIcon: _jsx(ArrowBack, {}), onClick: () => navigate(`/banks/${id}/transactions`), variant: "outlined", size: "small", children: "Back" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Bank Reconciliation" })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(PlayArrow, {}), onClick: () => setStartDialogOpen(true), children: "Start New Reconciliation" })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Bank Account" }), _jsx(Typography, { variant: "h6", children: account?.name }), _jsx(Typography, { variant: "body2", children: account?.accountNumber })] }), _jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "System Balance" }), _jsx(Typography, { variant: "h6", color: "primary", children: formatCurrency(account?.currentBalance ?? 0) })] }), _jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Reconciliation Status" }), currentRecon ? (_jsx(Chip, { label: currentRecon.status, color: currentRecon.status === 'COMPLETED' ? 'success' : 'warning', size: "small" })) : (_jsx(Chip, { label: "Not Started", color: "default", size: "small" }))] })] }) }) }), currentRecon && (_jsxs(_Fragment, { children: [_jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "h6", gutterBottom: true, children: [_jsx(CompareArrows, { sx: { mr: 1, verticalAlign: 'middle' } }), "Reconciliation Summary"] }), _jsxs(Grid, { container: true, spacing: 3, mt: 1, children: [_jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Statement Balance" }), _jsx(Typography, { variant: "h6", children: formatCurrency(currentRecon.statementBalance) })] }), _jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "System Balance" }), _jsx(Typography, { variant: "h6", children: formatCurrency(currentRecon.systemBalance) })] }), _jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Adjusted Balance" }), _jsx(Typography, { variant: "h6", color: currentRecon.difference === 0 ? 'success.main' : 'error.main', children: formatCurrency(currentRecon.adjustedBalance) })] }), _jsxs(Grid, { size: { xs: 12, sm: 4 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Difference" }), _jsx(Typography, { variant: "h6", color: currentRecon.difference === 0 ? 'success.main' : 'error.main', children: formatCurrency(currentRecon.difference) })] }), _jsx(Grid, { size: { xs: 12, sm: 8 }, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 2, children: currentRecon.status !== 'COMPLETED' && (_jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(DoneAll, {}), onClick: () => completeMutation.mutate(), disabled: completeMutation.isPending || currentRecon.difference !== 0, children: completeMutation.isPending ? 'Completing...' : 'Complete Reconciliation' })) })] })] }) }), _jsx(Typography, { variant: "h6", gutterBottom: true, children: "Reconciliation Items" }), _jsx(TableContainer, { component: Paper, variant: "outlined", sx: { mb: 3 }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5' }, children: [_jsx(TableCell, { children: "Status" }), _jsx(TableCell, { children: "Bank Date" }), _jsx(TableCell, { children: "Description" }), _jsx(TableCell, { children: "Reference" }), _jsx(TableCell, { align: "right", children: "Bank Amount" }), _jsx(TableCell, { align: "right", children: "System Amount" }), _jsx(TableCell, { children: "Actions" })] }) }), _jsx(TableBody, { children: activeReconciliation === undefined ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, align: "center", children: _jsx(CircularProgress, { size: 24 }) }) })) : activeReconciliation.items.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, align: "center", children: "No items to reconcile" }) })) : (activeReconciliation.items.map((item) => (_jsxs(TableRow, { sx: {
                                                backgroundColor: item.status === 'MATCHED'
                                                    ? '#e8f5e9'
                                                    : item.status === 'UNMATCHED_BANK'
                                                        ? '#fff3e0'
                                                        : item.status === 'UNMATCHED_SYSTEM'
                                                            ? '#fce4ec'
                                                            : 'inherit',
                                            }, children: [_jsx(TableCell, { children: _jsx(Chip, { label: item.status.replace('_', ' '), size: "small", color: item.status === 'MATCHED'
                                                            ? 'success'
                                                            : item.status === 'PARTIAL'
                                                                ? 'warning'
                                                                : 'error' }) }), _jsx(TableCell, { children: formatDate(item.bankDate) }), _jsx(TableCell, { children: item.description }), _jsx(TableCell, { children: item.reference }), _jsx(TableCell, { align: "right", children: formatCurrency(item.bankAmount) }), _jsx(TableCell, { align: "right", children: formatCurrency(item.systemAmount) }), _jsx(TableCell, { children: item.status === 'MATCHED' ? (_jsx(Tooltip, { title: "Unmatch", children: _jsx(IconButton, { size: "small", onClick: () => unmatchMutation.mutate(item.id), disabled: unmatchMutation.isPending, children: _jsx(LinkOff, { fontSize: "small" }) }) })) : (_jsx(Tooltip, { title: "Match", children: _jsx(IconButton, { size: "small", onClick: () => matchMutation.mutate({
                                                                bankTxId: item.bankTransactionId,
                                                                sysTxId: item.systemTransactionId,
                                                            }), disabled: matchMutation.isPending, children: _jsx(CheckCircle, { fontSize: "small" }) }) })) })] }, item.id)))) })] }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Outstanding Bank Items" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Items on bank statement not in system" }), _jsx(Box, { mt: 1, children: currentRecon.outstandingBankItems.length === 0 ? (_jsx(Typography, { variant: "body2", color: "success.main", children: "None" })) : (currentRecon.outstandingBankItems.map((item) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.5, children: [_jsx(Typography, { variant: "body2", children: item.description }), _jsx(Typography, { variant: "body2", children: formatCurrency(item.bankAmount) })] }, item.id)))) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Outstanding System Items" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Items in system not on bank statement" }), _jsx(Box, { mt: 1, children: currentRecon.outstandingSystemItems.length === 0 ? (_jsx(Typography, { variant: "body2", color: "success.main", children: "None" })) : (currentRecon.outstandingSystemItems.map((item) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.5, children: [_jsx(Typography, { variant: "body2", children: item.description }), _jsx(Typography, { variant: "body2", children: formatCurrency(item.systemAmount) })] }, item.id)))) })] }) }) })] })] })), _jsxs(Dialog, { open: startDialogOpen, onClose: () => setStartDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Start New Reconciliation" }), _jsxs(DialogContent, { children: [startMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to start reconciliation" })), _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 0.5 }, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsx(DatePicker, { label: "Statement Date", value: statementDate, onChange: setStatementDate, slotProps: { textField: { fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { label: "Statement Balance", type: "number", fullWidth: true, value: statementBalance, onChange: (e) => setStatementBalance(e.target.value) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setStartDialogOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => startMutation.mutate(), disabled: startMutation.isPending || !statementDate || !statementBalance, children: startMutation.isPending ? 'Starting...' : 'Start' })] })] })] }) }));
};
export default BankReconciliationPage;
