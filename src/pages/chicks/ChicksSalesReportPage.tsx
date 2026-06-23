import React, { useState } from "react";
import {
  Box,
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
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";

interface SalesByBreed {
  breedType: string;
  breedTypeLabel: string;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
  fill: string;
}

interface CustomerAnalysis {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalQuantity: number;
  totalRevenue: number;
  avgPrice: number;
  lastPurchaseDate: string;
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  quantity: number;
}

interface SalesReportData {
  summary: {
    totalSales: number;
    totalQuantity: number;
    totalRevenue: number;
    avgPrice: number;
    periodStart: string;
    periodEnd: string;
  };
  salesByBreed: SalesByBreed[];
  customerAnalysis: CustomerAnalysis[];
  revenueTrend: RevenueTrendPoint[];
}

const BREED_COLORS: Record<string, string> = {
  BROILER: "#4caf50",
  LAYER: "#2196f3",
  BREEDER: "#ff9800",
  PIGEON: "#9c27b0",
  OTHER: "#607d8b",
};

const fetchSalesReport = async (params: any): Promise<SalesReportData> => {
  const response = await apiService.get<SalesReportData>("/poultry/reports/chicks-sales", { params });
  return response.data;
};

const ChicksSalesReportPage: React.FC = () => {
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<SalesReportData>({
    queryKey: ["chicks-sales-report", dateFrom, dateTo],
    queryFn: () => fetchSalesReport({
      startDate: dateFrom ? dateFrom.toISOString() : undefined,
      endDate: dateTo ? dateTo.toISOString() : undefined,
    }),
  });

  const summary = data?.summary;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Chicks Sales Report</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
            <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
          </Box>
        </Box>

        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}><DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { size: "small", fullWidth: true } }} /></Grid>
              <Grid item xs={12} sm={5}><DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { size: "small", fullWidth: true } }} /></Grid>
              <Grid item xs={12} sm={2}><Button variant="outlined" size="small" fullWidth onClick={() => { setDateFrom(null); setDateTo(null); }}>Clear</Button></Grid>
            </Grid>
          </Paper>
        )}

        {error && <Paper sx={{ p: 2, mb: 2 }}><Typography color="error">Failed to load report.</Typography></Paper>}

        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Sales</Typography><Typography variant="h5" fontWeight="bold">{summary.totalSales}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Qty</Typography><Typography variant="h5" fontWeight="bold" color="primary">{summary.totalQuantity.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}><Typography variant="caption" color="text.secondary">Total Revenue</Typography><Typography variant="h5" fontWeight="bold" color="success.main">${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Avg Price</Typography><Typography variant="h5" fontWeight="bold">${summary.avgPrice.toFixed(2)}</Typography></Paper></Grid>
          </Grid>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={5}>
            <Card sx={{ height: 380 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom align="center">Sales by Breed Type</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.salesByBreed || []} cx="50%" cy="50%" outerRadius={120} dataKey="quantitySold" label={({ breedTypeLabel, percentage }: any) => `${breedTypeLabel}: ${percentage?.toFixed(0) || 0}%`}>
                        {(data?.salesByBreed || []).map((entry: SalesByBreed, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => [Number(value).toLocaleString(), "Quantity"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ height: 380 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Revenue Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.revenueTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val: number) => `$${val}`} />
                      <RechartsTooltip formatter={(value: any, name: any) => [name === "revenue" ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString(), name === "revenue" ? "Revenue" : "Quantity"]} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#4caf50" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Customer Analysis Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Customer Analysis</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow sx={{ backgroundColor: theme.palette.grey[100] }}><TableCell>Customer</TableCell><TableCell align="right">Purchases</TableCell><TableCell align="right">Total Qty</TableCell><TableCell align="right">Total Revenue</TableCell><TableCell align="right">Avg Price</TableCell><TableCell>Last Purchase</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data?.customerAnalysis || []).map((cust: CustomerAnalysis) => (
                    <TableRow key={cust.customerId} hover>
                      <TableCell fontWeight={500}>{cust.customerName}</TableCell>
                      <TableCell align="right">{cust.totalPurchases}</TableCell>
                      <TableCell align="right">{cust.totalQuantity.toLocaleString()}</TableCell>
                      <TableCell align="right" fontWeight="bold" color="success.main">${cust.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">${cust.avgPrice.toFixed(2)}</TableCell>
                      <TableCell>{new Date(cust.lastPurchaseDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!data?.customerAnalysis || data.customerAnalysis.length === 0) && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No customer data available.</Typography></TableCell></TableRow>
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

export default ChicksSalesReportPage;
