import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Menu, MenuItem, Paper, Rating, TextField, Typography, useTheme, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Receipt as StatementIcon, MoreVert as MoreIcon, Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon, People as SuppliersIcon, AttachMoney as MoneyIcon, ThumbUp as RatingIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import api from '../../app/api';
const typeLabels = { LOCAL: 'Local', IMPORT: 'Import', MANUFACTURER: 'Manufacturer' };
const typeColors = { LOCAL: '#2196f3', IMPORT: '#ff9800', MANUFACTURER: '#4caf50' };
const SuppliersPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'name', sort: 'asc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const fetchSuppliers = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'asc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (typeFilter)
            params.append('type', typeFilter);
        if (statusFilter)
            params.append('status', statusFilter);
        const response = await api.get(`/suppliers?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, typeFilter, statusFilter]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['suppliers', paginationModel, sortModel, searchQuery, typeFilter, statusFilter],
        queryFn: fetchSuppliers,
    });
    const { data: summaryData } = useQuery({
        queryKey: ['suppliersSummary'],
        queryFn: async () => { const response = await api.get('/suppliers/summary'); return response.data; },
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => { await api.delete(`/suppliers/${id}`); },
        onSuccess: () => refetch(),
    });
    const handleExport = async () => {
        const response = await api.get(`/suppliers/export?${new URLSearchParams({ search: searchQuery, type: typeFilter }).toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `suppliers-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const handleActionClick = (event, supplier) => {
        event.stopPropagation();
        setActionAnchorEl(event.currentTarget);
        setSelectedSupplierId(supplier.id);
    };
    const summary = summaryData || { total: 0, active: 0, totalBalance: 0, avgRating: 0 };
    const columns = [
        { field: 'code', headerName: 'Code', width: 100 },
        {
            field: 'name', headerName: 'Name', width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value }), params.row.nameAr && _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { direction: 'rtl', display: 'block' }, children: params.row.nameAr })] })),
        },
        {
            field: 'type', headerName: 'Type', width: 110,
            renderCell: (params) => (_jsx(Chip, { label: typeLabels[params.value] || params.value, size: "small", sx: { backgroundColor: (typeColors[params.value] || '#9e9e9e') + '20', color: typeColors[params.value] || '#9e9e9e', fontWeight: 600, fontSize: '0.7rem' } })),
        },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'email', headerName: 'Email', width: 180 },
        { field: 'leadTime', headerName: 'Lead Time', width: 100, type: 'number', valueFormatter: (value) => value ? `${value} days` : '-' },
        {
            field: 'rating', headerName: 'Rating', width: 120,
            renderCell: (params) => _jsx(Rating, { value: params.value, readOnly: true, size: "small", precision: 0.5 }),
        },
        {
            field: 'balance', headerName: 'Balance', width: 130, type: 'number',
            renderCell: (params) => {
                const supplier = params.row;
                const exceeds = supplier.balance >= supplier.creditLimit && supplier.creditLimit > 0;
                return _jsx(Typography, { variant: "body2", color: exceeds ? 'error' : 'inherit', fontWeight: exceeds ? 'bold' : 'normal', children: formatCurrency(params.value) });
            },
        },
        {
            field: 'isActive', headerName: 'Status', width: 90,
            renderCell: (params) => _jsx(Chip, { label: params.value ? 'Active' : 'Inactive', size: "small", color: params.value ? 'success' : 'default', sx: { fontWeight: 600, fontSize: '0.7rem' } }),
        },
        {
            field: 'actions', headerName: '', width: 50, sortable: false, filterable: false,
            renderCell: (params) => (_jsx(IconButton, { size: "small", onClick: (e) => handleActionClick(e, params.row), children: _jsx(MoreIcon, { fontSize: "small" }) })),
        },
    ];
    const suppliers = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Suppliers" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/suppliers/new'), children: "New Supplier" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.primary.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Suppliers" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.total?.toLocaleString() || 0 })] }), _jsx(SuppliersIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Active" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.active?.toLocaleString() || 0 })] }), _jsx(RatingIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.info.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Payables" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.totalBalance || 0) })] }), _jsx(MoneyIcon, { color: "info", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.warning.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Avg Rating" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", children: [(summary.avgRating || 0).toFixed(1), _jsx(Rating, { value: summary.avgRating || 0, readOnly: true, size: "small", sx: { ml: 1, verticalAlign: 'middle' } })] })] }), _jsx(RatingIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search name, phone, code...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: { input: { startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })) } } }), _jsxs(TextField, { select: true, size: "small", label: "Type", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), sx: { minWidth: 130 }, children: [_jsx(MenuItem, { value: "", children: "All Types" }), Object.entries(typeLabels).map(([key, label]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 120 }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: suppliers, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/suppliers/${params.id}`), sx: { '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } } })] }), _jsxs(Menu, { anchorEl: actionAnchorEl, open: Boolean(actionAnchorEl), onClose: () => setActionAnchorEl(null), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' }, children: [_jsxs(MenuItem, { onClick: () => { selectedSupplierId && navigate(`/suppliers/${selectedSupplierId}`); setActionAnchorEl(null); }, children: [_jsx(ViewIcon, { fontSize: "small", sx: { mr: 1 } }), " View"] }), _jsxs(MenuItem, { onClick: () => { selectedSupplierId && navigate(`/suppliers/${selectedSupplierId}/edit`); setActionAnchorEl(null); }, children: [_jsx(EditIcon, { fontSize: "small", sx: { mr: 1 } }), " Edit"] }), _jsxs(MenuItem, { onClick: () => { selectedSupplierId && navigate(`/suppliers/${selectedSupplierId}/statement`); setActionAnchorEl(null); }, children: [_jsx(StatementIcon, { fontSize: "small", sx: { mr: 1 } }), " Statement"] }), _jsxs(MenuItem, { onClick: () => { selectedSupplierId && deleteMutation.mutate(selectedSupplierId); setActionAnchorEl(null); }, sx: { color: 'error.main' }, children: [_jsx(DeleteIcon, { fontSize: "small", sx: { mr: 1 } }), " Delete"] })] })] }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default SuppliersPage;
