import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Divider, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Autocomplete, Snackbar, Alert, CircularProgress, MenuItem, } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, ArrowBack as BackIcon, } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import api from '../../app/api';
const validationSchema = Yup.object({
    supplierId: Yup.string().required('Supplier is required'),
    orderDate: Yup.date().required('Order date is required'),
    expectedDate: Yup.date().nullable(),
    branchId: Yup.string().required('Branch is required'),
    discountPercent: Yup.number().min(0).max(100),
    taxPercent: Yup.number().min(0).max(100),
    shipping: Yup.number().min(0),
    items: Yup.array().of(Yup.object({
        productId: Yup.string().required('Product is required'),
        quantity: Yup.number().required().min(0.01),
        unitPrice: Yup.number().required().min(0),
    })).min(1, 'At least one item is required'),
});
const emptyItem = () => ({
    id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    productId: '',
    productCode: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    taxPercent: 15,
    total: 0,
    notes: '',
});
const PurchaseOrderForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id && id !== 'new');
    const [snackbar, setSnackbar] = useState({
        open: false, message: '', severity: 'success',
    });
    const { data: orderData, isLoading: orderLoading } = useQuery({
        queryKey: ['purchaseOrder', id],
        queryFn: async () => {
            if (!isEdit)
                return null;
            const response = await api.get(`/purchases/orders/${id}`);
            return response.data;
        },
        enabled: isEdit,
    });
    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const response = await api.get('/suppliers?active=true&pageSize=1000');
            return response.data.data;
        },
    });
    const { data: productsData } = useQuery({
        queryKey: ['productsForPO'],
        queryFn: async () => {
            const response = await api.get('/products?active=true&pageSize=1000');
            return response.data.data;
        },
    });
    const { data: branchesData } = useQuery({
        queryKey: ['branchesForPO'],
        queryFn: async () => {
            const response = await api.get('/branches?active=true');
            return response.data.data;
        },
    });
    const saveMutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                supplierId: values.supplierId,
                orderDate: values.orderDate ? format(values.orderDate, 'yyyy-MM-dd') : null,
                expectedDate: values.expectedDate ? format(values.expectedDate, 'yyyy-MM-dd') : null,
                branchId: values.branchId,
                discountPercent: values.discountPercent,
                taxPercent: values.taxPercent,
                shipping: values.shipping,
                notes: values.notes,
                items: values.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountPercent: item.discountPercent,
                    taxPercent: item.taxPercent,
                    notes: item.notes,
                })),
            };
            if (isEdit) {
                const response = await api.put(`/purchases/orders/${id}`, payload);
                return response.data;
            }
            else {
                const response = await api.post('/purchases/orders', payload);
                return response.data;
            }
        },
        onSuccess: (data) => {
            setSnackbar({ open: true, message: `Purchase order ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
            if (!isEdit)
                setTimeout(() => navigate(`/purchases/orders/${data.id}`), 800);
        },
        onError: (error) => {
            setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save', severity: 'error' });
        },
    });
    const suppliers = suppliersData || [];
    const products = productsData || [];
    const calculateItemTotal = (item) => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || 0;
        const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
        const subtotal = qty * price - discountAmt;
        const taxAmt = (subtotal * (item.taxPercent || 0)) / 100;
        return Number((subtotal + taxAmt).toFixed(2));
    };
    const initialValues = {
        supplierId: orderData?.supplierId || '',
        orderDate: orderData ? new Date(orderData.orderDate) : new Date(),
        expectedDate: orderData?.expectedDate ? new Date(orderData.expectedDate) : null,
        branchId: orderData?.branchId || '',
        discountPercent: orderData?.discountPercent || 0,
        taxPercent: orderData?.taxPercent || 15,
        shipping: orderData?.shipping || 0,
        notes: orderData?.notes || '',
        items: orderData?.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            taxPercent: item.taxPercent,
            total: item.total,
            notes: item.notes,
        })) || [emptyItem()],
    };
    if (orderLoading) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsxs(Box, { sx: { p: 2 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/purchases/orders'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEdit ? 'Edit Purchase Order' : 'New Purchase Order' })] }) }), _jsx(Formik, { initialValues: initialValues, validationSchema: validationSchema, enableReinitialize: true, onSubmit: (values) => {
                            const subtotal = values.items.reduce((sum, item) => {
                                const qty = item.quantity || 0;
                                const price = item.unitPrice || 0;
                                const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
                                return sum + (qty * price - discountAmt);
                            }, 0);
                            const discount = (subtotal * (values.discountPercent || 0)) / 100;
                            const afterDiscount = subtotal - discount;
                            const tax = (afterDiscount * (values.taxPercent || 0)) / 100;
                            const total = afterDiscount + tax + (values.shipping || 0);
                            saveMutation.mutate({ ...values, subtotal, total: Number(total.toFixed(2)) });
                        }, children: ({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
                            const subtotal = values.items.reduce((sum, item) => {
                                const qty = item.quantity || 0;
                                const price = item.unitPrice || 0;
                                const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
                                return sum + (qty * price - discountAmt);
                            }, 0);
                            const discount = (subtotal * (values.discountPercent || 0)) / 100;
                            const afterDiscount = subtotal - discount;
                            const tax = (afterDiscount * (values.taxPercent || 0)) / 100;
                            const total = afterDiscount + tax + (values.shipping || 0);
                            const handleProductSelect = (index, product) => {
                                if (!product)
                                    return;
                                const newItems = [...values.items];
                                newItems[index] = {
                                    ...newItems[index],
                                    productId: product.id,
                                    productCode: product.code,
                                    productName: product.name,
                                    unitPrice: product.costPrice || product.salePrice,
                                };
                                newItems[index].total = calculateItemTotal(newItems[index]);
                                setFieldValue('items', newItems);
                            };
                            const handleItemChange = (index, field, value) => {
                                const newItems = [...values.items];
                                newItems[index] = { ...newItems[index], [field]: value };
                                newItems[index].total = calculateItemTotal(newItems[index]);
                                setFieldValue('items', newItems);
                            };
                            const addItem = () => setFieldValue('items', [...values.items, emptyItem()]);
                            const removeItem = (index) => {
                                const newItems = values.items.filter((_, i) => i !== index);
                                if (newItems.length === 0)
                                    newItems.push(emptyItem());
                                setFieldValue('items', newItems);
                            };
                            return (_jsx(Form, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Order Info" }), _jsx(Autocomplete, { options: suppliers, getOptionLabel: (s) => `${s.code} - ${s.name}`, value: suppliers.find((s) => s.id === values.supplierId) || null, onChange: (_, val) => setFieldValue('supplierId', val?.id || ''), renderInput: (params) => (_jsx(TextField, { ...params, label: "Supplier *", size: "small", fullWidth: true, margin: "normal", error: touched.supplierId && Boolean(errors.supplierId), helperText: touched.supplierId && errors.supplierId })) }), _jsx(DatePicker, { label: "Order Date *", value: values.orderDate, onChange: (val) => setFieldValue('orderDate', val), slotProps: { textField: { size: 'small', fullWidth: true, margin: 'normal' } } }), _jsx(DatePicker, { label: "Expected Date", value: values.expectedDate, onChange: (val) => setFieldValue('expectedDate', val), slotProps: { textField: { size: 'small', fullWidth: true, margin: 'normal' } } }), _jsx(TextField, { select: true, label: "Branch *", size: "small", fullWidth: true, margin: "normal", value: values.branchId, onChange: handleChange, name: "branchId", error: touched.branchId && Boolean(errors.branchId), helperText: touched.branchId && errors.branchId, children: branchesData?.map((b) => (_jsx(MenuItem, { value: b.id, children: b.name }, b.id))) }), _jsx(TextField, { label: "Notes", size: "small", fullWidth: true, margin: "normal", multiline: true, rows: 3, name: "notes", value: values.notes, onChange: handleChange })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Order Items" }), _jsx(Button, { size: "small", variant: "outlined", startIcon: _jsx(AddIcon, {}), onClick: addItem, children: "Add Item" })] }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Product" }), _jsx(TableCell, { align: "right", children: "Qty" }), _jsx(TableCell, { align: "right", children: "Unit Price" }), _jsx(TableCell, { align: "right", children: "Disc%" }), _jsx(TableCell, { align: "right", children: "Tax%" }), _jsx(TableCell, { align: "right", children: "Total" }), _jsx(TableCell, { width: 50 })] }) }), _jsx(TableBody, { children: values.items.map((item, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(Autocomplete, { options: products, getOptionLabel: (p) => `${p.code} - ${p.name}`, value: products.find((p) => p.id === item.productId) || null, onChange: (_, val) => handleProductSelect(index, val), renderInput: (params) => (_jsx(TextField, { ...params, size: "small", placeholder: "Select product", fullWidth: true })), size: "small", sx: { minWidth: 250 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.quantity, onChange: (e) => handleItemChange(index, 'quantity', Number(e.target.value)), inputProps: { min: 0.01, step: 0.01 }, sx: { width: 80 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.unitPrice, onChange: (e) => handleItemChange(index, 'unitPrice', Number(e.target.value)), inputProps: { min: 0, step: 0.01 }, sx: { width: 100 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.discountPercent, onChange: (e) => handleItemChange(index, 'discountPercent', Number(e.target.value)), inputProps: { min: 0, max: 100, step: 0.01 }, sx: { width: 70 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.taxPercent, onChange: (e) => handleItemChange(index, 'taxPercent', Number(e.target.value)), inputProps: { min: 0, max: 100, step: 0.01 }, sx: { width: 70 } }) }), _jsx(TableCell, { align: "right", children: _jsx(Typography, { fontWeight: "medium", children: formatCurrency(item.total) }) }), _jsx(TableCell, { children: _jsx(IconButton, { size: "small", color: "error", onClick: () => removeItem(index), children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }, item.id))) })] }) }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'flex-end' }, children: _jsxs(Box, { sx: { width: 300 }, children: [_jsx(SummaryRow, { label: "Subtotal:", value: subtotal }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { children: "Discount:" }), _jsx(TextField, { type: "number", size: "small", name: "discountPercent", value: values.discountPercent, onChange: handleChange, inputProps: { min: 0, max: 100 }, sx: { width: 80 } })] }), _jsx(SummaryRow, { label: "Discount Amount:", value: discount }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { children: "Tax:" }), _jsx(TextField, { type: "number", size: "small", name: "taxPercent", value: values.taxPercent, onChange: handleChange, inputProps: { min: 0, max: 100 }, sx: { width: 80 } })] }), _jsx(SummaryRow, { label: "Tax Amount:", value: tax }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { children: "Shipping:" }), _jsx(TextField, { type: "number", size: "small", name: "shipping", value: values.shipping, onChange: handleChange, inputProps: { min: 0, step: 0.01 }, sx: { width: 120 } })] }), _jsx(Divider, { sx: { my: 1 } }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Total:" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: formatCurrency(total) })] })] }) }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/purchases/orders'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: saveMutation.isPending, children: saveMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Save Purchase Order' })] })] }) }) })] }) }));
                        } })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }));
};
const SummaryRow = ({ label, value }) => (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 0.75 }, children: [_jsx(Typography, { variant: "body2", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: formatCurrency(value) })] }));
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default PurchaseOrderForm;
