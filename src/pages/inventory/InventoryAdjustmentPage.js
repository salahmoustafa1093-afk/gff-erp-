import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Divider, Grid, IconButton, MenuItem, Paper, TextField, Typography, Autocomplete, Snackbar, Alert, CircularProgress, } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../app/api';
const adjustmentReasons = [
    { value: 'DAMAGE', label: 'Damage' }, { value: 'EXPIRY', label: 'Expiry' }, { value: 'LOSS', label: 'Loss' },
    { value: 'FOUND', label: 'Found' }, { value: 'COUNT', label: 'Physical Count' }, { value: 'OTHER', label: 'Other' },
];
const InventoryAdjustmentPage = () => {
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [warehouseId, setWarehouseId] = useState('');
    const [productId, setProductId] = useState('');
    const [currentQty, setCurrentQty] = useState(0);
    const [newQty, setNewQty] = useState('');
    const [reason, setReason] = useState('COUNT');
    const [notes, setNotes] = useState('');
    const { data: warehousesData } = useQuery({
        queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data; },
        queryKey: ['warehousesForAdjustment'],
    });
    const { data: productsData } = useQuery({
        queryFn: async () => { const response = await api.get('/products?active=true&pageSize=1000'); return response.data.data; },
        queryKey: ['productsForAdjustment'],
    });
    const { data: currentStockData, refetch: refetchStock } = useQuery({
        queryKey: ['currentStock', warehouseId, productId],
        queryFn: async () => {
            if (!warehouseId || !productId)
                return null;
            const response = await api.get(`/inventory/stock?warehouseId=${warehouseId}&productId=${productId}`);
            return response.data;
        },
        enabled: Boolean(warehouseId && productId),
    });
    const createMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                warehouseId,
                productId,
                currentQty: currentStockData?.quantity || 0,
                newQty: Number(newQty),
                difference: Number(newQty) - (currentStockData?.quantity || 0),
                unitCost: currentStockData?.unitCost || 0,
                reason,
                notes,
            };
            const response = await api.post('/inventory/adjustments', payload);
            return response.data;
        },
        onSuccess: () => {
            setSnackbar({ open: true, message: 'Adjustment created successfully', severity: 'success' });
            setTimeout(() => navigate('/inventory'), 1000);
        },
        onError: (error) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to create adjustment', severity: 'error' }); },
    });
    const handleProductSelect = (pid) => {
        setProductId(pid);
        setNewQty('');
    };
    const handleWarehouseChange = (wid) => {
        setWarehouseId(wid);
        setProductId('');
        setNewQty('');
    };
    const warehouses = warehousesData || [];
    const products = productsData || [];
    const currentStock = currentStockData?.quantity || 0;
    const unitCost = currentStockData?.unitCost || 0;
    const difference = (Number(newQty) || 0) - currentStock;
    const differenceCost = difference * unitCost;
    const isValid = warehouseId && productId && newQty !== '' && !isNaN(Number(newQty)) && Number(newQty) >= 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/inventory'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Stock Adjustment" })] }) }), _jsx(Grid, { container: true, spacing: 3, justifyContent: "center", children: _jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { p: 4 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 3 }, children: "Adjustment Details" }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Warehouse *", value: warehouseId, onChange: (e) => handleWarehouseChange(e.target.value), children: [_jsx(MenuItem, { value: "", children: "Select Warehouse" }), warehouses.map((w) => (_jsx(MenuItem, { value: w.id, children: w.name }, w.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Autocomplete, { options: products, getOptionLabel: (p) => `${p.code} - ${p.name}`, value: products.find((p) => p.id === productId) || null, onChange: (_, val) => handleProductSelect(val?.id || ''), renderInput: (params) => _jsx(TextField, { ...params, label: "Product *", size: "small", fullWidth: true }) }) })] }), productId && warehouseId && (_jsxs(_Fragment, { children: [_jsx(Divider, { sx: { my: 3 } }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', backgroundColor: 'primary.main', color: 'white' }, children: [_jsx(Typography, { variant: "caption", sx: { opacity: 0.9 }, children: "Current Quantity" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: currentStock.toLocaleString() })] }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', backgroundColor: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'grey.500', color: 'white' }, children: [_jsx(Typography, { variant: "caption", sx: { opacity: 0.9 }, children: "Difference" }), _jsxs(Typography, { variant: "h4", fontWeight: "bold", children: [difference > 0 ? '+' : '', difference.toLocaleString()] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsxs(Paper, { sx: { p: 2, textAlign: 'center', backgroundColor: 'action.hover' }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Difference Value" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: differenceCost > 0 ? 'success.main' : differenceCost < 0 ? 'error' : 'text.secondary', children: formatCurrency(differenceCost) })] }) })] }), _jsxs(Box, { sx: { mt: 3 }, children: [_jsx(TextField, { fullWidth: true, size: "small", label: "New Quantity *", type: "number", value: newQty, onChange: (e) => setNewQty(e.target.value === '' ? '' : Number(e.target.value)), inputProps: { min: 0, step: 0.01 }, sx: { mb: 2 } }), _jsx(TextField, { select: true, fullWidth: true, size: "small", label: "Reason *", value: reason, onChange: (e) => setReason(e.target.value), sx: { mb: 2 }, children: adjustmentReasons.map((r) => (_jsx(MenuItem, { value: r.value, children: r.label }, r.value))) }), _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", value: notes, onChange: (e) => setNotes(e.target.value), multiline: true, rows: 3 })] })] })), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/inventory'), children: "Cancel" }), _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: !isValid || createMutation.isPending, onClick: () => createMutation.mutate(), children: createMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Create Adjustment' })] })] }) }) }) }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default InventoryAdjustmentPage;
