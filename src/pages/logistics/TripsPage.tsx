import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  FormControl, InputLabel, Select, MenuItem, TextField, Grid
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Visibility, Edit, PlayArrow, CheckCircle, Cancel, ViewKanban, ViewList, LocalShipping } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Trip, TripStatus, TripType } from '../../types';

const statusColors: Record<TripStatus, string> = {
  SCHEDULED: '#0288d1',
  IN_PROGRESS: '#ed6c02',
  COMPLETED: '#2e7d32',
  CANCELLED: '#d32f2f',
};

const KANBAN_STATUSES: TripStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const TripsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filters, setFilters] = useState({ type: '', status: '', vehicleId: '', driverId: '', startDate: '', endDate: '', page: 1, limit: 25 });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', filters],
    queryFn: () => apiService.getTrips(filters),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => apiService.startTrip(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiService.completeTrip(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
  }, []);

  const columns: GridColDef[] = [
    { field: 'tripNumber', headerName: 'Trip #', width: 120, renderCell: (params: GridRenderCellParams) => (
      <Typography variant="body2" fontWeight={600} fontFamily="monospace">{params.value}</Typography>
    )},
    { field: 'vehicleCode', headerName: 'Vehicle', width: 120 },
    { field: 'driverName', headerName: 'Driver', width: 140 },
    { field: 'type', headerName: 'Type', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" sx={{ bgcolor: `${statusColors[params.value as TripStatus]}15`, color: statusColors[params.value as TripStatus], fontWeight: 600, border: `1px solid ${statusColors[params.value as TripStatus]}40` }} />
      ),
    },
    { field: 'startDate', headerName: 'Start', width: 120, valueFormatter: (v: string) => new Date(v).toLocaleDateString() },
    { field: 'distance', headerName: 'Dist. (km)', width: 90, type: 'number' },
    { field: 'fuelCost', headerName: 'Fuel', width: 80, type: 'number', valueFormatter: (v: number) => v ? `$${v.toFixed(2)}` : '-' },
    { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={() => navigate(`/trips/${params.row.id}`)}><Visibility fontSize="small" /></IconButton>
          {params.row.status === 'SCHEDULED' && (
            <IconButton size="small" color="primary" onClick={() => startMutation.mutate(params.row.id)}><PlayArrow fontSize="small" /></IconButton>
          )}
          {params.row.status === 'IN_PROGRESS' && (
            <IconButton size="small" color="success" onClick={() => completeMutation.mutate(params.row.id)}><CheckCircle fontSize="small" /></IconButton>
          )}
          {params.row.status === 'SCHEDULED' && (
            <IconButton size="small" color="error" onClick={() => apiService.cancelTrip(params.row.id)}><Cancel fontSize="small" /></IconButton>
          )}
        </Box>
      ),
    },
  ];

  const kanbanTrips = (status: TripStatus) => (data?.data || []).filter((t: Trip) => t.status === status);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Trips</Typography>
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small" startIcon={viewMode === 'list' ? <ViewKanban /> : <ViewList />} onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}>
              {viewMode === 'list' ? 'Kanban' : 'List'}
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/trips/new')}>Create Trip</Button>
          </Box>
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.type} label="Type" onChange={(e) => handleFilterChange('type', e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="DELIVERY">Delivery</MenuItem>
                    <MenuItem value="PICKUP">Pickup</MenuItem>
                    <MenuItem value="TRANSFER">Transfer</MenuItem>
                    <MenuItem value="SERVICE">Service</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <DatePicker label="From" value={startDate} onChange={(v) => { setStartDate(v); setFilters((p) => ({ ...p, startDate: v ? v.toISOString() : '' })); }} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <DatePicker label="To" value={endDate} onChange={(v) => { setEndDate(v); setFilters((p) => ({ ...p, endDate: v ? v.toISOString() : '' })); }} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {viewMode === 'list' ? (
          <DataGrid rows={data?.data || []} columns={columns} loading={isLoading} rowCount={data?.total || 0} paginationMode="server" pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} onPaginationModelChange={(model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize }))} disableRowSelectionOnClick density="compact" />
        ) : (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 'calc(100vh - 300px)' }}>
            {KANBAN_STATUSES.map((status) => (
              <Box key={status} sx={{ minWidth: 280, maxWidth: 320, flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} px={1}>
                  <Typography variant="subtitle2" fontWeight={700} color={statusColors[status]}>{status}</Typography>
                  <Chip label={kanbanTrips(status).length} size="small" sx={{ bgcolor: `${statusColors[status]}15`, color: statusColors[status], fontWeight: 600 }} />
                </Box>
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1, minHeight: 400 }}>
                  {kanbanTrips(status).map((trip: Trip) => (
                    <Card key={trip.id} sx={{ mb: 1, cursor: 'pointer', borderLeft: 3, borderColor: statusColors[status], '&:hover': { boxShadow: 2 } }} onClick={() => navigate(`/trips/${trip.id}`)}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" fontWeight={600}>{trip.tripNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">{trip.vehicleCode} | {trip.driverName}</Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                          <Chip label={trip.type} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                          <Typography variant="caption" color="success.main" fontWeight={600">${trip.totalCost?.toFixed(2)}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default TripsPage;
