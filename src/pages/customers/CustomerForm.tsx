import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../../app/api';
import { Customer } from '../types';

const customerTypes = ['INDIVIDUAL', 'COMPANY', 'DEALER', 'DISTRIBUTOR'];

const validationSchema = Yup.object({
  code: Yup.string().required('Code is required').max(20, 'Max 20 characters'),
  name: Yup.string().required('Name is required').max(200, 'Max 200 characters'),
  nameAr: Yup.string().max(200, 'Max 200 characters'),
  type: Yup.string().required('Type is required').oneOf(customerTypes),
  phone: Yup.string().max(20, 'Max 20 characters'),
  email: Yup.string().email('Invalid email').max(100, 'Max 100 characters'),
  address: Yup.string().max(500, 'Max 500 characters'),
  city: Yup.string().max(50, 'Max 50 characters'),
  taxNumber: Yup.string().max(50, 'Max 50 characters'),
  creditLimit: Yup.number().min(0, 'Min 0'),
  paymentTerms: Yup.number().integer().min(0, 'Min 0'),
  discountPercent: Yup.number().min(0, 'Max 100').max(100),
  gpsLat: Yup.number().min(-90).max(90),
  gpsLng: Yup.number().min(-180).max(180),
  notes: Yup.string().max(2000, 'Max 2000 characters'),
});

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!isEdit) return null;
      const response = await api.get(`/customers/${id}`);
      return response.data as Customer;
    },
    enabled: isEdit,
  });

  const { data: salesRepsData } = useQuery({
    queryKey: ['salesReps'],
    queryFn: async () => {
      const response = await api.get('/users?role=SALES_REP&active=true');
      return response.data.data as { id: string; name: string }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        creditLimit: Number(values.creditLimit) || 0,
        paymentTerms: Number(values.paymentTerms) || 0,
        discountPercent: Number(values.discountPercent) || 0,
        gpsLat: values.gpsLat ? Number(values.gpsLat) : null,
        gpsLng: values.gpsLng ? Number(values.gpsLng) : null,
        isActive: values.isActive,
      };
      if (isEdit) {
        const response = await api.put(`/customers/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post('/customers', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: `Customer ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
      if (!isEdit) setTimeout(() => navigate('/customers'), 800);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to save customer';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const initialValues = {
    code: customerData?.code || '',
    name: customerData?.name || '',
    nameAr: customerData?.nameAr || '',
    type: customerData?.type || 'INDIVIDUAL',
    phone: customerData?.phone || '',
    email: customerData?.email || '',
    address: customerData?.address || '',
    city: customerData?.city || '',
    taxNumber: customerData?.taxNumber || '',
    creditLimit: customerData?.creditLimit || 0,
    paymentTerms: customerData?.paymentTerms || 30,
    discountPercent: customerData?.discountPercent || 0,
    salesRepId: customerData?.salesRepId || '',
    gpsLat: customerData?.gpsLat || '',
    gpsLng: customerData?.gpsLng || '',
    notes: customerData?.notes || '',
    isActive: customerData?.isActive ?? true,
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/customers')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {isEdit ? 'Edit Customer' : 'New Customer'}
          </Typography>
        </Box>
      </Box>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={(values) => saveMutation.mutate(values)}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>Customer Information</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Customer Code *"
                        name="code"
                        value={values.code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.code && Boolean(errors.code)}
                        helperText={touched.code && errors.code}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Type *"
                        name="type"
                        value={values.type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.type && Boolean(errors.type)}
                        helperText={touched.type && errors.type}
                      >
                        {customerTypes.map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Sales Rep"
                        name="salesRepId"
                        value={values.salesRepId}
                        onChange={handleChange}
                      >
                        <MenuItem value="">None</MenuItem>
                        {salesRepsData?.map((rep) => (
                          <MenuItem key={rep.id} value={rep.id}>{rep.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name (English) *"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name (Arabic)"
                        name="nameAr"
                        value={values.nameAr}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.nameAr && Boolean(errors.nameAr)}
                        helperText={touched.nameAr && errors.nameAr}
                        inputProps={{ dir: 'rtl' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={touched.phone && errors.phone}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="City"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Address"
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Tax Number"
                        name="taxNumber"
                        value={values.taxNumber}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Status"
                        name="isActive"
                        value={values.isActive}
                        onChange={(e) => setFieldValue('isActive', e.target.value === 'true')}
                      >
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Financial Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Credit Limit"
                        name="creditLimit"
                        type="number"
                        value={values.creditLimit}
                        onChange={handleChange}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Payment Terms (days)"
                        name="paymentTerms"
                        type="number"
                        value={values.paymentTerms}
                        onChange={handleChange}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Discount %"
                        name="discountPercent"
                        type="number"
                        value={values.discountPercent}
                        onChange={handleChange}
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    GPS Coordinates
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Latitude"
                        name="gpsLat"
                        type="number"
                        value={values.gpsLat}
                        onChange={handleChange}
                        inputProps={{ min: -90, max: 90, step: 0.000001 }}
                        error={touched.gpsLat && Boolean(errors.gpsLat)}
                        helperText={touched.gpsLat && errors.gpsLat}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Longitude"
                        name="gpsLng"
                        type="number"
                        value={values.gpsLng}
                        onChange={handleChange}
                        inputProps={{ min: -180, max: 180, step: 0.000001 }}
                        error={touched.gpsLng && Boolean(errors.gpsLng)}
                        helperText={touched.gpsLng && errors.gpsLng}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Notes</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notes"
                    name="notes"
                    value={values.notes}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    error={touched.notes && Boolean(errors.notes)}
                    helperText={touched.notes && errors.notes}
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ position: 'sticky', top: 16 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
                    {isEdit && customerData && (
                      <Box sx={{ mb: 3 }}>
                        <InfoRow label="Created" value={new Date(customerData.createdAt).toLocaleDateString()} />
                        <InfoRow label="Current Balance" value={formatCurrency(customerData.balance)} />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        fullWidth
                        disabled={isSubmitting || saveMutation.isPending}
                      >
                        {isSubmitting || saveMutation.isPending ? <CircularProgress size={24} /> : 'Save Customer'}
                      </Button>
                      <Button variant="outlined" onClick={() => navigate('/customers')} fullWidth>
                        Cancel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
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

export default CustomerForm;
