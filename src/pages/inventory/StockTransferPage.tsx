import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Autocomplete, Snackbar, Alert, CircularProgress, MenuItem, Chip,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import api from '../../app/api';
import { Warehouse, Product } from '../types';

interface TransferItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  availableQty: number;
  quantity: number;
  notes: string;
}

const StockTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferDate, setTransferDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);

  const { data: warehousesData } = useQuery({
    queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data as Warehouse[]; },
    queryKey: ['warehousesForTransfer'],
  });

  const { data: productsData } = useQuery({
    queryFn: async () => { const response = await api.get('/products?active=true&pageSize=1000'); return response.data.data as Product[]; },
    queryKey: ['productsForTransfer'],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fromWarehouseId, toWarehouseId,
        transferDate: transferDate ? format(transferDate, 'yyyy-MM-dd') : null,
        notes,
        items: items.filter((i) => i.productId && i.quantity > 0).map((i) => ({ productId: i.productId, quantity: i.quantity, notes: i.notes })),
      };
      const response = await api.post('/inventory/transfers', payload);
      return response.data;
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Stock transfer created successfully', severity: 'success' });
      setTimeout(() => navigate('/inventory'), 1000);
    },
    onError: (error: any) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to create transfer', severity: 'error' }); },
  });

  const addItem = () => {
    setItems([...items, { id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, productId: '', productCode: '', productName: '', availableQty: 0, quantity: 1, notes: '' }]);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    if (newItems.length === 0) setItems([{ id: `new-${Date.now()}`, productId: '', productCode: '', productName: '', availableQty: 0, quantity: 1, notes: '' }]);
    else setItems(newItems);
  };

  const updateItemProduct = (itemId: string, product: Product | null) => {
    if (!product) return;
    setItems(items.map((i) => i.id === itemId ? { ...i, productId: product.id, productCode: product.code, productName: product.name, availableQty: product.currentStock, quantity: Math.min(1, product.currentStock) } : i));
  };

  const updateItemQty = (itemId: string, qty: number) => {
    setItems(items.map((i) => i.id === itemId ? { ...i, quantity: Math.min(Math.max(1, qty), i.availableQty) } : i));
  };

  const products = productsData || [];
  const warehouses = warehousesData || [];
  const isValid = fromWarehouseId && toWarehouseId && fromWarehouseId !== toWarehouseId && items.some((i) => i.productId && i.quantity > 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/inventory')}><BackIcon /></IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">New Stock Transfer</Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Transfer Details</Typography>
                <TextField select fullWidth size="small" label="From Warehouse *" value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} margin="normal">
                  <MenuItem value="">Select</MenuItem>
                  {warehouses.map((w) => (<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
                </TextField>
                <TextField select fullWidth size="small" label="To Warehouse *" value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} margin="normal"
                  error={toWarehouseId === fromWarehouseId && toWarehouseId !== ''}
                  helperText={toWarehouseId === fromWarehouseId && toWarehouseId !== '' ? 'Cannot transfer to same warehouse' : ''}>
                  <MenuItem value="">Select</MenuItem>
                  {warehouses.map((w) => (<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
                </TextField>
                <DatePicker label="Transfer Date *" value={transferDate} onChange={setTransferDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true, margin: 'normal' } }} />
                <TextField fullWidth size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} margin="normal" multiline rows={3} />

                {fromWarehouseId && toWarehouseId && (
                  <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">Transfer Route</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {warehouses.find((w) => w.id === fromWarehouseId)?.name}
                      <Box component="span" sx={{ mx: 1, color: 'primary.main' }}>→</Box>
                      {warehouses.find((w) => w.id === toWarehouseId)?.name}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Transfer Items</Typography>
                  <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addItem}>Add Item</Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Product</TableCell><TableCell align="right">Available</TableCell><TableCell align="right">Qty</TableCell><TableCell>Notes</TableCell><TableCell width={50} /></TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Autocomplete
                              options={products}
                              getOptionLabel={(p) => `${p.code} - ${p.name} (Stock: ${p.currentStock})`}
                              value={products.find((p) => p.id === item.productId) || null}
                              onChange={(_, val) => updateItemProduct(item.id, val)}
                              renderInput={(params) => <TextField {...params} size="small" placeholder="Select product" fullWidth />}
                              size="small" sx={{ minWidth: 280 }}
                            />
                          </TableCell>
                          <TableCell align="right">{item.availableQty.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <TextField type="number" size="small" value={item.quantity}
                              onChange={(e) => updateItemQty(item.id, Number(e.target.value))}
                              inputProps={{ min: 1, max: item.availableQty }} sx={{ width: 80 }}
                              error={item.quantity > item.availableQty} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={item.notes} onChange={(e) => setItems(items.map((i) => i.id === item.id ? { ...i, notes: e.target.value } : i))} placeholder="Notes" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeItem(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total Items: {items.filter((i) => i.quantity > 0).reduce((s, i) => s + i.quantity, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  <Button variant="outlined" onClick={() => navigate('/inventory')}>Cancel</Button>
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={!isValid || createMutation.isPending} onClick={() => createMutation.mutate()}>
                    {createMutation.isPending ? <CircularProgress size={24} /> : 'Create Transfer'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default StockTransferPage;
