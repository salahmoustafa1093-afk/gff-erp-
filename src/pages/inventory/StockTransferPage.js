import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Divider, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Autocomplete, Snackbar, Alert, CircularProgress, MenuItem, } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import api from '../../app/api';
const StockTransferPage = () => {
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [transferDate, setTransferDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([]);
    const { data: warehousesData } = useQuery({
        queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data; },
        queryKey: ['warehousesForTransfer'],
    });
    const { data: productsData } = useQuery({
        queryFn: async () => { const response = await api.get('/products?active=true&pageSize=1000'); return response.data.data; },
        queryKey: ['productsForTransfer'],
    });
    const createMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                fromWarehouseId, toWarehouseId,
                transferDate: transferDate ? format(transferDate, 'yyyy-MM-dd') : null,
                notes,
                items: items.filter((i) => i.productId && i.quantity > 0).map((i) => ({ productId: i.productId, quantity: i.quantity, notes: i.notes })),
            };
            const response = await api.post('/inventory/transfers', payload);
            return response.data;
        },
        onSuccess: () => {
            setSnackbar({ open: true, message: 'Stock transfer created successfully', severity: 'success' });
            setTimeout(() => navigate('/inventory'), 1000);
        },
        onError: (error) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to create transfer', severity: 'error' }); },
    });
    const addItem = () => {
        setItems([...items, { id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, productId: '', productCode: '', productName: '', availableQty: 0, quantity: 1, notes: '' }]);
    };
    const removeItem = (id) => {
        const newItems = items.filter((i) => i.id !== id);
        if (newItems.length === 0)
            setItems([{ id: `new-${Date.now()}`, productId: '', productCode: '', productName: '', availableQty: 0, quantity: 1, notes: '' }]);
        else
            setItems(newItems);
    };
    const updateItemProduct = (itemId, product) => {
        if (!product)
            return;
        setItems(items.map((i) => i.id === itemId ? { ...i, productId: product.id, productCode: product.code, productName: product.name, availableQty: product.currentStock, quantity: Math.min(1, product.currentStock) } : i));
    };
    const updateItemQty = (itemId, qty) => {
        setItems(items.map((i) => i.id === itemId ? { ...i, quantity: Math.min(Math.max(1, qty), i.availableQty) } : i));
    };
    const products = productsData || [];
    const warehouses = warehousesData || [];
    const isValid = fromWarehouseId && toWarehouseId && fromWarehouseId !== toWarehouseId && items.some((i) => i.productId && i.quantity > 0);
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/inventory'), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "New Stock Transfer" })] }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Transfer Details" }), _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "From Warehouse *", value: fromWarehouseId, onChange: (e) => setFromWarehouseId(e.target.value), margin: "normal", children: [_jsx(MenuItem, { value: "", children: "Select" }), warehouses.map((w) => (_jsx(MenuItem, { value: w.id, children: w.name }, w.id)))] }), _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "To Warehouse *", value: toWarehouseId, onChange: (e) => setToWarehouseId(e.target.value), margin: "normal", error: toWarehouseId === fromWarehouseId && toWarehouseId !== '', helperText: toWarehouseId === fromWarehouseId && toWarehouseId !== '' ? 'Cannot transfer to same warehouse' : '', children: [_jsx(MenuItem, { value: "", children: "Select" }), warehouses.map((w) => (_jsx(MenuItem, { value: w.id, children: w.name }, w.id)))] }), _jsx(DatePicker, { label: "Transfer Date *", value: transferDate, onChange: setTransferDate, slotProps: { textField: { size: 'small', fullWidth: true, margin: 'normal' } } }), _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", value: notes, onChange: (e) => setNotes(e.target.value), margin: "normal", multiline: true, rows: 3 }), fromWarehouseId && toWarehouseId && (_jsxs(Box, { sx: { mt: 2, p: 1.5, backgroundColor: 'action.hover', borderRadius: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Transfer Route" }), _jsxs(Typography, { variant: "subtitle2", fontWeight: "bold", children: [warehouses.find((w) => w.id === fromWarehouseId)?.name, _jsx(Box, { component: "span", sx: { mx: 1, color: 'primary.main' }, children: "\u2192" }), warehouses.find((w) => w.id === toWarehouseId)?.name] })] }))] }) }) }), _jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Transfer Items" }), _jsx(Button, { size: "small", variant: "outlined", startIcon: _jsx(AddIcon, {}), onClick: addItem, children: "Add Item" })] }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Product" }), _jsx(TableCell, { align: "right", children: "Available" }), _jsx(TableCell, { align: "right", children: "Qty" }), _jsx(TableCell, { children: "Notes" }), _jsx(TableCell, { width: 50 })] }) }), _jsx(TableBody, { children: items.map((item) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx(Autocomplete, { options: products, getOptionLabel: (p) => `${p.code} - ${p.name} (Stock: ${p.currentStock})`, value: products.find((p) => p.id === item.productId) || null, onChange: (_, val) => updateItemProduct(item.id, val), renderInput: (params) => _jsx(TextField, { ...params, size: "small", placeholder: "Select product", fullWidth: true }), size: "small", sx: { minWidth: 280 } }) }), _jsx(TableCell, { align: "right", children: item.availableQty.toLocaleString() }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.quantity, onChange: (e) => updateItemQty(item.id, Number(e.target.value)), inputProps: { min: 1, max: item.availableQty }, sx: { width: 80 }, error: item.quantity > item.availableQty }) }), _jsx(TableCell, { children: _jsx(TextField, { size: "small", value: item.notes, onChange: (e) => setItems(items.map((i) => i.id === item.id ? { ...i, notes: e.target.value } : i)), placeholder: "Notes" }) }), _jsx(TableCell, { children: _jsx(IconButton, { size: "small", color: "error", onClick: () => removeItem(item.id), children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] }, item.id))) })] }) }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'flex-end' }, children: _jsxs(Typography, { variant: "h6", fontWeight: "bold", children: ["Total Items: ", items.filter((i) => i.quantity > 0).reduce((s, i) => s + i.quantity, 0).toLocaleString()] }) }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/inventory'), children: "Cancel" }), _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: !isValid || createMutation.isPending, onClick: () => createMutation.mutate(), children: createMutation.isPending ? _jsx(CircularProgress, { size: 24 }) : 'Create Transfer' })] })] }) }) })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { severity: snackbar.severity, onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }) }));
};
export default StockTransferPage;
