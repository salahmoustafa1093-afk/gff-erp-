import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Grid, TextField, MenuItem, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const validationSchema = Yup.object({
    code: Yup.string().required('Code is required').max(50),
    type: Yup.string().required('Type is required'),
    make: Yup.string().required('Make is required').max(100),
    model: Yup.string().required('Model is required').max(100),
    year: Yup.number().required('Year is required').min(1900).max(new Date().getFullYear() + 1),
    licensePlate: Yup.string().required('License plate is required').max(50),
    chassisNumber: Yup.string().max(100),
    engineNumber: Yup.string().max(100),
    capacity: Yup.number().min(0),
    fuelType: Yup.string().required('Fuel type is required'),
    fuelCapacity: Yup.number().min(0),
    purchaseDate: Yup.date().nullable(),
    purchaseCost: Yup.number().min(0),
    branch: Yup.string().required('Branch is required'),
    status: Yup.string().required('Status is required'),
});
const VehicleForm = ({ vehicleId, onClose }) => {
    const queryClient = useQueryClient();
    const { data: existing } = useQuery({
        queryKey: ['vehicle', vehicleId],
        queryFn: () => vehicleId ? apiService.getVehicle(vehicleId) : null,
        enabled: !!vehicleId,
    });
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: () => apiService.getBranches(),
    });
    const mutation = useMutation({
        mutationFn: (values) => vehicleId ? apiService.updateVehicle(vehicleId, values) : apiService.createVehicle(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            if (vehicleId)
                queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
            onClose();
        },
    });
    const formik = useFormik({
        initialValues: {
            code: '', type: 'TRUCK', make: '', model: '', year: new Date().getFullYear(),
            licensePlate: '', chassisNumber: '', engineNumber: '', capacity: 0,
            fuelType: 'DIESEL', fuelCapacity: 0, purchaseDate: null,
            purchaseCost: 0, branch: '', status: 'ACTIVE',
        },
        validationSchema,
        onSubmit: (values) => {
            mutation.mutate({
                ...values,
                purchaseDate: values.purchaseDate?.toISOString(),
            });
        },
    });
    useEffect(() => {
        if (existing) {
            formik.setValues({
                code: existing.code || '',
                type: existing.type || 'TRUCK',
                make: existing.make || '',
                model: existing.model || '',
                year: existing.year || new Date().getFullYear(),
                licensePlate: existing.licensePlate || '',
                chassisNumber: existing.chassisNumber || '',
                engineNumber: existing.engineNumber || '',
                capacity: existing.capacity || 0,
                fuelType: existing.fuelType || 'DIESEL',
                fuelCapacity: existing.fuelCapacity || 0,
                purchaseDate: existing.purchaseDate ? new Date(existing.purchaseDate) : null,
                purchaseCost: existing.purchaseCost || 0,
                branch: existing.branch || '',
                status: existing.status || 'ACTIVE',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existing]);
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsx(DialogTitle, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "h6", children: vehicleId ? 'Edit Vehicle' : 'Create Vehicle' }), _jsx(IconButton, { onClick: onClose, size: "small", children: _jsx(Close, {}) })] }) }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsx(DialogContent, { dividers: true, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Code", name: "code", value: formik.values.code, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.code && Boolean(formik.errors.code), helperText: formik.touched.code && formik.errors.code, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Type", name: "type", value: formik.values.type, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "TRUCK", children: "Truck" }), _jsx(MenuItem, { value: "VAN", children: "Van" }), _jsx(MenuItem, { value: "CAR", children: "Car" }), _jsx(MenuItem, { value: "MOTORCYCLE", children: "Motorcycle" }), _jsx(MenuItem, { value: "BUS", children: "Bus" }), _jsx(MenuItem, { value: "TRAILER", children: "Trailer" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Make", name: "make", value: formik.values.make, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.make && Boolean(formik.errors.make), helperText: formik.touched.make && formik.errors.make, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Model", name: "model", value: formik.values.model, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.model && Boolean(formik.errors.model), helperText: formik.touched.model && formik.errors.model, required: true }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Year", name: "year", type: "number", value: formik.values.year, onChange: formik.handleChange, required: true }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "License Plate", name: "licensePlate", value: formik.values.licensePlate, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.licensePlate && Boolean(formik.errors.licensePlate), helperText: formik.touched.licensePlate && formik.errors.licensePlate, required: true }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Capacity (kg)", name: "capacity", type: "number", value: formik.values.capacity, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Chassis Number", name: "chassisNumber", value: formik.values.chassisNumber, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Engine Number", name: "engineNumber", value: formik.values.engineNumber, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Fuel Type", name: "fuelType", value: formik.values.fuelType, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "DIESEL", children: "Diesel" }), _jsx(MenuItem, { value: "PETROL", children: "Petrol" }), _jsx(MenuItem, { value: "ELECTRIC", children: "Electric" }), _jsx(MenuItem, { value: "HYBRID", children: "Hybrid" })] }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Fuel Capacity (L)", name: "fuelCapacity", type: "number", value: formik.values.fuelCapacity, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(DatePicker, { label: "Purchase Date", value: formik.values.purchaseDate, onChange: (v) => formik.setFieldValue('purchaseDate', v), slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Purchase Cost ($)", name: "purchaseCost", type: "number", value: formik.values.purchaseCost, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsx(TextField, { fullWidth: true, select: true, size: "small", label: "Branch", name: "branch", value: formik.values.branch, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.branch && Boolean(formik.errors.branch), helperText: formik.touched.branch && formik.errors.branch, required: true, children: (branches || []).map((b) => _jsx(MenuItem, { value: b, children: b }, b)) }) }), _jsx(Grid, { size: { xs: 6, sm: 4 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Status", name: "status", value: formik.values.status, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "ACTIVE", children: "Active" }), _jsx(MenuItem, { value: "MAINTENANCE", children: "Maintenance" }), _jsx(MenuItem, { value: "IN_USE", children: "In Use" }), _jsx(MenuItem, { value: "RETIRED", children: "Retired" })] }) })] }) }), _jsxs(DialogActions, { sx: { px: 3, py: 2 }, children: [_jsx(Button, { onClick: onClose, variant: "outlined", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: mutation.isPending, children: mutation.isPending ? 'Saving...' : vehicleId ? 'Update' : 'Create' })] })] })] }));
};
export default VehicleForm;
