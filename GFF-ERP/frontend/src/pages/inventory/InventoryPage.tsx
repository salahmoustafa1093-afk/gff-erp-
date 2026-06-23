import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme,
} from '@mui/material';
import {
  Visibility as ViewIcon, SwapHoriz as TransferIcon, Add as AddIcon, TrendingDown as LowStockIcon,
  Warning as OutOfStockIcon, Inventory as InventoryIcon, Search as SearchIcon, Refresh as RefreshIcon,
  AttachMoney as MoneyIcon, Category as CategoryIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowParams,
} from '@mui/x-data-grid';
import api from '../../app/api';
import { InventoryItem, ListResponse } from '../types';

const InventoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'productName', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('');

  const fetchInventory = useCallback(async (): Promise<ListResponse<InventoryItem>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) { params.append('sortField', sortModel[0].field); params.append('sortDir', sortModel[0].sort || 'asc'); }
    if (searchQuery) params.append('search', searchQuery);
    if (warehouseFilter) params.append('warehouseId', warehouseFilter);
    if (categoryFilter) params.append('categoryId', categoryFilter);
    if (stockStatusFilter) params.append('stockStatus', stockStatusFilter);
    const response = await api.get(`/inventory?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, warehouseFilter, categoryFilter, stockStatusFilter]);

  const { data, isLoading, refetch } = useQuery<ListResponse<InventoryItem>>({
    queryKey: ['inventory', paginationModel, sortModel, searchQuery, warehouseFilter, categoryFilter, stockStatusFilter],
    queryFn: fetchInventory,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['inventorySummary'],
    queryFn: async () => { const response = await api.get('/inventory/summary'); return response.data; },
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehousesForInventory'],
    queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data as { id: string; name: string }[]; },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categoriesForInventory'],
    queryFn: async () => { const response = await api.get('/products/categories?active=true'); return response.data.data as { id: string; name: string }[]; },
  });

  const summary = summaryData || { totalSKUs: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 };

  const getStockStatus = (item: InventoryItem): { label: string; color: string } => {
    if (item.quantity <= 0) return { label: 'Out of Stock', color: '#f44336' };
    if (item.quantity <= item.minStock) return { label: 'Low Stock', color: '#ff9800' };
    if (item.maxStock > 0 && item.quantity > item.maxStock) return { label: 'Overstock', color: '#2196f3' };
    return { label: 'OK', color: '#4caf50' };
  };

  const columns: GridColDef[] = [
    { field: 'productCode', headerName: 'Code', width: 100 },
    { field: 'productName', headerName: 'Product', width: 200 },
    { field: 'categoryName', headerName: 'Category', width: 130 },
    { field: 'brandName', headerName: 'Brand', width: 100 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 130 },
    { field: 'branchName', headerName: 'Branch', width: 100 },
    {
      field: 'quantity', headerName: 'Qty', width: 80, type: 'number',
      renderCell: (params) => {
        const item = params.row as InventoryItem;
        const status = getStockStatus(item);
        return <Typography variant="body2" fontWeight="bold" color={status.color === '#4caf50' ? 'success.main' : status.color === '#f44336' ? 'error' : 'warning.main'}>{item.quantity}</Typography>;
      },
    },
    { field: 'reserved', headerName: 'Reserved', width: 90, type: 'number' },
    { field: 'available', headerName: 'Available', width: 90, type: 'number' },
    { field: 'minStock', headerName: 'Min', width: 70, type: 'number' },
    { field: 'maxStock', headerName: 'Max', width: 70, type: 'number' },
    {
      field: 'stockStatus', headerName: 'Status', width: 110,
      renderCell: (params) => {
        const status = getStockStatus(params.row as InventoryItem);
        return <Chip label={status.label} size="small" sx={{ backgroundColor: status.color + '20', color: status.color, fontWeight: 600, fontSize: '0.7rem' }} />;
      },
    },
    {
      field: 'totalValue', headerName: 'Value', width: 120, type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    { field: 'lastMovement', headerName: 'Last Movement', width: 130, valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString() : '-' },
    {
      field: 'actions', headerName: '', width: 120, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/products/${params.row.productId}`); }}><ViewIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/inventory/transfers/new?productId=${params.row.productId}`); }}><TransferIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  const items = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Inventory</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<TransferIcon />} onClick={() => navigate('/inventory/transfers/new')}>Transfer</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inventory/adjustments/new')}>Adjustment</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total SKUs</Typography><Typography variant="h5" fontWeight="bold">{summary.totalSKUs?.toLocaleString() || 0}</Typography></Box>
                <CategoryIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total Value</Typography><Typography variant="h5" fontWeight="bold">{formatCurrency(summary.totalValue || 0)}</Typography></Box>
                <MoneyIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Low Stock</Typography><Typography variant="h5" fontWeight="bold" color="warning.main">{summary.lowStockCount?.toLocaleString() || 0}</Typography></Box>
                <LowStockIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Out of Stock</Typography><Typography variant="h5" fontWeight="bold" color="error">{summary.outOfStockCount?.toLocaleString() || 0}</Typography></Box>
                <OutOfStockIcon color="error" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField placeholder="Search product..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }} />
          <TextField select size="small" label="Warehouse" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">All Warehouses</MenuItem>
            {warehousesData?.map((w) => (<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">All Categories</MenuItem>
            {categoriesData?.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Stock Status" value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="LOW">Low Stock</MenuItem>
            <MenuItem value="OUT">Out of Stock</MenuItem>
            <MenuItem value="OVER">Overstock</MenuItem>
          </TextField>
          <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
        </Box>

        <DataGrid rows={items} columns={columns} rowCount={totalRows} loading={isLoading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel} pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server" sortingMode="server" disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(`/products/${params.row.productId}`)}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } }} />
      </Paper>
    </Box>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default InventoryPage;
