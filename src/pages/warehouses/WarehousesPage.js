import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Add as AddIcon, Warehouse as WarehouseIcon, Search as SearchIcon, Refresh as RefreshIcon, Inventory as StockIcon, AttachMoney as MoneyIcon, LocalShipping as TypeIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import api from '../../app/api';
const warehouseTypes = { MAIN: 'Main', RETAIL: 'Retail', RETURN: 'Return', TEMPORARY: 'Temporary' };
const WarehousesPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'name', sort: 'asc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const fetchWarehouses = useCallback(async () => {
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
        const response = await api.get(`/warehouses?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, typeFilter, statusFilter]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['warehouses', paginationModel, sortModel, searchQuery, typeFilter, statusFilter],
        queryFn: fetchWarehouses,
    });
    const { data: summaryData } = useQuery({
        queryKey: ['warehousesSummary'],
        queryFn: async () => { const response = await api.get('/warehouses/summary'); return response.data; },
    });
    const summary = summaryData || { total: 0, active: 0, totalSKUs: 0, totalValue: 0 };
    const columns = [
        { field: 'code', headerName: 'Code', width: 100 },
        {
            field: 'name',
            headerName: 'Name',
            width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value }), params.row.nameAr && _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { direction: 'rtl', display: 'block' }, children: params.row.nameAr })] })),
        },
        {
            field: 'type', headerName: 'Type', width: 110,
            renderCell: (params) => _jsx(Chip, { label: warehouseTypes[params.value] || params.value, size: "small", sx: { fontWeight: 600, fontSize: '0.7rem' } }),
        },
        { field: 'branchName', headerName: 'Branch', width: 130 },
        { field: 'managerName', headerName: 'Manager', width: 140 },
        {
            field: 'totalSKUs', headerName: 'SKUs', width: 80, type: 'number',
            renderCell: (params) => _jsx(Typography, { variant: "body2", fontWeight: "medium", children: params.value?.toLocaleString() || 0 }),
        },
        {
            field: 'totalValue', headerName: 'Value', width: 130, type: 'number',
            valueFormatter: (value) => formatCurrency(value || 0),
        },
        {
            field: 'isActive', headerName: 'Status', width: 90,
            renderCell: (params) => _jsx(Chip, { label: params.value ? 'Active' : 'Inactive', size: "small", color: params.value ? 'success' : 'default', sx: { fontWeight: 600, fontSize: '0.7rem' } }),
        },
        {
            field: 'actions', headerName: '', width: 80, sortable: false, filterable: false,
            renderCell: (params) => (_jsx(Button, { size: "small", variant: "outlined", onClick: (e) => { e.stopPropagation(); navigate(`/warehouses/${params.row.id}`); }, children: "View" })),
        },
    ];
    const warehouses = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Warehouses" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/warehouses/new'), children: "New Warehouse" })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.primary.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Warehouses" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.total?.toLocaleString() || 0 })] }), _jsx(WarehouseIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Active" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.active?.toLocaleString() || 0 })] }), _jsx(TypeIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.info.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total SKUs" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalSKUs?.toLocaleString() || 0 })] }), _jsx(StockIcon, { color: "info", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.warning.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Value" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.totalValue || 0) })] }), _jsx(MoneyIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search name, code...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: { input: { startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })) } } }), _jsxs(TextField, { select: true, size: "small", label: "Type", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), sx: { minWidth: 130 }, children: [_jsx(MenuItem, { value: "", children: "All" }), Object.entries(warehouseTypes).map(([key, label]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 120 }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: warehouses, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/warehouses/${params.id}`), sx: { '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } } })] })] }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default WarehousesPage;
