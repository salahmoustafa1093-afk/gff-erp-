import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Divider, Grid, IconButton, MenuItem, Paper, TextField, Typography, Snackbar, Alert, CircularProgress, Tab, Tabs,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../../app/api';
import { Product } from '../types';

const productTypes = ['GOODS', 'SERVICE', 'RAW_MATERIAL', 'FINISHED', 'FEED'];

const validationSchema = Yup.object({
  code: Yup.string().required('Code is required').max(50),
  name: Yup.string().required('Name is required').max(200),
  nameAr: Yup.string().max(200),
  type: Yup.string().required('Type is required').oneOf(productTypes),
  categoryId: Yup.string().required('Category is required'),
  unitId: Yup.string().required('Unit is required'),
  costPrice: Yup.number().min(0).required('Cost price is required'),
  salePrice: Yup.number().min(0).required('Sale price is required'),
  minPrice: Yup.number().min(0),
  minStock: Yup.number().integer().min(0),
  maxStock: Yup.number().integer().min(0),
  reorderPoint: Yup.number().integer().min(0),
  reorderQty: Yup.number().integer().min(0),
  weight: Yup.number().min(0),
  barcode: Yup.string().max(50),
  description: Yup.string().max(2000),
});

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => { if (!isEdit) return null; const response = await api.get(`/products/${id}`); return response.data as Product; },
    enabled: isEdit,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['productCategoriesForm'],
    queryFn: async () => { const response = await api.get('/products/categories?active=true&pageSize=1000'); return response.data.data as { id: string; name: string }[]; },
  });

  const { data: brandsData } = useQuery({
    queryKey: ['productBrandsForm'],
    queryFn: async () => { const response = await api.get('/products/brands?active=true&pageSize=1000'); return response.data.data as { id: string; name: string }[]; },
  });

  const { data: unitsData } = useQuery({
    queryKey: ['productUnitsForm'],
    queryFn: async () => { const response = await api.get('/products/units?active=true&pageSize=1000'); return response.data.data as { id: string; name: string }[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        costPrice: Number(values.costPrice),
        salePrice: Number(values.salePrice),
        minPrice: Number(values.minPrice) || 0,
        minStock: Number(values.minStock) || 0,
        maxStock: Number(values.maxStock) || 0,
        reorderPoint: Number(values.reorderPoint) || 0,
        reorderQty: Number(values.reorderQty) || 0,
        weight: Number(values.weight) || 0,
        isActive: values.isActive,
      };
      if (isEdit) { const response = await api.put(`/products/${id}`, payload); return response.data; }
      else { const response = await api.post('/products', payload); return response.data; }
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: `Product ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
      if (!isEdit) setTimeout(() => navigate('/products'), 800);
    },
    onError: (error: any) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save', severity: 'error' }); },
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;

  const initialValues = {
    code: productData?.code || '',
    name: productData?.name || '',
    nameAr: productData?.nameAr || '',
    barcode: productData?.barcode || '',
    type: productData?.type || 'GOODS',
    categoryId: productData?.categoryId || '',
    brandId: productData?.brandId || '',
    unitId: productData?.unitId || '',
    costPrice: productData?.costPrice || 0,
    salePrice: productData?.salePrice || 0,
    minPrice: productData?.minPrice || 0,
    minStock: productData?.minStock || 0,
    maxStock: productData?.maxStock || 0,
    reorderPoint: productData?.reorderPoint || 0,
    reorderQty: productData?.reorderQty || 0,
    weight: productData?.weight || 0,
    nutritionalInfo: productData?.nutritionalInfo ? JSON.stringify(productData.nutritionalInfo, null, 2) : '',
    description: productData?.description || '',
    isActive: productData?.isActive ?? true,
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/products')}><BackIcon /></IconButton>
          <Typography variant="h4" fontWeight="bold" color="primary">{isEdit ? 'Edit Product' : 'New Product'}</Typography>
        </Box>
      </Box>

      <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize
        onSubmit={(values) => saveMutation.mutate(values)}>
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 3 }}>
                    <Tab label="Basic Info" />
                    <Tab label="Pricing & Inventory" />
                    <Tab label="Additional" />
                  </Tabs>

                  {activeTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField fullWidth size="small" label="Product Code *" name="code" value={values.code} onChange={handleChange} onBlur={handleBlur}
                          error={touched.code && Boolean(errors.code)} helperText={touched.code && errors.code} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField fullWidth size="small" label="Barcode" name="barcode" value={values.barcode} onChange={handleChange} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth size="small" label="Type *" name="type" value={values.type} onChange={handleChange} onBlur={handleBlur}
                          error={touched.type && Boolean(errors.type)} helperText={touched.type && errors.type}>
                          {productTypes.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth size="small" label="Name (English) *" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur}
                          error={touched.name && Boolean(errors.name)} helperText={touched.name && errors.name} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth size="small" label="Name (Arabic)" name="nameAr" value={values.nameAr} onChange={handleChange} inputProps={{ dir: 'rtl' }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth size="small" label="Category *" name="categoryId" value={values.categoryId} onChange={handleChange} onBlur={handleBlur}
                          error={touched.categoryId && Boolean(errors.categoryId)} helperText={touched.categoryId && errors.categoryId}>
                          <MenuItem value="">Select</MenuItem>
                          {categoriesData?.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth size="small" label="Brand" name="brandId" value={values.brandId} onChange={handleChange}>
                          <MenuItem value="">None</MenuItem>
                          {brandsData?.map((b) => (<MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth size="small" label="Unit *" name="unitId" value={values.unitId} onChange={handleChange} onBlur={handleBlur}
                          error={touched.unitId && Boolean(errors.unitId)} helperText={touched.unitId && errors.unitId}>
                          <MenuItem value="">Select</MenuItem>
                          {unitsData?.map((u) => (<MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth size="small" label="Description" name="description" value={values.description} onChange={handleChange} multiline rows={3} />
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 1 && (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField fullWidth size="small" label="Cost Price *" name="costPrice" type="number" value={values.costPrice} onChange={handleChange} onBlur={handleBlur}
                          error={touched.costPrice && Boolean(errors.costPrice)} helperText={touched.costPrice && errors.costPrice}
                          inputProps={{ min: 0, step: 0.01 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField fullWidth size="small" label="Sale Price *" name="salePrice" type="number" value={values.salePrice} onChange={handleChange} onBlur={handleBlur}
                          error={touched.salePrice && Boolean(errors.salePrice)} helperText={touched.salePrice && errors.salePrice}
                          inputProps={{ min: 0, step: 0.01 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField fullWidth size="small" label="Minimum Price" name="minPrice" type="number" value={values.minPrice} onChange={handleChange} inputProps={{ min: 0, step: 0.01 }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Inventory Settings</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField fullWidth size="small" label="Min Stock" name="minStock" type="number" value={values.minStock} onChange={handleChange} inputProps={{ min: 0 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField fullWidth size="small" label="Max Stock" name="maxStock" type="number" value={values.maxStock} onChange={handleChange} inputProps={{ min: 0 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField fullWidth size="small" label="Reorder Point" name="reorderPoint" type="number" value={values.reorderPoint} onChange={handleChange} inputProps={{ min: 0 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField fullWidth size="small" label="Reorder Qty" name="reorderQty" type="number" value={values.reorderQty} onChange={handleChange} inputProps={{ min: 0 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField fullWidth size="small" label="Weight (kg)" name="weight" type="number" value={values.weight} onChange={handleChange} inputProps={{ min: 0, step: 0.001 }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth size="small" label="Status" name="isActive" value={String(values.isActive)}
                          onChange={(e) => setFieldValue('isActive', e.target.value === 'true')}>
                          <MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 2 && (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Nutritional Information (JSON)</Typography>
                        <TextField fullWidth size="small" label="Nutritional Info" name="nutritionalInfo" value={values.nutritionalInfo}
                          onChange={handleChange} multiline rows={8} placeholder={`{\n  "protein": 18.5,\n  "fat": 3.2,\n  "fiber": 8.1\n}`}
                          helperText="Enter valid JSON for feed product nutritional data" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Product Image</Typography>
                        <TextField fullWidth size="small" label="Image URL" name="imageUrl" placeholder="https://example.com/image.jpg" disabled
                          helperText="Image upload will be available in future release" />
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ position: 'sticky', top: 16 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
                    {isEdit && productData && (
                      <Box sx={{ mb: 3 }}>
                        <InfoRow label="Current Stock" value={productData.currentStock?.toLocaleString() || '0'} />
                        <InfoRow label="Profit Margin" value={`${((1 - (productData.costPrice / productData.salePrice)) * 100).toFixed(1)}%`} />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button type="submit" variant="contained" startIcon={<SaveIcon />} fullWidth disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <CircularProgress size={24} /> : 'Save Product'}
                      </Button>
                      <Button variant="outlined" onClick={() => navigate('/products')} fullWidth>Cancel</Button>
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

export default ProductForm;
