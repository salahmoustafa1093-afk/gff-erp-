import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Menu, MenuItem, Paper, Rating, TextField, Typography, useTheme,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Receipt as StatementIcon,
  MoreVert as MoreIcon, Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon,
  People as SuppliersIcon, AttachMoney as MoneyIcon, Warning as WarningIcon, ThumbUp as RatingIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowParams,
} from '@mui/x-data-grid';
import api from '../../app/api';
import { Supplier, ListResponse } from '../types';

const typeLabels: Record<string, string> = { LOCAL: 'Local', IMPORT: 'Import', MANUFACTURER: 'Manufacturer' };
const typeColors: Record<string, string> = { LOCAL: '#2196f3', IMPORT: '#ff9800', MANUFACTURER: '#4caf50' };

const SuppliersPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async (): Promise<ListResponse<Supplier>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) { params.append('sortField', sortModel[0].field); params.append('sortDir', sortModel[0].sort || 'asc'); }
    if (searchQuery) params.append('search', searchQuery);
    if (typeFilter) params.append('type', typeFilter);
    if (statusFilter) params.append('status', statusFilter);
    const response = await api.get(`/suppliers?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, typeFilter, statusFilter]);

  const { data, isLoading, refetch } = useQuery<ListResponse<Supplier>>({
    queryKey: ['suppliers', paginationModel, sortModel, searchQuery, typeFilter, statusFilter],
    queryFn: fetchSuppliers,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['suppliersSummary'],
    queryFn: async () => { const response = await api.get('/suppliers/summary'); return response.data; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/suppliers/${id}`); },
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

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
    setSelectedSupplierId(supplier.id);
  };

  const summary = summaryData || { total: 0, active: 0, totalBalance: 0, avgRating: 0 };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    {
      field: 'name', headerName: 'Name', width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" color="primary" sx={{ cursor: 'pointer' }}>{params.value as string}</Typography>
          {params.row.nameAr && <Typography variant="caption" color="text.secondary" sx={{ direction: 'rtl', display: 'block' }}>{params.row.nameAr as string}</Typography>}
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 110,
      renderCell: (params) => (
        <Chip label={typeLabels[params.value as string] || params.value} size="small"
          sx={{ backgroundColor: (typeColors[params.value as string] || '#9e9e9e') + '20', color: typeColors[params.value as string] || '#9e9e9e', fontWeight: 600, fontSize: '0.7rem' }} />
      ),
    },
    { field: 'phone', headerName: 'Phone', width: 130 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'leadTime', headerName: 'Lead Time', width: 100, type: 'number', valueFormatter: (value: number) => value ? `${value} days` : '-' },
    {
      field: 'rating', headerName: 'Rating', width: 120,
      renderCell: (params) => <Rating value={params.value as number} readOnly size="small" precision={0.5} />,
    },
    {
      field: 'balance', headerName: 'Balance', width: 130, type: 'number',
      renderCell: (params) => {
        const supplier = params.row as Supplier;
        const exceeds = supplier.balance >= supplier.creditLimit && supplier.creditLimit > 0;
        return <Typography variant="body2" color={exceeds ? 'error' : 'inherit'} fontWeight={exceeds ? 'bold' : 'normal'}>{formatCurrency(params.value as number)}</Typography>;
      },
    },
    {
      field: 'isActive', headerName: 'Status', width: 90,
      renderCell: (params) => <Chip label={params.value ? 'Active' : 'Inactive'} size="small" color={params.value ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />,
    },
    {
      field: 'actions', headerName: '', width: 50, sortable: false, filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => handleActionClick(e, params.row as Supplier)}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const suppliers = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Suppliers</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>Export</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/suppliers/new')}>New Supplier</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Suppliers</Typography>
                  <Typography variant="h5" fontWeight="bold">{summary.total?.toLocaleString() || 0}</Typography>
                </Box>
                <SuppliersIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Active</Typography>
                  <Typography variant="h5" fontWeight="bold">{summary.active?.toLocaleString() || 0}</Typography>
                </Box>
                <RatingIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Payables</Typography>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(summary.totalBalance || 0)}</Typography>
                </Box>
                <MoneyIcon color="info" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Avg Rating</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {(summary.avgRating || 0).toFixed(1)}
                    <Rating value={summary.avgRating || 0} readOnly size="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Typography>
                </Box>
                <RatingIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField placeholder="Search name, phone, code..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }} />
          <TextField select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(typeLabels).map(([key, label]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
        </Box>

        <DataGrid rows={suppliers} columns={columns} rowCount={totalRows} loading={isLoading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel} pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server" sortingMode="server" disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(`/suppliers/${params.id}`)}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } }} />
      </Paper>

      <Menu anchorEl={actionAnchorEl} open={Boolean(actionAnchorEl)} onClose={() => setActionAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => { selectedSupplierId && navigate(`/suppliers/${selectedSupplierId}`); setActionAnchorEl(null); }}><ViewIcon fontSize="small" sx={{ mr: 1 }} /> View</MenuItem>
        <MenuItem onClick={() => { selectedSupplierId && navigate(`/suppliers/${selectedSupplierId}/edit`); setActionAnchorEl(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={() => { selectedSupplierId && navigate(`/suppliers/${selectedSupplierId}/statement`); setActionAnchorEl(null); }}><StatementIcon fontSize="small" sx={{ mr: 1 }} /> Statement</MenuItem>
        <MenuItem onClick={() => { selectedSupplierId && deleteMutation.mutate(selectedSupplierId); setActionAnchorEl(null); }} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete</MenuItem>
      </Menu>
    </Box>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SuppliersPage;
