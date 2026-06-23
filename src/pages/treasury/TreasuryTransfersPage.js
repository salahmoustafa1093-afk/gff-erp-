import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, Grid, Alert, Stepper, Step, StepLabel, StepContent, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Add, Send, CheckCircle, Cancel, SwapHoriz, } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { treasuryService } from '../../services/treasuryService';
import { formatCurrency, formatDate } from '../../utils/formatters';
const transferSchema = Yup.object().shape({
    fromType: Yup.string().oneOf(['CASHBOX', 'BANK']).required('From type is required'),
    fromAccountId: Yup.string().required('From account is required'),
    toType: Yup.string().oneOf(['CASHBOX', 'BANK']).required('To type is required'),
    toAccountId: Yup.string().required('To account is required'),
    amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
    date: Yup.date().required('Date is required'),
    notes: Yup.string(),
});
const statusWorkflow = {
    DRAFT: { label: 'Draft', color: 'warning' },
    PENDING: { label: 'Pending Approval', color: 'info' },
    APPROVED: { label: 'Approved', color: 'success' },
    REJECTED: { label: 'Rejected', color: 'error' },
    COMPLETED: { label: 'Completed', color: 'success' },
};
const getWorkflowStep = (status) => {
    switch (status) {
        case 'DRAFT': return 0;
        case 'PENDING': return 1;
        case 'APPROVED': return 1;
        case 'REJECTED': return 1;
        case 'COMPLETED': return 2;
        default: return 0;
    }
};
const TreasuryTransfersPage = () => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [statusFilter, setStatusFilter] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['transfers', paginationModel.page, paginationModel.pageSize, statusFilter],
        queryFn: () => treasuryService.getTransfers({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            status: statusFilter || undefined,
        }),
    });
    const createMutation = useMutation({
        mutationFn: treasuryService.createTransfer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            setOpen(false);
        },
    });
    const approveMutation = useMutation({
        mutationFn: treasuryService.approveTransfer,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
    });
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => treasuryService.rejectTransfer(id, reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
    });
    const columns = [
        { field: 'transferNumber', headerName: 'Transfer #', width: 150 },
        {
            field: 'fromAccountName',
            headerName: 'From',
            width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", children: params.row.fromAccountName }), _jsx(Chip, { label: params.row.fromType, size: "small", variant: "outlined" })] })),
        },
        {
            field: 'toAccountName',
            headerName: 'To',
            width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", children: params.row.toAccountName }), _jsx(Chip, { label: params.row.toType, size: "small", variant: "outlined" })] })),
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
            field: 'date',
            headerName: 'Date',
            width: 120,
            renderCell: (params) => formatDate(params.row.date),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params) => {
                const sw = statusWorkflow[params.row.status];
                return (_jsx(Chip, { label: sw?.label ?? params.row.status, color: sw?.color ?? 'default', size: "small" }));
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 280,
            sortable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { size: "small", variant: "text", onClick: () => setSelectedTransfer(params.row), children: "Workflow" }), params.row.status === 'PENDING' && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "small", variant: "contained", color: "success", startIcon: _jsx(CheckCircle, {}), onClick: () => approveMutation.mutate(params.row.id), disabled: approveMutation.isPending, children: "Approve" }), _jsx(Button, { size: "small", variant: "outlined", color: "error", startIcon: _jsx(Cancel, {}), onClick: () => rejectMutation.mutate({ id: params.row.id, reason: 'Rejected by user' }), disabled: rejectMutation.isPending, children: "Reject" })] }))] })),
        },
    ];
    const transfers = data?.data ?? [];
    const totalRows = data?.total ?? 0;
    return (_jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Treasury Transfers" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => setOpen(true), children: "New Transfer" })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Box, { display: "flex", gap: 2, mb: 2, children: _jsxs(FormControl, { sx: { minWidth: 150 }, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => {
                                            setStatusFilter(e.target.value);
                                            setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                        }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "DRAFT", children: "Draft" }), _jsx(MenuItem, { value: "PENDING", children: "Pending" }), _jsx(MenuItem, { value: "APPROVED", children: "Approved" }), _jsx(MenuItem, { value: "REJECTED", children: "Rejected" }), _jsx(MenuItem, { value: "COMPLETED", children: "Completed" })] })] }) }), _jsx(DataGrid, { rows: transfers, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [5, 10, 25, 50], rowCount: totalRows, paginationMode: "server", loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (row) => row.id })] }) }), _jsxs(Dialog, { open: open, onClose: () => setOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(SwapHoriz, {}), "Create Transfer"] }) }), _jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(Formik, { initialValues: {
                                fromType: 'CASHBOX',
                                fromAccountId: '',
                                toType: 'BANK',
                                toAccountId: '',
                                amount: '',
                                date: new Date(),
                                notes: '',
                            }, validationSchema: transferSchema, onSubmit: (values) => {
                                createMutation.mutate({
                                    ...values,
                                    amount: Number(values.amount),
                                    date: values.date.toISOString().split('T')[0],
                                });
                            }, children: ({ values, setFieldValue, errors, touched }) => (_jsxs(Form, { children: [_jsxs(DialogContent, { children: [createMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create transfer" })), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "From Type" }), _jsxs(Select, { value: values.fromType, label: "From Type", onChange: (e) => {
                                                                        setFieldValue('fromType', e.target.value);
                                                                        setFieldValue('fromAccountId', '');
                                                                    }, children: [_jsx(MenuItem, { value: "CASHBOX", children: "Cashbox" }), _jsx(MenuItem, { value: "BANK", children: "Bank" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "fromAccountId", label: "From Account ID", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "To Type" }), _jsxs(Select, { value: values.toType, label: "To Type", onChange: (e) => {
                                                                        setFieldValue('toType', e.target.value);
                                                                        setFieldValue('toAccountId', '');
                                                                    }, children: [_jsx(MenuItem, { value: "CASHBOX", children: "Cashbox" }), _jsx(MenuItem, { value: "BANK", children: "Bank" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "toAccountId", label: "To Account ID", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "amount", label: "Amount", type: "number", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Date", value: values.date, onChange: (val) => setFieldValue('date', val), slotProps: {
                                                                textField: {
                                                                    fullWidth: true,
                                                                    error: touched.date && Boolean(errors.date),
                                                                    helperText: touched.date && errors.date ? String(errors.date) : '',
                                                                },
                                                            } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "notes", label: "Notes", multiline: true, rows: 2, fullWidth: true }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(Send, {}), disabled: createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Transfer' })] })] })) }) })] }), selectedTransfer && (_jsxs(Dialog, { open: !!selectedTransfer, onClose: () => setSelectedTransfer(null), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Transfer Approval Workflow" }), _jsx(DialogContent, { children: _jsxs(Stepper, { orientation: "vertical", activeStep: getWorkflowStep(selectedTransfer.status), children: [_jsxs(Step, { completed: ['PENDING', 'APPROVED', 'COMPLETED'].includes(selectedTransfer.status), children: [_jsx(StepLabel, { children: "Draft Created" }), _jsx(StepContent, { children: _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Transfer #", selectedTransfer.transferNumber, " created on", ' ', formatDate(selectedTransfer.createdAt), " by ", selectedTransfer.createdBy] }) })] }), _jsxs(Step, { completed: ['APPROVED', 'COMPLETED'].includes(selectedTransfer.status), active: selectedTransfer.status === 'PENDING', children: [_jsx(StepLabel, { children: selectedTransfer.status === 'REJECTED' ? 'Approval Rejected' : 'Pending Approval' }), _jsx(StepContent, { children: selectedTransfer.approvedBy && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: [selectedTransfer.status === 'REJECTED' ? 'Rejected' : 'Approved', " by", ' ', selectedTransfer.approvedBy, " on ", formatDate(selectedTransfer.approvedAt ?? '')] })) })] }), _jsxs(Step, { completed: selectedTransfer.status === 'COMPLETED', children: [_jsx(StepLabel, { children: "Completed" }), _jsx(StepContent, { children: _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Transfer amount: ", formatCurrency(selectedTransfer.amount)] }) })] })] }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setSelectedTransfer(null), children: "Close" }) })] }))] }));
};
export default TreasuryTransfersPage;
