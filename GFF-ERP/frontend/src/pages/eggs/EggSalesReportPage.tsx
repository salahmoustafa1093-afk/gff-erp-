import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";

interface SalesBySize {
  size: string;
  quantity: number;
  revenue: number;
  avgPrice: number;
  fill: string;
}

interface CustomerSale {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  avgPrice: number;
  lastOrderDate: string;
  preferredSize: string;
}

interface PriceTrendPoint {
  date: string;
  largePrice: number;
  mediumPrice: number;
  smallPrice: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface EggSalesReportData {
  summary: {
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
    avgPrice: number;
    avgOrderValue: number;
    periodStart: string;
    periodEnd: string;
  };
  salesBySize: SalesBySize[];
  customerAnalysis: CustomerSale[];
  priceTrend: PriceTrendPoint[];
  revenueTrend: RevenuePoint[];
}

const SIZE_COLORS: Record<string, string> = {
  LARGE: "#4caf50",
  MEDIUM: "#2196f3",
  SMALL: "#ff9800",
  MIXED: "#9c27b0",
};

const fetchEggSalesReport = async (params: any): Promise<EggSalesReportData> => {
  const response = await apiService.get<EggSalesReportData>("/eggs/reports/sales", { params });
  return response.data;
};

const EggSalesReportPage: React.FC = () => {
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [customerFilter, setCustomerFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<EggSalesReportData>({
    queryKey: ["egg-sales-report", dateFrom, dateTo, customerFilter],
    queryFn: () => fetchEggSalesReport({
      startDate: dateFrom ? dateFrom.toISOString() : undefined,
      endDate: dateTo ? dateTo.toISOString() : undefined,
      customerId: customerFilter || undefined,
    }),
  });

  const summary = data?.summary;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Egg Sales Report</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
            <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
          </Box>
        </Box>

        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}><DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { size: "small", fullWidth: true } }} /></Grid>
              <Grid item xs={12} sm={4}><DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { size: "small", fullWidth: true } }} /></Grid>
              <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Customer ID" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} /></Grid>
              <Grid item xs={12} sm={1}><Button variant="outlined" size="small" fullWidth onClick={() => { setDateFrom(null); setDateTo(null); setCustomerFilter(""); }}>Clear</Button></Grid>
            </Grid>
          </Paper>
        )}

        {error && <Paper sx={{ p: 2, mb: 2 }}><Typography color="error">Failed to load report.</Typography></Paper>}

        {/* Summary */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Orders</Typography><Typography variant="h5" fontWeight="bold">{summary.totalOrders}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Qty</Typography><Typography variant="h5" fontWeight="bold" color="primary">{summary.totalQuantity.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}><Typography variant="caption" color="text.secondary">Total Revenue</Typography><Typography variant="h5" fontWeight="bold" color="success.main">${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Avg Price</Typography><Typography variant="h5" fontWeight="bold">${summary.avgPrice.toFixed(2)}</Typography></Paper></Grid>
          </Grid>
        )}

        {/* Charts Row 1 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 380 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Sales by Egg Size</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.salesBySize || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="size" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(val: number) => `$${val}`} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="quantity" fill="#4caf50" radius={[4, 4, 0, 0]} name="Quantity" />
                      <Bar yAxisId="right" dataKey="revenue" fill="#2196f3" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 380 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Revenue Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.revenueTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} /><stop offset="95%" stopColor="#4caf50" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val: number) => `$${val}`} />
                      <RechartsTooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
                      <Area type="monotone" dataKey="revenue" stroke="#4caf50" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Price Trend */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Price Trend by Size</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.priceTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val: number) => `$${val.toFixed(2)}`} />
                  <RechartsTooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Price"]} />
                  <Legend />
                  <Line type="monotone" dataKey="largePrice" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} name="Large" />
                  <Line type="monotone" dataKey="mediumPrice" stroke="#2196f3" strokeWidth={2} dot={{ r: 3 }} name="Medium" />
                  <Line type="monotone" dataKey="smallPrice" stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} name="Small" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Customer Analysis */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Customer Analysis</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow sx={{ backgroundColor: theme.palette.grey[100] }}><TableCell>Customer</TableCell><TableCell align="right">Orders</TableCell><TableCell align="right">Total Qty</TableCell><TableCell align="right">Revenue</TableCell><TableCell align="right">Avg Price</TableCell><TableCell align="center">Preferred Size</TableCell><TableCell>Last Order</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data?.customerAnalysis || []).map((cust: CustomerSale) => (
                    <TableRow key={cust.customerId} hover>
                      <TableCell fontWeight={500}>{cust.customerName}</TableCell>
                      <TableCell align="right">{cust.totalOrders}</TableCell>
                      <TableCell align="right">{cust.totalQuantity.toLocaleString()}</TableCell>
                      <TableCell align="right" fontWeight="bold" color="success.main">${cust.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">${cust.avgPrice.toFixed(2)}</TableCell>
                      <TableCell align="center"><Chip label={cust.preferredSize} size="small" color="primary" variant="outlined" /></TableCell>
                      <TableCell>{new Date(cust.lastOrderDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!data?.customerAnalysis || data.customerAnalysis.length === 0) && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No customer data.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default EggSalesReportPage;
