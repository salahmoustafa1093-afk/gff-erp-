import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Menu, MenuItem, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, MoreVert as MoreIcon, Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon, ShoppingCart as OrderIcon, PendingActions as PendingIcon, CheckCircle as ReceivedIcon, AttachMoney as MoneyIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const statusConfig = {
    DRAFT: { color: '#9e9e9e', label: 'Draft' },
    PENDING: { color: '#ff9800', label: 'Pending' },
    CONFIRMED: { color: '#2196f3', label: 'Confirmed' },
    PARTIAL: { color: '#9c27b0', label: 'Partial' },
    RECEIVED: { color: '#4caf50', label: 'Received' },
    CANCELLED: { color: '#f44336', label: 'Cancelled' },
};
const PurchaseOrdersPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'orderDate', sort: 'desc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const fetchOrders = useCallback(async () => {
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
        if (fromDate)
            params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
        if (toDate)
            params.append('toDate', format(toDate, 'yyyy-MM-dd'));
        const response = await api.get(`/purchases/orders?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, statusFilter, fromDate, toDate]);
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['purchaseOrders', paginationModel, sortModel, searchQuery, statusFilter, fromDate, toDate],
        queryFn: fetchOrders,
    });
    const { data: summaryData } = useQuery({
        queryKey: ['purchaseOrdersSummary'],
        queryFn: async () => {
            const response = await api.get('/purchases/orders/summary');
            return response.data;
        },
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/purchases/orders/${id}`);
        },
        onSuccess: () => refetch(),
    });
    const handleExport = async () => {
        const params = new URLSearchParams();
        if (searchQuery)
            params.append('search', searchQuery);
        if (statusFilter)
            params.append('status', statusFilter);
        const response = await api.get(`/purchases/orders/export?${params.toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `purchase-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const handleActionClick = (event, orderId) => {
        event.stopPropagation();
        setActionAnchorEl(event.currentTarget);
        setSelectedOrderId(orderId);
    };
    const columns = [
        {
            field: 'orderNumber',
            headerName: 'PO #',
            width: 130,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value })),
        },
        { field: 'supplierName', headerName: 'Supplier', width: 180 },
        {
            field: 'orderDate',
            headerName: 'Order Date',
            width: 120,
            valueFormatter: (value) => format(parseISO(value), 'dd/MM/yyyy'),
        },
        {
            field: 'expectedDate',
            headerName: 'Expected Date',
            width: 120,
            valueFormatter: (value) => value ? format(parseISO(value), 'dd/MM/yyyy') : '-',
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: statusConfig[params.value]?.label || params.value, size: "small", sx: {
                    backgroundColor: statusConfig[params.value]?.color + '20',
                    color: statusConfig[params.value]?.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                } })),
        },
        {
            field: 'total',
            headerName: 'Total',
            width: 130,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'balance',
            headerName: 'Balance',
            width: 130,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        { field: 'branchName', headerName: 'Branch', width: 130 },
        {
            field: 'actions',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(IconButton, { size: "small", onClick: (e) => handleActionClick(e, params.row.id), children: _jsx(MoreIcon, { fontSize: "small" }) })),
        },
    ];
    const orders = data?.data || [];
    const totalRows = data?.total || 0;
    const summary = summaryData || { totalOrders: 0, totalAmount: 0, pendingCount: 0, receivedCount: 0 };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Purchase Orders" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/purchases/orders/new'), children: "New PO" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.primary.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Orders" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalOrders?.toLocaleString() || 0 })] }), _jsx(OrderIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Amount" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.totalAmount || 0) })] }), _jsx(MoneyIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.warning.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Pending" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.pendingCount?.toLocaleString() || 0 })] }), _jsx(PendingIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Received" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.receivedCount?.toLocaleString() || 0 })] }), _jsx(ReceivedIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search PO # or supplier...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: {
                                        input: {
                                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })),
                                        },
                                    } }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 140 }, children: [_jsx(MenuItem, { value: "", children: "All Status" }), Object.entries(statusConfig).map(([key, { label }]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsx(DatePicker, { label: "From", value: fromDate, onChange: setFromDate, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(DatePicker, { label: "To", value: toDate, onChange: setToDate, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: orders, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/purchases/orders/${params.id}`), sx: {
                                '& .MuiDataGrid-row': {
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: theme.palette.action.hover },
                                },
                            } })] }), _jsxs(Menu, { anchorEl: actionAnchorEl, open: Boolean(actionAnchorEl), onClose: () => setActionAnchorEl(null), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' }, children: [_jsxs(MenuItem, { onClick: () => { selectedOrderId && navigate(`/purchases/orders/${selectedOrderId}`); setActionAnchorEl(null); }, children: [_jsx(ViewIcon, { fontSize: "small", sx: { mr: 1 } }), " View"] }), _jsxs(MenuItem, { onClick: () => { selectedOrderId && navigate(`/purchases/orders/${selectedOrderId}/edit`); setActionAnchorEl(null); }, children: [_jsx(EditIcon, { fontSize: "small", sx: { mr: 1 } }), " Edit"] }), _jsxs(MenuItem, { onClick: () => { selectedOrderId && deleteMutation.mutate(selectedOrderId); setActionAnchorEl(null); }, sx: { color: 'error.main' }, children: [_jsx(DeleteIcon, { fontSize: "small", sx: { mr: 1 } }), " Delete"] })] })] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default PurchaseOrdersPage;
