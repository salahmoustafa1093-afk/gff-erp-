import React, { useState } from 'react';
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
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendIcon,
  ShoppingCart as OrderIcon,
  MonetizationOn as MoneyIcon,
  Percent as ProfitIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import api from '../../app/api';
import { SalesReportRow } from '../types';

type ReportType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'BY_PRODUCT' | 'BY_CUSTOMER' | 'BY_SALES_REP';

const reportTypeLabels: Record<ReportType, string> = {
  DAILY: 'Daily Sales',
  MONTHLY: 'Monthly Sales',
  YEARLY: 'Yearly Sales',
  BY_PRODUCT: 'By Product',
  BY_CUSTOMER: 'By Customer',
  BY_SALES_REP: 'By Sales Rep',
};

const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0', '#00bcd4', '#ff5722', '#795548'];

const SalesReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('MONTHLY');
  const [fromDate, setFromDate] = useState<Date | null>(new Date(new Date().getFullYear(), 0, 1));
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['salesReport', reportType, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', reportType);
      if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
      if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));
      const response = await api.get(`/sales/reports?${params.toString()}`);
      return response.data as { summary: { totalOrders: number; totalRevenue: number; totalCost: number; totalProfit: number; avgOrderValue: number }; rows: SalesReportRow[] };
    },
    enabled: Boolean(fromDate && toDate),
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    params.append('type', reportType);
    if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));
    const response = await api.get(`/sales/reports/export?${params.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const summary = reportData?.summary || { totalOrders: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, avgOrderValue: 0 };
  const rows = reportData?.rows || [];

  const chartData = rows.map((row) => ({
    name: row.period,
    orders: row.orderCount,
    revenue: row.total,
    profit: row.profit,
  }));

  const pieData = rows.slice(0, 8).map((row, idx) => ({
    name: row.period,
    value: row.total,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Sales Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>
              Export
            </Button>
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                label="Report Type"
                fullWidth
                size="small"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                {Object.entries(reportTypeLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={setToDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                label="Chart Type"
                fullWidth
                size="small"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie')}
              >
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: '4px solid #4caf50' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                    <Typography variant="h5" fontWeight="bold">{summary.totalOrders.toLocaleString()}</Typography>
                  </Box>
                  <OrderIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: '4px solid #2196f3' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h5" fontWeight="bold">{formatCurrency(summary.totalRevenue)}</Typography>
                  </Box>
                  <MoneyIcon color="primary" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: '4px solid #4caf50' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Profit</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">{formatCurrency(summary.totalProfit)}</Typography>
                  </Box>
                  <TrendIcon color="success" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: '4px solid #ff9800' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg Order Value</Typography>
                    <Typography variant="h5" fontWeight="bold">{formatCurrency(summary.avgOrderValue)}</Typography>
                  </Box>
                  <ProfitIcon color="warning" sx={{ fontSize: 36, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {rows.length > 0 && (
          <>
            <Paper sx={{ p: 2, mb: 3, height: 400 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Sales Chart</Typography>
              <ResponsiveContainer width="100%" height="90%">
                {chartType === 'bar' && (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                    <Bar dataKey="profit" fill="#2196f3" name="Profit" />
                  </BarChart>
                )}
                {chartType === 'line' && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#4caf50" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="orders" stroke="#ff9800" name="Orders" strokeWidth={2} />
                  </LineChart>
                )}
                {chartType === 'pie' && (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Report Data</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white' }}>Period</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Orders</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Items</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Subtotal</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Discount</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Tax</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Total</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Profit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell fontWeight="medium">{row.period}</TableCell>
                        <TableCell align="right">{row.orderCount.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.itemCount.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatCurrency(row.subtotal)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.discount)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.tax)}</TableCell>
                        <TableCell align="right" fontWeight="medium">{formatCurrency(row.total)}</TableCell>
                        <TableCell align="right" sx={{ color: row.profit >= 0 ? 'success.main' : 'error.main' }}>
                          {formatCurrency(row.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'action.hover', fontWeight: 'bold' }}>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell align="right"><strong>{rows.reduce((s, r) => s + r.orderCount, 0).toLocaleString()}</strong></TableCell>
                      <TableCell align="right"><strong>{rows.reduce((s, r) => s + r.itemCount, 0).toLocaleString()}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.subtotal, 0))}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.discount, 0))}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.tax, 0))}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.total, 0))}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(rows.reduce((s, r) => s + r.profit, 0))}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {rows.length === 0 && !isLoading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No data available for the selected criteria</Typography>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SalesReportsPage;
