import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  Paper, Skeleton, Alert, Chip, Divider
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { LocalGasStation, TrendingUp, TrendingDown, Speed } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { apiService } from '../../services/api';
import { FuelLog } from '../../types';

const validationSchema = Yup.object({
  date: Yup.date().required(),
  odometer: Yup.number().required().min(0),
  fuelAmount: Yup.number().required().min(0),
  fuelPrice: Yup.number().required().min(0),
  station: Yup.string().required('Station is required'),
  notes: Yup.string(),
});

const FuelLogsPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId || '');

  const { data: fuelLogs, isLoading } = useQuery({
    queryKey: ['fuel-logs', selectedVehicle],
    queryFn: () => apiService.getFuelLogs(selectedVehicle),
    enabled: !!selectedVehicle,
  });

  const { data: fuelEfficiency } = useQuery({
    queryKey: ['fuel-efficiency', selectedVehicle],
    queryFn: () => apiService.getFuelEfficiency(selectedVehicle),
    enabled: !!selectedVehicle,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiService.getVehicles({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FuelLog>) => apiService.createFuelLog(selectedVehicle, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-efficiency'] });
      formik.resetForm();
    },
  });

  const formik = useFormik({
    initialValues: {
      date: new Date() as Date | null,
      odometer: 0,
      fuelAmount: 0,
      fuelPrice: 0,
      station: '',
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const totalCost = (values.fuelAmount || 0) * (values.fuelPrice || 0);
      createMutation.mutate({
        ...values,
        date: values.date?.toISOString(),
        totalCost,
      });
    },
  });

  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', width: 120, valueFormatter: (v: string) => new Date(v).toLocaleDateString() },
    { field: 'odometer', headerName: 'Odometer', width: 110, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'fuelAmount', headerName: 'Fuel (L)', width: 90, type: 'number' },
    { field: 'fuelPrice', headerName: 'Price/L', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    { field: 'station', headerName: 'Station', width: 150 },
    { field: 'notes', headerName: 'Notes', flex: 1 },
  ];

  const costTrend = (fuelLogs || []).map((log) => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    cost: log.totalCost,
    liters: log.fuelAmount,
  })).reverse();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Fuel Logs</Typography>

        {!vehicleId && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                select
                size="small"
                label="Select Vehicle"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
              >
                <MenuItem value="">Select a vehicle</MenuItem>
                {(vehicles?.data || []).map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.code} - {v.make} {v.model}</MenuItem>
                ))}
              </TextField>
            </CardContent>
          </Card>
        )}

        {selectedVehicle && (
          <>
            {/* Efficiency Metrics */}
            {fuelEfficiency && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Speed sx={{ color: 'primary.main', mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">Avg. Consumption</Typography>
                      <Typography variant="h4" fontWeight={700} color="primary.main">{fuelEfficiency.avgConsumption.toFixed(1)} L/100km</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <LocalGasStation sx={{ color: 'error.main', mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">Total Fuel Cost</Typography>
                      <Typography variant="h4" fontWeight={700} color="error.main">${fuelEfficiency.totalCost.toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ color: 'success.main', mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">Total Distance</Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main">{fuelEfficiency.totalDistance.toLocaleString()} km</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Cost Trend Chart */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Cost & Consumption Trend</Typography>
                <Box height={280}>
                  {costTrend.length > 0 ? (
                    <ResponsiveContainer>
                      <AreaChart data={costTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Area yAxisId="left" type="monotone" dataKey="cost" name="Cost ($)" stroke="#d32f2f" fill="#d32f2f" fillOpacity={0.1} />
                        <Area yAxisId="right" type="monotone" dataKey="liters" name="Liters" stroke="#0288d1" fill="#0288d1" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert severity="info">No fuel data available yet.</Alert>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* Fuel Log Form */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Add Fuel Log</Typography>
                    <form onSubmit={formik.handleSubmit}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <DatePicker
                            label="Date"
                            value={formik.values.date}
                            onChange={(v) => formik.setFieldValue('date', v)}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Odometer (km)"
                            name="odometer"
                            type="number"
                            value={formik.values.odometer}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.odometer && Boolean(formik.errors.odometer)}
                            helperText={formik.touched.odometer && formik.errors.odometer}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Fuel Amount (L)"
                            name="fuelAmount"
                            type="number"
                            value={formik.values.fuelAmount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.fuelAmount && Boolean(formik.errors.fuelAmount)}
                            helperText={formik.touched.fuelAmount && formik.errors.fuelAmount}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Price/L ($)"
                            name="fuelPrice"
                            type="number"
                            value={formik.values.fuelPrice}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.fuelPrice && Boolean(formik.errors.fuelPrice)}
                            helperText={formik.touched.fuelPrice && formik.errors.fuelPrice}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Station"
                            name="station"
                            value={formik.values.station}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.station && Boolean(formik.errors.station)}
                            helperText={formik.touched.station && formik.errors.station}
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
                        <Grid size={{ xs: 12 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">Estimated Total:</Typography>
                            <Typography variant="body1" fontWeight={700}>${((formik.values.fuelAmount || 0) * (formik.values.fuelPrice || 0)).toFixed(2)}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button type="submit" variant="contained" fullWidth disabled={createMutation.isPending} startIcon={<LocalGasStation />}>
                            {createMutation.isPending ? 'Adding...' : 'Add Fuel Log'}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </CardContent>
                </Card>
              </Grid>

              {/* Fuel Logs Table */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Fuel Log History</Typography>
                    <DataGrid
                      rows={fuelLogs || []}
                      columns={columns}
                      loading={isLoading}
                      pageSizeOptions={[10, 25]}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      density="compact"
                      autoHeight
                      disableRowSelectionOnClick
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {!selectedVehicle && (
          <Alert severity="info">Select a vehicle to view fuel logs.</Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default FuelLogsPage;
