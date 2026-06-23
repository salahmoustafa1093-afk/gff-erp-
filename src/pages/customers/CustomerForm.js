import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, Paper, TextField, Typography, Snackbar, Alert, CircularProgress, } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, LocationOn as LocationIcon, } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../../app/api';
const customerTypes = ['INDIVIDUAL', 'COMPANY', 'DEALER', 'DISTRIBUTOR'];
const validationSchema = Yup.object({
    code: Yup.string().required('Code is required').max(20, 'Max 20 characters'),
    name: Yup.string().required('Name is required').max(200, 'Max 200 characters'),
    nameAr: Yup.string().max(200, 'Max 200 characters'),
    type: Yup.string().required('Type is required').oneOf(customerTypes),
    phone: Yup.string().max(20, 'Max 20 characters'),
    email: Yup.string().email('Invalid email').max(100, 'Max 100 characters'),
    address: Yup.string().max(500, 'Max 500 characters'),
    city: Yup.string().max(50, 'Max 50 characters'),
    taxNumber: Yup.string().max(50, 'Max 50 characters'),
    creditLimit: Yup.number().min(0, 'Min 0'),
    paymentTerms: Yup.number().integer().min(0, 'Min 0'),
    discountPercent: Yup.number().min(0, 'Max 100').max(100),
    gpsLat: Yup.number().min(-90).max(90),
    gpsLng: Yup.number().min(-180).max(180),
    notes: Yup.string().max(2000, 'Max 2000 characters'),
});
const CustomerForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id && id !== 'new');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });
    const { data: customerData, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            if (!isEdit)
                return null;
            const response = await api.get(`/customers/${id}`);
            return response.data;
        },
        enabled: isEdit,
    });
    const { data: salesRepsData } = useQuery({
        queryKey: ['salesReps'],
        queryFn: async () => {
            const response = await api.get('/users?role=SALES_REP&active=true');
            return response.data.data;
        },
    });
    const saveMutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                ...values,
                creditLimit: Number(values.creditLimit) || 0,
                paymentTerms: Number(values.paymentTerms) || 0,
                discountPercent: Number(values.discountPercent) || 0,
                gpsLat: values.gpsLat ? Number(values.gpsLat) : null,
                gpsLng: values.gpsLng ? Number(values.gpsLng) : null,
                isActive: values.isActive,
            };
            if (isEdit) {
                const response = await api.put(`/customers/${id}`, payload);
                return response.data;
            }
            else {
                const response = await api.post('/customers', payload);
                return response.data;
            }
        },
        onSuccess: () => {
            setSnackbar({ open: true, message: `Customer ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
            if (!isEdit)
                setTimeout(() => navigate('/customers'), 800);
        },
        onError: (error) => {
            const msg = error?.response?.data?.message || 'Failed to save customer';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        },
    });
    if (isLoading) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(CircularProgress, {}) }));
    }
    const initialValues = {
        code: customerData?.code || '',
        name: customerData?.name || '',
        nameAr: customerData?.nameAr || '',
        type: customerData?.type || 'INDIVIDUAL',
        phone: customerData?.phone || '',
        email: customerData?.email || '',
        address: customerData?.address || '',
        city: customerData?.city || '',
        taxNumber: customerData?.taxNumber || '',
        creditLimit: customerData?.creditLimit || 0,
        paymentTerms: customerData?.paymentTerms || 30,
        discountPercent: customerData?.discountPercent || 0,
        salesRepId: customerData?.salesRepId || '',
        gpsLat: customerData?.gpsLat || '',
        gpsLng: customerData?.gpsLng || '',
        notes: customerData?.notes || '',
        isActive: customerData?.isActive ?? true,
    };
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/customers'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEdit ? 'Edit Customer' : 'New Customer' })] }) }), _jsx(Formik, { initialValues: initialValues, validationSchema: validationSchema, enableReinitialize: true, onSubmit: (values) => saveMutation.mutate(values), children: ({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (_jsx(Form, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 3 }, children: "Customer Information" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Customer Code *", name: "code", value: values.code, onChange: handleChange, onBlur: handleBlur, error: touched.code && Boolean(errors.code), helperText: touched.code && errors.code }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { select: true, fullWidth: true, size: "small", label: "Type *", name: "type", value: values.type, onChange: handleChange, onBlur: handleBlur, error: touched.type && Boolean(errors.type), helperText: touched.type && errors.type, children: customerTypes.map((t) => (_jsx(MenuItem, { value: t, children: t }, t))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Sales Rep", name: "salesRepId", value: values.salesRepId, onChange: handleChange, children: [_jsx(MenuItem, { value: "", children: "None" }), salesRepsData?.map((rep) => (_jsx(MenuItem, { value: rep.id, children: rep.name }, rep.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Name (English) *", name: "name", value: values.name, onChange: handleChange, onBlur: handleBlur, error: touched.name && Boolean(errors.name), helperText: touched.name && errors.name }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Name (Arabic)", name: "nameAr", value: values.nameAr, onChange: handleChange, onBlur: handleBlur, error: touched.nameAr && Boolean(errors.nameAr), helperText: touched.nameAr && errors.nameAr, inputProps: { dir: 'rtl' } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Phone", name: "phone", value: values.phone, onChange: handleChange, onBlur: handleBlur, error: touched.phone && Boolean(errors.phone), helperText: touched.phone && errors.phone }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Email", name: "email", value: values.email, onChange: handleChange, onBlur: handleBlur, error: touched.email && Boolean(errors.email), helperText: touched.email && errors.email }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "City", name: "city", value: values.city, onChange: handleChange }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Address", name: "address", value: values.address, onChange: handleChange, multiline: true, rows: 2 }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Tax Number", name: "taxNumber", value: values.taxNumber, onChange: handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Status", name: "isActive", value: values.isActive, onChange: (e) => setFieldValue('isActive', e.target.value === 'true'), children: [_jsx(MenuItem, { value: "true", children: "Active" }), _jsx(MenuItem, { value: "false", children: "Inactive" })] }) })] }), _jsx(Typography, { variant: "h6", sx: { mt: 4, mb: 2 }, children: "Financial Settings" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Credit Limit", name: "creditLimit", type: "number", value: values.creditLimit, onChange: handleChange, inputProps: { min: 0, step: 0.01 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Payment Terms (days)", name: "paymentTerms", type: "number", value: values.paymentTerms, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Discount %", name: "discountPercent", type: "number", value: values.discountPercent, onChange: handleChange, inputProps: { min: 0, max: 100, step: 0.01 } }) })] }), _jsxs(Typography, { variant: "h6", sx: { mt: 4, mb: 2 }, children: [_jsx(LocationIcon, { sx: { mr: 1, verticalAlign: 'middle' } }), "GPS Coordinates"] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Latitude", name: "gpsLat", type: "number", value: values.gpsLat, onChange: handleChange, inputProps: { min: -90, max: 90, step: 0.000001 }, error: touched.gpsLat && Boolean(errors.gpsLat), helperText: touched.gpsLat && errors.gpsLat }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Longitude", name: "gpsLng", type: "number", value: values.gpsLng, onChange: handleChange, inputProps: { min: -180, max: 180, step: 0.000001 }, error: touched.gpsLng && Boolean(errors.gpsLng), helperText: touched.gpsLng && errors.gpsLng }) })] }), _jsx(Typography, { variant: "h6", sx: { mt: 4, mb: 2 }, children: "Notes" }), _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", name: "notes", value: values.notes, onChange: handleChange, multiline: true, rows: 4, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes })] }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { sx: { position: 'sticky', top: 16 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Actions" }), isEdit && customerData && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(InfoRow, { label: "Created", value: new Date(customerData.createdAt).toLocaleDateString() }), _jsx(InfoRow, { label: "Current Balance", value: formatCurrency(customerData.balance) })] })), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 1 }, children: [_jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), fullWidth: true, disabled: isSubmitting || saveMutation.isPending, children: isSubmitting || saveMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Save Customer' }), _jsx(Button, { variant: "outlined", onClick: () => navigate('/customers'), fullWidth: true, children: "Cancel" })] })] }) }) })] }) })) }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }));
};
const InfoRow = ({ label, value }) => (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: value })] }));
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default CustomerForm;
