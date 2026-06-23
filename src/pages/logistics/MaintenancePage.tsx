import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Tooltip, FormControl, InputLabel, Select, MenuItem, TextField,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  Paper, Divider
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add, Warning, Build, CheckCircle, DirectionsCar, DateRange, TrendingUp
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '../../types';

const validationSchema = Yup.object({
  type: Yup.string().required(),
  description: Yup.string().required('Description is required').max(500),
  cost: Yup.number().required().min(0),
  serviceDate: Yup.date().required(),
  serviceProvider: Yup.string().required('Service provider is required'),
  status: Yup.string().required(),
  nextServiceDate: Yup.date().nullable(),
  nextServiceMileage: Yup.number().nullable().min(0),
  notes: Yup.string(),
});

const typeColors: Record<MaintenanceType, string> = {
  ROUTINE: '#2e7d32',
  REPAIR: '#d32f2f',
  INSPECTION: '#0288d1',
  TIRE_CHANGE: '#ed6c02',
  OIL_CHANGE: '#9c27b0',
  OTHER: '#757575',
};

const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ vehicleId: '', status: '', page: 1, limit: 25 });
  const [formOpen, setFormOpen] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState('');

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['maintenance', filters],
    queryFn: () => apiService.getMaintenanceRecords(filters),
  });

  const { data: upcomingMaintenance } = useQuery({
    queryKey: ['upcoming-maintenance'],
    queryFn: () => apiService.getUpcomingMaintenance(),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiService.getVehicles({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<MaintenanceRecord>) => apiService.createMaintenanceRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
      setFormOpen(false);
    },
  });

  const formik = useFormik({
    initialValues: {
      type: 'ROUTINE' as MaintenanceType,
      description: '',
      cost: 0,
      serviceDate: new Date() as Date | null,
      serviceProvider: '',
      status: 'SCHEDULED' as MaintenanceStatus,
      vehicleId: '',
      nextServiceDate: null as Date | null,
      nextServiceMileage: null as number | null,
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      createMutation.mutate({
        ...values,
        serviceDate: values.serviceDate?.toISOString(),
        nextServiceDate: values.nextServiceDate?.toISOString(),
      });
    },
  });

  const columns: GridColDef[] = [
    {
      field: 'vehicleCode',
      headerName: 'Vehicle',
      width: 120,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: { value: string }) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: `${typeColors[params.value as MaintenanceType]}15`,
            color: typeColors[params.value as MaintenanceType],
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      ),
    },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'cost', headerName: 'Cost', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    {
      field: 'serviceDate',
      headerName: 'Service Date',
      width: 120,
      valueFormatter: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: { value: string }) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'warning'}
          variant="outlined"
        />
      ),
    },
    { field: 'serviceProvider', headerName: 'Provider', width: 140 },
    {
      field: 'nextServiceDate',
      headerName: 'Next Service',
      width: 120,
      valueFormatter: (v: string) => v ? new Date(v).toLocaleDateString() : '-',
    },
  ];

  const totalCost = (maintenanceRecords?.data || []).reduce((sum: number, r: MaintenanceRecord) => sum + r.cost, 0);
  const completedCount = (maintenanceRecords?.data || []).filter((r: MaintenanceRecord) => r.status === 'COMPLETED').length;
  const scheduledCount = (maintenanceRecords?.data || []).filter((r: MaintenanceRecord) => r.status === 'SCHEDULED').length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Maintenance</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
            Add Record
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Build sx={{ color: 'primary.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary">Total Records</Typography>
                <Typography variant="h5" fontWeight={700">{maintenanceRecords?.total || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircle sx={{ color: 'success.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary">Completed</Typography>
                <Typography variant="h5" fontWeight={700}" color="success.main">{completedCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <DateRange sx={{ color: 'warning.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                <Typography variant="h5" fontWeight={700}" color="warning.main">{scheduledCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TrendingUp sx={{ color: 'error.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                <Typography variant="h5" fontWeight={700}" color="error.main">${totalCost.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Upcoming Alerts */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600}" gutterBottom display="flex" alignItems="center" gap={1}>
              <Warning color="warning" /> Upcoming Maintenance Alerts
            </Typography>
            {(!upcomingMaintenance || upcomingMaintenance.length === 0) ? (
              <Alert severity="success">No upcoming maintenance alerts.</Alert>
            ) : (
              <Grid container spacing={2}>
                {(upcomingMaintenance || []).map((record: MaintenanceRecord) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={record.id}>
                    <Paper variant="outlined" sx={{ p: 2, borderLeft: 3, borderColor: 'warning.main' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight={600">{record.vehicleCode}</Typography>
                        <Chip label={record.type} size="small" sx={{ bgcolor: `${typeColors[record.type]}15`, color: typeColors[record.type], fontSize: '0.65rem' }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{record.description}</Typography>
                      <Typography variant="caption" color="warning.main" display="block" mt={0.5}>
                        Due: {record.nextServiceDate ? new Date(record.nextServiceDate).toLocaleDateString() : `${record.nextServiceMileage?.toLocaleString()} km`}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Filters & Table */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vehicle</InputLabel>
                  <Select value={filters.vehicleId} label="Vehicle" onChange={(e) => setFilters((p) => ({ ...p, vehicleId: e.target.value, page: 1 }))}>
                    <MenuItem value="">All Vehicles</MenuItem>
                    {(vehicles?.data || []).map((v) => (
                      <MenuItem key={v.id} value={v.id}>{v.code} - {v.make} {v.model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <DataGrid
          rows={maintenanceRecords?.data || []}
          columns={columns}
          loading={isLoading}
          rowCount={maintenanceRecords?.total || 0}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          onPaginationModelChange={(model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize }))}
          disableRowSelectionOnClick
          density="compact"
          autoHeight
        />

        {/* Create Dialog */}
        <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Vehicle</InputLabel>
                    <Select
                      value={formik.values.vehicleId}
                      label="Vehicle"
                      onChange={(e) => formik.setFieldValue('vehicleId', e.target.value)}
                      required
                    >
                      {(vehicles?.data || []).map((v) => (
                        <MenuItem key={v.id} value={v.id}>{v.code} - {v.make} {v.model}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    required
                  >
                    <MenuItem value="ROUTINE">Routine</MenuItem>
                    <MenuItem value="REPAIR">Repair</MenuItem>
                    <MenuItem value="INSPECTION">Inspection</MenuItem>
                    <MenuItem value="TIRE_CHANGE">Tire Change</MenuItem>
                    <MenuItem value="OIL_CHANGE">Oil Change</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Status"
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    required
                  >
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Description"
                    name="description"
                    multiline
                    rows={2}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cost ($)"
                    name="cost"
                    type="number"
                    value={formik.values.cost}
                    onChange={formik.handleChange}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Service Date"
                    value={formik.values.serviceDate}
                    onChange={(v) => formik.setFieldValue('serviceDate', v)}
                    slotProps={{ textField: { fullWidth: true, size: 'small', required: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Service Provider"
                    name="serviceProvider"
                    value={formik.values.serviceProvider}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.serviceProvider && Boolean(formik.errors.serviceProvider)}
                    helperText={formik.touched.serviceProvider && formik.errors.serviceProvider}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Next Service Date"
                    value={formik.values.nextServiceDate}
                    onChange={(v) => formik.setFieldValue('nextServiceDate', v)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Next Service Mileage"
                    name="nextServiceMileage"
                    type="number"
                    value={formik.values.nextServiceMileage || ''}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notes"
                    name="notes"
                    multiline
                    rows={2}
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setFormOpen(false)} variant="outlined">Cancel</Button>
              <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Record'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Mai