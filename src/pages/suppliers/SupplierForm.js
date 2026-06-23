import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, Paper, Rating, TextField, Typography, Snackbar, Alert, CircularProgress, } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../../app/api';
const supplierTypes = ['LOCAL', 'IMPORT', 'MANUFACTURER'];
const validationSchema = Yup.object({
    code: Yup.string().required('Code is required').max(20),
    name: Yup.string().required('Name is required').max(200),
    nameAr: Yup.string().max(200),
    type: Yup.string().required('Type is required').oneOf(supplierTypes),
    phone: Yup.string().max(20),
    email: Yup.string().email().max(100),
    address: Yup.string().max(500),
    city: Yup.string().max(50),
    taxNumber: Yup.string().max(50),
    creditLimit: Yup.number().min(0),
    paymentTerms: Yup.number().integer().min(0),
    leadTime: Yup.number().integer().min(0),
    rating: Yup.number().min(0).max(5),
    gpsLat: Yup.number().min(-90).max(90).nullable(),
    gpsLng: Yup.number().min(-180).max(180).nullable(),
    notes: Yup.string().max(2000),
});
const SupplierForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id && id !== 'new');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { data: supplierData, isLoading } = useQuery({
        queryKey: ['supplier', id],
        queryFn: async () => { if (!isEdit)
            return null; const response = await api.get(`/suppliers/${id}`); return response.data; },
        enabled: isEdit,
    });
    const { data: usersData } = useQuery({
        queryKey: ['purchaseReps'],
        queryFn: async () => { const response = await api.get('/users?role=PURCHASE_REP&active=true'); return response.data.data; },
    });
    const saveMutation = useMutation({
        mutationFn: async (values) => {
            const payload = { ...values, creditLimit: Number(values.creditLimit) || 0, paymentTerms: Number(values.paymentTerms) || 0, leadTime: Number(values.leadTime) || 0, rating: Number(values.rating) || 0, gpsLat: values.gpsLat ? Number(values.gpsLat) : null, gpsLng: values.gpsLng ? Number(values.gpsLng) : null };
            if (isEdit) {
                const response = await api.put(`/suppliers/${id}`, payload);
                return response.data;
            }
            else {
                const response = await api.post('/suppliers', payload);
                return response.data;
            }
        },
        onSuccess: () => {
            setSnackbar({ open: true, message: `Supplier ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
            if (!isEdit)
                setTimeout(() => navigate('/suppliers'), 800);
        },
        onError: (error) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save', severity: 'error' }); },
    });
    if (isLoading)
        return _jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(CircularProgress, {}) });
    const initialValues = {
        code: supplierData?.code || '', name: supplierData?.name || '', nameAr: supplierData?.nameAr || '', type: supplierData?.type || 'LOCAL',
        phone: supplierData?.phone || '', email: supplierData?.email || '', address: supplierData?.address || '', city: supplierData?.city || '',
        taxNumber: supplierData?.taxNumber || '', creditLimit: supplierData?.creditLimit || 0, paymentTerms: supplierData?.paymentTerms || 30,
        leadTime: supplierData?.leadTime || 7, rating: supplierData?.rating || 3, salesRepId: supplierData?.salesRepId || '',
        gpsLat: supplierData?.gpsLat || '', gpsLng: supplierData?.gpsLng || '', notes: supplierData?.notes || '', isActive: supplierData?.isActive ?? true,
    };
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/suppliers'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEdit ? 'Edit Supplier' : 'New Supplier' })] }) }), _jsx(Formik, { initialValues: initialValues, validationSchema: validationSchema, enableReinitialize: true, onSubmit: (values) => saveMutation.mutate(values), children: ({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (_jsx(Form, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 3 }, children: "Supplier Information" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Supplier Code *", name: "code", value: values.code, onChange: handleChange, onBlur: handleBlur, error: touched.code && Boolean(errors.code), helperText: touched.code && errors.code }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { select: true, fullWidth: true, size: "small", label: "Type *", name: "type", value: values.type, onChange: handleChange, onBlur: handleBlur, error: touched.type && Boolean(errors.type), helperText: touched.type && errors.type, children: supplierTypes.map((t) => (_jsx(MenuItem, { value: t, children: t }, t))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Purchase Rep", name: "salesRepId", value: values.salesRepId, onChange: handleChange, children: [_jsx(MenuItem, { value: "", children: "None" }), usersData?.map((u) => (_jsx(MenuItem, { value: u.id, children: u.name }, u.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Name (English) *", name: "name", value: values.name, onChange: handleChange, onBlur: handleBlur, error: touched.name && Boolean(errors.name), helperText: touched.name && errors.name }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Name (Arabic)", name: "nameAr", value: values.nameAr, onChange: handleChange, onBlur: handleBlur, error: touched.nameAr && Boolean(errors.nameAr), helperText: touched.nameAr && errors.nameAr, inputProps: { dir: 'rtl' } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Phone", name: "phone", value: values.phone, onChange: handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Email", name: "email", value: values.email, onChange: handleChange, onBlur: handleBlur, error: touched.email && Boolean(errors.email), helperText: touched.email && errors.email }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "City", name: "city", value: values.city, onChange: handleChange }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Address", name: "address", value: values.address, onChange: handleChange, multiline: true, rows: 2 }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Tax Number", name: "taxNumber", value: values.taxNumber, onChange: handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Status", name: "isActive", value: String(values.isActive), onChange: (e) => setFieldValue('isActive', e.target.value === 'true'), children: [_jsx(MenuItem, { value: "true", children: "Active" }), _jsx(MenuItem, { value: "false", children: "Inactive" })] }) })] }), _jsx(Typography, { variant: "h6", sx: { mt: 4, mb: 2 }, children: "Financial Settings" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Credit Limit", name: "creditLimit", type: "number", value: values.creditLimit, onChange: handleChange, inputProps: { min: 0, step: 0.01 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Payment Terms (days)", name: "paymentTerms", type: "number", value: values.paymentTerms, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Lead Time (days)", name: "leadTime", type: "number", value: values.leadTime, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(Typography, { variant: "body2", children: "Rating:" }), _jsx(Rating, { value: Number(values.rating) || 0, onChange: (_, val) => setFieldValue('rating', val || 0), precision: 0.5 })] }) })] }), _jsx(Typography, { variant: "h6", sx: { mt: 4, mb: 2 }, children: "GPS Coordinates" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Latitude", name: "gpsLat", type: "number", value: values.gpsLat, onChange: handleChange, inputProps: { min: -90, max: 90, step: 0.000001 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Longitude", name: "gpsLng", type: "number", value: values.gpsLng, onChange: handleChange, inputProps: { min: -180, max: 180, step: 0.000001 } }) })] }), _jsx(Typography, { variant: "h6", sx: { mt: 4, mb: 2 }, children: "Notes" }), _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", name: "notes", value: values.notes, onChange: handleChange, multiline: true, rows: 4 })] }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { sx: { position: 'sticky', top: 16 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Actions" }), isEdit && supplierData && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(InfoRow, { label: "Created", value: new Date(supplierData.createdAt).toLocaleDateString() }), _jsx(InfoRow, { label: "Current Balance", value: formatCurrency(supplierData.balance) })] })), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 1 }, children: [_jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), fullWidth: true, disabled: saveMutation.isPending, children: saveMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Save Supplier' }), _jsx(Button, { variant: "outlined", onClick: () => navigate('/suppliers'), fullWidth: true, children: "Cancel" })] })] }) }) })] }) })) }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }));
};
const InfoRow = ({ label, value }) => (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: value })] }));
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default SupplierForm;
