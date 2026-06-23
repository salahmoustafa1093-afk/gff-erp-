import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, Grid, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Add, ArrowBack, FilterList } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { bankService } from '../../services/bankService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
const transactionSchema = Yup.object().shape({
    type: Yup.string().oneOf(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']).required(),
    amount: Yup.number().positive().required(),
    date: Yup.date().required(),
    description: Yup.string().required(),
    reference: Yup.string(),
});
const BankTransactionsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const { data: account } = useQuery({
        queryKey: ['bank-account', id],
        queryFn: () => bankService.getAccountById(id),
        enabled: !!id,
    });
    const { data, isLoading } = useQuery({
        queryKey: ['bank-transactions', id, paginationModel.page, paginationModel.pageSize, typeFilter, statusFilter, dateFrom, dateTo],
        queryFn: () => bankService.getTransactions(id, {
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            type: typeFilter || undefined,
            status: statusFilter || undefined,
            dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
            dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
        }),
        enabled: !!id,
    });
    const createMutation = useMutation({
        mutationFn: (values) => bankService.createTransaction(id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['bank-account'] });
            setOpen(false);
        },
    });
    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            renderCell: (params) => formatDate(params.row.date),
        },
        {
            field: 'transactionNumber',
            headerName: 'Ref #',
            width: 130,
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.row.type, size: "small", color: params.row.type === 'DEPOSIT'
                    ? 'success'
                    : params.row.type === 'WITHDRAWAL'
                        ? 'error'
                        : 'info' })),
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.amount),
        },
        {
            field: 'runningBalance',
            headerName: 'Balance',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.runningBalance),
        },
        { field: 'reference', headerName: 'Reference', width: 130 },
        { field: 'description', headerName: 'Description', width: 200, flex: 1 },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.row.status, size: "small", color: getStatusColor(params.row.status) })),
        },
        {
            field: 'isReconciled',
            headerName: 'Reconciled',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.row.isReconciled ? 'Yes' : 'No', size: "small", color: params.row.isReconciled ? 'success' : 'default', variant: params.row.isReconciled ? 'filled' : 'outlined' })),
        },
    ];
    const transactions = data?.data ?? [];
    return (_jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Button, { startIcon: _jsx(ArrowBack, {}), onClick: () => navigate('/banks'), variant: "outlined", size: "small", children: "Back" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: account?.name ?? 'Bank Transactions' })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => setOpen(true), children: "Add Transaction" })] }), _jsx(Card, { sx: { mb: 2, p: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Account Number" }), _jsx(Typography, { variant: "body1", children: account?.accountNumber ?? '-' })] }), _jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Current Balance" }), _jsx(Typography, { variant: "h6", color: "success.main", fontWeight: "bold", children: formatCurrency(account?.currentBalance ?? 0) })] }), _jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Opening Balance" }), _jsx(Typography, { variant: "body1", children: formatCurrency(account?.openingBalance ?? 0) })] }), _jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsx(Box, { display: "flex", justifyContent: "flex-end", gap: 1, children: _jsx(Button, { variant: "outlined", size: "small", onClick: () => navigate(`/banks/${id}/reconciliation`), children: "Reconciliation" }) }) })] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mb: 2, children: [_jsx(FilterList, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "subtitle2", children: "Filters" })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: typeFilter, label: "Type", onChange: (e) => { setTypeFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "DEPOSIT", children: "Deposit" }), _jsx(MenuItem, { value: "WITHDRAWAL", children: "Withdrawal" }), _jsx(MenuItem, { value: "TRANSFER", children: "Transfer" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => { setStatusFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "PENDING", children: "Pending" }), _jsx(MenuItem, { value: "CLEARED", children: "Cleared" }), _jsx(MenuItem, { value: "BOUNCED", children: "Bounced" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', fullWidth: true } } }) }) }), _jsx(Grid, { size: { xs: 12, sm: 3 }, children: _jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', fullWidth: true } } }) }) })] })] }) }), _jsx(DataGrid, { rows: transactions, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [10, 25, 50, 100], rowCount: data?.total ?? 0, paginationMode: "server", loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (row) => row.id }), _jsxs(Dialog, { open: open, onClose: () => setOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Add Transaction" }), _jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(Formik, { initialValues: {
                                type: 'DEPOSIT',
                                amount: '',
                                date: new Date(),
                                description: '',
                                reference: '',
                            }, validationSchema: transactionSchema, onSubmit: (values) => {
                                createMutation.mutate({
                                    ...values,
                                    amount: Number(values.amount),
                                    date: values.date.toISOString().split('T')[0],
                                });
                            }, children: ({ values, setFieldValue }) => (_jsxs(Form, { children: [_jsxs(DialogContent, { children: [createMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create transaction" })), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: values.type, label: "Type", onChange: (e) => setFieldValue('type', e.target.value), children: [_jsx(MenuItem, { value: "DEPOSIT", children: "Deposit" }), _jsx(MenuItem, { value: "WITHDRAWAL", children: "Withdrawal" }), _jsx(MenuItem, { value: "TRANSFER", children: "Transfer" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "amount", label: "Amount", type: "number", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Date", value: values.date, onChange: (val) => setFieldValue('date', val), slotProps: { textField: { fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "reference", label: "Reference", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "description", label: "Description", multiline: true, rows: 2, fullWidth: true, required: true }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Saving...' : 'Save' })] })] })) }) })] })] }));
};
export default BankTransactionsPage;
