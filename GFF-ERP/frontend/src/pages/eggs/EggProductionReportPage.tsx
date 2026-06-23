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
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";

interface DailyProduction {
  date: string;
  batchNumber: string;
  totalEggs: number;
  largeEggs: number;
  mediumEggs: number;
  smallEggs: number;
  brokenEggs: number;
  dirtyEggs: number;
  goodEggs: number;
  breakageRate: number;
}

interface BatchComparison {
  batchNumber: string;
  breedType: string;
  totalEggs: number;
  avgDailyProduction: number;
  peakProduction: number;
  avgBreakageRate: number;
}

interface ProductionReportData {
  summary: {
    totalEggs: number;
    totalGoodEggs: number;
    totalBroken: number;
    totalDirty: number;
    avgBreakageRate: number;
    avgDailyProduction: number;
    bestDay: string;
    bestDayCount: number;
  };
  dailyData: DailyProduction[];
  sizeDistribution: { size: string; count: number; fill: string }[];
  trendBySize: { date: string; large: number; medium: number; small: number }[];
  batchComparisons: BatchComparison[];
  weeklyAggregation: { week: string; total: number; good: number; broken: number }[];
  breakageTrend: { date: string; rate: number }[];
  fcrEstimation: { date: string; fcr: number }[];
}

const SIZE_COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336", "#9e9e9e"];

const fetchProductionReport = async (params: any): Promise<ProductionReportData> => {
  const response = await apiService.get<ProductionReportData>("/eggs/reports/production", { params });
  return response.data;
};

const EggProductionReportPage: React.FC = () => {
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [batchFilter, setBatchFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<ProductionReportData>({
    queryKey: ["egg-production-report", dateFrom, dateTo, batchFilter],
    queryFn: () => fetchProductionReport({
      startDate: dateFrom ? dateFrom.toISOString() : undefined,
      endDate: dateTo ? dateTo.toISOString() : undefined,
      batchId: batchFilter || undefined,
    }),
  });

  const summary = data?.summary;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Egg Production Report</Typography>
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
              <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Batch ID" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} /></Grid>
              <Grid item xs={12} sm={1}><Button variant="outlined" size="small" fullWidth onClick={() => { setDateFrom(null); setDateTo(null); setBatchFilter(""); }}>Clear</Button></Grid>
            </Grid>
          </Paper>
        )}

        {error && <Paper sx={{ p: 2, mb: 2 }}><Typography color="error">Failed to load report.</Typography></Paper>}

        {/* Summary */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Eggs</Typography><Typography variant="h5" fontWeight="bold">{summary.totalEggs.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}><Typography variant="caption" color="text.secondary">Good Eggs</Typography><Typography variant="h5" fontWeight="bold" color="success.main">{summary.totalGoodEggs.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }}><Typography variant="caption" color="text.secondary">Broken</Typography><Typography variant="h5" fontWeight="bold" color="error">{summary.totalBroken.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.warning.light + "20" }}><Typography variant="caption" color="text.secondary">Dirty</Typography><Typography variant="h5" fontWeight="bold" color="warning.main">{summary.totalDirty.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Avg Breakage</Typography><Typography variant="h5" fontWeight="bold" color={summary.avgBreakageRate > 3 ? "error" : "success"}>{summary.avgBreakageRate.toFixed(1)}%</Typography></Paper></Grid>
            <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }}><Typography variant="caption" color="text.secondary">Best Day</Typography><Typography variant="h5" fontWeight="bold" color="primary">{summary.bestDayCount.toLocaleString()}</Typography><Typography variant="caption">{new Date(summary.bestDay).toLocaleDateString()}</Typography></Paper></Grid>
          </Grid>
        )}

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={7}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Production Trend by Size</Typography>
                <Box sx={{ height: 330 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.trendBySize || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="large" stroke="#4caf50" strokeWidth={2} dot={{ r: 2 }} name="Large" />
                      <Line type="monotone" dataKey="medium" stroke="#2196f3" strokeWidth={2} dot={{ r: 2 }} name="Medium" />
                      <Line type="monotone" dataKey="small" stroke="#ff9800" strokeWidth={2} dot={{ r: 2 }} name="Small" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom align="center">Size Distribution</Typography>
                <Box sx={{ height: 330 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.sizeDistribution || []} cx="50%" cy="50%" outerRadius={130} dataKey="count" label={({ size, count }: any) => `${size}: ${(count || 0).toLocaleString()}`}>
                        {(data?.sizeDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={SIZE_COLORS[index % SIZE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Breakage Rate Trend */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Breakage Rate Trend</Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.breakageTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="brkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f44336" stopOpacity={0.3} /><stop offset="95%" stopColor="#f44336" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} tickFormatter={(val: number) => `${val}%`} />
                  <RechartsTooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Breakage Rate"]} />
                  <Area type="monotone" dataKey="rate" stroke="#f44336" fill="url(#brkGrad)" strokeWidth={2} name="Breakage %" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Weekly Aggregation */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Weekly Summary</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.weeklyAggregation || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#4caf50" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="good" fill="#2196f3" radius={[4, 4, 0, 0]} name="Good" />
                  <Bar dataKey="broken" fill="#f44336" radius={[4, 4, 0, 0]} name="Broken" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Batch Comparison */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Batch Performance Comparison</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow sx={{ backgroundColor: theme.palette.grey[100] }}><TableCell>Batch</TableCell><TableCell>Breed</TableCell><TableCell align="right">Total Eggs</TableCell><TableCell align="right">Avg Daily</TableCell><TableCell align="right">Peak</TableCell><TableCell align="right">Avg Breakage</TableCell></TableRow></TableHead>
                <TableBody>
                  {(data?.batchComparisons || []).map((bc: BatchComparison) => (
                    <TableRow key={bc.batchNumber} hover>
                      <TableCell fontWeight="bold">{bc.batchNumber}</TableCell>
                      <TableCell>{bc.breedType}</TableCell>
                      <TableCell align="right">{bc.totalEggs.toLocaleString()}</TableCell>
                      <TableCell align="right">{bc.avgDailyProduction.toFixed(0)}</TableCell>
                      <TableCell align="right" color="primary">{bc.peakProduction.toLocaleString()}</TableCell>
                      <TableCell align="right"><Chip label={`${bc.avgBreakageRate.toFixed(1)}%`} size="small" color={bc.avgBreakageRate > 3 ? "error" : "success"} variant="outlined" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* FCR Estimation */}
        {data?.fcrEstimation && data.fcrEstimation.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Feed Conversion Ratio (FCR) Estimation</Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.fcrEstimation} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(value: any) => [`${Number(value).toFixed(2)}`, "FCR"]} />
                    <Line type="monotone" dataKey="fcr" stroke="#9c27b0" strokeWidth={2} dot={{ r: 3 }} name="FCR" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EggProductionReportPage;
