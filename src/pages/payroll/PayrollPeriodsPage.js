import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Alert, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, PlayArrow, Close, Delete, CheckCircle, Schedule } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiService } from '../../services/api';
const statusConfig = {
    DRAFT: { color: '#757575', icon: _jsx(Schedule, { fontSize: "small" }), label: 'Draft' },
    PROCESSING: { color: '#ed6c02', icon: _jsx(PlayArrow, { fontSize: "small" }), label: 'Processing' },
    COMPLETED: { color: '#2e7d32', icon: _jsx(CheckCircle, { fontSize: "small" }), label: 'Completed' },
    CLOSED: { color: '#0288d1', icon: _jsx(Close, { fontSize: "small" }), label: 'Closed' },
};
const periodSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date().required('End date is required').min(Yup.ref('startDate'), 'Must be after start date'),
});
const PayrollPeriodsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const { data: periods, isLoading, error } = useQuery({
        queryKey: ['payroll-periods'],
        queryFn: () => apiService.getPayrollPeriods(),
    });
    const createMutation = useMutation({
        mutationFn: (data) => apiService.createPayrollPeriod(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
            setCreateOpen(false);
        },
    });
    const processMutation = useMutation({
        mutationFn: (id) => apiService.processPayroll(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
            setProcessingId(null);
        },
    });
    const closeMutation = useMutation({
        mutationFn: (id) => apiService.closePayroll(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => apiService.deletePayrollPeriod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
        },
    });
    const formik = useFormik({
        initialValues: {
            name: '',
            startDate: null,
            endDate: null,
        },
        validationSchema: periodSchema,
        onSubmit: (values) => {
            createMutation.mutate({
                name: values.name,
                startDate: values.startDate?.toISOString(),
                endDate: values.endDate?.toISOString(),
            });
        },
    });
    const columns = [
        { field: 'name', headerName: 'Period Name', width: 200, renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value })) },
        {
            field: 'startDate',
            headerName: 'Start Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString(),
        },
        {
            field: 'endDate',
            headerName: 'End Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString(),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => {
                const config = statusConfig[params.value];
                return (_jsx(Chip, { icon: config.icon, label: config.label, size: "small", sx: {
                        bgcolor: `${config.color}15`,
                        color: config.color,
                        fontWeight: 600,
                        border: `1px solid ${config.color}40`,
                    } }));
            },
        },
        { field: 'employeeCount', headerName: 'Employees', width: 100, type: 'number', align: 'center' },
        {
            field: 'totalNetSalary',
            headerName: 'Total Net Salary',
            width: 160,
            valueFormatter: (value, row) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency || 'USD' }).format(value) : '-',
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 220,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const period = params.row;
                return (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View / Process", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/payroll/${period.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), period.status === 'DRAFT' && (_jsx(Tooltip, { title: "Process Payroll", children: _jsx(IconButton, { size: "small", color: "primary", onClick: () => { setProcessingId(period.id); processMutation.mutate(period.id); }, disabled: processMutation.isPending && processingId === period.id, children: _jsx(PlayArrow, { fontSize: "small" }) }) })), period.status === 'COMPLETED' && (_jsx(Tooltip, { title: "Close Period", children: _jsx(IconButton, { size: "small", color: "success", onClick: () => closeMutation.mutate(period.id), children: _jsx(Close, { fontSize: "small" }) }) })), period.status === 'DRAFT' && (_jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => deleteMutation.mutate(period.id), disabled: deleteMutation.isPending, children: _jsx(Delete, { fontSize: "small" }) }) }))] }));
            },
        },
    ];
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { m: 3 }, children: "Failed to load payroll periods. Please try again." }));
    }
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Payroll Periods" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => setCreateOpen(true), children: "Create Period" })] }), _jsx(DataGrid, { rows: periods || [], columns: columns, loading: isLoading, pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true }), _jsxs(Dialog, { open: createOpen, onClose: () => setCreateOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Create Payroll Period" }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Period Name", name: "name", placeholder: "e.g., January 2024", value: formik.values.name, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.name && Boolean(formik.errors.name), helperText: formik.touched.name && formik.errors.name }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Start Date", value: formik.values.startDate, onChange: (v) => formik.setFieldValue('startDate', v), slotProps: {
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            error: formik.touched.startDate && Boolean(formik.errors.startDate),
                                                            helperText: formik.touched.startDate && typeof formik.errors.startDate === 'string' ? formik.errors.startDate : '',
                                                        }
                                                    } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "End Date", value: formik.values.endDate, onChange: (v) => formik.setFieldValue('endDate', v), slotProps: {
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            error: formik.touched.endDate && Boolean(formik.errors.endDate),
                                                            helperText: formik.touched.endDate && typeof formik.errors.endDate === 'string' ? formik.errors.endDate : '',
                                                        }
                                                    } }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setCreateOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Period' })] })] })] })] }) }));
};
export default PayrollPeriodsPage;
