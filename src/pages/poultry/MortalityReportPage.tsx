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
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";

interface MortalityByCause {
  cause: string;
  causeLabel: string;
  count: number;
  percentage: number;
  fill: string;
}

interface MortalityTrendPoint {
  date: string;
  batchNumber: string;
  count: number;
  cumulativeRate: number;
}

interface BatchMortalitySummary {
  batchId: string;
  batchNumber: string;
  breedType: string;
  breedTypeLabel: string;
  initialQty: number;
  currentQty: number;
  totalDeaths: number;
  mortalityRate: number;
  supplierName: string;
  arrivalDate: string;
}

interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalBatches: number;
  totalChicks: number;
  totalDeaths: number;
  avgMortalityRate: number;
}

interface MortalityReportData {
  summary: {
    totalBatches: number;
    totalChicks: number;
    totalDeaths: number;
    overallMortalityRate: number;
    periodStart: string;
    periodEnd: string;
  };
  byCause: MortalityByCause[];
  trends: MortalityTrendPoint[];
  batchSummaries: BatchMortalitySummary[];
  supplierPerformance: SupplierPerformance[];
}

const CAUSE_COLORS: Record<string, string> = {
  DISEASE: "#f44336",
  HEAT: "#ff9800",
  COLD: "#2196f3",
  PREDATOR: "#795548",
  OTHER: "#9e9e9e",
};

const BREED_COLORS: Record<string, string> = {
  BROILER: "#4caf50",
  LAYER: "#2196f3",
  BREEDER: "#ff9800",
  PIGEON: "#9c27b0",
  OTHER: "#607d8b",
};

const fetchMortalityReport = async (params: any): Promise<MortalityReportData> => {
  const response = await apiService.get<MortalityReportData>("/poultry/reports/mortality", { params });
  return response.data;
};

const MortalityReportPage: React.FC = () => {
  const theme = useTheme();
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [breedFilter, setBreedFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<MortalityReportData>({
    queryKey: ["mortality-report", dateFrom, dateTo, breedFilter],
    queryFn: () =>
      fetchMortalityReport({
        startDate: dateFrom ? dateFrom.toISOString() : undefined,
        endDate: dateTo ? dateTo.toISOString() : undefined,
        breedType: breedFilter || undefined,
      }),
  });

  const summary = data?.summary;

  const batchColumns: GridColDef[] = [
    { field: "batchNumber", headerName: "Batch #", flex: 1, minWidth: 100 },
    { field: "breedTypeLabel", headerName: "Breed", flex: 0.7, minWidth: 70 },
    { field: "supplierName", headerName: "Supplier", flex: 0.8, minWidth: 80 },
    { field: "initialQty", headerName: "Initial", type: "number", flex: 0.7, minWidth: 70, valueFormatter: (p: any) => Number(p).toLocaleString() },
    { field: "currentQty", headerName: "Current", type: "number", flex: 0.7, minWidth: 70, valueFormatter: (p: any) => Number(p).toLocaleString() },
    { field: "totalDeaths", headerName: "Deaths", type: "number", flex: 0.6, minWidth: 60 },
    {
      field: "mortalityRate",
      headerName: "Mort %",
      type: "number",
      flex: 0.7,
      minWidth: 70,
      renderCell: (params) => {
        const val = params.value as number;
        return <Chip label={`${val.toFixed(1)}%`} size="small" color={val > 5 ? "error" : val > 3 ? "warning" : "success"} variant="outlined" sx={{ fontWeight: 700 }} />;
      },
    },
  ];

  const supplierColumns: GridColDef[] = [
    { field: "supplierName", headerName: "Supplier", flex: 1.2, minWidth: 130 },
    { field: "totalBatches", headerName: "Batches", type: "number", flex: 0.7, minWidth: 60 },
    { field: "totalChicks", headerName: "Chicks", type: "number", flex: 0.8, minWidth: 70, valueFormatter: (p: any) => Number(p).toLocaleString() },
    { field: "totalDeaths", headerName: "Deaths", type: "number", flex: 0.7, minWidth: 60 },
    {
      field: "avgMortalityRate",
      headerName: "Avg Mort %",
      type: "number",
      flex: 0.8,
      minWidth: 80,
      renderCell: (params) => {
        const val = params.value as number;
        return <Chip label={`${val.toFixed(1)}%`} size="small" color={val > 5 ? "error" : val > 3 ? "warning" : "success"} variant="outlined" sx={{ fontWeight: 700 }} />;
      },
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Mortality Analysis Report</Typography>
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
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small"><InputLabel>Breed</InputLabel>
                  <Select value={breedFilter} label="Breed" onChange={(e) => setBreedFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="BROILER">Broiler</MenuItem>
                    <MenuItem value="LAYER">Layer</MenuItem>
                    <MenuItem value="BREEDER">Breeder</MenuItem>
                    <MenuItem value="PIGEON">Pigeon</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={1}><Button variant="outlined" size="small" fullWidth onClick={() => { setDateFrom(null); setDateTo(null); setBreedFilter(""); }}>Clear</Button></Grid>
            </Grid>
          </Paper>
        )}

        {error && <Paper sx={{ p: 2, mb: 2 }}><Typography color="error">Failed to load report.</Typography></Paper>}

        {/* Summary */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Batches</Typography><Typography variant="h5" fontWeight="bold">{summary.totalBatches}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Chicks</Typography><Typography variant="h5" fontWeight="bold">{summary.totalChicks.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }}><Typography variant="caption" color="text.secondary">Total Deaths</Typography><Typography variant="h5" fontWeight="bold" color="error">{summary.totalDeaths.toLocaleString()}</Typography></Paper></Grid>
            <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }}><Typography variant="caption" color="text.secondary">Overall Mort %</Typography><Typography variant="h5" fontWeight="bold" color={summary.overallMortalityRate > 5 ? "error" : summary.overallMortalityRate > 3 ? "warning.main" : "success.main"}>{summary.overallMortalityRate.toFixed(2)}%</Typography></Paper></Grid>
          </Grid>
        )}

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 380 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom align="center">Deaths by Cause</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.byCause || []} cx="50%" cy="50%" outerRadius={120} dataKey="count" label={({ causeLabel, percentage }: any) => `${causeLabel}: ${percentage.toFixed(1)}%`}>
                        {(data?.byCause || []).map((entry: MortalityByCause, index: number) => (
                          <Cell key={`cell-${index}`} fill={CAUSE_COLORS[entry.cause] || "#9e9e9e"} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 380 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Mortality Trend by Batch</Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.trends || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="count" stroke="#f44336" strokeWidth={2} dot={{ r: 3 }} name="Daily Deaths" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tables */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Batch Comparison</Typography>
                <DataGrid rows={data?.batchSummaries || []} columns={batchColumns} loading={isLoading} pageSizeOptions={[5, 10]} initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} pagination disableRowSelectionOnClick density="compact" autoHeight sx={{ border: "none" }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Supplier Performance</Typography>
                <DataGrid rows={data?.supplierPerformance || []} columns={supplierColumns} loading={isLoading} pageSizeOptions={[5, 10]} initialState={{ pagination: { paginationModel: { pageSize: 5 } } }} pagination disableRowSelectionOnClick density="compact" autoHeight sx={{ border: "none" }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default MortalityReportPage;
