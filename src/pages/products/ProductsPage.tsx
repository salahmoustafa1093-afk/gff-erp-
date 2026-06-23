import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon,
  Category as ProductsIcon, Inventory as StockIcon, Warning as LowStockIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowParams,
} from '@mui/x-data-grid';
import api from '../../app/api';
import { Product, ListResponse } from '../types';

const productTypeLabels: Record<string, string> = {
  GOODS: 'Goods', SERVICE: 'Service', RAW_MATERIAL: 'Raw Material', FINISHED: 'Finished', FEED: 'Feed',
};

const ProductsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchProducts = useCallback(async (): Promise<ListResponse<Product>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) { params.append('sortField', sortModel[0].field); params.append('sortDir', sortModel[0].sort || 'asc'); }
    if (searchQuery) params.append('search', searchQuery);
    if (categoryFilter) params.append('categoryId', categoryFilter);
    if (brandFilter) params.append('brandId', brandFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (statusFilter) params.append('status', statusFilter);
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, categoryFilter, brandFilter, typeFilter, statusFilter]);

  const { data, isLoading, refetch } = useQuery<ListResponse<Product>>({
    queryKey: ['products', paginationModel, sortModel, searchQuery, categoryFilter, brandFilter, typeFilter, statusFilter],
    queryFn: fetchProducts,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['productsSummary'],
    queryFn: async () => { const response = await api.get('/products/summary'); return response.data; },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['productCategories'],
    queryFn: async () => { const response = await api.get('/products/categories?active=true'); return response.data.data as { id: string; name: string }[]; },
  });

  const { data: brandsData } = useQuery({
    queryKey: ['productBrands'],
    queryFn: async () => { const response = await api.get('/products/brands?active=true'); return response.data.data as { id: string; name: string }[]; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/products/${id}`); },
    onSuccess: () => refetch(),
  });

  const handleExport = async () => {
    const response = await api.get(`/products/export?${new URLSearchParams({ search: searchQuery }).toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a'); link.href = url;
    link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const summary = summaryData || { total: 0, active: 0, lowStock: 0, totalValue: 0 };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    {
      field: 'name',
      headerName: 'Product Name',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.imageUrl && (
            <Box component="img" src={params.row.imageUrl as string} alt="" sx={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 1 }} />
          )}
          <Box>
            <Typography variant="body2" fontWeight="medium" color="primary" sx={{ cursor: 'pointer' }}>{params.value as string}</Typography>
            {params.row.nameAr && <Typography variant="caption" color="text.secondary" sx={{ direction: 'rtl', display: 'block' }}>{params.row.nameAr as string}</Typography>}
          </Box>
        </Box>
      ),
    },
    { field: 'categoryName', headerName: 'Category', width: 120 },
    { field: 'brandName', headerName: 'Brand', width: 100 },
    {
      field: 'type',
      headerName: 'Type',
      width: 110,
      renderCell: (params) => <Chip label={productTypeLabels[params.value as string] || params.value} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />,
    },
    { field: 'unitName', headerName: 'Unit', width: 70 },
    {
      field: 'costPrice',
      headerName: 'Cost',
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'salePrice',
      headerName: 'Price',
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'currentStock',
      headerName: 'Stock',
      width: 80,
      type: 'number',
      renderCell: (params) => {
        const product = params.row as Product;
        const isLow = product.currentStock > 0 && product.currentStock <= product.minStock;
        const isOut = product.currentStock <= 0;
        return (
          <Typography variant="body2" fontWeight="bold" color={isOut ? 'error' : isLow ? 'warning.main' : 'success.main'}>
            {product.currentStock}
          </Typography>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 80,
      renderCell: (params) => <Chip label={params.value ? 'Active' : 'Inactive'} size="small" color={params.value ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/products/${params.row.id}`); }}><ViewIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/products/${params.row.id}/edit`); }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(params.row.id); }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  const products = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Products</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>Export</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')}>New Product</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total Products</Typography><Typography variant="h5" fontWeight="bold">{summary.total?.toLocaleString() || 0}</Typography></Box>
                <ProductsIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Active</Typography><Typography variant="h5" fontWeight="bold">{summary.active?.toLocaleString() || 0}</Typography></Box>
                <StockIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Low Stock</Typography><Typography variant="h5" fontWeight="bold" color="warning.main">{summary.lowStock?.toLocaleString() || 0}</Typography></Box>
                <LowStockIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total Value</Typography><Typography variant="h5" fontWeight="bold">{formatCurrency(summary.totalValue || 0)}</Typography></Box>
                <MoneyIcon color="info" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField placeholder="Search name, code, barcode..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }} />
          <TextField select size="small" label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All</MenuItem>
            {categoriesData?.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Brand" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">All</MenuItem>
            {brandsData?.map((b) => (<MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(productTypeLabels).map(([key, label]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 100 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
        </Box>

        <DataGrid rows={products} columns={columns} rowCount={totalRows} loading={isLoading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel} pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server" sortingMode="server" disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(`/products/${params.id}`)}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } }} />
      </Paper>
    </Box>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default ProductsPage;
