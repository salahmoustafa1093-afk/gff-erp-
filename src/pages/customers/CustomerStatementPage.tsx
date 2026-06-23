import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  FileDownload as ExportIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../../app/api';
import { Customer, CustomerStatementRow } from '../types';

const CustomerStatementPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [fromDate, setFromDate] = useState<Date | null>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date | null>(endOfMonth(new Date()));

  const { data: customer } = useQuery({
    queryKey: ['customerForStatement', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data as Customer;
    },
    enabled: Boolean(id),
  });

  const { data: statement, isLoading, refetch } = useQuery({
    queryKey: ['customerStatement', id, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
      if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));
      const response = await api.get(`/customers/${id}/statement?${params.toString()}`);
      return response.data as { openingBalance: number; closingBalance: number; rows: CustomerStatementRow[] };
    },
    enabled: Boolean(id && fromDate && toDate),
  });

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent || !customer) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Customer Statement - ${customer.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #2e7d32; }
        .customer-info { display: flex; justify-content: space-between; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #4caf50; color: white; }
        .totals { margin-top: 10px; text-align: right; font-weight: bold; }
        .debit { color: #d32f2f; }
        .credit { color: #2e7d32; }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style></head>
      <body>${printContent}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));
    const response = await api.get(`/customers/${id}/statement/export?${params.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `statement-${customer?.code}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const rows = statement?.rows || [];
  const openingBalance = statement?.openingBalance || 0;
  const closingBalance = statement?.closingBalance || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/customers/${id}`)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Customer Statement
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
          </Box>
        </Box>

        {customer && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>{customer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{customer.code}</Typography>
                <Typography variant="body2" color="text.secondary">{customer.address}{customer.city ? `, ${customer.city}` : ''}</Typography>
                <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { md: 'right' } }}>
                <Typography variant="body2" color="text.secondary">Statement Period</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {fromDate ? format(fromDate, 'dd/MM/yyyy') : ''} - {toDate ? format(toDate, 'dd/MM/yyyy') : ''}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={setToDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button variant="contained" onClick={() => refetch()} fullWidth>
                Generate Statement
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Opening Balance</Typography>
              <Typography variant="h6" fontWeight="bold">{formatCurrency(openingBalance)}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Closing Balance</Typography>
              <Typography variant="h6" fontWeight="bold" color={closingBalance > 0 ? 'error' : 'success'}>
                {formatCurrency(closingBalance)}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white' }}>Reference</TableCell>
                  <TableCell sx={{ color: 'white' }}>Description</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Debit</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Credit</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No transactions for the selected period</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{format(parseISO(row.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Chip label={row.type} size="small" color={row.type === 'PAYMENT' || row.type === 'CREDIT_NOTE' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell fontWeight="medium">{row.reference}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell align="right" sx={{ color: row.debit > 0 ? 'error.main' : 'inherit' }}>
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.credit > 0 ? 'success.main' : 'inherit' }}>
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </TableCell>
                    <TableCell align="right" fontWeight="medium">{formatCurrency(row.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Hidden print content */}
        <Box sx={{ display: 'none' }}>
          <div ref={printRef}>
            <div className="header">
              <h1>CUSTOMER STATEMENT</h1>
              <p>{fromDate ? format(fromDate, 'dd/MM/yyyy') : ''} - {toDate ? format(toDate, 'dd/MM/yyyy') : ''}</p>
            </div>
            {customer && (
              <div className="customer-info">
                <div>
                  <p><strong>{customer.name}</strong></p>
                  <p>{customer.code}</p>
                  <p>{customer.address}{customer.city ? `, ${customer.city}` : ''}</p>
                  <p>{customer.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>Opening Balance: {formatCurrency(openingBalance)}</p>
                  <p>Closing Balance: {formatCurrency(closingBalance)}</p>
                </div>
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{format(parseISO(row.date), 'dd/MM/yyyy')}</td>
                    <td>{row.type}</td>
                    <td>{row.reference}</td>
                    <td>{row.description}</td>
                    <td className="debit">{row.debit > 0 ? formatCurrency(row.debit) : ''}</td>
                    <td className="credit">{row.credit > 0 ? formatCurrency(row.credit) : ''}</td>
                    <td>{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="totals">
              <p>Opening Balance: {formatCurrency(openingBalance)}</p>
              <p>Closing Balance: {formatCurrency(closingBalance)}</p>
            </div>
          </div>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default CustomerStatementPage;
