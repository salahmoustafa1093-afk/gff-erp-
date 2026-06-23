import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search, Download, Print, Warning } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, downloadCSV, printWindow } from '../../utils/formatters';
import type { TrialBalanceRow } from '../../types';

const TrialBalancePage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance', dateFrom, dateTo],
    queryFn: () =>
      accountingService.getTrialBalance({
        dateFrom: dateFrom!.toISOString().split('T')[0],
        dateTo: dateTo!.toISOString().split('T')[0],
      }),
    enabled: submitted && !!dateFrom && !!dateTo,
  });

  const rows: TrialBalanceRow[] = data?.rows ?? [];
  const isBalanced = data?.isBalanced ?? true;

  const handleExportCSV = () => {
    if (!rows.length) return;
    const exportData = rows.map((r) => ({
      'Account Code': r.accountCode,
      'Account Name': r.accountName,
      'Opening Dr': r.openingBalanceDebit,
      'Opening Cr': r.openingBalanceCredit,
      'Movement Dr': r.movementsDebit,
      'Movement Cr': r.movementsCredit,
      'Closing Dr': r.closingBalanceDebit,
      'Closing Cr': r.closingBalanceCredit,
    }));
    downloadCSV(exportData, `trial-balance-${dateFrom?.toISOString().split('T')[0]}-to-${dateTo?.toISOString().split('T')[0]}.csv`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Trial Balance
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Date From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Date To"
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => setSubmitted(true)}
                  disabled={!dateFrom || !dateTo}
                  fullWidth
                >
                  Generate Report
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {submitted && isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {submitted && !isLoading && data && (
          <>
            {!isBalanced && (
              <Alert severity="error" icon={<Warning />} sx={{ mb: 2 }}>
                Trial balance is NOT balanced! Difference: {formatCurrency(Math.abs((data.totalDebit ?? 0) - (data.totalCredit ?? 0)))}
              </Alert>
            )}
            {isBalanced && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Trial balance is balanced.
              </Alert>
            )}

            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <Button size="small" startIcon={<Download />} onClick={handleExportCSV} variant="outlined">
                Export CSV
              </Button>
              <Button size="small" startIcon={<Print />} onClick={() => printWindow('trial-balance-print')} variant="outlined">
                Print
              </Button>
            </Box>

            <div id="trial-balance-print">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Trial Balance</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Period: {formatDate(dateFrom!)} to {formatDate(dateTo!)}
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Code</TableCell>
                          <TableCell>Account Name</TableCell>
                          <TableCell align="right">Opening Dr</TableCell>
                          <TableCell align="right">Opening Cr</TableCell>
                          <TableCell align="right">Movement Dr</TableCell>
                          <TableCell align="right">Movement Cr</TableCell>
                          <TableCell align="right">Closing Dr</TableCell>
                          <TableCell align="right">Closing Cr</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.accountId} hover>
                            <TableCell>{row.accountCode}</TableCell>
                            <TableCell>{row.accountName}</TableCell>
                            <TableCell align="right">
                              {row.openingBalanceDebit > 0 ? formatCurrency(row.openingBalanceDebit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.openingBalanceCredit > 0 ? formatCurrency(row.openingBalanceCredit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.movementsDebit > 0 ? formatCurrency(row.movementsDebit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.movementsCredit > 0 ? formatCurrency(row.movementsCredit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.closingBalanceDebit > 0 ? formatCurrency(row.closingBalanceDebit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.closingBalanceCredit > 0 ? formatCurrency(row.closingBalanceCredit) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                          <TableCell colSpan={2} align="right">
                            <strong>TOTALS</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(data.totalDebit ?? 0)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(data.totalCredit ?? 0)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(rows.reduce((s, r) => s + r.movementsDebit, 0))}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(rows.reduce((s, r) => s + r.movementsCredit, 0))}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(rows.reduce((s, r) => s + r.closingBalanceDebit, 0))}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(rows.reduce((s, r) => s + r.closingBalanceCredit, 0))}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default TrialBalancePage;
