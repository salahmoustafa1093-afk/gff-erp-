import React, { useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem,
  IconButton, Typography, Paper, Divider, Alert
} from '@mui/material';
import { Add, Delete, Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Trip, TripStop } from '../../types';

const validationSchema = Yup.object({
  type: Yup.string().required(),
  vehicleId: Yup.string().required('Vehicle is required'),
  driverId: Yup.string().required('Driver is required'),
  startDate: Yup.date().required(),
  expectedEndDate: Yup.date().required().min(Yup.ref('startDate'), 'Must be after start'),
  notes: Yup.string(),
});

const TripForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: availableVehicles } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: () => apiService.getVehicles({ status: 'ACTIVE', limit: 500 }),
  });

  const { data: availableDrivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: () => apiService.getAvailableDrivers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Trip>) => apiService.createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      navigate('/trips');
    },
  });

  const formik = useFormik({
    initialValues: {
      type: 'DELIVERY' as string,
      vehicleId: '',
      driverId: '',
      startDate: new Date() as Date | null,
      expectedEndDate: null as Date | null,
      notes: '',
      stops: [{ sequence: 1, type: 'PICKUP' as const, location: '', contactName: '', contactPhone: '', expectedTime: '', notes: '', status: 'PENDING' as const }] as TripStop[],
    },
    validationSchema,
    onSubmit: (values) => {
      createMutation.mutate({
        ...values,
        startDate: values.startDate?.toISOString(),
        expectedEndDate: values.expectedEndDate?.toISOString(),
      });
    },
  });

  const addStop = () => {
    formik.setFieldValue('stops', [
      ...formik.values.stops,
      { sequence: formik.values.stops.length + 1, type: 'DELIVERY' as const, location: '', contactName: '', contactPhone: '', expectedTime: '', notes: '', status: 'PENDING' as const },
    ]);
  };

  const removeStop = (index: number) => {
    const newStops = formik.values.stops.filter((_, i) => i !== index);
    newStops.forEach((stop, i) => { stop.sequence = i + 1; });
    formik.setFieldValue('stops', newStops);
  };

  const updateStop = (index: number, field: keyof TripStop, value: string) => {
    const newStops = [...formik.values.stops];
    newStops[index] = { ...newStops[index], [field]: value };
    formik.setFieldValue('stops', newStops);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Create Trip</Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Trip Details</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth select size="small" label="Trip Type" name="type" value={formik.values.type} onChange={formik.handleChange} required>
                        <MenuItem value="DELIVERY">Delivery</MenuItem>
                        <MenuItem value="PICKUP">Pickup</MenuItem>
                        <MenuItem value="TRANSFER">Transfer</MenuItem>
                        <MenuItem value="SERVICE">Service</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth select size="small" label="Vehicle" name="vehicleId" value={formik.values.vehicleId} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.vehicleId && Boolean(formik.errors.vehicleId)} helperText={formik.touched.vehicleId && formik.errors.vehicleId} required>
                        <MenuItem value="">Select Vehicle</MenuItem>
                        {(availableVehicles?.data || []).map((v) => (
                          <MenuItem key={v.id} value={v.id}>{v.code} - {v.make} {v.model}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth select size="small" label="Driver" name="driverId" value={formik.values.driverId} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.driverId && Boolean(formik.errors.driverId)} helperText={formik.touched.driverId && formik.errors.driverId} required>
                        <MenuItem value="">Select Driver</MenuItem>
                        {(availableDrivers || []).map((d) => (
                          <MenuItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker label="Start Date" value={formik.values.startDate} onChange={(v) => formik.setFieldValue('startDate', v)} slotProps={{ textField: { fullWidth: true, size: 'small', required: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker label="Expected End" value={formik.values.expectedEndDate} onChange={(v) => formik.setFieldValue('expectedEndDate', v)} slotProps={{ textField: { fullWidth: true, size: 'small', required: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth size="small" label="Notes" name="notes" multiline rows={3} value={formik.values.notes} onChange={formik.handleChange} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Only active vehicles and available drivers are shown.
              </Alert>
              <Box display="flex" gap={2}>
                <Button variant="outlined" onClick={() => navigate('/trips')}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Trip'}
                </Button>
              </Box>
            </Grid>

            {/* Stops Section */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>Stops</Typography>
                    <Button variant="outlined" size="small" startIcon={<Add />} onClick={addStop}>Add Stop</Button>
                  </Box>

                  {formik.values.stops.map((stop, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, position: 'relative' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip label={`#${stop.sequence} ${stop.type}`} size="small" color="primary" variant="outlined" />
                        {formik.values.stops.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => removeStop(index)}><Delete fontSize="small" /></IconButton>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth size="small" label="Location" value={stop.location} onChange={(e) => updateStop(index, 'location', e.target.value)} required />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField fullWidth size="small" select label="Type" value={stop.type} onChange={(e) => updateStop(index, 'type', e.target.value)}>
                            <MenuItem value="PICKUP">Pickup</MenuItem>
                            <MenuItem value="DELIVERY">Delivery</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField fullWidth size="small" label="Expected Time" type="time" value={stop.expectedTime} onChange={(e) => updateStop(index, 'expectedTime', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth size="small" label="Contact Name" value={stop.contactName} onChange={(e) => updateStop(index, 'contactName', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth size="small" label="Contact Phone" value={stop.contactPhone} onChange={(e) => updateStop(index, 'contactPhone', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField fullWidth size="small" label="Notes" multiline rows={2} value={stop.notes} onChange={(e) => updateStop(index, 'notes', e.target.value)} />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default TripForm;
