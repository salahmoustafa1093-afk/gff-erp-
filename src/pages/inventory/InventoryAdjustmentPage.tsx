import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, MenuItem, Paper, TextField, Typography, Autocomplete, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../app/api';
import { Warehouse, Product, AdjustmentReason } from '../types';

const adjustmentReasons: { value: AdjustmentReason; label: string }[] = [
  { value: 'DAMAGE', label: 'Damage' }, { value: 'EXPIRY', label: 'Expiry' }, { value: 'LOSS', label: 'Loss' },
  { value: 'FOUND', label: 'Found' }, { value: 'COUNT', label: 'Physical Count' }, { value: 'OTHER', label: 'Other' },
];

const InventoryAdjustmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(0);
  const [newQty, setNewQty] = useState<number | ''>('');
  const [reason, setReason] = useState<AdjustmentReason>('COUNT');
  const [notes, setNotes] = useState('');

  const { data: warehousesData } = useQuery({
    queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data as Warehouse[]; },
    queryKey: ['warehousesForAdjustment'],
  });

  const { data: productsData } = useQuery({
    queryFn: async () => { const response = await api.get('/products?active=true&pageSize=1000'); return response.data.data as Product[]; },
    queryKey: ['productsForAdjustment'],
  });

  const { data: currentStockData, refetch: refetchStock } = useQuery({
    queryKey: ['currentStock', warehouseId, productId],
    queryFn: async () => {
      if (!warehouseId || !productId) return null;
      const response = await api.get(`/inventory/stock?warehouseId=${warehouseId}&productId=${productId}`);
      return response.data as { quantity: number; unitCost: number };
    },
    enabled: Boolean(warehouseId && productId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        warehouseId,
        productId,
        currentQty: currentStockData?.quantity || 0,
        newQty: Number(newQty),
        difference: Number(newQty) - (currentStockData?.quantity || 0),
        unitCost: currentStockData?.unitCost || 0,
        reason,
        notes,
      };
      const response = await api.post('/inventory/adjustments', payload);
      return response.data;
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Adjustment created successfully', severity: 'success' });
      setTimeout(() => navigate('/inventory'), 1000);
    },
    onError: (error: any) => { setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to create adjustment', severity: 'error' }); },
  });

  const handleProductSelect = (pid: string) => {
    setProductId(pid);
    setNewQty('');
  };

  const handleWarehouseChange = (wid: string) => {
    setWarehouseId(wid);
    setProductId('');
    setNewQty('');
  };

  const warehouses = warehousesData || [];
  const products = productsData || [];
  const currentStock = currentStockData?.quantity || 0;
  const unitCost = currentStockData?.unitCost || 0;
  const difference = (Number(newQty) || 0) - currentStock;
  const differenceCost = difference * unitCost;
  const isValid = warehouseId && productId && newQty !== '' && !isNaN(Number(newQty)) && Number(newQty) >= 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/inventory')}><BackIcon /></IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">Stock Adjustment</Typography>
          </Box>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Adjustment Details</Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth size="small" label="Warehouse *" value={warehouseId} onChange={(e) => handleWarehouseChange(e.target.value)}>
                      <MenuItem value="">Select Warehouse</MenuItem>
                      {warehouses.map((w) => (<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(p) => `${p.code} - ${p.name}`}
                      value={products.find((p) => p.id === productId) || null}
                      onChange={(_, val) => handleProductSelect(val?.id || '')}
                      renderInput={(params) => <TextField {...params} label="Product *" size="small" fullWidth />}
                    />
                  </Grid>
                </Grid>

                {productId && warehouseId && (
                  <>
                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.main', color: 'white' }}>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>Current Quantity</Typography>
                          <Typography variant="h4" fontWeight="bold">{currentStock.toLocaleString()}</Typography>
                        </Paper>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'grey.500', color: 'white' }}>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>Difference</Typography>
                          <Typography variant="h4" fontWeight="bold">{difference > 0 ? '+' : ''}{difference.toLocaleString()}</Typography>
                        </Paper>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary">Difference Value</Typography>
                          <Typography variant="h4" fontWeight="bold" color={differenceCost > 0 ? 'success.main' : differenceCost < 0 ? 'error' : 'text.secondary'}>
                            {formatCurrency(differenceCost)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="New Quantity *"
                        type="number"
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value === '' ? '' : Number(e.target.value))}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ mb: 2 }}
                      />
                      <TextField select fullWidth size="small" label="Reason *" value={reason} onChange={(e) => setReason(e.target.value as AdjustmentReason)} sx={{ mb: 2 }}>
                        {adjustmentReasons.map((r) => (<MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>))}
                      </TextField>
                      <TextField fullWidth size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
                    </Box>
                  </>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                  <Button variant="outlined" onClick={() => navigate('/inventory')}>Cancel</Button>
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={!isValid || createMutation.isPending} onClick={() => createMutation.mutate()}>
                    {createMutation.isPending ? <CircularProgress size={24} /> : 'Create Adjustment'}
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default InventoryAdjustmentPage;
