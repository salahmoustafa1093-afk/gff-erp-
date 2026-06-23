import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Warning, Build, CheckCircle, DateRange, TrendingUp } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const validationSchema = Yup.object({
    type: Yup.string().required(),
    description: Yup.string().required('Description is required').max(500),
    cost: Yup.number().required().min(0),
    serviceDate: Yup.date().required(),
    serviceProvider: Yup.string().required('Service provider is required'),
    status: Yup.string().required(),
    nextServiceDate: Yup.date().nullable(),
    nextServiceMileage: Yup.number().nullable().min(0),
    notes: Yup.string(),
});
const typeColors = {
    ROUTINE: '#2e7d32',
    REPAIR: '#d32f2f',
    INSPECTION: '#0288d1',
    TIRE_CHANGE: '#ed6c02',
    OIL_CHANGE: '#9c27b0',
    OTHER: '#757575',
};
const MaintenancePage = () => {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({ vehicleId: '', status: '', page: 1, limit: 25 });
    const [formOpen, setFormOpen] = useState(false);
    const [filterVehicle, setFilterVehicle] = useState('');
    const { data: maintenanceRecords, isLoading } = useQuery({
        queryKey: ['maintenance', filters],
        queryFn: () => apiService.getMaintenanceRecords(filters),
    });
    const { data: upcomingMaintenance } = useQuery({
        queryKey: ['upcoming-maintenance'],
        queryFn: () => apiService.getUpcomingMaintenance(),
    });
    const { data: vehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => apiService.getVehicles({ limit: 500 }),
    });
    const createMutation = useMutation({
        mutationFn: (data) => apiService.createMaintenanceRecord(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
            setFormOpen(false);
        },
    });
    const formik = useFormik({
        initialValues: {
            type: 'ROUTINE',
            description: '',
            cost: 0,
            serviceDate: new Date(),
            serviceProvider: '',
            status: 'SCHEDULED',
            vehicleId: '',
            nextServiceDate: null,
            nextServiceMileage: null,
            notes: '',
        },
        validationSchema,
        onSubmit: (values) => {
            createMutation.mutate({
                ...values,
                serviceDate: values.serviceDate?.toISOString(),
                nextServiceDate: values.nextServiceDate?.toISOString(),
            });
        },
    });
    const columns = [
        {
            field: 'vehicleCode',
            headerName: 'Vehicle',
            width: 120,
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", sx: {
                    bgcolor: `${typeColors[params.value]}15`,
                    color: typeColors[params.value],
                    fontWeight: 600,
                    fontSize: '0.7rem',
                } })),
        },
        { field: 'description', headerName: 'Description', flex: 1 },
        { field: 'cost', headerName: 'Cost', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        {
            field: 'serviceDate',
            headerName: 'Service Date',
            width: 120,
            valueFormatter: (v) => new Date(v).toLocaleDateString(),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", color: params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'warning', variant: "outlined" })),
        },
        { field: 'serviceProvider', headerName: 'Provider', width: 140 },
        {
            field: 'nextServiceDate',
            headerName: 'Next Service',
            width: 120,
            valueFormatter: (v) => v ? new Date(v).toLocaleDateString() : '-',
        },
    ];
    const totalCost = (maintenanceRecords?.data || []).reduce((sum, r) => sum + r.cost, 0);
    const completedCount = (maintenanceRecords?.data || []).filter((r) => r.status === 'COMPLETED').length;
    const scheduledCount = (maintenanceRecords?.data || []).filter((r) => r.status === 'SCHEDULED').length;
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Maintenance" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => setFormOpen(true), children: "Add Record" })] }), _jsx(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Build, { sx: { color: 'primary.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Records" }), _jsx(Typography, { variant: "h5", fontWeight: 700 }), "\">", maintenanceRecords?.total || 0] }) }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(CheckCircle, { sx: { color: 'success.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Completed" }), _jsx(Typography, { variant: "h5", fontWeight: 700 }), "\" color=\"success.main\">", completedCount] }) }) })] }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(DateRange, { sx: { color: 'warning.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Scheduled" }), _jsx(Typography, { variant: "h5", fontWeight: 700 }), "\" color=\"warning.main\">", scheduledCount] }) }) })] })
        ,
            _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(TrendingUp, { sx: { color: 'error.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Cost" }), _jsx(Typography, { variant: "h5", fontWeight: 700 }), "\" color=\"error.main\">$", totalCost.toLocaleString()] }) }) }));
};
Grid >
;
Grid >
    { /* Upcoming Alerts */}
    < Card;
variant = "outlined";
sx = {};
{
    mb: 3;
}
 >
    _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600 }), "\" gutterBottom display=\"flex\" alignItems=\"center\" gap=", 1, ">", _jsx(Warning, { color: "warning" }), " Upcoming Maintenance Alerts"] });
{
    (!upcomingMaintenance || upcomingMaintenance.length === 0) ? (_jsx(Alert, { severity: "success", children: "No upcoming maintenance alerts." })) : (_jsx(Grid, { container: true, spacing: 2, children: (upcomingMaintenance || []).map((record) => (_jsxs(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: [_jsxs(Paper, { variant: "outlined", sx: { p: 2, borderLeft: 3, borderColor: 'warning.main' }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, children: [_jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", record.vehicleCode] }), _jsx(Chip, { label: record.type, size: "small", sx: { bgcolor: `${typeColors[record.type]}15`, color: typeColors[record.type], fontSize: '0.65rem' } })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: record.description }), _jsxs(Typography, { variant: "caption", color: "warning.main", display: "block", mt: 0.5, children: ["Due: ", record.nextServiceDate ? new Date(record.nextServiceDate).toLocaleDateString() : `${record.nextServiceMileage?.toLocaleString()} km`] })] }, record.id))) }));
}
Grid >
;
CardContent >
;
Card >
    { /* Filters & Table */}
    < Card;
variant = "outlined";
sx = {};
{
    mb: 3;
}
 >
    _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Vehicle" }), _jsxs(Select, { value: filters.vehicleId, label: "Vehicle", onChange: (e) => setFilters((p) => ({ ...p, vehicleId: e.target.value, page: 1 })), children: [_jsx(MenuItem, { value: "", children: "All Vehicles" }), (vehicles?.data || []).map((v) => (_jsxs(MenuItem, { value: v.id, children: [v.code, " - ", v.make, " ", v.model] }, v.id)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status, label: "Status", onChange: (e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 })), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "SCHEDULED", children: "Scheduled" }), _jsx(MenuItem, { value: "IN_PROGRESS", children: "In Progress" }), _jsx(MenuItem, { value: "COMPLETED", children: "Completed" })] })] }) })] }) });
Card >
    _jsx(DataGrid, { rows: maintenanceRecords?.data || [], columns: columns, loading: isLoading, rowCount: maintenanceRecords?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, onPaginationModelChange: (model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize })), disableRowSelectionOnClick: true, density: "compact", autoHeight: true });
{ /* Create Dialog */ }
_jsxs(Dialog, { open: formOpen, onClose: () => setFormOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Add Maintenance Record" }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsx(DialogContent, { dividers: true, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Vehicle" }), _jsx(Select, { value: formik.values.vehicleId, label: "Vehicle", onChange: (e) => formik.setFieldValue('vehicleId', e.target.value), required: true, children: (vehicles?.data || []).map((v) => (_jsxs(MenuItem, { value: v.id, children: [v.code, " - ", v.make, " ", v.model] }, v.id))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Type", name: "type", value: formik.values.type, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "ROUTINE", children: "Routine" }), _jsx(MenuItem, { value: "REPAIR", children: "Repair" }), _jsx(MenuItem, { value: "INSPECTION", children: "Inspection" }), _jsx(MenuItem, { value: "TIRE_CHANGE", children: "Tire Change" }), _jsx(MenuItem, { value: "OIL_CHANGE", children: "Oil Change" }), _jsx(MenuItem, { value: "OTHER", children: "Other" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Status", name: "status", value: formik.values.status, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "SCHEDULED", children: "Scheduled" }), _jsx(MenuItem, { value: "IN_PROGRESS", children: "In Progress" }), _jsx(MenuItem, { value: "COMPLETED", children: "Completed" })] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Description", name: "description", multiline: true, rows: 2, value: formik.values.description, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.description && Boolean(formik.errors.description), helperText: formik.touched.description && formik.errors.description }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Cost ($)", name: "cost", type: "number", value: formik.values.cost, onChange: formik.handleChange, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Service Date", value: formik.values.serviceDate, onChange: (v) => formik.setFieldValue('serviceDate', v), slotProps: { textField: { fullWidth: true, size: 'small', required: true } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Service Provider", name: "serviceProvider", value: formik.values.serviceProvider, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.serviceProvider && Boolean(formik.errors.serviceProvider), helperText: formik.touched.serviceProvider && formik.errors.serviceProvider }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Next Service Date", value: formik.values.nextServiceDate, onChange: (v) => formik.setFieldValue('nextServiceDate', v), slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Next Service Mileage", name: "nextServiceMileage", type: "number", value: formik.values.nextServiceMileage || '', onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", name: "notes", multiline: true, rows: 2, value: formik.values.notes, onChange: formik.handleChange }) })] }) }), _jsxs(DialogActions, { sx: { px: 3, py: 2 }, children: [_jsx(Button, { onClick: () => setFormOpen(false), variant: "outlined", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Adding...' : 'Add Record' })] })] })] });
Box >
;
LocalizationProvider >
;
;
;
export default Mai;
