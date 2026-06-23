import React, { useEffect } from 'react';
import {
  Box, Button, DialogActions, DialogContent, DialogTitle,
  Grid, TextField, MenuItem, IconButton, Typography
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { Vehicle } from '../../types';

interface VehicleFormProps {
  vehicleId: string | null;
  onClose: () => void;
}

const validationSchema = Yup.object({
  code: Yup.string().required('Code is required').max(50),
  type: Yup.string().required('Type is required'),
  make: Yup.string().required('Make is required').max(100),
  model: Yup.string().required('Model is required').max(100),
  year: Yup.number().required('Year is required').min(1900).max(new Date().getFullYear() + 1),
  licensePlate: Yup.string().required('License plate is required').max(50),
  chassisNumber: Yup.string().max(100),
  engineNumber: Yup.string().max(100),
  capacity: Yup.number().min(0),
  fuelType: Yup.string().required('Fuel type is required'),
  fuelCapacity: Yup.number().min(0),
  purchaseDate: Yup.date().nullable(),
  purchaseCost: Yup.number().min(0),
  branch: Yup.string().required('Branch is required'),
  status: Yup.string().required('Status is required'),
});

const VehicleForm: React.FC<VehicleFormProps> = ({ vehicleId, onClose }) => {
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehicleId ? apiService.getVehicle(vehicleId) : null,
    enabled: !!vehicleId,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiService.getBranches(),
  });

  const mutation = useMutation({
    mutationFn: (values: Partial<Vehicle>) =>
      vehicleId ? apiService.updateVehicle(vehicleId, values) : apiService.createVehicle(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (vehicleId) queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: {
      code: '', type: 'TRUCK', make: '', model: '', year: new Date().getFullYear(),
      licensePlate: '', chassisNumber: '', engineNumber: '', capacity: 0,
      fuelType: 'DIESEL', fuelCapacity: 0, purchaseDate: null as Date | null,
      purchaseCost: 0, branch: '', status: 'ACTIVE',
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate({
        ...values,
        purchaseDate: values.purchaseDate?.toISOString(),
      });
    },
  });

  useEffect(() => {
    if (existing) {
      formik.setValues({
        code: existing.code || '',
        type: existing.type || 'TRUCK',
        make: existing.make || '',
        model: existing.model || '',
        year: existing.year || new Date().getFullYear(),
        licensePlate: existing.licensePlate || '',
        chassisNumber: existing.chassisNumber || '',
        engineNumber: existing.engineNumber || '',
        capacity: existing.capacity || 0,
        fuelType: existing.fuelType || 'DIESEL',
        fuelCapacity: existing.fuelCapacity || 0,
        purchaseDate: existing.purchaseDate ? new Date(existing.purchaseDate) : null,
        purchaseCost: existing.purchaseCost || 0,
        branch: existing.branch || '',
        status: existing.status || 'ACTIVE',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{vehicleId ? 'Edit Vehicle' : 'Create Vehicle'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Code" name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.code && Boolean(formik.errors.code)} helperText={formik.touched.code && formik.errors.code} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select size="small" label="Type" name="type" value={formik.values.type} onChange={formik.handleChange} required>
                <MenuItem value="TRUCK">Truck</MenuItem>
                <MenuItem value="VAN">Van</MenuItem>
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="MOTORCYCLE">Motorcycle</MenuItem>
                <MenuItem value="BUS">Bus</MenuItem>
                <MenuItem value="TRAILER">Trailer</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Make" name="make" value={formik.values.make} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.make && Boolean(formik.errors.make)} helperText={formik.touched.make && formik.errors.make} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Model" name="model" value={formik.values.model} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.model && Boolean(formik.errors.model)} helperText={formik.touched.model && formik.errors.model} required />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth size="small" label="Year" name="year" type="number" value={formik.values.year} onChange={formik.handleChange} required />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth size="small" label="License Plate" name="licensePlate" value={formik.values.licensePlate} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.licensePlate && Boolean(formik.errors.licensePlate)} helperText={formik.touched.licensePlate && formik.errors.licensePlate} required />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth size="small" label="Capacity (kg)" name="capacity" type="number" value={formik.values.capacity} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Chassis Number" name="chassisNumber" value={formik.values.chassisNumber} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Engine Number" name="engineNumber" value={formik.values.engineNumber} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth select size="small" label="Fuel Type" name="fuelType" value={formik.values.fuelType} onChange={formik.handleChange} required>
                <MenuItem value="DIESEL">Diesel</MenuItem>
                <MenuItem value="PETROL">Petrol</MenuItem>
                <MenuItem value="ELECTRIC">Electric</MenuItem>
                <MenuItem value="HYBRID">Hybrid</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth size="small" label="Fuel Capacity (L)" name="fuelCapacity" type="number" value={formik.values.fuelCapacity} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <DatePicker label="Purchase Date" value={formik.values.purchaseDate} onChange={(v) => formik.setFieldValue('purchaseDate', v)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth size="small" label="Purchase Cost ($)" name="purchaseCost" type="number" value={formik.values.purchaseCost} onChange={formik.handleChange} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth select size="small" label="Branch" name="branch" value={formik.values.branch} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.branch && Boolean(formik.errors.branch)} helperText={formik.touched.branch && formik.errors.branch} required>
                {(branches || []).map((b: string) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth select size="small" label="Status" name="status" value={formik.values.status} onChange={formik.handleChange} required>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="IN_USE">In Use</MenuItem>
                <MenuItem value="RETIRED">Retired</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : vehicleId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </LocalizationProvider>
  );
};

export default VehicleForm;
