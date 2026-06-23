import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Receipt as InvoiceIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ShoppingCart as OrderIcon,
  PendingActions as PendingIcon,
  Warning as OverdueIcon,
  AttachMoney as MoneyIcon,
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
import { format, isAfter, parseISO } from 'date-fns';
import api from '../../app/api';
import { SalesOrder, SalesOrderStatus, ListResponse } from '../types';

const statusConfig: Record<SalesOrderStatus, { color: string; label: string }> = {
  DRAFT: { color: '#9e9e9e', label: 'Draft' },
  PENDING: { color: '#ff9800', label: 'Pending' },
  CONFIRMED: { color: '#2196f3', label: 'Confirmed' },
  SHIPPED: { color: '#9c27b0', label: 'Shipped' },
  DELIVERED: { color: '#4caf50', label: 'Delivered' },
  INVOICED: { color: '#00bcd4', label: 'Invoiced' },
  PAID: { color: '#2e7d32', label: 'Paid' },
  CANCELLED: { color: '#f44336', label: 'Cancelled' },
};

const SalesOrdersPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'orderDate', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (): Promise<ListResponse<SalesOrder>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) {
      params.append('sortField', sortModel[0].field);
      params.append('sortDir', sortModel[0].sort || 'desc');
    }
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    if (branchFilter) params.append('branchId', branchFilter);
    if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));

    const response = await api.get(`/sales/orders?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, statusFilter, branchFilter, fromDate, toDate]);

  const { data, isLoading, error, refetch } = useQuery<ListResponse<SalesOrder>>({
    queryKey: ['salesOrders', paginationModel, sortModel, searchQuery, statusFilter, branchFilter, fromDate, toDate],
    queryFn: fetchOrders,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['salesOrdersSummary'],
    queryFn: async () => {
      const response = await api.get('/sales/orders/summary');
      return response.data;
    },
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches?active=true');
      return response.data;
    },
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    if (branchFilter) params.append('branchId', branchFilter);
    if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));

    const response = await api.get(`/sales/orders/export?${params.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      await api.delete(`/sales/orders/${id}`);
      refetch();
    }
  };

  const handleCreateInvoice = async (orderId: string) => {
    try {
      const response = await api.post(`/sales/orders/${orderId}/invoice`);
      navigate(`/sales/invoices/${response.data.id}`);
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
  };

  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: 'Order #',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary" sx={{ cursor: 'pointer' }}>
          {params.value}
        </Typography>
      ),
    },
    { field: 'customerName', headerName: 'Customer', width: 180 },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      width: 120,
      valueFormatter: (value: string) => format(parseISO(value), 'dd/MM/yyyy'),
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 120,
      valueFormatter: (value: string) => format(parseISO(value), 'dd/MM/yyyy'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={statusConfig[params.value as SalesOrderStatus]?.label || params.value}
          size="small"
          sx={{
            backgroundColor: statusConfig[params.value as SalesOrderStatus]?.color + '20',
            color: statusConfig[params.value as SalesOrderStatus]?.color,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value),
    },
    {
      field: 'paid',
      headerName: 'Paid',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value),
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 130,
      type: 'number',
      renderCell: (params) => {
        const row = params.row as SalesOrder;
        const isOverdue = row.balance > 0 && row.dueDate && isAfter(new Date(), parseISO(row.dueDate));
        return (
          <Typography
            variant="body2"
            color={isOverdue ? 'error' : 'inherit'}
            fontWeight={isOverdue ? 'bold' : 'normal'}
          >
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(params.value as number)}
          </Typography>
        );
      },
    },
    { field: 'branchName', headerName: 'Branch', width: 130 },
    { field: 'salesRepName', headerName: 'Sales Rep', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleActionClick(e, params.row.id); }}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const orders = data?.data || [];
  const totalRows = data?.total || 0;

  const summary = summaryData || { totalOrders: 0, totalAmount: 0, pendingCount: 0, overdueCount: 0 };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Sales Orders
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/orders/new')}
            >
              New Order
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Orders
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {summary.totalOrders?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                  <OrderIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(summary.totalAmount || 0)}
                    </Typography>
                  </Box>
                  <MoneyIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {summary.pendingCount?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                  <PendingIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Overdue
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="error">
                      {summary.overdueCount?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                  <OverdueIcon color="error" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search by order # or customer..."
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
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branchesData?.data?.map((b: { id: string; name: string }) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label="From"
              value={fromDate}
              onChange={setFromDate}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />
            <DatePicker
              label="To"
              value={toDate}
              onChange={setToDate}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>

          <DataGrid
            rows={orders}
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
            onRowClick={(params: GridRowParams) => navigate(`/sales/orders/${params.id}`)}
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': { backgroundColor: theme.palette.action.hover },
              },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No orders found</Typography>
                </Box>
              ),
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
          <MenuItem onClick={() => { selectedOrderId && navigate(`/sales/orders/${selectedOrderId}`); setActionAnchorEl(null); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View
          </MenuItem>
          <MenuItem onClick={() => { selectedOrderId && navigate(`/sales/orders/${selectedOrderId}/edit`); setActionAnchorEl(null); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { selectedOrderId && handleCreateInvoice(selectedOrderId); setActionAnchorEl(null); }}>
            <InvoiceIcon fontSize="small" sx={{ mr: 1 }} /> Create Invoice
          </MenuItem>
          <MenuItem onClick={() => { selectedOrderId && handleDelete(selectedOrderId); setActionAnchorEl(null); }} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesOrdersPage;
