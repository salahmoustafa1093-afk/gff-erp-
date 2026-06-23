import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
  Snackbar,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import api from '../../app/api';
import { PurchaseOrder, Supplier, Product } from '../types';

interface FormItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  notes: string;
}

interface FormValues {
  supplierId: string;
  orderDate: Date | null;
  expectedDate: Date | null;
  branchId: string;
  discountPercent: number;
  taxPercent: number;
  shipping: number;
  notes: string;
  items: FormItem[];
}

const validationSchema = Yup.object({
  supplierId: Yup.string().required('Supplier is required'),
  orderDate: Yup.date().required('Order date is required'),
  expectedDate: Yup.date().nullable(),
  branchId: Yup.string().required('Branch is required'),
  discountPercent: Yup.number().min(0).max(100),
  taxPercent: Yup.number().min(0).max(100),
  shipping: Yup.number().min(0),
  items: Yup.array().of(
    Yup.object({
      productId: Yup.string().required('Product is required'),
      quantity: Yup.number().required().min(0.01),
      unitPrice: Yup.number().required().min(0),
    })
  ).min(1, 'At least one item is required'),
});

const emptyItem = (): FormItem => ({
  id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  productId: '',
  productCode: '',
  productName: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxPercent: 15,
  total: 0,
  notes: '',
});

const PurchaseOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: async () => {
      if (!isEdit) return null;
      const response = await api.get(`/purchases/orders/${id}`);
      return response.data as PurchaseOrder;
    },
    enabled: isEdit,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers?active=true&pageSize=1000');
      return response.data.data as Supplier[];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['productsForPO'],
    queryFn: async () => {
      const response = await api.get('/products?active=true&pageSize=1000');
      return response.data.data as Product[];
    },
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branchesForPO'],
    queryFn: async () => {
      const response = await api.get('/branches?active=true');
      return response.data.data as { id: string; name: string }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues & { subtotal: number; total: number }) => {
      const payload = {
        supplierId: values.supplierId,
        orderDate: values.orderDate ? format(values.orderDate, 'yyyy-MM-dd') : null,
        expectedDate: values.expectedDate ? format(values.expectedDate, 'yyyy-MM-dd') : null,
        branchId: values.branchId,
        discountPercent: values.discountPercent,
        taxPercent: values.taxPercent,
        shipping: values.shipping,
        notes: values.notes,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxPercent: item.taxPercent,
          notes: item.notes,
        })),
      };
      if (isEdit) {
        const response = await api.put(`/purchases/orders/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post('/purchases/orders', payload);
        return response.data;
      }
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: `Purchase order ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
      if (!isEdit) setTimeout(() => navigate(`/purchases/orders/${data.id}`), 800);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save', severity: 'error' });
    },
  });

  const suppliers = suppliersData || [];
  const products = productsData || [];

  const calculateItemTotal = (item: FormItem): number => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
    const subtotal = qty * price - discountAmt;
    const taxAmt = (subtotal * (item.taxPercent || 0)) / 100;
    return Number((subtotal + taxAmt).toFixed(2));
  };

  const initialValues: FormValues = {
    supplierId: orderData?.supplierId || '',
    orderDate: orderData ? new Date(orderData.orderDate) : new Date(),
    expectedDate: orderData?.expectedDate ? new Date(orderData.expectedDate) : null,
    branchId: orderData?.branchId || '',
    discountPercent: orderData?.discountPercent || 0,
    taxPercent: orderData?.taxPercent || 15,
    shipping: orderData?.shipping || 0,
    notes: orderData?.notes || '',
    items: orderData?.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      taxPercent: item.taxPercent,
      total: item.total,
      notes: item.notes,
    })) || [emptyItem()],
  };

  if (orderLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/purchases/orders')}>
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
            </Typography>
          </Box>
        </Box>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={(values) => {
            const subtotal = values.items.reduce((sum, item) => {
              const qty = item.quantity || 0;
              const price = item.unitPrice || 0;
              const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
              return sum + (qty * price - discountAmt);
            }, 0);
            const discount = (subtotal * (values.discountPercent || 0)) / 100;
            const afterDiscount = subtotal - discount;
            const tax = (afterDiscount * (values.taxPercent || 0)) / 100;
            const total = afterDiscount + tax + (values.shipping || 0);
            saveMutation.mutate({ ...values, subtotal, total: Number(total.toFixed(2)) });
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
            const subtotal = values.items.reduce((sum, item) => {
              const qty = item.quantity || 0;
              const price = item.unitPrice || 0;
              const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
              return sum + (qty * price - discountAmt);
            }, 0);
            const discount = (subtotal * (values.discountPercent || 0)) / 100;
            const afterDiscount = subtotal - discount;
            const tax = (afterDiscount * (values.taxPercent || 0)) / 100;
            const total = afterDiscount + tax + (values.shipping || 0);

            const handleProductSelect = (index: number, product: Product | null) => {
              if (!product) return;
              const newItems = [...values.items];
              newItems[index] = {
                ...newItems[index],
                productId: product.id,
                productCode: product.code,
                productName: product.name,
                unitPrice: product.costPrice || product.salePrice,
              };
              newItems[index].total = calculateItemTotal(newItems[index]);
              setFieldValue('items', newItems);
            };

            const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
              const newItems = [...values.items];
              newItems[index] = { ...newItems[index], [field]: value };
              newItems[index].total = calculateItemTotal(newItems[index]);
              setFieldValue('items', newItems);
            };

            const addItem = () => setFieldValue('items', [...values.items, emptyItem()]);
            const removeItem = (index: number) => {
              const newItems = values.items.filter((_, i) => i !== index);
              if (newItems.length === 0) newItems.push(emptyItem());
              setFieldValue('items', newItems);
            };

            return (
              <Form>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>Order Info</Typography>
                        <Autocomplete
                          options={suppliers}
                          getOptionLabel={(s) => `${s.code} - ${s.name}`}
                          value={suppliers.find((s) => s.id === values.supplierId) || null}
                          onChange={(_, val) => setFieldValue('supplierId', val?.id || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Supplier *"
                              size="small"
                              fullWidth
                              margin="normal"
                              error={touched.supplierId && Boolean(errors.supplierId)}
                              helperText={touched.supplierId && errors.supplierId}
                            />
                          )}
                        />
                        <DatePicker
                          label="Order Date *"
                          value={values.orderDate}
                          onChange={(val) => setFieldValue('orderDate', val)}
                          slotProps={{ textField: { size: 'small', fullWidth: true, margin: 'normal' } }}
                        />
                        <DatePicker
                          label="Expected Date"
                          value={values.expectedDate}
                          onChange={(val) => setFieldValue('expectedDate', val)}
                          slotProps={{ textField: { size: 'small', fullWidth: true, margin: 'normal' } }}
                        />
                        <TextField
                          select
                          label="Branch *"
                          size="small"
                          fullWidth
                          margin="normal"
                          value={values.branchId}
                          onChange={handleChange}
                          name="branchId"
                          error={touched.branchId && Boolean(errors.branchId)}
                          helperText={touched.branchId && errors.branchId}
                        >
                          {branchesData?.map((b) => (
                            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Notes"
                          size="small"
                          fullWidth
                          margin="normal"
                          multiline
                          rows={3}
                          name="notes"
                          value={values.notes}
                          onChange={handleChange}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">Order Items</Typography>
                          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addItem}>
                            Add Item
                          </Button>
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Disc%</TableCell>
                                <TableCell align="right">Tax%</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell width={50} />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {values.items.map((item, index) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Autocomplete
                                      options={products}
                                      getOptionLabel={(p) => `${p.code} - ${p.name}`}
                                      value={products.find((p) => p.id === item.productId) || null}
                                      onChange={(_, val) => handleProductSelect(index, val)}
                                      renderInput={(params) => (
                                        <TextField {...params} size="small" placeholder="Select product" fullWidth />
                                      )}
                                      size="small"
                                      sx={{ minWidth: 250 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                      inputProps={{ min: 0.01, step: 0.01 }}
                                      sx={{ width: 80 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.unitPrice}
                                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      sx={{ width: 100 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.discountPercent}
                                      onChange={(e) => handleItemChange(index, 'discountPercent', Number(e.target.value))}
                                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                                      sx={{ width: 70 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.taxPercent}
                                      onChange={(e) => handleItemChange(index, 'taxPercent', Number(e.target.value))}
                                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                                      sx={{ width: 70 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontWeight="medium">
                                      {formatCurrency(item.total)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <IconButton size="small" color="error" onClick={() => removeItem(index)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Box sx={{ width: 300 }}>
                            <SummaryRow label="Subtotal:" value={subtotal} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography>Discount:</Typography>
                              <TextField
                                type="number" size="small" name="discountPercent"
                                value={values.discountPercent}
                                onChange={handleChange}
                                inputProps={{ min: 0, max: 100 }} sx={{ width: 80 }}
                              />
                            </Box>
                            <SummaryRow label="Discount Amount:" value={discount} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography>Tax:</Typography>
                              <TextField
                                type="number" size="small" name="taxPercent"
                                value={values.taxPercent}
                                onChange={handleChange}
                                inputProps={{ min: 0, max: 100 }} sx={{ width: 80 }}
                              />
                            </Box>
                            <SummaryRow label="Tax Amount:" value={tax} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography>Shipping:</Typography>
                              <TextField
                                type="number" size="small" name="shipping"
                                value={values.shipping}
                                onChange={handleChange}
                                inputProps={{ min: 0, step: 0.01 }} sx={{ width: 120 }}
                              />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="h6" fontWeight="bold">Total:</Typography>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                {formatCurrency(total)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                          <Button variant="outlined" onClick={() => navigate('/purchases/orders')}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? <CircularProgress size={24} /> : 'Save Purchase Order'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

const SummaryRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
    <Typography variant="body2">{label}</Typography>
    <Typography variant="body2" fontWeight="medium">{formatCurrency(value)}</Typography>
  </Box>
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default PurchaseOrderForm;
