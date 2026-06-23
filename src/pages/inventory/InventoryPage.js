import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Visibility as ViewIcon, SwapHoriz as TransferIcon, Add as AddIcon, TrendingDown as LowStockIcon, Warning as OutOfStockIcon, Search as SearchIcon, Refresh as RefreshIcon, AttachMoney as MoneyIcon, Category as CategoryIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import api from '../../app/api';
const InventoryPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'productName', sort: 'asc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [stockStatusFilter, setStockStatusFilter] = useState('');
    const fetchInventory = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'asc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (warehouseFilter)
            params.append('warehouseId', warehouseFilter);
        if (categoryFilter)
            params.append('categoryId', categoryFilter);
        if (stockStatusFilter)
            params.append('stockStatus', stockStatusFilter);
        const response = await api.get(`/inventory?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, warehouseFilter, categoryFilter, stockStatusFilter]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['inventory', paginationModel, sortModel, searchQuery, warehouseFilter, categoryFilter, stockStatusFilter],
        queryFn: fetchInventory,
    });
    const { data: summaryData } = useQuery({
        queryKey: ['inventorySummary'],
        queryFn: async () => { const response = await api.get('/inventory/summary'); return response.data; },
    });
    const { data: warehousesData } = useQuery({
        queryKey: ['warehousesForInventory'],
        queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data; },
    });
    const { data: categoriesData } = useQuery({
        queryKey: ['categoriesForInventory'],
        queryFn: async () => { const response = await api.get('/products/categories?active=true'); return response.data.data; },
    });
    const summary = summaryData || { totalSKUs: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 };
    const getStockStatus = (item) => {
        if (item.quantity <= 0)
            return { label: 'Out of Stock', color: '#f44336' };
        if (item.quantity <= item.minStock)
            return { label: 'Low Stock', color: '#ff9800' };
        if (item.maxStock > 0 && item.quantity > item.maxStock)
            return { label: 'Overstock', color: '#2196f3' };
        return { label: 'OK', color: '#4caf50' };
    };
    const columns = [
        { field: 'productCode', headerName: 'Code', width: 100 },
        { field: 'productName', headerName: 'Product', width: 200 },
        { field: 'categoryName', headerName: 'Category', width: 130 },
        { field: 'brandName', headerName: 'Brand', width: 100 },
        { field: 'warehouseName', headerName: 'Warehouse', width: 130 },
        { field: 'branchName', headerName: 'Branch', width: 100 },
        {
            field: 'quantity', headerName: 'Qty', width: 80, type: 'number',
            renderCell: (params) => {
                const item = params.row;
                const status = getStockStatus(item);
                return _jsx(Typography, { variant: "body2", fontWeight: "bold", color: status.color === '#4caf50' ? 'success.main' : status.color === '#f44336' ? 'error' : 'warning.main', children: item.quantity });
            },
        },
        { field: 'reserved', headerName: 'Reserved', width: 90, type: 'number' },
        { field: 'available', headerName: 'Available', width: 90, type: 'number' },
        { field: 'minStock', headerName: 'Min', width: 70, type: 'number' },
        { field: 'maxStock', headerName: 'Max', width: 70, type: 'number' },
        {
            field: 'stockStatus', headerName: 'Status', width: 110,
            renderCell: (params) => {
                const status = getStockStatus(params.row);
                return _jsx(Chip, { label: status.label, size: "small", sx: { backgroundColor: status.color + '20', color: status.color, fontWeight: 600, fontSize: '0.7rem' } });
            },
        },
        {
            field: 'totalValue', headerName: 'Value', width: 120, type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        { field: 'lastMovement', headerName: 'Last Movement', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-' },
        {
            field: 'actions', headerName: '', width: 120, sortable: false, filterable: false,
            renderCell: (params) => (_jsxs(Box, { sx: { display: 'flex' }, children: [_jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); navigate(`/products/${params.row.productId}`); }, children: _jsx(ViewIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); navigate(`/inventory/transfers/new?productId=${params.row.productId}`); }, children: _jsx(TransferIcon, { fontSize: "small" }) })] })),
        },
    ];
    const items = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Inventory" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(TransferIcon, {}), onClick: () => navigate('/inventory/transfers/new'), children: "Transfer" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/inventory/adjustments/new'), children: "Adjustment" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.primary.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total SKUs" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalSKUs?.toLocaleString() || 0 })] }), _jsx(CategoryIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Value" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.totalValue || 0) })] }), _jsx(MoneyIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.warning.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Low Stock" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "warning.main", children: summary.lowStockCount?.toLocaleString() || 0 })] }), _jsx(LowStockIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.error.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Out of Stock" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "error", children: summary.outOfStockCount?.toLocaleString() || 0 })] }), _jsx(OutOfStockIcon, { color: "error", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search product...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: { input: { startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })) } } }), _jsxs(TextField, { select: true, size: "small", label: "Warehouse", value: warehouseFilter, onChange: (e) => setWarehouseFilter(e.target.value), sx: { minWidth: 150 }, children: [_jsx(MenuItem, { value: "", children: "All Warehouses" }), warehousesData?.map((w) => (_jsx(MenuItem, { value: w.id, children: w.name }, w.id)))] }), _jsxs(TextField, { select: true, size: "small", label: "Category", value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), sx: { minWidth: 150 }, children: [_jsx(MenuItem, { value: "", children: "All Categories" }), categoriesData?.map((c) => (_jsx(MenuItem, { value: c.id, children: c.name }, c.id)))] }), _jsxs(TextField, { select: true, size: "small", label: "Stock Status", value: stockStatusFilter, onChange: (e) => setStockStatusFilter(e.target.value), sx: { minWidth: 130 }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "LOW", children: "Low Stock" }), _jsx(MenuItem, { value: "OUT", children: "Out of Stock" }), _jsx(MenuItem, { value: "OVER", children: "Overstock" })] }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: items, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/products/${params.row.productId}`), sx: { '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } } })] })] }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default InventoryPage;
