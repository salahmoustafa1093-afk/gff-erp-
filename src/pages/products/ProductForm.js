import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Divider, Grid, IconButton, MenuItem, Paper, TextField, Typography, Snackbar, Alert, CircularProgress, Tab, Tabs, } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../../app/api';
const productTypes = ['GOODS', 'SERVICE', 'RAW_MATERIAL', 'FINISHED', 'FEED'];
const validationSchema = Yup.object({
    code: Yup.string().required('Code is required').max(50),
    name: Yup.string().required('Name is required').max(200),
    nameAr: Yup.string().max(200),
    type: Yup.string().required('Type is required').oneOf(productTypes),
    categoryId: Yup.string().required('Category is required'),
    unitId: Yup.string().required('Unit is required'),
    costPrice: Yup.number().min(0).required('Cost price is required'),
    salePrice: Yup.number().min(0).required('Sale price is required'),
    minPrice: Yup.number().min(0),
    minStock: Yup.number().integer().min(0),
    maxStock: Yup.number().integer().min(0),
    reorderPoint: Yup.number().integer().min(0),
    reorderQty: Yup.number().integer().min(0),
    weight: Yup.number().min(0),
    barcode: Yup.string().max(50),
    description: Yup.string().max(2000),
});
const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id && id !== 'new');
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { data: productData, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => { if (!isEdit)
            return null; const response = await api.get(`/products/${id}`); return response.data; },
        enabled: isEdit,
    });
    const { data: categoriesData } = useQuery({
        queryKey: ['productCategoriesForm'],
        queryFn: async () => { const response = await api.get('/products/categories?active=true&pageSize=1000'); return response.data.data; },
    });
    const { data: brandsData } = useQuery({
        queryKey: ['productBrandsForm'],
        queryFn: async () => { const response = await api.get('/products/brands?active=true&pageSize=1000'); return response.data.data; },
    });
    const { data: unitsData } = useQuery({
        queryKey: ['productUnitsForm'],
        queryFn: async () => { const response = await api.get('/products/units?active=true&pageSize=1000'); return response.data.data; },
    });
    const saveMutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                ...values,
                costPrice: Number(values.costPrice),
                salePrice: Number(values.salePrice),
                minPrice: Number(values.minPrice) || 0,
                minStock: Number(values.minStock) || 0,
                maxStock: Number(values.maxStock) || 0,
                reorderPoint: Number(values.reorderPoint) || 0,
                reorderQty: Number(values.reorderQty) || 0,
                weight: Number(values.weight) || 0,
                isActive: values.isActive,
            };
            if (isEdit) {
                const response = await api.put(`/products/${id}`, payload);
                return response.data;
            }
            else {
                const response = await api.post('/products', payload);
                return response.data;
            }
        },
        onSuccess: () => {
            setSnackbar({ open: true, message: `Product ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
            if (!isEdit)
                setTimeout(() => navigate('/products'), 800);
        },
        onError: (error) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save', severity: 'error' }); },
    });
    if (isLoading)
        return _jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(CircularProgress, {}) });
    const initialValues = {
        code: productData?.code || '',
        name: productData?.name || '',
        nameAr: productData?.nameAr || '',
        barcode: productData?.barcode || '',
        type: productData?.type || 'GOODS',
        categoryId: productData?.categoryId || '',
        brandId: productData?.brandId || '',
        unitId: productData?.unitId || '',
        costPrice: productData?.costPrice || 0,
        salePrice: productData?.salePrice || 0,
        minPrice: productData?.minPrice || 0,
        minStock: productData?.minStock || 0,
        maxStock: productData?.maxStock || 0,
        reorderPoint: productData?.reorderPoint || 0,
        reorderQty: productData?.reorderQty || 0,
        weight: productData?.weight || 0,
        nutritionalInfo: productData?.nutritionalInfo ? JSON.stringify(productData.nutritionalInfo, null, 2) : '',
        description: productData?.description || '',
        isActive: productData?.isActive ?? true,
    };
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/products'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEdit ? 'Edit Product' : 'New Product' })] }) }), _jsx(Formik, { initialValues: initialValues, validationSchema: validationSchema, enableReinitialize: true, onSubmit: (values) => saveMutation.mutate(values), children: ({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (_jsx(Form, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsxs(Tabs, { value: activeTab, onChange: (_, val) => setActiveTab(val), sx: { mb: 3 }, children: [_jsx(Tab, { label: "Basic Info" }), _jsx(Tab, { label: "Pricing & Inventory" }), _jsx(Tab, { label: "Additional" })] }), activeTab === 0 && (_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Product Code *", name: "code", value: values.code, onChange: handleChange, onBlur: handleBlur, error: touched.code && Boolean(errors.code), helperText: touched.code && errors.code }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Barcode", name: "barcode", value: values.barcode, onChange: handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { select: true, fullWidth: true, size: "small", label: "Type *", name: "type", value: values.type, onChange: handleChange, onBlur: handleBlur, error: touched.type && Boolean(errors.type), helperText: touched.type && errors.type, children: productTypes.map((t) => (_jsx(MenuItem, { value: t, children: t }, t))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Name (English) *", name: "name", value: values.name, onChange: handleChange, onBlur: handleBlur, error: touched.name && Boolean(errors.name), helperText: touched.name && errors.name }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Name (Arabic)", name: "nameAr", value: values.nameAr, onChange: handleChange, inputProps: { dir: 'rtl' } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Category *", name: "categoryId", value: values.categoryId, onChange: handleChange, onBlur: handleBlur, error: touched.categoryId && Boolean(errors.categoryId), helperText: touched.categoryId && errors.categoryId, children: [_jsx(MenuItem, { value: "", children: "Select" }), categoriesData?.map((c) => (_jsx(MenuItem, { value: c.id, children: c.name }, c.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Brand", name: "brandId", value: values.brandId, onChange: handleChange, children: [_jsx(MenuItem, { value: "", children: "None" }), brandsData?.map((b) => (_jsx(MenuItem, { value: b.id, children: b.name }, b.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Unit *", name: "unitId", value: values.unitId, onChange: handleChange, onBlur: handleBlur, error: touched.unitId && Boolean(errors.unitId), helperText: touched.unitId && errors.unitId, children: [_jsx(MenuItem, { value: "", children: "Select" }), unitsData?.map((u) => (_jsx(MenuItem, { value: u.id, children: u.name }, u.id)))] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Description", name: "description", value: values.description, onChange: handleChange, multiline: true, rows: 3 }) })] })), activeTab === 1 && (_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Cost Price *", name: "costPrice", type: "number", value: values.costPrice, onChange: handleChange, onBlur: handleBlur, error: touched.costPrice && Boolean(errors.costPrice), helperText: touched.costPrice && errors.costPrice, inputProps: { min: 0, step: 0.01 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Sale Price *", name: "salePrice", type: "number", value: values.salePrice, onChange: handleChange, onBlur: handleBlur, error: touched.salePrice && Boolean(errors.salePrice), helperText: touched.salePrice && errors.salePrice, inputProps: { min: 0, step: 0.01 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Minimum Price", name: "minPrice", type: "number", value: values.minPrice, onChange: handleChange, inputProps: { min: 0, step: 0.01 } }) }), _jsxs(Grid, { size: { xs: 12 }, children: [_jsx(Divider, { sx: { my: 1 } }), _jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Inventory Settings" })] }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Min Stock", name: "minStock", type: "number", value: values.minStock, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Max Stock", name: "maxStock", type: "number", value: values.maxStock, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Reorder Point", name: "reorderPoint", type: "number", value: values.reorderPoint, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Reorder Qty", name: "reorderQty", type: "number", value: values.reorderQty, onChange: handleChange, inputProps: { min: 0 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Weight (kg)", name: "weight", type: "number", value: values.weight, onChange: handleChange, inputProps: { min: 0, step: 0.001 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Status", name: "isActive", value: String(values.isActive), onChange: (e) => setFieldValue('isActive', e.target.value === 'true'), children: [_jsx(MenuItem, { value: "true", children: "Active" }), _jsx(MenuItem, { value: "false", children: "Inactive" })] }) })] })), activeTab === 2 && (_jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { size: { xs: 12 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Nutritional Information (JSON)" }), _jsx(TextField, { fullWidth: true, size: "small", label: "Nutritional Info", name: "nutritionalInfo", value: values.nutritionalInfo, onChange: handleChange, multiline: true, rows: 8, placeholder: `{\n  "protein": 18.5,\n  "fat": 3.2,\n  "fiber": 8.1\n}`, helperText: "Enter valid JSON for feed product nutritional data" })] }), _jsxs(Grid, { size: { xs: 12 }, children: [_jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Product Image" }), _jsx(TextField, { fullWidth: true, size: "small", label: "Image URL", name: "imageUrl", placeholder: "https://example.com/image.jpg", disabled: true, helperText: "Image upload will be available in future release" })] })] }))] }) }), _jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { sx: { position: 'sticky', top: 16 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Actions" }), isEdit && productData && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(InfoRow, { label: "Current Stock", value: productData.currentStock?.toLocaleString() || '0' }), _jsx(InfoRow, { label: "Profit Margin", value: `${((1 - (productData.costPrice / productData.salePrice)) * 100).toFixed(1)}%` })] })), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 1 }, children: [_jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), fullWidth: true, disabled: saveMutation.isPending, children: saveMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Save Product' }), _jsx(Button, { variant: "outlined", onClick: () => navigate('/products'), fullWidth: true, children: "Cancel" })] })] }) }) })] }) })) }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }));
};
const InfoRow = ({ label, value }) => (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: value })] }));
export default ProductForm;
