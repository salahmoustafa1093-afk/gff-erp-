import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
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
  useTheme,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isAfter } from 'date-fns';
import api from '../../app/api';
import { SalesInvoice, InvoiceStatus, PaymentMethod, ListResponse } from '../types';

const statusConfig: Record<InvoiceStatus, { color: string; label: string }> = {
  DRAFT: { color: '#9e9e9e', label: 'Draft' },
  SENT: { color: '#2196f3', label: 'Sent' },
  PAID: { color: '#4caf50', label: 'Paid' },
  PARTIAL: { color: '#ff9800', label: 'Partial' },
  OVERDUE: { color: '#f44336', label: 'Overdue' },
  CANCELLED: { color: '#9e9e9e', label: 'Cancelled' },
};

const paymentMethods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'ONLINE'];

const SalesInvoicesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'invoiceDate', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date(), method: 'CASH' as PaymentMethod, reference: '', notes: '' });

  const fetchInvoices = useCallback(async (): Promise<ListResponse<SalesInvoice>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) {
      params.append('sortField', sortModel[0].field);
      params.append('sortDir', sortModel[0].sort || 'desc');
    }
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));

    const response = await api.get(`/sales/invoices?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, statusFilter, fromDate, toDate]);

  const { data, isLoading, error, refetch } = useQuery<ListResponse<SalesInvoice>>({
    queryKey: ['salesInvoices', paginationModel, sortModel, searchQuery, statusFilter, fromDate, toDate],
    queryFn: fetchInvoices,
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: string; data: typeof paymentForm }) => {
      const response = await api.post(`/sales/invoices/${invoiceId}/payments`, {
        amount: Number(data.amount),
        paymentDate: format(data.paymentDate, 'yyyy-MM-dd'),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      setPaymentDialog(false);
      setPaymentForm({ amount: '', paymentDate: new Date(), method: 'CASH', reference: '', notes: '' });
      refetch();
    },
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    const response = await api.get(`/sales/invoices/export?${params.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, invoice: SalesInvoice) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const openPaymentDialog = () => {
    if (selectedInvoice) {
      setPaymentForm({
        amount: String(selectedInvoice.balance),
        paymentDate: new Date(),
        method: 'CASH',
        reference: '',
        notes: '',
      });
    }
    setPaymentDialog(true);
    setActionAnchorEl(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Invoice #',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary" sx={{ cursor: 'pointer' }}>
          {params.value}
        </Typography>
      ),
    },
    { field: 'customerName', headerName: 'Customer', width: 180 },
    {
      field: 'invoiceDate',
      headerName: 'Invoice Date',
      width: 120,
      valueFormatter: (value: string) => format(parseISO(value), 'dd/MM/yyyy'),
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 120,
      valueFormatter: (value: string) => format(parseISO(value), 'dd/MM/yyyy'),
      renderCell: (params) => {
        const row = params.row as SalesInvoice;
        const isOverdue = row.status !== 'PAID' && row.status !== 'CANCELLED' && isAfter(new Date(), parseISO(row.dueDate));
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color={isOverdue ? 'error' : 'inherit'} fontWeight={isOverdue ? 'bold' : 'normal'}>
              {format(parseISO(params.value as string), 'dd/MM/yyyy')}
            </Typography>
            {isOverdue && <WarningIcon fontSize="small" color="error" />}
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={statusConfig[params.value as InvoiceStatus]?.label || params.value}
          size="small"
          sx={{
            backgroundColor: statusConfig[params.value as InvoiceStatus]?.color + '20',
            color: statusConfig[params.value as InvoiceStatus]?.color,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'paid',
      headerName: 'Paid',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color={(params.value as number) > 0 ? 'error' : 'success'} fontWeight="medium">
          {formatCurrency(params.value as number)}
        </Typography>
      ),
    },
    { field: 'branchName', headerName: 'Branch', width: 120 },
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleActionClick(e, params.row); }}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const invoices = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Sales Invoices
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>
              Export
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search invoice # or customer..."
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
            <DatePicker label="From" value={fromDate} onChange={setFromDate} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
            <DatePicker label="To" value={toDate} onChange={setToDate} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>

          <DataGrid
            rows={invoices}
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
            onRowClick={(params: GridRowParams) => navigate(`/sales/invoices/${params.id}`)}
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': { backgroundColor: theme.palette.action.hover },
              },
            }}
          />
        </Paper>

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={() => setActionAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => { selectedInvoice && navigate(`/sales/invoices/${selectedInvoice.id}`); setActionAnchorEl(null); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View
          </MenuItem>
          <MenuItem onClick={() => { selectedInvoice && window.open(`/sales/invoices/${selectedInvoice.id}/print`, '_blank'); setActionAnchorEl(null); }}>
            <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print
          </MenuItem>
          {selectedInvoice && selectedInvoice.balance > 0 && selectedInvoice.status !== 'CANCELLED' && (
            <MenuItem onClick={openPaymentDialog}>
              <PaymentIcon fontSize="small" sx={{ mr: 1 }} /> Record Payment
            </MenuItem>
          )}
        </Menu>

        <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Invoice: {selectedInvoice.invoiceNumber}</Typography>
                <Typography variant="body2" color="text.secondary">Customer: {selectedInvoice.customerName}</Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  Balance Due: {formatCurrency(selectedInvoice.balance)}
                </Typography>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Amount *"
                  type="number"
                  fullWidth
                  size="small"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Payment Date *"
                  value={paymentForm.paymentDate}
                  onChange={(val) => val && setPaymentForm({ ...paymentForm, paymentDate: val })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Payment Method *"
                  fullWidth
                  size="small"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Reference #"
                  fullWidth
                  size="small"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Notes"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => selectedInvoice && paymentMutation.mutate({ invoiceId: selectedInvoice.id, data: paymentForm })}
              disabled={!paymentForm.amount || Number(paymentForm.amount) <= 0 || paymentMutation.isPending}
            >
              {paymentMutation.isPending ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SalesInvoicesPage;
