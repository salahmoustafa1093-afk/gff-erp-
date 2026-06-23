import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Tooltip, FormControl, InputLabel, Select, MenuItem, TextField,
  Grid, Dialog, useTheme, useMediaQuery, Rating, Avatar
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Visibility, Edit, LocalShipping, Speed, Warning, Delete } from '@mui/icons-material';
import { differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Driver, DriverStatus } from '../../types';

const statusColors: Record<DriverStatus, 'success' | 'primary' | 'default' | 'error'> = {
  AVAILABLE: 'success',
  ON_TRIP: 'primary',
  OFF_DUTY: 'default',
  SUSPENDED: 'error',
};

const DriversPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 25 });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', filters],
    queryFn: () => apiService.getDrivers(filters),
  });

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Driver',
      width: 180,
      valueGetter: (_, row: Driver) => `${row.firstName} ${row.lastName}`,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {params.row.firstName?.[0]}{params.row.lastName?.[0]}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
        </Box>
      ),
    },
    { field: 'licenseNumber', headerName: 'License #', width: 130 },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const daysLeft = differenceInDays(new Date(params.value), new Date());
        return (
          <Box>
            <Typography variant="body2">{new Date(params.value).toLocaleDateString()}</Typography>
            {daysLeft < 30 && (
              <Chip label={`${daysLeft}d left`} size="small" color="error" variant="outlined" icon={<Warning fontSize="small" />} sx={{ mt: 0.5, fontSize: '0.65rem' }} />
            )}
          </Box>
        );
      },
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Rating value={params.value || 0} readOnly size="small" precision={0.5} />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={statusColors[params.value as DriverStatus] || 'default'} size="small" variant="outlined" />
      ),
    },
    { field: 'yearsExperience', headerName: 'Exp. (Years)', width: 100, type: 'number' },
    { field: 'branch', headerName: 'Branch', width: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/drivers/${params.row.id}`)}><Visibility fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Trips"><IconButton size="small" onClick={() => navigate(`/trips?driverId=${params.row.id}`)}><LocalShipping fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Performance"><IconButton size="small" onClick={() => navigate(`/drivers/${params.row.id}?tab=performance`)}><Speed fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Drivers</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/drivers/new')}>
          Add Driver
        </Button>
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth size="small" placeholder="Search name, license..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="ON_TRIP">On Trip</MenuItem>
                  <MenuItem value="OFF_DUTY">Off Duty</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataGrid
        rows={data?.data || []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.total || 0}
        paginationMode="server"
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        onPaginationModelChange={(model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize }))}
        disableRowSelectionOnClick
        density="compact"
      />
    </Box>
  );
};

export default DriversPage;
