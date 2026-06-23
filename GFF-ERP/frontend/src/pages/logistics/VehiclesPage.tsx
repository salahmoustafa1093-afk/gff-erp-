import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Tooltip, FormControl, InputLabel, Select, MenuItem, TextField,
  Grid, Dialog, useTheme, useMediaQuery
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Visibility, Edit, Build, LocalGasStation, Delete, FilterList, Clear
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Vehicle, VehicleStatus, VehicleType, FuelType } from '../../types';
import VehicleForm from './VehicleForm';

const statusColors: Record<VehicleStatus, 'success' | 'error' | 'warning' | 'info'> = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  RETIRED: 'error',
  IN_USE: 'info',
};

const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ search: '', type: '', status: '', fuelType: '', branch: '', page: 1, limit: 25 });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => apiService.getVehicles(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ search: '', type: '', status: '', fuelType: '', branch: '', page: 1, limit: 25 });
  }, []);

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100, renderCell: (params: GridRenderCellParams) => (
      <Typography variant="body2" fontWeight={600} fontFamily="monospace">{params.value}</Typography>
    )},
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'make', headerName: 'Make', width: 100 },
    { field: 'model', headerName: 'Model', width: 120 },
    { field: 'year', headerName: 'Year', width: 80, type: 'number' },
    { field: 'licensePlate', headerName: 'License Plate', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={statusColors[params.value as VehicleStatus] || 'default'} size="small" variant="outlined" />
      ),
    },
    { field: 'currentMileage', headerName: 'Mileage', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'fuelType', headerName: 'Fuel', width: 90 },
    { field: 'branch', headerName: 'Branch', width: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/vehicles/${params.row.id}`)}><Visibility fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditingId(params.row.id); setFormOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Maintenance"><IconButton size="small" onClick={() => navigate(`/maintenance?vehicleId=${params.row.id}`)}><Build fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Fuel Logs"><IconButton size="small" onClick={() => navigate(`/fuel-logs/${params.row.id}`)}><LocalGasStation fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Vehicles</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingId(null); setFormOpen(true); }}>
          Add Vehicle
        </Button>
      </Box>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth size="small" placeholder="Search code, plate, make, model..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={filters.type} label="Type" onChange={(e) => handleFilterChange('type', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="TRUCK">Truck</MenuItem>
                  <MenuItem value="VAN">Van</MenuItem>
                  <MenuItem value="CAR">Car</MenuItem>
                  <MenuItem value="MOTORCYCLE">Motorcycle</MenuItem>
                  <MenuItem value="BUS">Bus</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="IN_USE">In Use</MenuItem>
                  <MenuItem value="RETIRED">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Fuel</InputLabel>
                <Select value={filters.fuelType} label="Fuel" onChange={(e) => handleFilterChange('fuelType', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DIESEL">Diesel</MenuItem>
                  <MenuItem value="PETROL">Petrol</MenuItem>
                  <MenuItem value="ELECTRIC">Electric</MenuItem>
                  <MenuItem value="HYBRID">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Button size="small" onClick={handleClear} startIcon={<Clear />}>Clear</Button>
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

      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditingId(null); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <VehicleForm vehicleId={editingId} onClose={() => { setFormOpen(false); setEditingId(null); refetch(); }} />
      </Dialog>
    </Box>
  );
};

export default VehiclesPage;
