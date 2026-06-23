import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Paper, TextField, Typography, useTheme,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Business as BranchIcon,
  Search as SearchIcon, Refresh as RefreshIcon, Store as StoreIcon,
  People as UsersIcon, Warehouse as WarehouseIcon, AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowParams,
} from '@mui/x-data-grid';
import api from '../../app/api';
import { Branch, ListResponse } from '../types';

const BranchesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchBranches = useCallback(async (): Promise<ListResponse<Branch>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) { params.append('sortField', sortModel[0].field); params.append('sortDir', sortModel[0].sort || 'asc'); }
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    const response = await api.get(`/branches?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, statusFilter]);

  const { data, isLoading, refetch } = useQuery<ListResponse<Branch>>({
    queryKey: ['branches', paginationModel, sortModel, searchQuery, statusFilter],
    queryFn: fetchBranches,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['branchesSummary'],
    queryFn: async () => { const response = await api.get('/branches/summary'); return response.data; },
  });

  const summary = summaryData || { total: 0, active: 0, totalWarehouses: 0, totalUsers: 0 };

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
    { field: 'city', headerName: 'City', width: 130 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'managerName', headerName: 'Manager', width: 150 },
    {
      field: 'isActive', headerName: 'Status', width: 100,
      renderCell: (params) => <Chip label={params.value ? 'Active' : 'Inactive'} size="small" color={params.value ? 'success' : 'default'} sx={{ fontWeight: 600 }} />,
    },
    {
      field: 'actions', headerName: '', width: 80, sortable: false, filterable: false,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/branches/${params.row.id}`); }}>View</Button>
      ),
    },
  ];

  const branches = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Branches</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/branches/new')}>New Branch</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Total Branches</Typography><Typography variant="h5" fontWeight="bold">{summary.total?.toLocaleString() || 0}</Typography></Box>
                <BranchIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Active</Typography><Typography variant="h5" fontWeight="bold">{summary.active?.toLocaleString() || 0}</Typography></Box>
                <StoreIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Warehouses</Typography><Typography variant="h5" fontWeight="bold">{summary.totalWarehouses?.toLocaleString() || 0}</Typography></Box>
                <WarehouseIcon color="info" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography variant="caption" color="text.secondary">Users</Typography><Typography variant="h5" fontWeight="bold">{summary.totalUsers?.toLocaleString() || 0}</Typography></Box>
                <UsersIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {branches.slice(0, 6).map((branch) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={branch.id}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(`/branches/${branch.id}`)}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="primary">{branch.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{branch.code} | {branch.city}</Typography>
                  </Box>
                  <Chip label={branch.isActive ? 'Active' : 'Inactive'} size="small" color={branch.isActive ? 'success' : 'default'} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body2">{branch.phone || '-'}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Manager</Typography><Typography variant="body2">{branch.managerName || '-'}</Typography></Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField placeholder="Search name, code, city..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }} />
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
        </Box>

        <DataGrid rows={branches} columns={columns} rowCount={totalRows} loading={isLoading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel} pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server" sortingMode="server" disableRowSelectionOnClick
          onRowClick={(params: GridRowParams) => navigate(`/branches/${params.id}`)}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } }} />
      </Paper>
    </Box>
  );
};

export default BranchesPage;
