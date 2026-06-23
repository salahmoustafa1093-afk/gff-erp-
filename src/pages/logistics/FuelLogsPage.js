import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, TextField, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalGasStation, TrendingUp, Speed } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';
const validationSchema = Yup.object({
    date: Yup.date().required(),
    odometer: Yup.number().required().min(0),
    fuelAmount: Yup.number().required().min(0),
    fuelPrice: Yup.number().required().min(0),
    station: Yup.string().required('Station is required'),
    notes: Yup.string(),
});
const FuelLogsPage = () => {
    const { vehicleId } = useParams();
    const queryClient = useQueryClient();
    const [selectedVehicle, setSelectedVehicle] = useState(vehicleId || '');
    const { data: fuelLogs, isLoading } = useQuery({
        queryKey: ['fuel-logs', selectedVehicle],
        queryFn: () => apiService.getFuelLogs(selectedVehicle),
        enabled: !!selectedVehicle,
    });
    const { data: fuelEfficiency } = useQuery({
        queryKey: ['fuel-efficiency', selectedVehicle],
        queryFn: () => apiService.getFuelEfficiency(selectedVehicle),
        enabled: !!selectedVehicle,
    });
    const { data: vehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => apiService.getVehicles({ limit: 500 }),
    });
    const createMutation = useMutation({
        mutationFn: (data) => apiService.createFuelLog(selectedVehicle, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
            queryClient.invalidateQueries({ queryKey: ['fuel-efficiency'] });
            formik.resetForm();
        },
    });
    const formik = useFormik({
        initialValues: {
            date: new Date(),
            odometer: 0,
            fuelAmount: 0,
            fuelPrice: 0,
            station: '',
            notes: '',
        },
        validationSchema,
        onSubmit: (values) => {
            const totalCost = (values.fuelAmount || 0) * (values.fuelPrice || 0);
            createMutation.mutate({
                ...values,
                date: values.date?.toISOString(),
                totalCost,
            });
        },
    });
    const columns = [
        { field: 'date', headerName: 'Date', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString() },
        { field: 'odometer', headerName: 'Odometer', width: 110, type: 'number', valueFormatter: (v) => v?.toLocaleString() },
        { field: 'fuelAmount', headerName: 'Fuel (L)', width: 90, type: 'number' },
        { field: 'fuelPrice', headerName: 'Price/L', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v) => `$${v?.toFixed(2)}` },
        { field: 'station', headerName: 'Station', width: 150 },
        { field: 'notes', headerName: 'Notes', flex: 1 },
    ];
    const costTrend = (fuelLogs || []).map((log) => ({
        date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        cost: log.totalCost,
        liters: log.fuelAmount,
    })).reverse();
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Fuel Logs" }), !vehicleId && (_jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Select Vehicle", value: selectedVehicle, onChange: (e) => setSelectedVehicle(e.target.value), children: [_jsx(MenuItem, { value: "", children: "Select a vehicle" }), (vehicles?.data || []).map((v) => (_jsxs(MenuItem, { value: v.id, children: [v.code, " - ", v.make, " ", v.model] }, v.id)))] }) }) })), selectedVehicle && (_jsxs(_Fragment, { children: [fuelEfficiency && (_jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center' }, children: [_jsx(Speed, { sx: { color: 'primary.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Avg. Consumption" }), _jsxs(Typography, { variant: "h4", fontWeight: 700, color: "primary.main", children: [fuelEfficiency.avgConsumption.toFixed(1), " L/100km"] })] }) }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center' }, children: [_jsx(LocalGasStation, { sx: { color: 'error.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Fuel Cost" }), _jsxs(Typography, { variant: "h4", fontWeight: 700, color: "error.main", children: ["$", fuelEfficiency.totalCost.toLocaleString()] })] }) }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center' }, children: [_jsx(TrendingUp, { sx: { color: 'success.main', mb: 1 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Distance" }), _jsxs(Typography, { variant: "h4", fontWeight: 700, color: "success.main", children: [fuelEfficiency.totalDistance.toLocaleString(), " km"] })] }) }) })] })), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Cost & Consumption Trend" }), _jsx(Box, { height: 280, children: costTrend.length > 0 ? (_jsx(ResponsiveContainer, { children: _jsxs(AreaChart, { data: costTrend, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(RechartsTooltip, {}), _jsx(Area, { yAxisId: "left", type: "monotone", dataKey: "cost", name: "Cost ($)", stroke: "#d32f2f", fill: "#d32f2f", fillOpacity: 0.1 }), _jsx(Area, { yAxisId: "right", type: "monotone", dataKey: "liters", name: "Liters", stroke: "#0288d1", fill: "#0288d1", fillOpacity: 0.1 })] }) })) : (_jsx(Alert, { severity: "info", children: "No fuel data available yet." })) })] }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Add Fuel Log" }), _jsx("form", { onSubmit: formik.handleSubmit, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsx(DatePicker, { label: "Date", value: formik.values.date, onChange: (v) => formik.setFieldValue('date', v), slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Odometer (km)", name: "odometer", type: "number", value: formik.values.odometer, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.odometer && Boolean(formik.errors.odometer), helperText: formik.touched.odometer && formik.errors.odometer }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Fuel Amount (L)", name: "fuelAmount", type: "number", value: formik.values.fuelAmount, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.fuelAmount && Boolean(formik.errors.fuelAmount), helperText: formik.touched.fuelAmount && formik.errors.fuelAmount }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Price/L ($)", name: "fuelPrice", type: "number", value: formik.values.fuelPrice, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.fuelPrice && Boolean(formik.errors.fuelPrice), helperText: formik.touched.fuelPrice && formik.errors.fuelPrice }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Station", name: "station", value: formik.values.station, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.station && Boolean(formik.errors.station), helperText: formik.touched.station && formik.errors.station }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", name: "notes", multiline: true, rows: 2, value: formik.values.notes, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", sx: { p: 1, bgcolor: 'grey.50', borderRadius: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Estimated Total:" }), _jsxs(Typography, { variant: "body1", fontWeight: 700, children: ["$", ((formik.values.fuelAmount || 0) * (formik.values.fuelPrice || 0)).toFixed(2)] })] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Button, { type: "submit", variant: "contained", fullWidth: true, disabled: createMutation.isPending, startIcon: _jsx(LocalGasStation, {}), children: createMutation.isPending ? 'Adding...' : 'Add Fuel Log' }) })] }) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Fuel Log History" }), _jsx(DataGrid, { rows: fuelLogs || [], columns: columns, loading: isLoading, pageSizeOptions: [10, 25], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true })] }) }) })] })] })), !selectedVehicle && (_jsx(Alert, { severity: "info", children: "Select a vehicle to view fuel logs." }))] }) }));
};
export default FuelLogsPage;
