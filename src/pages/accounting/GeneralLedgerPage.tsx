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
  Autocomplete,
  TextField as MuiTextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search, Download, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { settingsService } from '../../services/settingsService';
import { formatCurrency, formatDate, downloadCSV, printWindow } from '../../utils/formatters';
import type { ChartOfAccount, LedgerEntry } from '../../types';

const GeneralLedgerPage: React.FC = () => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [branchId, setBranchId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingService.getAccounts(),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => settingsService.getBranches(),
  });

  const accounts: ChartOfAccount[] = accountsData?.data ?? [];
  const branches = branchesData?.data ?? [];

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['general-ledger', accountId, dateFrom, dateTo, branchId],
    queryFn: () =>
      accountingService.getGeneralLedger({
        accountId: accountId ?? undefined,
        dateFrom: dateFrom!.toISOString().split('T')[0],
        dateTo: dateTo!.toISOString().split('T')[0],
        branchId: branchId || undefined,
        pageSize: 1000,
      }),
    enabled: submitted && !!dateFrom && !!dateTo,
  });

  const { data: summary } = useQuery({
    queryKey: ['general-ledger-summary', accountId, dateFrom, dateTo],
    queryFn: () =>
      accountingService.getGeneralLedgerSummary({
        accountId: accountId ?? undefined,
        dateFrom: dateFrom!.toISOString().split('T')[0],
        dateTo: dateTo!.toISOString().split('T')[0],
      }),
    enabled: submitted && !!dateFrom && !!dateTo,
  });

  const entries: LedgerEntry[] = ledgerData?.data ?? [];
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleExportCSV = () => {
    if (!entries.length) return;
    const data = entries.map((e) => ({
      Date: formatDate(e.date),
      Reference: e.reference,
      Description: e.description,
      Debit: e.debit,
      Credit: e.credit,
      Balance: e.runningBalance,
    }));
    downloadCSV(data, `general-ledger-${selectedAccount?.code ?? 'all'}-${dateFrom?.toISOString().split('T')[0]}.csv`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          General Ledger
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={accounts}
                  getOptionLabel={(a) => `${a.code} - ${a.name}`}
                  value={selectedAccount ?? null}
                  onChange={(_, val) => setAccountId(val?.id ?? null)}
                  renderInput={(params) => (
                    <MuiTextField {...params} label="Account (leave empty for all)" size="small" fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <DatePicker
                  label="Date From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <DatePicker
                  label="Date To"
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => setSubmitted(true)}
                  disabled={!dateFrom || !dateTo}
                  fullWidth
                >
                  Query
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

        {submitted && !isLoading && summary && (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Opening Balance</Typography>
                    <Typography variant="h6">{formatCurrency(summary.openingBalance)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Total Debits</Typography>
                    <Typography variant="h6" color="success.main">{formatCurrency(summary.totalDebits)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Total Credits</Typography>
                    <Typography variant="h6" color="error.main">{formatCurrency(summary.totalCredits)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">Closing Balance</Typography>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(summary.closingBalance)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <Button size="small" startIcon={<Download />} onClick={handleExportCSV} variant="outlined">
                Export CSV
              </Button>
              <Button size="small" startIcon={<Print />} onClick={() => printWindow('general-ledger-print')} variant="outlined">
                Print
              </Button>
            </Box>

            <div id="general-ledger-print">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : 'All Accounts'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Period: {formatDate(dateFrom!)} to {formatDate(dateTo!)}
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Date</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Debit</TableCell>
                          <TableCell align="right">Credit</TableCell>
                          <TableCell align="right">Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow sx={{ backgroundColor: '#fffde7' }}>
                          <TableCell colSpan={5} align="right">
                            <strong>Opening Balance</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(summary.openingBalance)}</strong>
                          </TableCell>
                        </TableRow>
                        {entries.map((entry) => (
                          <TableRow key={entry.id} hover>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.reference}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell align="right">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                            </TableCell>
                            <TableCell align="right" fontWeight="medium">
                              {formatCurrency(entry.runningBalance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                          <TableCell colSpan={3} align="right">
                            <strong>Totals / Closing</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(summary.totalDebits)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(summary.totalCredits)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(summary.closingBalance)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {entries.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">No transactions found for the selected criteria</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default GeneralLedgerPage;
