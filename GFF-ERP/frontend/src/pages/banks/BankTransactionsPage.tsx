import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Add, ArrowBack, FilterList } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { bankService } from '../../services/bankService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import type { BankTransaction, BankAccount } from '../../types';

const transactionSchema = Yup.object().shape({
  type: Yup.string().oneOf(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']).required(),
  amount: Yup.number().positive().required(),
  date: Yup.date().required(),
  description: Yup.string().required(),
  reference: Yup.string(),
});

const BankTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const { data: account } = useQuery<BankAccount>({
    queryKey: ['bank-account', id],
    queryFn: () => bankService.getAccountById(id!),
    enabled: !!id,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['bank-transactions', id, paginationModel.page, paginationModel.pageSize, typeFilter, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      bankService.getTransactions(id!, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
        dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
      }),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: Partial<BankTransaction>) => bankService.createTransaction(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      setOpen(false);
    },
  });

  const columns: GridColDef<BankTransaction>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params: GridRenderCellParams<BankTransaction>) => formatDate(params.row.date),
    },
    {
      field: 'transactionNumber',
      headerName: 'Ref #',
      width: 130,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 110,
      renderCell: (params: GridRenderCellParams<BankTransaction>) => (
        <Chip
          label={params.row.type}
          size="small"
          color={
            params.row.type === 'DEPOSIT'
              ? 'success'
              : params.row.type === 'WITHDRAWAL'
                ? 'error'
                : 'info'
          }
        />
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<BankTransaction>) =>
        formatCurrency(params.row.amount),
    },
    {
      field: 'runningBalance',
      headerName: 'Balance',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<BankTransaction>) =>
        formatCurrency(params.row.runningBalance),
    },
    { field: 'reference', headerName: 'Reference', width: 130 },
    { field: 'description', headerName: 'Description', width: 200, flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams<BankTransaction>) => (
        <Chip
          label={params.row.status}
          size="small"
          color={getStatusColor(params.row.status)}
        />
      ),
    },
    {
      field: 'isReconciled',
      headerName: 'Reconciled',
      width: 100,
      renderCell: (params: GridRenderCellParams<BankTransaction>) => (
        <Chip
          label={params.row.isReconciled ? 'Yes' : 'No'}
          size="small"
          color={params.row.isReconciled ? 'success' : 'default'}
          variant={params.row.isReconciled ? 'filled' : 'outlined'}
        />
      ),
    },
  ];

  const transactions: BankTransaction[] = data?.data ?? [];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/banks')} variant="outlined" size="small">
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold">
            {account?.name ?? 'Bank Transactions'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Transaction
        </Button>
      </Box>

      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Account Number</Typography>
            <Typography variant="body1">{account?.accountNumber ?? '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Current Balance</Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {formatCurrency(account?.currentBalance ?? 0)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Opening Balance</Typography>
            <Typography variant="body1">{formatCurrency(account?.openingBalance ?? 0)}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/banks/${id}/reconciliation`)}
              >
                Reconciliation
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterList fontSize="small" color="action" />
            <Typography variant="subtitle2">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DEPOSIT">Deposit</MenuItem>
                  <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="CLEARED">Cleared</MenuItem>
                  <MenuItem value="BOUNCED">Bounced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="To"
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataGrid
        rows={transactions}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100]}
        rowCount={data?.total ?? 0}
        paginationMode="server"
        loading={isLoading}
        disableRowSelectionOnClick
        density="compact"
        autoHeight
        getRowId={(row) => row.id}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Transaction</DialogTitle>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Formik
            initialValues={{
              type: 'DEPOSIT' as 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER',
              amount: '',
              date: new Date(),
              description: '',
              reference: '',
            }}
            validationSchema={transactionSchema}
            onSubmit={(values) => {
              createMutation.mutate({
                ...values,
                amount: Number(values.amount),
                date: values.date.toISOString().split('T')[0],
              });
            }}
          >
            {({ values, setFieldValue }) => (
              <Form>
                <DialogContent>
                  {createMutation.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>Failed to create transaction</Alert>
                  )}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={values.type}
                          label="Type"
                          onChange={(e) => setFieldValue('type', e.target.value)}
                        >
                          <MenuItem value="DEPOSIT">Deposit</MenuItem>
                          <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
                          <MenuItem value="TRANSFER">Transfer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={FormikTextField} name="amount" label="Amount" type="number" fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Date"
                        value={values.date}
                        onChange={(val) => setFieldValue('date', val)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={FormikTextField} name="reference" label="Reference" fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field component={FormikTextField} name="description" label="Description" multiline rows={2} fullWidth required />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </LocalizationProvider>
      </Dialog>
    </Box>
  );
};

export default BankTransactionsPage;
