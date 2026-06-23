import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, Menu, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Autocomplete, } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Delete as DeleteIcon, MoreVert as MoreIcon, Search as SearchIcon, Refresh as RefreshIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const statusConfig = {
    DRAFT: { color: '#9e9e9e', label: 'Draft' },
    PENDING: { color: '#ff9800', label: 'Pending' },
    APPROVED: { color: '#2196f3', label: 'Approved' },
    RECEIVED: { color: '#4caf50', label: 'Received' },
    REFUNDED: { color: '#2e7d32', label: 'Refunded' },
    CANCELLED: { color: '#f44336', label: 'Cancelled' },
};
const returnReasons = ['DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESC', 'EXPIRED', 'DAMAGED', 'OVER_ORDER', 'OTHER'];
const PurchaseReturnsPage = () => {
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'returnDate', sort: 'desc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [selectedReturnId, setSelectedReturnId] = useState(null);
    const fetchReturns = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'desc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (statusFilter)
            params.append('status', statusFilter);
        const response = await api.get(`/purchases/returns?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, statusFilter]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['purchaseReturns', paginationModel, sortModel, searchQuery, statusFilter],
        queryFn: fetchReturns,
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => { await api.delete(`/purchases/returns/${id}`); },
        onSuccess: () => refetch(),
    });
    const columns = [
        {
            field: 'returnNumber',
            headerName: 'Return #',
            width: 130,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value })),
        },
        { field: 'supplierName', headerName: 'Supplier', width: 160 },
        { field: 'orderNumber', headerName: 'PO #', width: 120 },
        {
            field: 'returnDate',
            headerName: 'Return Date',
            width: 120,
            valueFormatter: (value) => format(parseISO(value), 'dd/MM/yyyy'),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: statusConfig[params.value]?.label || params.value, size: "small", sx: {
                    backgroundColor: statusConfig[params.value]?.color + '20',
                    color: statusConfig[params.value]?.color,
                    fontWeight: 600,
                } })),
        },
        { field: 'reason', headerName: 'Reason', width: 130 },
        {
            field: 'total',
            headerName: 'Total',
            width: 120,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'actions',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); setActionAnchorEl(e.currentTarget); setSelectedReturnId(params.row.id); }, children: _jsx(MoreIcon, { fontSize: "small" }) })),
        },
    ];
    const returns = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Purchase Returns" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setShowCreateDialog(true), children: "New Return" })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search return # or supplier...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: {
                                        input: {
                                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })),
                                        },
                                    } }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 140 }, children: [_jsx(MenuItem, { value: "", children: "All Status" }), Object.entries(statusConfig).map(([key, { label }]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: returns, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/purchases/returns/${params.id}`) })] }), _jsxs(Menu, { anchorEl: actionAnchorEl, open: Boolean(actionAnchorEl), onClose: () => setActionAnchorEl(null), children: [_jsxs(MenuItem, { onClick: () => { selectedReturnId && navigate(`/purchases/returns/${selectedReturnId}`); setActionAnchorEl(null); }, children: [_jsx(ViewIcon, { fontSize: "small", sx: { mr: 1 } }), " View"] }), _jsxs(MenuItem, { onClick: () => { selectedReturnId && deleteMutation.mutate(selectedReturnId); setActionAnchorEl(null); }, sx: { color: 'error.main' }, children: [_jsx(DeleteIcon, { fontSize: "small", sx: { mr: 1 } }), " Delete"] })] }), showCreateDialog && (_jsx(CreateReturnDialog, { open: showCreateDialog, onClose: () => setShowCreateDialog(false), onSuccess: () => { refetch(); setShowCreateDialog(false); } }))] }) }));
};
const CreateReturnDialog = ({ open, onClose, onSuccess }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [returnDate, setReturnDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const { data: ordersData } = useQuery({
        queryKey: ['purchaseOrdersForReturn'],
        queryFn: async () => {
            const response = await api.get('/purchases/orders?status=RECEIVED&pageSize=100');
            return response.data.data;
        },
    });
    const createMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                orderId: selectedOrder?.id,
                returnDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : null,
                notes,
                items: returnItems.filter((i) => i.returnQty > 0).map((i) => ({
                    orderItemId: i.itemId,
                    productId: i.productId,
                    quantity: i.returnQty,
                    unitPrice: i.unitPrice,
                    reason: i.reason,
                })),
            };
            await api.post('/purchases/returns', payload);
        },
        onSuccess,
    });
    const handleOrderSelect = (order) => {
        setSelectedOrder(order);
        if (order?.items) {
            setReturnItems(order.items.map((item) => ({
                itemId: item.id,
                productId: item.productId,
                productName: item.productName,
                maxQty: item.receivedQty,
                returnQty: 0,
                unitPrice: item.unitPrice,
                reason: '',
            })));
        }
    };
    const updateQty = (itemId, qty) => {
        setReturnItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, returnQty: Math.min(Math.max(0, qty), i.maxQty) } : i)));
    };
    const updateReason = (itemId, reason) => {
        setReturnItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, reason } : i)));
    };
    const total = returnItems.reduce((s, i) => s + i.returnQty * i.unitPrice, 0);
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Create Purchase Return" }), _jsxs(DialogContent, { children: [_jsxs(Grid, { container: true, spacing: 2, sx: { mb: 2 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Autocomplete, { options: ordersData || [], getOptionLabel: (o) => `${o.orderNumber} - ${o.supplierName}`, value: selectedOrder, onChange: (_, val) => handleOrderSelect(val), renderInput: (params) => _jsx(TextField, { ...params, label: "Select Purchase Order *", size: "small", fullWidth: true }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Return Date *", value: returnDate, onChange: setReturnDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) })] }), selectedOrder && (_jsxs(_Fragment, { children: [_jsx(TableContainer, { component: Paper, variant: "outlined", sx: { mb: 2 }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Product" }), _jsx(TableCell, { align: "right", children: "Received" }), _jsx(TableCell, { align: "right", children: "Return Qty" }), _jsx(TableCell, { children: "Reason" })] }) }), _jsx(TableBody, { children: returnItems.map((item) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx(Typography, { fontWeight: "medium", children: item.productName }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Max: ", item.maxQty] })] }), _jsx(TableCell, { align: "right", children: item.maxQty }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { type: "number", size: "small", value: item.returnQty, onChange: (e) => updateQty(item.itemId, Number(e.target.value)), inputProps: { min: 0, max: item.maxQty }, sx: { width: 80 } }) }), _jsx(TableCell, { children: _jsxs(TextField, { select: true, size: "small", value: item.reason, onChange: (e) => updateReason(item.itemId, e.target.value), sx: { minWidth: 140 }, children: [_jsx(MenuItem, { value: "", children: "Select" }), returnReasons.map((r) => _jsx(MenuItem, { value: r, children: r.replace(/_/g, ' ') }, r))] }) })] }, item.itemId))) })] }) }), _jsx(TextField, { label: "Notes", fullWidth: true, size: "small", multiline: true, rows: 2, value: notes, onChange: (e) => setNotes(e.target.value) }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'flex-end', mt: 1 }, children: _jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", children: ["Total: ", formatCurrency(total)] }) })] }))] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => createMutation.mutate(), disabled: !selectedOrder || returnItems.filter((i) => i.returnQty > 0).length === 0 || createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Return' })] })] }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default PurchaseReturnsPage;
