import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Grid, IconButton, MenuItem, Paper, Rating, TextField, Typography, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../../app/api';
import { Supplier } from '../types';

const supplierTypes = ['LOCAL', 'IMPORT', 'MANUFACTURER'];

const validationSchema = Yup.object({
  code: Yup.string().required('Code is required').max(20),
  name: Yup.string().required('Name is required').max(200),
  nameAr: Yup.string().max(200),
  type: Yup.string().required('Type is required').oneOf(supplierTypes),
  phone: Yup.string().max(20),
  email: Yup.string().email().max(100),
  address: Yup.string().max(500),
  city: Yup.string().max(50),
  taxNumber: Yup.string().max(50),
  creditLimit: Yup.number().min(0),
  paymentTerms: Yup.number().integer().min(0),
  leadTime: Yup.number().integer().min(0),
  rating: Yup.number().min(0).max(5),
  gpsLat: Yup.number().min(-90).max(90).nullable(),
  gpsLng: Yup.number().min(-180).max(180).nullable(),
  notes: Yup.string().max(2000),
});

const SupplierForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => { if (!isEdit) return null; const response = await api.get(`/suppliers/${id}`); return response.data as Supplier; },
    enabled: isEdit,
  });

  const { data: usersData } = useQuery({
    queryKey: ['purchaseReps'],
    queryFn: async () => { const response = await api.get('/users?role=PURCHASE_REP&active=true'); return response.data.data as { id: string; name: string }[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = { ...values, creditLimit: Number(values.creditLimit) || 0, paymentTerms: Number(values.paymentTerms) || 0, leadTime: Number(values.leadTime) || 0, rating: Number(values.rating) || 0, gpsLat: values.gpsLat ? Number(values.gpsLat) : null, gpsLng: values.gpsLng ? Number(values.gpsLng) : null };
      if (isEdit) { const response = await api.put(`/suppliers/${id}`, payload); return response.data; }
      else { const response = await api.post('/suppliers', payload); return response.data; }
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: `Supplier ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
      if (!isEdit) setTimeout(() => navigate('/suppliers'), 800);
    },
    onError: (error: any) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save', severity: 'error' }); },
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;

  const initialValues = {
    code: supplierData?.code || '', name: supplierData?.name || '', nameAr: supplierData?.nameAr || '', type: supplierData?.type || 'LOCAL',
    phone: supplierData?.phone || '', email: supplierData?.email || '', address: supplierData?.address || '', city: supplierData?.city || '',
    taxNumber: supplierData?.taxNumber || '', creditLimit: supplierData?.creditLimit || 0, paymentTerms: supplierData?.paymentTerms || 30,
    leadTime: supplierData?.leadTime || 7, rating: supplierData?.rating || 3, salesRepId: supplierData?.salesRepId || '',
    gpsLat: supplierData?.gpsLat || '', gpsLng: supplierData?.gpsLng || '', notes: supplierData?.notes || '', isActive: supplierData?.isActive ?? true,
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/suppliers')}><BackIcon /></IconButton>
          <Typography variant="h4" fontWeight="bold" color="primary">{isEdit ? 'Edit Supplier' : 'New Supplier'}</Typography>
        </Box>
      </Box>
      <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize
        onSubmit={(values) => saveMutation.mutate(values)}>
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>Supplier Information</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="Supplier Code *" name="code" value={values.code} onChange={handleChange} onBlur={handleBlur}
                        error={touched.code && Boolean(errors.code)} helperText={touched.code && errors.code} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField select fullWidth size="small" label="Type *" name="type" value={values.type} onChange={handleChange} onBlur={handleBlur}
                        error={touched.type && Boolean(errors.type)} helperText={touched.type && errors.type}>
                        {supplierTypes.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField select fullWidth size="small" label="Purchase Rep" name="salesRepId" value={values.salesRepId} onChange={handleChange}>
                        <MenuItem value="">None</MenuItem>
                        {usersData?.map((u) => (<MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Name (English) *" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)} helperText={touched.name && errors.name} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Name (Arabic)" name="nameAr" value={values.nameAr} onChange={handleChange} onBlur={handleBlur}
                        error={touched.nameAr && Boolean(errors.nameAr)} helperText={touched.nameAr && errors.nameAr} inputProps={{ dir: 'rtl' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="Phone" name="phone" value={values.phone} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="Email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)} helperText={touched.email && errors.email} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="City" name="city" value={values.city} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth size="small" label="Address" name="address" value={values.address} onChange={handleChange} multiline rows={2} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="Tax Number" name="taxNumber" value={values.taxNumber} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField select fullWidth size="small" label="Status" name="isActive" value={String(values.isActive)} onChange={(e) => setFieldValue('isActive', e.target.value === 'true')}>
                        <MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Financial Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField fullWidth size="small" label="Credit Limit" name="creditLimit" type="number" value={values.creditLimit} onChange={handleChange} inputProps={{ min: 0, step: 0.01 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField fullWidth size="small" label="Payment Terms (days)" name="paymentTerms" type="number" value={values.paymentTerms} onChange={handleChange} inputProps={{ min: 0 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField fullWidth size="small" label="Lead Time (days)" name="leadTime" type="number" value={values.leadTime} onChange={handleChange} inputProps={{ min: 0 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">Rating:</Typography>
                        <Rating value={Number(values.rating) || 0} onChange={(_, val) => setFieldValue('rating', val || 0)} precision={0.5} />
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>GPS Coordinates</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Latitude" name="gpsLat" type="number" value={values.gpsLat} onChange={handleChange}
                        inputProps={{ min: -90, max: 90, step: 0.000001 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Longitude" name="gpsLng" type="number" value={values.gpsLng} onChange={handleChange}
                        inputProps={{ min: -180, max: 180, step: 0.000001 }} />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Notes</Typography>
                  <TextField fullWidth size="small" label="Notes" name="notes" value={values.notes} onChange={handleChange} multiline rows={4} />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ position: 'sticky', top: 16 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
                    {isEdit && supplierData && (
                      <Box sx={{ mb: 3 }}>
                        <InfoRow label="Created" value={new Date(supplierData.createdAt).toLocaleDateString()} />
                        <InfoRow label="Current Balance" value={formatCurrency(supplierData.balance)} />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button type="submit" variant="contained" startIcon={<SaveIcon />} fullWidth disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <CircularProgress size={24} /> : 'Save Supplier'}
                      </Button>
                      <Button variant="outlined" onClick={() => navigate('/suppliers')} fullWidth>Cancel</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight="medium">{value}</Typography>
  </Box>
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SupplierForm;
