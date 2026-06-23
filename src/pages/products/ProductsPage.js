import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon, Category as ProductsIcon, Inventory as StockIcon, Warning as LowStockIcon, AttachMoney as MoneyIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import api from '../../app/api';
const productTypeLabels = {
    GOODS: 'Goods', SERVICE: 'Service', RAW_MATERIAL: 'Raw Material', FINISHED: 'Finished', FEED: 'Feed',
};
const ProductsPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'name', sort: 'asc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const fetchProducts = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'asc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (categoryFilter)
            params.append('categoryId', categoryFilter);
        if (brandFilter)
            params.append('brandId', brandFilter);
        if (typeFilter)
            params.append('type', typeFilter);
        if (statusFilter)
            params.append('status', statusFilter);
        const response = await api.get(`/products?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, categoryFilter, brandFilter, typeFilter, statusFilter]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['products', paginationModel, sortModel, searchQuery, categoryFilter, brandFilter, typeFilter, statusFilter],
        queryFn: fetchProducts,
    });
    const { data: summaryData } = useQuery({
        queryKey: ['productsSummary'],
        queryFn: async () => { const response = await api.get('/products/summary'); return response.data; },
    });
    const { data: categoriesData } = useQuery({
        queryKey: ['productCategories'],
        queryFn: async () => { const response = await api.get('/products/categories?active=true'); return response.data.data; },
    });
    const { data: brandsData } = useQuery({
        queryKey: ['productBrands'],
        queryFn: async () => { const response = await api.get('/products/brands?active=true'); return response.data.data; },
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => { await api.delete(`/products/${id}`); },
        onSuccess: () => refetch(),
    });
    const handleExport = async () => {
        const response = await api.get(`/products/export?${new URLSearchParams({ search: searchQuery }).toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const summary = summaryData || { total: 0, active: 0, lowStock: 0, totalValue: 0 };
    const columns = [
        { field: 'code', headerName: 'Code', width: 100 },
        {
            field: 'name',
            headerName: 'Product Name',
            width: 200,
            renderCell: (params) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [params.row.imageUrl && (_jsx(Box, { component: "img", src: params.row.imageUrl, alt: "", sx: { width: 32, height: 32, objectFit: 'cover', borderRadius: 1 } })), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value }), params.row.nameAr && _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { direction: 'rtl', display: 'block' }, children: params.row.nameAr })] })] })),
        },
        { field: 'categoryName', headerName: 'Category', width: 120 },
        { field: 'brandName', headerName: 'Brand', width: 100 },
        {
            field: 'type',
            headerName: 'Type',
            width: 110,
            renderCell: (params) => _jsx(Chip, { label: productTypeLabels[params.value] || params.value, size: "small", sx: { fontWeight: 600, fontSize: '0.7rem' } }),
        },
        { field: 'unitName', headerName: 'Unit', width: 70 },
        {
            field: 'costPrice',
            headerName: 'Cost',
            width: 100,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'salePrice',
            headerName: 'Price',
            width: 100,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'currentStock',
            headerName: 'Stock',
            width: 80,
            type: 'number',
            renderCell: (params) => {
                const product = params.row;
                const isLow = product.currentStock > 0 && product.currentStock <= product.minStock;
                const isOut = product.currentStock <= 0;
                return (_jsx(Typography, { variant: "body2", fontWeight: "bold", color: isOut ? 'error' : isLow ? 'warning.main' : 'success.main', children: product.currentStock }));
            },
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 80,
            renderCell: (params) => _jsx(Chip, { label: params.value ? 'Active' : 'Inactive', size: "small", color: params.value ? 'success' : 'default', sx: { fontWeight: 600, fontSize: '0.7rem' } }),
        },
        {
            field: 'actions',
            headerName: '',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { sx: { display: 'flex' }, children: [_jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); navigate(`/products/${params.row.id}`); }, children: _jsx(ViewIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); navigate(`/products/${params.row.id}/edit`); }, children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", color: "error", onClick: (e) => { e.stopPropagation(); deleteMutation.mutate(params.row.id); }, children: _jsx(DeleteIcon, { fontSize: "small" }) })] })),
        },
    ];
    const products = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Products" }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/products/new'), children: "New Product" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.primary.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Products" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.total?.toLocaleString() || 0 })] }), _jsx(ProductsIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Active" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.active?.toLocaleString() || 0 })] }), _jsx(StockIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.warning.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Low Stock" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "warning.main", children: summary.lowStock?.toLocaleString() || 0 })] }), _jsx(LowStockIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.info.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Value" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formatCurrency(summary.totalValue || 0) })] }), _jsx(MoneyIcon, { color: "info", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search name, code, barcode...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: { input: { startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })) } } }), _jsxs(TextField, { select: true, size: "small", label: "Category", value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), sx: { minWidth: 140 }, children: [_jsx(MenuItem, { value: "", children: "All" }), categoriesData?.map((c) => (_jsx(MenuItem, { value: c.id, children: c.name }, c.id)))] }), _jsxs(TextField, { select: true, size: "small", label: "Brand", value: brandFilter, onChange: (e) => setBrandFilter(e.target.value), sx: { minWidth: 120 }, children: [_jsx(MenuItem, { value: "", children: "All" }), brandsData?.map((b) => (_jsx(MenuItem, { value: b.id, children: b.name }, b.id)))] }), _jsxs(TextField, { select: true, size: "small", label: "Type", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), sx: { minWidth: 120 }, children: [_jsx(MenuItem, { value: "", children: "All" }), Object.entries(productTypeLabels).map(([key, label]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 100 }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: products, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/products/${params.id}`), sx: { '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } } })] })] }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default ProductsPage;
