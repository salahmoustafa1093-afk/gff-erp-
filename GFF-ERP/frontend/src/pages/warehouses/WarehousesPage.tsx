import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Warehouse as WarehouseIcon,
  Search as SearchIcon, Refresh as RefreshIcon, Inventory as StockIcon,
  AttachMoney as MoneyIcon, LocalShipping as TypeIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowParams,
} from '@mui/x-data-grid';
import api from '../../app/api';
import { Warehouse, ListResponse } from '../types';

const warehouseTypes: Record<string, string> = { MAIN: 'Main', RETAIL: 'Retail', RETURN: 'Return', TEMPORARY: 'Temporary' };

const WarehousesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchWarehouses = useCallback(async (): Promise<ListResponse<Warehouse>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) { params.append('sortField', sortModel[0].field); params.append('sortDir', sortModel[0].sort || 'asc'); }
    if (searchQuery) params.append('search', searchQuery);
    if (typeFilter) params.append('type', typeFilter);
    if (statusFilter) params.append('status', statusFilter);
    const response = await api.get(`/warehouses?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, typeFilter, statusFilter]);

  const { data, isLoading, refetch } = useQuery<ListResponse<Warehouse>>({
    queryKey: ['warehouses', paginationModel, sortModel, searchQuery, typeFilter, statusFilter],
    queryFn: fetchWarehouses,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['warehousesSummary'],
    queryFn: async () => { const response = await api.get('/warehouses/summary'); return response.data; },
  });

  const summary = summaryData || { total: 0, active: 0, totalSKUs: 0, totalValue: 0 };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" color="primary" sx={{ cursor: 'pointer' }}>{params.value as string}</Typography>
          {params.row.nameAr && <Typography variant="caption" color="text.secondary" sx={{ direction: 'rtl', display: 'block' }}>{params.row.nameAr as string}</Typography>}
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 110,
      renderCell: (params) => <Chip label={warehouseTypes[params.value as string] || params.value} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />,
    },
    { field: 'branchName', headerName: 'Branch', width: 130 },
    { field: 'managerName', headerName: 'Manager', width: 140 },
    {
      field: 'totalSKUs', headerName: 'SKUs', width: 80, type: 'number',
      renderCell: (params) => <Typography variant="body2" fontWeight="medium">{(params.value as number)?.toLocaleString() || 0}</Typography>,
    },
    {
      field: 'totalValue', headerName: 'Value', width: 130, type: 'number',
      valueFormatter: (value: number) => formatCurrency(value || 0),
    },
    {
      field: 'isActive', headerName: 'Status', width: 90,
      renderCell: (params) => <Chip label={params.value ? 'Active' : 'Inactive'} size="small" color={params.value ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />,
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false, filterable: false,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/warehouses/${params.row.id}`); }}>
          View
        </Button>
      ),
    },
  ];

  const warehouses = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Warehouses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/warehouses/new')}>New Warehouse</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total Warehouses</Typography><Typography variant="h5" fontWeight="bold">{summary.total?.toLocaleString() || 0}</Typography></Box>
                <WarehouseIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Active</Typography><Typography variant="h5" fontWeight="bold">{summary.active?.toLocaleString() || 0}</Typography></Box>
                <TypeIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total SKUs</Typography><Typography variant="h5" fontWeight="bold">{summary.totalSKUs?.toLocaleString() || 0}</Typography></Box>
                <StockIcon color="info" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total Value</Typography><Typography variant="h5" fontWeight="bold">{formatCurrency(summary.totalValue || 0)}</Typography></Box>
                <MoneyIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField placeholder="Search name, code..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }} />
          <TextField select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(warehouseTypes).map(([key, label]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
        </Box>

        <DataGrid rows={warehouses} columns={columns} rowCount={totalRows} loading={isLoading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel} pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server" sortingMode="server" disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(`/warehouses/${params.id}`)}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } }} />
      </Paper>
    </Box>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default WarehousesPage;
