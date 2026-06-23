import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Formik, Form, FieldArray, Field, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import api from '../../app/api';
import { SalesOrder, Customer, Product, SalesOrderItem } from '../types';

interface FormItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  stockAvailable: number;
  notes: string;
}

interface FormValues {
  customerId: string;
  orderDate: Date | null;
  dueDate: Date | null;
  branchId: string;
  salesRepId: string;
  discountPercent: number;
  taxPercent: number;
  shipping: number;
  notes: string;
  items: FormItem[];
}

const validationSchema = Yup.object({
  customerId: Yup.string().required('Customer is required'),
  orderDate: Yup.date().required('Order date is required'),
  dueDate: Yup.date()
    .required('Due date is required')
    .min(Yup.ref('orderDate'), 'Due date must be after order date'),
  branchId: Yup.string().required('Branch is required'),
  discountPercent: Yup.number().min(0, 'Min 0').max(100, 'Max 100'),
  taxPercent: Yup.number().min(0, 'Min 0').max(100, 'Max 100'),
  shipping: Yup.number().min(0, 'Min 0'),
  items: Yup.array().of(
    Yup.object({
      productId: Yup.string().required('Product is required'),
      quantity: Yup.number().required().min(0.01, 'Min 0.01'),
      unitPrice: Yup.number().required().min(0, 'Min 0'),
    })
  ).min(1, 'At least one item is required'),
});

const emptyItem = (): FormItem => ({
  id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  productId: '',
  productCode: '',
  productName: '',
  unitId: '',
  unitName: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxPercent: 15,
  total: 0,
  stockAvailable: 0,
  notes: '',
});

const SalesOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [customerCreditWarning, setCustomerCreditWarning] = useState<string | null>(null);

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['salesOrder', id],
    queryFn: async () => {
      if (!isEdit) return null;
      const response = await api.get(`/sales/orders/${id}`);
      return response.data as SalesOrder;
    },
    enabled: isEdit,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers?active=true&pageSize=1000');
      return response.data.data as Customer[];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products?active=true&pageSize=1000');
      return response.data.data as Product[];
    },
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches?active=true');
      return response.data.data as { id: string; name: string }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues & { subtotal: number; discount: number; tax: number; total: number }) => {
      const payload = {
        customerId: values.customerId,
        orderDate: values.orderDate ? format(values.orderDate, 'yyyy-MM-dd') : null,
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
        branchId: values.branchId,
        salesRepId: values.salesRepId,
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
        const response = await api.put(`/sales/orders/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post('/sales/orders', payload);
        return response.data;
      }
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: `Order ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
      if (!isEdit) {
        setTimeout(() => navigate(`/sales/orders/${data.id}`), 800);
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to save order';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    },
  });

  const draftMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        customerId: values.customerId,
        orderDate: values.orderDate ? format(values.orderDate, 'yyyy-MM-dd') : null,
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
        branchId: values.branchId,
        salesRepId: values.salesRepId,
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
        status: 'DRAFT',
      };
      if (isEdit && id) {
        await api.put(`/sales/orders/${id}`, payload);
      } else {
        await api.post('/sales/orders', payload);
      }
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Draft saved', severity: 'success' });
    },
  });

  const customers = customersData || [];
  const products = productsData || [];

  const calculateItemTotal = (item: FormItem): number => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
    const subtotal = qty * price - discountAmt;
    const taxAmt = (subtotal * (item.taxPercent || 0)) / 100;
    return Number((subtotal + taxAmt).toFixed(2));
  };

  const getInitialValues = (): FormValues => {
    if (orderData) {
      return {
        customerId: orderData.customerId,
        orderDate: parseISOOrNull(orderData.orderDate),
        dueDate: parseISOOrNull(orderData.dueDate),
        branchId: orderData.branchId,
        salesRepId: orderData.salesRepId,
        discountPercent: orderData.discountPercent,
        taxPercent: orderData.taxPercent,
        shipping: orderData.shipping,
        notes: orderData.notes,
        items: orderData.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unitId: item.unitId,
          unitName: item.unitName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxPercent: item.taxPercent,
          total: item.total,
          stockAvailable: item.stockAvailable,
          notes: item.notes,
        })),
      };
    }
    return {
      customerId: '',
      orderDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      branchId: '',
      salesRepId: '',
      discountPercent: 0,
      taxPercent: 15,
      shipping: 0,
      notes: '',
      items: [emptyItem()],
    };
  };

  function parseISOOrNull(dateStr: string): Date | null {
    if (!dateStr) return null;
    try { return new Date(dateStr); } catch { return null; }
  }

  const formik = useFormik<FormValues>({
    initialValues: getInitialValues(),
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
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

      saveMutation.mutate({ ...values, subtotal, discount, tax, total: Number(total.toFixed(2)) });
    },
  });

  useEffect(() => {
    if (formik.values.customerId && customers.length > 0) {
      const customer = customers.find((c) => c.id === formik.values.customerId);
      if (customer) {
        if (customer.balance >= customer.creditLimit && customer.creditLimit > 0) {
          setCustomerCreditWarning(`Customer has exceeded credit limit (${customer.creditLimit.toLocaleString()}). Current balance: ${customer.balance.toLocaleString()}`);
        } else if (customer.balance > customer.creditLimit * 0.8 && customer.creditLimit > 0) {
          setCustomerCreditWarning(`Customer approaching credit limit (${customer.creditLimit.toLocaleString()}). Current balance: ${customer.balance.toLocaleString()}`);
        } else {
          setCustomerCreditWarning(null);
        }
      }
    }
  }, [formik.values.customerId, customers]);

  useEffect(() => {
    if (!isEdit) {
      autoSaveRef.current = setInterval(() => {
        if (formik.values.customerId && formik.values.items.length > 0 && formik.values.items[0].productId) {
          draftMutation.mutate(formik.values);
        }
      }, 60000);
      return () => {
        if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      };
    }
  }, [isEdit, formik.values]);

  const handleProductSelect = (index: number, product: Product | null) => {
    if (!product) return;
    const newItems = [...formik.values.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      unitId: product.unitId,
      unitName: product.unitName,
      unitPrice: product.salePrice,
      stockAvailable: product.currentStock,
    };
    newItems[index].total = calculateItemTotal(newItems[index]);
    formik.setFieldValue('items', newItems);
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...formik.values.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = calculateItemTotal(newItems[index]);
    formik.setFieldValue('items', newItems);
  };

  const addItem = () => {
    formik.setFieldValue('items', [...formik.values.items, emptyItem()]);
  };

  const removeItem = (index: number) => {
    const newItems = formik.values.items.filter((_, i) => i !== index);
    if (newItems.length === 0) newItems.push(emptyItem());
    formik.setFieldValue('items', newItems);
  };

  const subtotal = formik.values.items.reduce((sum, item) => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const discountAmt = (qty * price * (item.discountPercent || 0)) / 100;
    return sum + (qty * price - discountAmt);
  }, 0);

  const discount = (subtotal * (formik.values.discountPercent || 0)) / 100;
  const afterDiscount = subtotal - discount;
  const tax = (afterDiscount * (formik.values.taxPercent || 0)) / 100;
  const total = afterDiscount + tax + (formik.values.shipping || 0);

  if (orderLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <FormikProvider value={formik}>
        <Form>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/sales/orders')}>
                  <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {isEdit ? 'Edit Sales Order' : 'New Sales Order'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!isEdit && (
                  <Button variant="outlined" onClick={() => draftMutation.mutate(formik.values)} disabled={draftMutation.isPending}>
                    Save Draft
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={formik.isSubmitting || saveMutation.isPending}
                >
                  {formik.isSubmitting || saveMutation.isPending ? <CircularProgress size={24} /> : 'Save Order'}
                </Button>
              </Box>
            </Box>

            {customerCreditWarning && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                {customerCreditWarning}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Order Info</Typography>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(c) => `${c.code} - ${c.name}`}
                      value={customers.find((c) => c.id === formik.values.customerId) || null}
                      onChange={(_, val) => formik.setFieldValue('customerId', val?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer *"
                          size="small"
                          fullWidth
                          margin="normal"
                          error={formik.touched.customerId && Boolean(formik.errors.customerId)}
                          helperText={formik.touched.customerId && formik.errors.customerId}
                        />
                      )}
                    />
                    <DatePicker
                      label="Order Date *"
                      value={formik.values.orderDate}
                      onChange={(val) => formik.setFieldValue('orderDate', val)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          margin: 'normal',
                          error: formik.touched.orderDate && Boolean(formik.errors.orderDate as any),
                          helperText: formik.touched.orderDate && (formik.errors.orderDate as any),
                        },
                      }}
                    />
                    <DatePicker
                      label="Due Date *"
                      value={formik.values.dueDate}
                      onChange={(val) => formik.setFieldValue('dueDate', val)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          margin: 'normal',
                          error: formik.touched.dueDate && Boolean(formik.errors.dueDate as any),
                          helperText: formik.touched.dueDate && (formik.errors.dueDate as any),
                        },
                      }}
                    />
                    <TextField
                      select
                      label="Branch *"
                      size="small"
                      fullWidth
                      margin="normal"
                      value={formik.values.branchId}
                      onChange={(e) => formik.setFieldValue('branchId', e.target.value)}
                      error={formik.touched.branchId && Boolean(formik.errors.branchId)}
                      helperText={formik.touched.branchId && formik.errors.branchId}
                    >
                      {branchesData?.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </TextField>
                    <TextField
                      label="Notes"
                      size="small"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={3}
                      value={formik.values.notes}
                      onChange={(e) => formik.setFieldValue('notes', e.target.value)}
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
                            <TableCell width={50}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {formik.values.items.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Autocomplete
                                  options={products}
                                  getOptionLabel={(p) => `${p.code} - ${p.name} (Stock: ${p.currentStock})`}
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
                                  error={item.quantity > item.stockAvailable && item.stockAvailable > 0}
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
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(item.total)}
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

                    {formik.errors.items && typeof formik.errors.items === 'string' && (
                      <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                        {formik.errors.items}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 300 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Subtotal:</Typography>
                          <Typography>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(subtotal)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography>Discount:</Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={formik.values.discountPercent}
                            onChange={(e) => formik.setFieldValue('discountPercent', Number(e.target.value))}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ width: 80 }}
                            slotProps={{
                              input: {
                                endAdornment: <Typography variant="caption">%</Typography>,
                              },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Discount Amount:</Typography>
                          <Typography>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(discount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography>Tax:</Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={formik.values.taxPercent}
                            onChange={(e) => formik.setFieldValue('taxPercent', Number(e.target.value))}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ width: 80 }}
                            slotProps={{
                              input: {
                                endAdornment: <Typography variant="caption">%</Typography>,
                              },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Tax Amount:</Typography>
                          <Typography>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(tax)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography>Shipping:</Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={formik.values.shipping}
                            onChange={(e) => formik.setFieldValue('shipping', Number(e.target.value))}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 120 }}
                          />
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" fontWeight="bold">Total:</Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(total)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

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
        </Form>
      </FormikProvider>
    </LocalizationProvider>
  );
};

export default SalesOrderForm;
