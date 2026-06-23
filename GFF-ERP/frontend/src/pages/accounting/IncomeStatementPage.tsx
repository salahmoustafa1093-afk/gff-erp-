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
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { Search, Download, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, formatPercentage, printWindow } from '../../utils/formatters';
import type { IncomeStatementItem } from '../../types';

const IncomeSection: React.FC<{
  title: string;
  items: IncomeStatementItem[];
  subtotal: number;
  isDeduction?: boolean;
}> = ({ title, items, subtotal, isDeduction }) => (
  <Box mb={2}>
    <Box
      display="flex"
      justifyContent="space-between"
      sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        color={isDeduction && subtotal > 0 ? 'error.main' : 'inherit'}
      >
        {formatCurrency(subtotal)}
      </Typography>
    </Box>
    <TableContainer>
      <Table size="small">
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ pl: 4 }}>{item.accountName}</TableCell>
              <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

const IncomeStatementPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['income-statement', dateFrom, dateTo],
    queryFn: () =>
      accountingService.getIncomeStatement({
        dateFrom: dateFrom!.toISOString().split('T')[0],
        dateTo: dateTo!.toISOString().split('T')[0],
      }),
    enabled: submitted && !!dateFrom && !!dateTo,
  });

  const revenue = data?.revenue.subtotal ?? 0;
  const cogs = data?.cogs.subtotal ?? 0;
  const grossProfit = data?.grossProfit ?? 0;
  const operatingExpenses = data?.operatingExpenses.subtotal ?? 0;
  const netOperatingIncome = data?.netOperatingIncome ?? 0;
  const netIncome = data?.netIncome ?? 0;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
  const chartData = data?.revenueChart ?? [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Income Statement
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
            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <Button size="small" startIcon={<Download />} variant="outlined">
                Export CSV
              </Button>
              <Button size="small" startIcon={<Print />} onClick={() => printWindow('income-statement-print')} variant="outlined">
                Print
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <div id="income-statement-print">
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
                        Income Statement
                      </Typography>
                      <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                        {formatDate(dateFrom!)} to {formatDate(dateTo!)}
                      </Typography>

                      <IncomeSection title="REVENUE" items={data.revenue.items} subtotal={revenue} />
                      <IncomeSection title="COST OF GOODS SOLD" items={data.cogs.items} subtotal={cogs} isDeduction />

                      <Box
                        sx={{
                          backgroundColor: '#e3f2fd',
                          p: 1.5,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          Gross Profit
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {formatCurrency(grossProfit)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Gross Margin: {formatPercentage(grossMargin)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(grossMargin, 100)}
                          sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <IncomeSection title="OPERATING EXPENSES" items={data.operatingExpenses.items} subtotal={operatingExpenses} isDeduction />

                      <Box
                        sx={{
                          backgroundColor: '#e8f5e9',
                          p: 1.5,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          Net Operating Income
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(netOperatingIncome)}
                        </Typography>
                      </Box>

                      {data.otherIncome.items.length > 0 && (
                        <IncomeSection title="OTHER INCOME" items={data.otherIncome.items} subtotal={data.otherIncome.subtotal} />
                      )}
                      {data.otherExpenses.items.length > 0 && (
                        <IncomeSection title="OTHER EXPENSES" items={data.otherExpenses.items} subtotal={data.otherExpenses.subtotal} isDeduction />
                      )}

                      <Box
                        sx={{
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          p: 2,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 3,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          NET INCOME
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {formatCurrency(netIncome)}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Net Margin: {formatPercentage(netMargin)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(netMargin, 100)}
                          color="success"
                          sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </div>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Revenue vs Expenses
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                          <Bar dataKey="expense" fill="#f44336" name="Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">Gross Margin</Typography>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                          {formatPercentage(grossMargin)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">Net Margin</Typography>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          {formatPercentage(netMargin)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">Operating Margin</Typography>
                        <Typography variant="h6">
                          {formatPercentage(revenue > 0 ? (netOperatingIncome / revenue) * 100 : 0)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">Revenue</Typography>
                        <Typography variant="h6">{formatCurrency(revenue)}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default IncomeStatementPage;
