import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, } from '@mui/material';
import { Add as AddIcon, BarChart as VarianceIcon, } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const statusConfig = {
    DRAFT: { color: '#9e9e9e', label: 'Draft' },
    IN_PROGRESS: { color: '#ff9800', label: 'In Progress' },
    COMPLETED: { color: '#2196f3', label: 'Completed' },
    APPROVED: { color: '#4caf50', label: 'Approved' },
    CANCELLED: { color: '#f44336', label: 'Cancelled' },
};
const PhysicalCountPage = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState('setup');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { data: countsData, isLoading, refetch } = useQuery({
        queryKey: ['physicalCounts'],
        queryFn: async () => { const response = await api.get('/inventory/counts?pageSize=50'); return response.data.data; },
    });
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Physical Counts" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(VarianceIcon, {}), onClick: () => navigate('/inventory/counts/variances'), children: "Variances" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setShowCreateDialog(true), children: "New Count" })] })] }), _jsx(Paper, { sx: { p: 2 }, children: _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: 'primary.main' }, children: [_jsx(TableCell, { sx: { color: 'white' }, children: "Count #" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Warehouse" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Category" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Date" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Status" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Items" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Variance" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Actions" })] }) }), _jsxs(TableBody, { children: [(!countsData || countsData.length === 0) && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, align: "center", sx: { py: 4 }, children: _jsx(Typography, { color: "text.secondary", children: "No count records" }) }) })), countsData?.map((count) => {
                                        const totalVariance = count.items?.reduce((s, i) => s + Math.abs(i.variance), 0) || 0;
                                        return (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { fontWeight: "medium", children: count.countNumber }), _jsx(TableCell, { children: count.warehouseName }), _jsx(TableCell, { children: count.categoryName || 'All' }), _jsx(TableCell, { children: format(parseISO(count.countDate), 'dd/MM/yyyy') }), _jsx(TableCell, { children: _jsx(Chip, { label: statusConfig[count.status]?.label || count.status, size: "small", sx: { backgroundColor: (statusConfig[count.status]?.color || '#9e9e9e') + '20', color: statusConfig[count.status]?.color || '#9e9e9e', fontWeight: 600 } }) }), _jsx(TableCell, { children: count.items?.length || 0 }), _jsx(TableCell, { children: _jsx(Typography, { color: totalVariance > 0 ? 'warning.main' : 'success.main', fontWeight: "medium", children: totalVariance.toLocaleString() }) }), _jsxs(TableCell, { align: "right", children: [_jsx(Button, { size: "small", variant: "outlined", onClick: () => navigate(`/inventory/counts/${count.id}`), children: "View" }), count.status === 'IN_PROGRESS' && (_jsx(Button, { size: "small", variant: "contained", sx: { ml: 1 }, onClick: () => navigate(`/inventory/counts/${count.id}/enter`), children: "Enter" }))] })] }, count.id));
                                    })] })] }) }) }), showCreateDialog && (_jsx(CreateCountDialog, { open: showCreateDialog, onClose: () => setShowCreateDialog(false), onSuccess: () => { refetch(); setShowCreateDialog(false); } }))] }));
};
const CreateCountDialog = ({ open, onClose, onSuccess }) => {
    const [warehouseId, setWarehouseId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [countDate, setCountDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const { data: warehousesData } = useQuery({
        queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data; },
        queryKey: ['warehousesForCount'],
    });
    const { data: categoriesData } = useQuery({
        queryFn: async () => { const response = await api.get('/products/categories?active=true'); return response.data.data; },
        queryKey: ['categoriesForCount'],
    });
    const createMutation = useMutation({
        mutationFn: async () => {
            const payload = { warehouseId, categoryId: categoryId || null, countDate: countDate ? format(countDate, 'yyyy-MM-dd') : null, notes };
            await api.post('/inventory/counts', payload);
        },
        onSuccess,
    });
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Create Count Sheet" }), _jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, sx: { mt: 0.5 }, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Warehouse *", value: warehouseId, onChange: (e) => setWarehouseId(e.target.value), children: [_jsx(MenuItem, { value: "", children: "Select" }), warehousesData?.map((w) => (_jsx(MenuItem, { value: w.id, children: w.name }, w.id)))] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsxs(TextField, { select: true, fullWidth: true, size: "small", label: "Category (optional)", value: categoryId, onChange: (e) => setCategoryId(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All Categories" }), categoriesData?.map((c) => (_jsx(MenuItem, { value: c.id, children: c.name }, c.id)))] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(DatePicker, { label: "Count Date *", value: countDate, onChange: setCountDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", value: notes, onChange: (e) => setNotes(e.target.value), multiline: true, rows: 2 }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => createMutation.mutate(), disabled: !warehouseId || !countDate || createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Count Sheet' })] })] }));
};
export default PhysicalCountPage;
