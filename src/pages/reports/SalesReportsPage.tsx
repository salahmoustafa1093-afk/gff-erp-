import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
} from '@mui/x-data-grid';
import { Download, BarChart as BarChartIcon } from '@mui/icons-material';
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
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';
import type { SalesReportRow } from '../../types';

// API integration - this would normally come from a service
const useSalesReport = (type: string, dateFrom: Date | null, dateTo: Date | null) => {
  const [data, setData] = useState<SalesReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = () => {
    setIsLoading(true);
    // Replace with actual API call
    setTimeout(() => {
      setData([]);
      setIsLoading(false);
    }, 500);
  };

  return { data, isLoading, fetch };
};

const reportTypes = ['Daily', 'Monthly', 'Yearly', 'By Product', 'By Customer', 'By Sales Rep'];

const SalesReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const { data: reportData, isLoading, fetch } = useSalesReport(
    reportTypes[tab],
    dateFrom,
    dateTo
  );

  const columns: GridColDef<SalesReportRow>[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 110,
      renderCell: (params) => formatDate(params.row.date),
    },
    { field: 'invoiceNumber', headerName: 'Invoice #', width: 120 },
    { field: 'customerName', headerName: 'Customer', width: 150, flex: 1 },
    { field: 'productName', headerName: 'Product', width: 150 },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'unitPrice',
      headerName: 'Unit Price',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => formatCurrency(params.row.unitPrice),
    },
    {
      field: 'totalAmount',
      headerName: 'Total',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => formatCurrency(params.row.totalAmount),
    },
    { field: 'salesRep', headerName: 'Sales Rep', width: 120 },
  ];

  const chartData = [
    { label: 'Week 1', revenue: 45000, target: 40000 },
    { label: 'Week 2', revenue: 52000, target: 40000 },
    { label: 'Week 3', revenue: 38000, target: 40000 },
    { label: 'Week 4', revenue: 61000, target: 40000 },
  ];

  const totalRevenue = reportData.reduce((s, r) => s + r.totalAmount, 0);
  const totalInvoices = reportData.length;
  const avgOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Sales Reports
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <DatePicker
                label="From"
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
              />
              <DatePicker
                label="To"
                value={dateTo}
                onChange={setDateTo}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
              />
              <Button
                variant="contained"
                onClick={fetch}
                disabled={!dateFrom || !dateTo || isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Generate'}
              </Button>
              <Box flex={1} />
              <Button size="small" startIcon={<Download />} variant="outlined" onClick={() => downloadCSV(reportData as unknown as Record<string, unknown>[], 'sales-report.csv')}>
                Export
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Box display="flex" gap={2} mb={3}>
          <Card sx={{ minWidth: 160 }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 160 }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="body2" color="text.secondary">Invoices</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {totalInvoices}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 160 }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="body2" color="text.secondary">Avg Order Value</Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(avgOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          {reportTypes.map((t) => (
            <Tab key={t} label={t} />
          ))}
        </Tabs>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Revenue Trend
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => `EGP ${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                  <Bar dataKey="target" fill="#ff9800" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <DataGrid
              rows={reportData}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50, 100]}
              loading={isLoading}
              disableRowSelectionOnClick
              density="compact"
              autoHeight
              getRowId={(_, index) => index}
            />
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesReportsPage;
