import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Paper, Step, StepLabel, Stepper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, useTheme, Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon, Print as PrintIcon, Save as SaveIcon, ArrowBack as BackIcon,
  CheckCircle as ApproveIcon, BarChart as VarianceIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { Warehouse, PhysicalCount, PhysicalCountItem, CountStatus } from '../types';

const statusConfig: Record<CountStatus, { color: string; label: string }> = {
  DRAFT: { color: '#9e9e9e', label: 'Draft' },
  IN_PROGRESS: { color: '#ff9800', label: 'In Progress' },
  COMPLETED: { color: '#2196f3', label: 'Completed' },
  APPROVED: { color: '#4caf50', label: 'Approved' },
  CANCELLED: { color: '#f44336', label: 'Cancelled' },
};

type WizardStep = 'setup' | 'count' | 'review';

const PhysicalCountPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<WizardStep>('setup');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: countsData, isLoading, refetch } = useQuery({
    queryKey: ['physicalCounts'],
    queryFn: async () => { const response = await api.get('/inventory/counts?pageSize=50'); return response.data.data as PhysicalCount[]; },
  });

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Physical Counts</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<VarianceIcon />} onClick={() => navigate('/inventory/counts/variances')}>Variances</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>New Count</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Count #</TableCell>
                <TableCell sx={{ color: 'white' }}>Warehouse</TableCell>
                <TableCell sx={{ color: 'white' }}>Category</TableCell>
                <TableCell sx={{ color: 'white' }}>Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Items</TableCell>
                <TableCell sx={{ color: 'white' }}>Variance</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!countsData || countsData.length === 0) && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No count records</Typography></TableCell></TableRow>
              )}
              {countsData?.map((count) => {
                const totalVariance = count.items?.reduce((s, i) => s + Math.abs(i.variance), 0) || 0;
                return (
                  <TableRow key={count.id} hover>
                    <TableCell fontWeight="medium">{count.countNumber}</TableCell>
                    <TableCell>{count.warehouseName}</TableCell>
                    <TableCell>{count.categoryName || 'All'}</TableCell>
                    <TableCell>{format(parseISO(count.countDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Chip label={statusConfig[count.status]?.label || count.status} size="small"
                        sx={{ backgroundColor: (statusConfig[count.status]?.color || '#9e9e9e') + '20', color: statusConfig[count.status]?.color || '#9e9e9e', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{count.items?.length || 0}</TableCell>
                    <TableCell><Typography color={totalVariance > 0 ? 'warning.main' : 'success.main'} fontWeight="medium">{totalVariance.toLocaleString()}</Typography></TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => navigate(`/inventory/counts/${count.id}`)}>View</Button>
                      {count.status === 'IN_PROGRESS' && (
                        <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => navigate(`/inventory/counts/${count.id}/enter`)}>Enter</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {showCreateDialog && (
        <CreateCountDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} onSuccess={() => { refetch(); setShowCreateDialog(false); }} />
      )}
    </Box>
  );
};

interface CreateCountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCountDialog: React.FC<CreateCountDialogProps> = ({ open, onClose, onSuccess }) => {
  const [warehouseId, setWarehouseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [countDate, setCountDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');

  const { data: warehousesData } = useQuery({
    queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data as Warehouse[]; },
    queryKey: ['warehousesForCount'],
  });

  const { data: categoriesData } = useQuery({
    queryFn: async () => { const response = await api.get('/products/categories?active=true'); return response.data.data as { id: string; name: string }[]; },
    queryKey: ['categoriesForCount'],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { warehouseId, categoryId: categoryId || null, countDate: countDate ? format(countDate, 'yyyy-MM-dd') : null, notes };
      await api.post('/inventory/counts', payload);
    },
    onSuccess,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Count Sheet</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField select fullWidth size="small" label="Warehouse *" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <MenuItem value="">Select</MenuItem>
              {warehousesData?.map((w) => (<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField select fullWidth size="small" label="Category (optional)" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <MenuItem value="">All Categories</MenuItem>
              {categoriesData?.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <DatePicker label="Count Date *" value={countDate} onChange={setCountDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!warehouseId || !countDate || createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Count Sheet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhysicalCountPage;
