import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { SalesReturn, SalesReturnItem, SalesOrder, ReturnStatus, ListResponse } from '../types';

const statusConfig: Record<ReturnStatus, { color: string; label: string }> = {
  DRAFT: { color: '#9e9e9e', label: 'Draft' },
  PENDING: { color: '#ff9800', label: 'Pending' },
  APPROVED: { color: '#2196f3', label: 'Approved' },
  RECEIVED: { color: '#4caf50', label: 'Received' },
  REFUNDED: { color: '#2e7d32', label: 'Refunded' },
  CANCELLED: { color: '#f44336', label: 'Cancelled' },
};

const returnReasons = ['DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESC', 'EXPIRED', 'DAMAGED', 'CUSTOMER_CHANGED_MIND', 'OTHER'];

const SalesReturnsPage: React.FC = () => {
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'returnDate', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const fetchReturns = useCallback(async (): Promise<ListResponse<SalesReturn>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) {
      params.append('sortField', sortModel[0].field);
      params.append('sortDir', sortModel[0].sort || 'desc');
    }
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);

    const response = await api.get(`/sales/returns?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, statusFilter]);

  const { data, isLoading, refetch } = useQuery<ListResponse<SalesReturn>>({
    queryKey: ['salesReturns', paginationModel, sortModel, searchQuery, statusFilter],
    queryFn: fetchReturns,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sales/returns/${id}`);
    },
    onSuccess: () => refetch(),
  });

  const columns: GridColDef[] = [
    {
      field: 'returnNumber',
      headerName: 'Return #',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary" sx={{ cursor: 'pointer' }}>
          {params.value}
        </Typography>
      ),
    },
    { field: 'customerName', headerName: 'Customer', width: 160 },
    { field: 'orderNumber', headerName: 'Order #', width: 120 },
    {
      field: 'returnDate',
      headerName: 'Return Date',
      width: 120,
      valueFormatter: (value: string) => format(parseISO(value), 'dd/MM/yyyy'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={statusConfig[params.value as ReturnStatus]?.label || params.value}
          size="small"
          sx={{
            backgroundColor: statusConfig[params.value as ReturnStatus]?.color + '20',
            color: statusConfig[params.value as ReturnStatus]?.color,
            fontWeight: 600,
          }}
        />
      ),
    },
    { field: 'reason', headerName: 'Reason', width: 130 },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setActionAnchorEl(e.currentTarget); setSelectedReturnId(params.row.id); }}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const returns = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Sales Returns
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={() => {}}>
              Export
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>
              New Return
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search return # or customer..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 260 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Status</MenuItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </TextField>
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>

          <DataGrid
            rows={returns}
            columns={columns}
            rowCount={totalRows}
            loading={isLoading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            onSortModelChange={setSortModel}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationMode="server"
            sortingMode="server"
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/sales/returns/${params.id}`)}
          />
        </Paper>

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={() => setActionAnchorEl(null)}
        >
          <MenuItem onClick={() => { selectedReturnId && navigate(`/sales/returns/${selectedReturnId}`); setActionAnchorEl(null); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View
          </MenuItem>
          <MenuItem
            onClick={() => { selectedReturnId && deleteMutation.mutate(selectedReturnId); setActionAnchorEl(null); }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {showCreateDialog && (
          <CreateReturnDialog
            open={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => { refetch(); setShowCreateDialog(false); }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

interface CreateReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateReturnDialog: React.FC<CreateReturnDialogProps> = ({ open, onClose, onSuccess }) => {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [returnItems, setReturnItems] = useState<Array<{ itemId: string; productId: string; productName: string; maxQty: number; returnQty: number; unitPrice: number; reason: string }>>([]);
  const [returnDate, setReturnDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');

  const { data: ordersData } = useQuery({
    queryKey: ['salesOrdersForReturn'],
    queryFn: async () => {
      const response = await api.get('/sales/orders?status=DELIVERED,INVOICED&pageSize=100');
      return response.data.data as SalesOrder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        orderId: selectedOrder?.id,
        returnDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : null,
        notes,
        items: returnItems
          .filter((item) => item.returnQty > 0)
          .map((item) => ({
            orderItemId: item.itemId,
            productId: item.productId,
            quantity: item.returnQty,
            unitPrice: item.unitPrice,
            reason: item.reason,
          })),
      };
      await api.post('/sales/returns', payload);
    },
    onSuccess,
  });

  const handleOrderSelect = (order: SalesOrder | null) => {
    setSelectedOrder(order);
    if (order?.items) {
      setReturnItems(
        order.items.map((item) => ({
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          maxQty: item.quantity - item.deliveredQty,
          returnQty: 0,
          unitPrice: item.unitPrice,
          reason: '',
        }))
      );
    }
  };

  const updateReturnQty = (itemId: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, returnQty: Math.min(Math.max(0, qty), item.maxQty) } : item))
    );
  };

  const updateReason = (itemId: string, reason: string) => {
    setReturnItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, reason } : item)));
  };

  const totalReturn = returnItems.reduce((sum, item) => sum + item.returnQty * item.unitPrice, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Sales Return</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              options={ordersData || []}
              getOptionLabel={(o) => `${o.orderNumber} - ${o.customerName}`}
              value={selectedOrder}
              onChange={(_, val) => handleOrderSelect(val)}
              renderInput={(params) => <TextField {...params} label="Select Order *" size="small" fullWidth />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Return Date *"
              value={returnDate}
              onChange={setReturnDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
        </Grid>

        {selectedOrder && (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Return Qty *</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnItems.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell>
                        <Typography fontWeight="medium">{item.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Max: {item.maxQty}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.maxQty}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.returnQty}
                          onChange={(e) => updateReturnQty(item.itemId, Number(e.target.value))}
                          inputProps={{ min: 0, max: item.maxQty, step: 1 }}
                          sx={{ width: 80 }}
                          error={item.returnQty > item.maxQty}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={item.reason}
                          onChange={(e) => updateReason(item.itemId, e.target.value)}
                          sx={{ minWidth: 140 }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {returnReasons.map((r) => (
                            <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TextField
              label="Notes"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Return: {formatCurrency(totalReturn)}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => createMutation.mutate()}
          disabled={!selectedOrder || returnItems.filter((i) => i.returnQty > 0).length === 0 || createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Return'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SalesReturnsPage;
