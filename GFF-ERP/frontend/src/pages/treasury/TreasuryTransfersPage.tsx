import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Add,
  Send,
  CheckCircle,
  Cancel,
  SwapHoriz,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { treasuryService } from '../../services/treasuryService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import type { TreasuryTransfer } from '../../types';

const transferSchema = Yup.object().shape({
  fromType: Yup.string().oneOf(['CASHBOX', 'BANK']).required('From type is required'),
  fromAccountId: Yup.string().required('From account is required'),
  toType: Yup.string().oneOf(['CASHBOX', 'BANK']).required('To type is required'),
  toAccountId: Yup.string().required('To account is required'),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  date: Yup.date().required('Date is required'),
  notes: Yup.string(),
});

const statusWorkflow: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
  DRAFT: { label: 'Draft', color: 'warning' },
  PENDING: { label: 'Pending Approval', color: 'info' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  COMPLETED: { label: 'Completed', color: 'success' },
};

const getWorkflowStep = (status: string): number => {
  switch (status) {
    case 'DRAFT': return 0;
    case 'PENDING': return 1;
    case 'APPROVED': return 1;
    case 'REJECTED': return 1;
    case 'COMPLETED': return 2;
    default: return 0;
  }
};

const TreasuryTransfersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TreasuryTransfer | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', paginationModel.page, paginationModel.pageSize, statusFilter],
    queryFn: () =>
      treasuryService.getTransfers({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        status: statusFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: treasuryService.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setOpen(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: treasuryService.approveTransfer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      treasuryService.rejectTransfer(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  });

  const columns: GridColDef<TreasuryTransfer>[] = [
    { field: 'transferNumber', headerName: 'Transfer #', width: 150 },
    {
      field: 'fromAccountName',
      headerName: 'From',
      width: 180,
      renderCell: (params: GridRenderCellParams<TreasuryTransfer>) => (
        <Box>
          <Typography variant="body2">{params.row.fromAccountName}</Typography>
          <Chip label={params.row.fromType} size="small" variant="outlined" />
        </Box>
      ),
    },
    {
      field: 'toAccountName',
      headerName: 'To',
      width: 180,
      renderCell: (params: GridRenderCellParams<TreasuryTransfer>) => (
        <Box>
          <Typography variant="body2">{params.row.toAccountName}</Typography>
          <Chip label={params.row.toType} size="small" variant="outlined" />
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<TreasuryTransfer>) =>
        formatCurrency(params.row.amount),
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params: GridRenderCellParams<TreasuryTransfer>) =>
        formatDate(params.row.date),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params: GridRenderCellParams<TreasuryTransfer>) => {
        const sw = statusWorkflow[params.row.status];
        return (
          <Chip
            label={sw?.label ?? params.row.status}
            color={sw?.color ?? 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 280,
      sortable: false,
      renderCell: (params: GridRenderCellParams<TreasuryTransfer>) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="text"
            onClick={() => setSelectedTransfer(params.row)}
          >
            Workflow
          </Button>
          {params.row.status === 'PENDING' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => approveMutation.mutate(params.row.id)}
                disabled={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() =>
                  rejectMutation.mutate({ id: params.row.id, reason: 'Rejected by user' })
                }
                disabled={rejectMutation.isPending}
              >
                Reject
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  const transfers = data?.data ?? [];
  const totalRows = data?.total ?? 0;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Treasury Transfers
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          New Transfer
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} mb={2}>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <DataGrid
            rows={transfers}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            rowCount={totalRows}
            paginationMode="server"
            loading={isLoading}
            disableRowSelectionOnClick
            density="compact"
            autoHeight
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SwapHoriz />
            Create Transfer
          </Box>
        </DialogTitle>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Formik
            initialValues={{
              fromType: 'CASHBOX' as 'CASHBOX' | 'BANK',
              fromAccountId: '',
              toType: 'BANK' as 'CASHBOX' | 'BANK',
              toAccountId: '',
              amount: '',
              date: new Date(),
              notes: '',
            }}
            validationSchema={transferSchema}
            onSubmit={(values) => {
              createMutation.mutate({
                ...values,
                amount: Number(values.amount),
                date: values.date.toISOString().split('T')[0],
              });
            }}
          >
            {({ values, setFieldValue, errors, touched }) => (
              <Form>
                <DialogContent>
                  {createMutation.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Failed to create transfer
                    </Alert>
                  )}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>From Type</InputLabel>
                        <Select
                          value={values.fromType}
                          label="From Type"
                          onChange={(e) => {
                            setFieldValue('fromType', e.target.value);
                            setFieldValue('fromAccountId', '');
                          }}
                        >
                          <MenuItem value="CASHBOX">Cashbox</MenuItem>
                          <MenuItem value="BANK">Bank</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        component={FormikTextField}
                        name="fromAccountId"
                        label="From Account ID"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>To Type</InputLabel>
                        <Select
                          value={values.toType}
                          label="To Type"
                          onChange={(e) => {
                            setFieldValue('toType', e.target.value);
                            setFieldValue('toAccountId', '');
                          }}
                        >
                          <MenuItem value="CASHBOX">Cashbox</MenuItem>
                          <MenuItem value="BANK">Bank</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        component={FormikTextField}
                        name="toAccountId"
                        label="To Account ID"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        component={FormikTextField}
                        name="amount"
                        label="Amount"
                        type="number"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Date"
                        value={values.date}
                        onChange={(val) => setFieldValue('date', val)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: touched.date && Boolean(errors.date),
                            helperText: touched.date && errors.date ? String(errors.date) : '',
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={FormikTextField}
                        name="notes"
                        label="Notes"
                        multiline
                        rows={2}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Send />}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Transfer'}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </LocalizationProvider>
      </Dialog>

      {selectedTransfer && (
        <Dialog
          open={!!selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Transfer Approval Workflow</DialogTitle>
          <DialogContent>
            <Stepper orientation="vertical" activeStep={getWorkflowStep(selectedTransfer.status)}>
              <Step completed={['PENDING', 'APPROVED', 'COMPLETED'].includes(selectedTransfer.status)}>
                <StepLabel>Draft Created</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    Transfer #{selectedTransfer.transferNumber} created on{' '}
                    {formatDate(selectedTransfer.createdAt)} by {selectedTransfer.createdBy}
                  </Typography>
                </StepContent>
              </Step>
              <Step
                completed={['APPROVED', 'COMPLETED'].includes(selectedTransfer.status)}
                active={selectedTransfer.status === 'PENDING'}
              >
                <StepLabel>
                  {selectedTransfer.status === 'REJECTED' ? 'Approval Rejected' : 'Pending Approval'}
                </StepLabel>
                <StepContent>
                  {selectedTransfer.approvedBy && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedTransfer.status === 'REJECTED' ? 'Rejected' : 'Approved'} by{' '}
                      {selectedTransfer.approvedBy} on {formatDate(selectedTransfer.approvedAt ?? '')}
                    </Typography>
                  )}
                </StepContent>
              </Step>
              <Step completed={selectedTransfer.status === 'COMPLETED'}>
                <StepLabel>Completed</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    Transfer amount: {formatCurrency(selectedTransfer.amount)}
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedTransfer(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default TreasuryTransfersPage;
