import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, Divider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, CheckCircle, Clear, CalendarMonth, ViewList } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiService } from '../../services/api';
const typeIcons = {
    CALL: '#0288d1',
    MEETING: '#9c27b0',
    EMAIL: '#ed6c02',
    TASK: '#2e7d32',
    NOTE: '#757575',
    REMINDER: '#d32f2f',
};
const ActivitiesPage = () => {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({ type: '', status: '', assignedTo: '', page: 1, limit: 25 });
    const [viewMode, setViewMode] = useState('list');
    const [formOpen, setFormOpen] = useState(false);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['activities', filters],
        queryFn: () => apiService.getActivities(filters),
    });
    const completeMutation = useMutation({
        mutationFn: (id) => apiService.markActivityComplete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });
    const createMutation = useMutation({
        mutationFn: (data) => apiService.createActivity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setFormOpen(false);
        },
    });
    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
    }, []);
    const columns = [
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", sx: {
                    bgcolor: `${typeIcons[params.value]}15`,
                    color: typeIcons[params.value],
                    fontWeight: 600,
                    fontSize: '0.7rem',
                } })),
        },
        { field: 'subject', headerName: 'Subject', width: 200, renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value })) },
        { field: 'relatedToName', headerName: 'Related To', width: 160 },
        { field: 'assignedToName', headerName: 'Assigned', width: 130 },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 160,
            valueFormatter: (value) => new Date(value).toLocaleString(),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", color: params.value === 'COMPLETED' ? 'success' : params.value === 'OVERDUE' ? 'error' : 'warning', variant: "outlined" })),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => (params.row.status !== 'COMPLETED' && (_jsx(Tooltip, { title: "Mark Complete", children: _jsx(IconButton, { size: "small", color: "success", onClick: () => completeMutation.mutate(params.row.id), children: _jsx(CheckCircle, { fontSize: "small" }) }) }))),
        },
    ];
    const formik = useFormik({
        initialValues: {
            type: 'TASK',
            subject: '',
            description: '',
            relatedTo: '',
            relatedToType: 'LEAD',
            dueDate: null,
        },
        validationSchema: Yup.object({
            type: Yup.string().required(),
            subject: Yup.string().required('Subject is required'),
            dueDate: Yup.date().required('Due date is required'),
        }),
        onSubmit: (values) => {
            createMutation.mutate({
                ...values,
                dueDate: values.dueDate?.toISOString(),
            });
        },
    });
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Activities" }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "outlined", size: "small", startIcon: viewMode === 'list' ? _jsx(CalendarMonth, {}) : _jsx(ViewList, {}), onClick: () => setViewMode(viewMode === 'list' ? 'calendar' : 'list'), children: viewMode === 'list' ? 'Calendar' : 'List' }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => setFormOpen(true), children: "Create Activity" })] })] }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: filters.type, label: "Type", onChange: (e) => handleFilterChange('type', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "CALL", children: "Call" }), _jsx(MenuItem, { value: "MEETING", children: "Meeting" }), _jsx(MenuItem, { value: "EMAIL", children: "Email" }), _jsx(MenuItem, { value: "TASK", children: "Task" }), _jsx(MenuItem, { value: "NOTE", children: "Note" }), _jsx(MenuItem, { value: "REMINDER", children: "Reminder" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status, label: "Status", onChange: (e) => handleFilterChange('status', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "PENDING", children: "Pending" }), _jsx(MenuItem, { value: "COMPLETED", children: "Completed" }), _jsx(MenuItem, { value: "OVERDUE", children: "Overdue" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Assigned" }), _jsx(Select, { value: filters.assignedTo, label: "Assigned", onChange: (e) => handleFilterChange('assignedTo', e.target.value), children: _jsx(MenuItem, { value: "", children: "All" }) })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Button, { size: "small", onClick: () => setFilters({ type: '', status: '', assignedTo: '', page: 1, limit: 25 }), startIcon: _jsx(Clear, {}), children: "Clear" }) })] }) }) }), viewMode === 'list' && (_jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, onPaginationModelChange: (model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize })), disableRowSelectionOnClick: true, density: "compact", autoHeight: true })), viewMode === 'calendar' && (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Activity Calendar" }), _jsx(Grid, { container: true, spacing: 2, children: ['PENDING', 'OVERDUE', 'COMPLETED'].map((statusGroup) => (_jsxs(Grid, { size: { xs: 12, md: 4 }, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, color: statusGroup === 'COMPLETED' ? 'success.main' : statusGroup === 'OVERDUE' ? 'error.main' : 'warning.main', children: [statusGroup, " (", (data?.data || []).filter((a) => a.status === statusGroup).length, ")"] }), _jsx(List, { dense: true, children: (data?.data || [])
                                                .filter((a) => a.status === statusGroup)
                                                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                                .map((activity, idx, arr) => (_jsxs(React.Fragment, { children: [_jsx(ListItem, { secondaryAction: activity.status !== 'COMPLETED' && (_jsx(IconButton, { size: "small", color: "success", onClick: () => completeMutation.mutate(activity.id), children: _jsx(CheckCircle, { fontSize: "small" }) })), children: _jsx(ListItemText, { primary: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Chip, { label: activity.type, size: "small", sx: { bgcolor: `${typeIcons[activity.type]}15`, color: typeIcons[activity.type], fontSize: '0.65rem', height: 18 } }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: activity.subject })] }), secondary: _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [new Date(activity.dueDate).toLocaleDateString(), " | ", activity.relatedToName] }) }) }), idx < arr.length - 1 && _jsx(Divider, { variant: "inset", component: "li" })] }, activity.id))) })] }, statusGroup))) })] }) })), _jsxs(Dialog, { open: formOpen, onClose: () => setFormOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Create Activity" }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Type", name: "type", value: formik.values.type, onChange: formik.handleChange, children: [_jsx(MenuItem, { value: "CALL", children: "Call" }), _jsx(MenuItem, { value: "MEETING", children: "Meeting" }), _jsx(MenuItem, { value: "EMAIL", children: "Email" }), _jsx(MenuItem, { value: "TASK", children: "Task" }), _jsx(MenuItem, { value: "NOTE", children: "Note" }), _jsx(MenuItem, { value: "REMINDER", children: "Reminder" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Due Date", value: formik.values.dueDate, onChange: (v) => formik.setFieldValue('dueDate', v), slotProps: {
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            error: formik.touched.dueDate && Boolean(formik.errors.dueDate),
                                                            helperText: formik.touched.dueDate && typeof formik.errors.dueDate === 'string' ? formik.errors.dueDate : '',
                                                        }
                                                    } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Subject", name: "subject", value: formik.values.subject, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.subject && Boolean(formik.errors.subject), helperText: formik.touched.subject && formik.errors.subject }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Description", name: "description", multiline: true, rows: 3, value: formik.values.description, onChange: formik.handleChange }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setFormOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create' })] })] })] })] }) }));
};
export default ActivitiesPage;
