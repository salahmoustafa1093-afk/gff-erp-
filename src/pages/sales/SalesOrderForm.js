import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Divider, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Autocomplete, Alert, Snackbar, CircularProgress, } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, ArrowBack as BackIcon, Warning as WarningIcon, } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import api from '../../app/api';
const validationSchema = Yup.object({
    customerId: Yup.string().required('Customer is required'),
    orderDate: Yup.date().required('Order date is required'),
    dueDate: Yup.date()
        .required('Due date is required')
        .min(Yup.ref('orderDate'), 'Due date must be after order date'),
    branchId: Yup.string().required('Branch is required'),
    discountPercent: Yup.number().min(0, 'Min 0').max(100, 'Max 100'),
    taxPercent: Yup.number().min(0, 'Min 0').max(100, 'Max 100'),
    shipping: Yup.number().min(0, 'Min 0'),
    items: Yup.array().of(Yup.object({
        productId: Yup.string().required('Product is required'),
        quantity: Yup.number().required().min(0.01, 'Min 0.01'),
        unitPrice: Yup.number().required().min(0, 'Min 0'),
    })).min(1, 'At least one item is required'),
});
const emptyItem = () => ({
    id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    productId: '',
    productCode: '',
    productName: '',
    unitId: '',
    unitName: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    taxPercent: 15,
    total: 0,
    stockAvailable: 0,
    notes: '',
});
const SalesOrderForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id && id !== 'new');
    const autoSaveRef = useRef(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });
    const [customerCreditWarning, setCustomerCreditWarning] = useState(null);
    const { data: orderData, isLoading: orderLoading } = useQuery({
        queryKey: ['salesOrder', id],
        queryFn: async () => {
            if (!isEdit)
                return null;
            const response = await api.get(`/sales/orders/${id}`);
            return response.data;
        },
        enabled: isEdit,
    });
    const { data: customersData } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await api.get('/customers?active=true&pageSize=1000');
            return response.data.data;
        },
    });
    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products?active=true&pageSize=1000');
            return response.data.data;
        },
    });
    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const response = await api.get('/branches?active=true');
            return response.data.data;
        },
    });
    const saveMutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                customerId: values.customerId,
                orderDate: values.orderDate ? format(values.orderDate, 'yyyy-MM-dd') : null,
                dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
                branchId: values.branchId,
                salesRepId: values.salesRepId,
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
                const response = await api.put(`/sales/orders/${id}`, payload);
                return response.data;
            }
            else {
                const response = await api.post('/sales/orders', payload);
                return response.data;
            }
        },
        onSuccess: (data) => {
            setSnackbar({ open: true, message: `Order ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
            if (!isEdit) {
                setTimeout(() => navigate(`/sales/orders/${data.id}`), 800);
            }
        },
        onError: (error) => {
            const msg = error?.response?.data?.message || 'Failed to save order';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        },
    });
    const draftMutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                customerId: values.customerId,
                orderDate: values.orderDate ? format(values.orderDate, 'yyyy-MM-dd') : null,
                dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
                branchId: values.branchId,
                salesRepId: values.salesRepId,
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
                status: 'DRAFT',
            };
            if (isEdit && id) {
                await api.put(`/sales/orders/${id}`, payload);
            }
            else {
                await api.post('/sales/orders', payload);
            }
        },
        onSuccess: () => {
            setSnackbar({ open: true, message: 'Draft saved', severity: 'success' });
        },
    });
    const customers = customersData || [];
    const products = productsData || [];
    const calculateItemTotal = (item) => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || 0;
        const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
        const subtotal = qty * price - discountAmt;
        const taxAmt = (subtotal * (item.taxPercent || 0)) / 100;
        return Number((subtotal + taxAmt).toFixed(2));
    };
    const getInitialValues = () => {
        if (orderData) {
            return {
                customerId: orderData.customerId,
                orderDate: parseISOOrNull(orderData.orderDate),
                dueDate: parseISOOrNull(orderData.dueDate),
                branchId: orderData.branchId,
                salesRepId: orderData.salesRepId,
                discountPercent: orderData.discountPercent,
                taxPercent: orderData.taxPercent,
                shipping: orderData.shipping,
                notes: orderData.notes,
                items: orderData.items.map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    productCode: item.productCode,
                    productName: item.productName,
                    unitId: item.unitId,
                    unitName: item.unitName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountPercent: item.discountPercent,
                    taxPercent: item.taxPercent,
                    total: item.total,
                    stockAvailable: item.stockAvailable,
                    notes: item.notes,
                })),
            };
        }
        return {
            customerId: '',
            orderDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            branchId: '',
            salesRepId: '',
            discountPercent: 0,
            taxPercent: 15,
            shipping: 0,
            notes: '',
            items: [emptyItem()],
        };
    };
    function parseISOOrNull(dateStr) {
        if (!dateStr)
            return null;
        try {
            return new Date(dateStr);
        }
        catch {
            return null;
        }
    }
    const formik = useFormik({
        initialValues: getInitialValues(),
        validationSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
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
            saveMutation.mutate({ ...values, subtotal, discount, tax, total: Number(total.toFixed(2)) });
        },
    });
    useEffect(() => {
        if (formik.values.customerId && customers.length > 0) {
            const customer = customers.find((c) => c.id === formik.values.customerId);
            if (customer) {
                if (customer.balance >= customer.creditLimit && customer.creditLimit > 0) {
                    setCustomerCreditWarning(`Customer has exceeded credit limit (${customer.creditLimit.toLocaleString()}). Current balance: ${customer.balance.toLocaleString()}`);
                }
                else if (customer.balance > customer.creditLimit * 0.8 && customer.creditLimit > 0) {
                    setCustomerCreditWarning(`Customer approaching credit limit (${customer.creditLimit.toLocaleString()}). Current balance: ${customer.balance.toLocaleString()}`);
                }
                else {
                    setCustomerCreditWarning(null);
                }
            }
        }
    }, [formik.values.customerId, customers]);
    useEffect(() => {
        if (!isEdit) {
            autoSaveRef.current = setInterval(() => {
                if (formik.values.customerId && formik.values.items.length > 0 && formik.values.items[0].productId) {
                    draftMutation.mutate(formik.values);
                }
            }, 60000);
            return () => {
                if (autoSaveRef.current)
                    clearInterval(autoSaveRef.current);
            };
        }
    }, [isEdit, formik.values]);
    const handleProductSelect = (index, product) => {
        if (!product)
            return;
        const newItems = [...formik.values.items];
        newItems[index] = {
            ...newItems[index],
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            unitId: product.unitId,
            unitName: product.unitName,
            unitPrice: product.salePrice,
            stockAvailable: product.currentStock,
        };
        newItems[index].total = calculateItemTotal(newItems[index]);
        formik.setFieldValue('items', newItems);
    };
    const handleItemChange = (index, field, value) => {
        const newItems = [...formik.values.items];
        newItems[index] = { ...newItems[index], [field]: value };
        newItems[index].total = calculateItemTotal(newItems[index]);
        formik.setFieldValue('items', newItems);
    };
    const addItem = () => {
        formik.setFieldValue('items', [...formik.values.items, emptyItem()]);
    };
    const removeItem = (index) => {
        const newItems = formik.values.items.filter((_, i) => i !== index);
        if (newItems.length === 0)
            newItems.push(emptyItem());
        formik.setFieldValue('items', newItems);
    };
    const subtotal = formik.values.items.reduce((sum, item) => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || 0;
        const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
        return sum + (qty * price - discountAmt);
    }, 0);
    const discount = (subtotal * (formik.values.discountPercent || 0)) / 100;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * (formik.values.taxPercent || 0)) / 100;
    const total = afterDiscount + tax + (formik.values.shipping || 0);
    if (orderLoading) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(CircularProgress, {}) }));
    }
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(FormikProvider, { value: formik, children: _jsxs(Form, { children: [_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/sales/orders'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEdit ? 'Edit Sales Order' : 'New Sales Order' })] }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [!isEdit && (_jsx(Button, { variant: "outlined", onClick: () => draftMutation.mutate(formik.values), disabled: draftMutation.isPending, children: "Save Draft" })), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: formik.isSubmitting || saveMutation.isPending, children: formik.isSubmitting || saveMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Save Order' })] })] }), customerCreditWarning && (_jsx(Alert, { severity: "warning", icon: _jsx(WarningIcon, {}), sx: { mb: 2 }, children: customerCreditWarning })), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Order Info" }), _jsx(Autocomplete, { options: customers, getOptionLabel: (c) => `${c.code} - ${c.name}`, value: customers.find((c) => c.id === formik.values.customerId) || null, onChange: (_, val) => formik.setFieldValue('customerId', val?.id || ''), renderInput: (params) => (_jsx(TextField, { ...params, label: "Customer *", size: "small", fullWidth: true, margin: "normal", error: formik.touched.customerId && Boolean(formik.errors.customerId), helperText: formik.touched.customerId && formik.errors.customerId })) }), _jsx(DatePicker, { label: "Order Date *", value: formik.values.orderDate, onChange: (val) => formik.setFieldValue('orderDate', val), slotProps: {
                                                            textField: {
                                                                size: 'small',
                                                                fullWidth: true,
                                                                margin: 'normal',
                                                                error: formik.touched.orderDate && Boolean(formik.errors.orderDate),
                                                                helperText: formik.touched.orderDate && formik.errors.orderDate,
                                                            },
                                                        } }), _jsx(DatePicker, { label: "Due Date *", value: formik.values.dueDate, onChange: (val) => formik.setFieldValue('dueDate', val), slotProps: {
                                                            textField: {
                                                                size: 'small',
                                                                fullWidth: true,
                                                                margin: 'normal',
                                                                error: formik.touched.dueDate && Boolean(formik.errors.dueDate),
                                                                helperText: formik.touched.dueDate && formik.errors.dueDate,
                                                            },
                                                        } }), _jsx(TextField, { select: true, label: "Branch *", size: "small", fullWidth: true, margin: "normal", value: formik.values.branchId, onChange: (e) => formik.setFieldValue('branchId', e.target.value), error: formik.touched.branchId && Boolean(formik.errors.branchId), helperText: formik.touched.branchId && formik.errors.branchId, children: branchesData?.map((b) => (_jsx("option", { value: b.id, children: b.name }, b.id))) }), _jsx(TextField, { label: "Notes", size: "small", fullWidth: true, margin: "normal", multiline: true, rows: 3, value: formik.values.notes, onChange: (e) => formik.setFieldValue('notes', e.target.value) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Order Items" }), _jsx(Button, { size: "small", variant: "outlined", startIcon: _jsx(AddIcon, {}), onClick: addItem, children: "Add Item" })] }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Product" }), _jsx(TableCell, { align: "right", children: "Qty" }), _jsx(TableCell, { align: "right", children: "Unit Price" }), _jsx(TableCell, { align: "right", children: "Disc%" }), _jsx(TableCell, { align: "right", children: "Tax%" }), _jsx(TableCell, { align: "right", children: "Total" }), _jsx(TableCell, { width: 50 })] }) }), _jsx(TableBody, { children: formik.values.items.map((item, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(Autocomplete, { options: products, getOptionLabel: (p) => `${p.code} - ${p.name} (Stock: ${p.currentStock})`, value: products.find((p) => p.id === item.productId) || null, onChange: (_, val) => handleProductSelect(index, val), renderInput: (params) => (_jsx(TextField, { ...params, size: "small", placeholder: "Select product", fullWidth: true })), size: "small", sx: { minWidth: 250 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.quantity, onChange: (e) => handleItemChange(index, 'quantity', Number(e.target.value)), inputProps: { min: 0.01, step: 0.01 }, sx: { width: 80 }, error: item.quantity > item.stockAvailable && item.stockAvailable > 0 }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.unitPrice, onChange: (e) => handleItemChange(index, 'unitPrice', Number(e.target.value)), inputProps: { min: 0, step: 0.01 }, sx: { width: 100 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.discountPercent, onChange: (e) => handleItemChange(index, 'discountPercent', Number(e.target.value)), inputProps: { min: 0, max: 100, step: 0.01 }, sx: { width: 70 } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.taxPercent, onChange: (e) => handleItemChange(index, 'taxPercent', Number(e.target.value)), inputProps: { min: 0, max: 100, step: 0.01 }, sx: { width: 70 } }) }), _jsx(TableCell, { align: "right", children: _jsx(Typography, { fontWeight: "medium", children: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(item.total) }) }), _jsx(TableCell, { children: _jsx(IconButton, { size: "small", color: "error", onClick: () => removeItem(index), children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }, item.id))) })] }) }), formik.errors.items && typeof formik.errors.items === 'string' && (_jsx(Typography, { color: "error", variant: "caption", sx: { mt: 1 }, children: formik.errors.items })), _jsx(Divider, { sx: { my: 2 } }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'flex-end' }, children: _jsxs(Box, { sx: { width: 300 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { children: "Subtotal:" }), _jsx(Typography, { children: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(subtotal) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { children: "Discount:" }), _jsx(TextField, { type: "number", size: "small", value: formik.values.discountPercent, onChange: (e) => formik.setFieldValue('discountPercent', Number(e.target.value)), inputProps: { min: 0, max: 100 }, sx: { width: 80 }, slotProps: {
                                                                                input: {
                                                                                    endAdornment: _jsx(Typography, { variant: "caption", children: "%" }),
                                                                                },
                                                                            } })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { children: "Discount Amount:" }), _jsx(Typography, { children: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(discount) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { children: "Tax:" }), _jsx(TextField, { type: "number", size: "small", value: formik.values.taxPercent, onChange: (e) => formik.setFieldValue('taxPercent', Number(e.target.value)), inputProps: { min: 0, max: 100 }, sx: { width: 80 }, slotProps: {
                                                                                input: {
                                                                                    endAdornment: _jsx(Typography, { variant: "caption", children: "%" }),
                                                                                },
                                                                            } })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { children: "Tax Amount:" }), _jsx(Typography, { children: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(tax) })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }, children: [_jsx(Typography, { children: "Shipping:" }), _jsx(TextField, { type: "number", size: "small", value: formik.values.shipping, onChange: (e) => formik.setFieldValue('shipping', Number(e.target.value)), inputProps: { min: 0, step: 0.01 }, sx: { width: 120 } })] }), _jsx(Divider, { sx: { my: 1 } }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", children: "Total:" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(total) })] })] }) })] }) }) })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }) }) }));
};
export default SalesOrderForm;
