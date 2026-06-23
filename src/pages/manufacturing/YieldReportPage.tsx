import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
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
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";

interface YieldRecord {
  id: string;
  orderNumber: string;
  feedFormulaName: string;
  feedFormulaCode: string;
  plannedQty: number;
  actualQty: number;
  yieldPercent: number;
  costPerKg: number;
  startDate: string;
  branch: string;
}

interface YieldSummary {
  totalOrders: number;
  avgYield: number;
  totalPlanned: number;
  totalActual: number;
  overallYield: number;
  avgCostPerKg: number;
  minYield: number;
  maxYield: number;
}

interface YieldByFormula {
  feedFormulaCode: string;
  feedFormulaName: string;
  avgYield: number;
  orderCount: number;
}

interface YieldTrendPoint {
  date: string;
  yield: number;
  costPerKg: number;
}

interface YieldReportData {
  records: YieldRecord[];
  summary: YieldSummary;
  yieldByFormula: YieldByFormula[];
  yieldTrend: YieldTrendPoint[];
}

interface FetchParams {
  startDate?: string;
  endDate?: string;
  formulaId?: string;
  branchId?: string;
}

const fetchYieldReport = async (params: FetchParams): Promise<YieldReportData> => {
  const response = await apiService.get<YieldReportData>("/manufacturing/reports/yield", { params });
  return response.data;
};

const YieldReportPage: React.FC = () => {
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [formulaFilter, setFormulaFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<YieldReportData>({
    queryKey: ["yield-report", dateFrom, dateTo, formulaFilter, branchFilter],
    queryFn: () =>
      fetchYieldReport({
        startDate: dateFrom ? dateFrom.toISOString() : undefined,
        endDate: dateTo ? dateTo.toISOString() : undefined,
        formulaId: formulaFilter || undefined,
        branchId: branchFilter || undefined,
      }),
  });

  const summary = data?.summary;

  const columns: GridColDef[] = [
    { field: "orderNumber", headerName: "Order #", flex: 0.8, minWidth: 100 },
    { field: "feedFormulaName", headerName: "Formula", flex: 1.2, minWidth: 140 },
    { field: "branch", headerName: "Branch", flex: 0.8, minWidth: 100 },
    {
      field: "plannedQty",
      headerName: "Planned (KG)",
      type: "number",
      flex: 0.8,
      minWidth: 90,
      valueFormatter: (p: any) => Number(p).toLocaleString(),
    },
    {
      field: "actualQty",
      headerName: "Actual (KG)",
      type: "number",
      flex: 0.8,
      minWidth: 90,
      valueFormatter: (p: any) => Number(p).toLocaleString(),
    },
    {
      field: "yieldPercent",
      headerName: "Yield %",
      type: "number",
      flex: 0.7,
      minWidth: 80,
      renderCell: (params) => {
        const val = params.value as number;
        return (
          <Chip
            label={`${val.toFixed(1)}%`}
            color={val >= 98 ? "success" : val >= 95 ? "warning" : "error"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "costPerKg",
      headerName: "Cost/KG",
      type: "number",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (p: any) => `$${Number(p).toFixed(3)}`,
    },
    {
      field: "startDate",
      headerName: "Date",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (p: any) => new Date(p).toLocaleDateString(),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Yield Analysis Report
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
              Filters
            </Button>
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Filters */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { size: "small", fullWidth: true } }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { size: "small", fullWidth: true } }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Formula" value={formulaFilter} onChange={(e) => setFormulaFilter(e.target.value)} placeholder="Formula ID..." />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} placeholder="Branch ID..." />
              </Grid>
            </Grid>
          </Paper>
        )}

        {error && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography color="error">Failed to load report data.</Typography>
          </Paper>
        )}

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                <Typography variant="h5" fontWeight="bold">{summary.totalOrders}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}>
                <Typography variant="caption" color="text.secondary">Avg Yield</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">{summary.avgYield.toFixed(1)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">Overall Yield</Typography>
                <Typography variant="h5" fontWeight="bold">{summary.overallYield.toFixed(1)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">Min Yield</Typography>
                <Typography variant="h5" fontWeight="bold" color={summary.minYield < 95 ? "error" : "inherit"}>{summary.minYield.toFixed(1)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">Max Yield</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">{summary.maxYield.toFixed(1)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }}>
                <Typography variant="caption" color="text.secondary">Avg Cost/KG</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">${summary.avgCostPerKg.toFixed(3)}</Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Average Yield by Formula</Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.yieldByFormula || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="feedFormulaCode" tick={{ fontSize: 12 }} />
                      <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Avg Yield"]} />
                      <Bar dataKey="avgYield" fill="#4caf50" radius={[4, 4, 0, 0]} name="Avg Yield %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Yield Trend Over Time</Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.yieldTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(value: any, name: any) => [name === "yield" ? `${Number(value).toFixed(1)}%` : `$${Number(value).toFixed(3)}`, name === "yield" ? "Yield" : "Cost/KG"]} />
                      <Legend />
                      <Line type="monotone" dataKey="yield" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} name="Yield %" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Cost Per KG Trend */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Cost per KG Trend</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.yieldTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(val: number) => `$${val}`} />
                  <RechartsTooltip formatter={(value: any) => [`$${Number(value).toFixed(3)}`, "Cost/KG"]} />
                  <Line type="monotone" dataKey="costPerKg" stroke="#f44336" strokeWidth={2} dot={{ r: 3 }} name="Cost/KG" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Yield Records</Typography>
            <DataGrid
              rows={data?.records || []}
              columns={columns}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pagination
              disableRowSelectionOnClick
              density="compact"
              autoHeight
              sx={{ border: "none" }}
            />
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default YieldReportPage;
