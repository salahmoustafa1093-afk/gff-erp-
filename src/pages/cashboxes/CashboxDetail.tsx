import React, { useState, useRef } from 'react';
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  ArrowBack,
  Add,
  Receipt,
  Payment,
  PictureAsPdf,
  Print,
  FilterList,
  Today,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { cashboxService } from '../../services/cashboxService';
import { formatCurrency, formatDate, getStatusColor, printWindow } from '../../utils/formatters';
import type { Cashbox, CashboxTransaction } from '../../types';

const transactionSchema = Yup.object().shape({
  type: Yup.string().oneOf(['RECEIPT', 'PAYMENT']).required(),
  amount: Yup.number().positive().required(),
  date: Yup.date().required(),
  description: Yup.string().required(),
  reference: Yup.string(),
  category: Yup.string().required(),
});

const receiptCategories = [
  'Sales Collection',
  'Customer Payment',
  'Bank Withdrawal',
  'Inter-cashbox Transfer',
  'Refund',
  'Other Income',
];

const paymentCategories = [
  'Purchase Payment',
  'Supplier Payment',
  'Bank Deposit',
  'Inter-cashbox Transfer',
  'Expense',
  'Payroll',
  'Other',
];

const CashboxDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [reportDate, setReportDate] = useState<Date | null>(new Date());
  const [showReport, setShowReport] = useState(false);

  const { data: cashbox } = useQuery<Cashbox>({
    queryKey: ['cashbox', id],
    queryFn: () => cashboxService.getCashboxById(id!),
    enabled: !!id,
  });

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['cashbox-transactions', id, paginationModel.page, paginationModel.pageSize, typeFilter, dateFrom, dateTo],
    queryFn: () =>
      cashboxService.getTransactions(id!, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        type: typeFilter || undefined,
        dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
        dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
      }),
    enabled: !!id,
  });

  const { data: dailyReport } = useQuery({
    queryKey: ['cashbox-daily-report', id, reportDate],
    queryFn: () =>
      cashboxService.getDailyReport(id!, reportDate!.toISOString().split('T')[0]),
    enabled: !!id && !!reportDate && showReport,
  });

  const createMutation = useMutation({
    mutationFn: (values: Partial<CashboxTransaction>) =>
      cashboxService.createTransaction(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbox-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashbox'] });
      queryClient.invalidateQueries({ queryKey: ['cashbox-daily-report'] });
      setOpen(false);
    },
  });

  const transactions: CashboxTransaction[] = transactionsData?.data ?? [];

  const columns: GridColDef<CashboxTransaction>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 110,
      renderCell: (params: GridRenderCellParams<CashboxTransaction>) => formatDate(params.row.date),
    },
    { field: 'transactionNumber', headerName: 'Ref #', width: 120 },
    {
      field: 'type',
      headerName: 'Type',
      width: 90,
      renderCell: (params: GridRenderCellParams<CashboxTransaction>) => (
        <Chip
          label={params.row.type}
          size="small"
          color={params.row.type === 'RECEIPT' ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<CashboxTransaction>) =>
        formatCurrency(params.row.amount),
    },
    {
      field: 'runningBalance',
      headerName: 'Balance',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<CashboxTransaction>) => (
        <Typography fontWeight="medium">{formatCurrency(params.row.runningBalance)}</Typography>
      ),
    },
    { field: 'reference', headerName: 'Reference', width: 120 },
    { field: 'description', headerName: 'Description', width: 200, flex: 1 },
    { field: 'category', headerName: 'Category', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 90,
      renderCell: (params: GridRenderCellParams<CashboxTransaction>) => (
        <Chip label={params.row.status} size="small" color={getStatusColor(params.row.status)} />
      ),
    },
  ];

  const handlePrint = () => {
    if (printRef.current) {
      printWindow('cashbox-report-print');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/cashboxes')} variant="outlined" size="small">
              Back
            </Button>
            <Typography variant="h4" fontWeight="bold">
              {cashbox?.name ?? 'Cashbox Detail'}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<Receipt />}
              onClick={() => { setTxType('RECEIPT'); setOpen(true); }}
            >
              Receipt
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Payment />}
              onClick={() => { setTxType('PAYMENT'); setOpen(true); }}
            >
              Payment
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Code</Typography>
                <Typography variant="body1">{cashbox?.code}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Responsible</Typography>
                <Typography variant="body1">{cashbox?.responsible}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
                <Typography variant="body1">{cashbox?.branchName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Current Balance</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {formatCurrency(cashbox?.currentBalance ?? 0)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Transaction Register" />
          <Tab label="Daily Cash Report" />
        </Tabs>

        {tab === 0 && (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <FilterList fontSize="small" color="action" />
                  <Typography variant="subtitle2">Filters</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="RECEIPT">Receipt</MenuItem>
                        <MenuItem value="PAYMENT">Payment</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="From"
                      value={dateFrom}
                      onChange={setDateFrom}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="To"
                      value={dateTo}
                      onChange={setDateTo}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
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
              rowCount={transactionsData?.total ?? 0}
              paginationMode="server"
              loading={isLoading}
              disableRowSelectionOnClick
              density="compact"
              autoHeight
              getRowId={(row) => row.id}
            />
          </>
        )}

        {tab === 1 && (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="Report Date"
                      value={reportDate}
                      onChange={setReportDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }} display="flex" gap={1} justifyContent="flex-end">
                    <Button
                      variant="contained"
                      startIcon={<Today />}
                      onClick={() => setShowReport(true)}
                      size="small"
                    >
                      Generate Report
                    </Button>
                    {showReport && dailyReport && (
                      <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        size="small"
                      >
                        Print
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {showReport && dailyReport && (
              <div id="cashbox-report-print" ref={printRef}>
                <Card>
                  <CardContent sx={{ p: 4 }}>
                    <Box textAlign="center" mb={3}>
                      <Typography variant="h5" fontWeight="bold">
                        Daily Cash Report
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        {cashbox?.name} - {formatDate(reportDate)}
                      </Typography>
                    </Box>

                    <Grid container spacing={3} mb={3}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">Opening Balance</Typography>
                            <Typography variant="h6">{formatCurrency(dailyReport.openingBalance)}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">Receipts</Typography>
                            <Typography variant="h6" color="success.main">{formatCurrency(dailyReport.receipts)}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">Payments</Typography>
                            <Typography variant="h6" color="error.main">{formatCurrency(dailyReport.payments)}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">Closing Balance</Typography>
                            <Typography variant="h6" fontWeight="bold">{formatCurrency(dailyReport.closingBalance)}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom>Transactions</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Time</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Reference</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailyReport.transactions.map((tx: CashboxTransaction) => (
                            <TableRow key={tx.id}>
                              <TableCell>{formatDate(tx.date)}</TableCell>
                              <TableCell>
                                <Chip label={tx.type} size="small" color={tx.type === 'RECEIPT' ? 'success' : 'error'} />
                              </TableCell>
                              <TableCell>{tx.reference ?? '-'}</TableCell>
                              <TableCell>{tx.description}</TableCell>
                              <TableCell>{tx.category}</TableCell>
                              <TableCell align="right">{formatCurrency(tx.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {txType === 'RECEIPT' ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Receipt color="success" /> New Receipt
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <Payment color="error" /> New Payment
              </Box>
            )}
          </DialogTitle>
          <Formik
            initialValues={{
              type: txType,
              amount: '',
              date: new Date(),
              description: '',
              reference: '',
              category: '',
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
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={values.category}
                          label="Category"
                          onChange={(e) => setFieldValue('category', e.target.value)}
                        >
                          {(txType === 'RECEIPT' ? receiptCategories : paymentCategories).map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
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
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CashboxDetail;
