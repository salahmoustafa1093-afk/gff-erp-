import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Egg as EggIcon,
  Pets as PetsIcon,
  TrendingDown as TrendingDownIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
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
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface PoultryKPI {
  activeBatches: number;
  totalChicks: number;
  mortalityRate: number;
  todayEggProduction: number;
  activeHouses: number;
  totalCapacity: number;
  capacityUtilization: number;
}

interface MortalityTrendPoint {
  date: string;
  mortalityCount: number;
  cumulativeRate: number;
}

interface ActiveBatch {
  id: string;
  batchNumber: string;
  breedType: string;
  ageDays: number;
  currentQty: number;
  mortalityRate: number;
  houseName: string;
  arrivalDate: string;
}

interface EggTrendPoint {
  date: string;
  totalEggs: number;
  largeEggs: number;
  mediumEggs: number;
  smallEggs: number;
  brokenEggs: number;
}

interface BreedDistribution {
  breedType: string;
  count: number;
  fill: string;
}

interface AgeDistribution {
  ageRange: string;
  count: number;
}

interface PoultryDashboardData {
  kpis: PoultryKPI;
  mortalityTrend: MortalityTrendPoint[];
  activeBatches: ActiveBatch[];
  eggProductionTrend: EggTrendPoint[];
  breedDistribution: BreedDistribution[];
  ageDistribution: AgeDistribution[];
}

const BREED_COLORS: Record<string, string> = {
  BROILER: "#4caf50",
  LAYER: "#2196f3",
  BREEDER: "#ff9800",
  PIGEON: "#9c27b0",
  OTHER: "#607d8b",
};

const BREED_LABELS: Record<string, string> = {
  BROILER: "Broiler",
  LAYER: "Layer",
  BREEDER: "Breeder",
  PIGEON: "Pigeon",
  OTHER: "Other",
};

const fetchPoultryDashboard = async (): Promise<PoultryDashboardData> => {
  const response = await apiService.get<PoultryDashboardData>("/poultry/dashboard");
  return response.data;
};

const PoultryDashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery<PoultryDashboardData>({
    queryKey: ["poultry-dashboard"],
    queryFn: fetchPoultryDashboard,
    refetchInterval: 300000,
  });

  const kpiCards = useMemo(() => {
    if (!data) return [];
    const { kpis: k } = data;
    return [
      { label: "Active Batches", value: k.activeBatches, sub: `${k.activeHouses} houses`, icon: <PetsIcon fontSize="large" />, color: theme.palette.primary.main },
      { label: "Total Chicks", value: k.totalChicks.toLocaleString(), sub: "current stock", icon: <PetsIcon fontSize="large" />, color: theme.palette.success.main },
      { label: "Mortality Rate", value: `${k.mortalityRate.toFixed(1)}%`, sub: "cumulative", icon: <TrendingDownIcon fontSize="large" />, color: k.mortalityRate > 5 ? theme.palette.error.main : k.mortalityRate > 3 ? theme.palette.warning.main : theme.palette.success.main },
      { label: "Today's Eggs", value: k.todayEggProduction.toLocaleString(), sub: "collected today", icon: <EggIcon fontSize="large" />, color: theme.palette.info.main },
      { label: "Active Houses", value: k.activeHouses, sub: `of ${k.totalCapacity} capacity`, icon: <HomeIcon fontSize="large" />, color: theme.palette.secondary.main },
      { label: "Capacity Used", value: `${k.capacityUtilization.toFixed(0)}%`, sub: "utilization", icon: <HomeIcon fontSize="large" />, color: k.capacityUtilization > 90 ? theme.palette.error.main : theme.palette.warning.main },
    ];
  }, [data, theme]);

  const batchColumns: GridColDef[] = [
    { field: "batchNumber", headerName: "Batch #", flex: 1, minWidth: 100 },
    {
      field: "breedType",
      headerName: "Breed",
      flex: 0.8,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<ActiveBatch>) => (
        <Chip label={BREED_LABELS[params.value as string] || params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    { field: "ageDays", headerName: "Age (Days)", type: "number", flex: 0.7, minWidth: 70 },
    { field: "currentQty", headerName: "Current Qty", type: "number", flex: 0.8, minWidth: 80, valueFormatter: (p: any) => Number(p).toLocaleString() },
    {
      field: "mortalityRate",
      headerName: "Mort %",
      type: "number",
      flex: 0.7,
      minWidth: 70,
      renderCell: (params: GridRenderCellParams<ActiveBatch>) => {
        const val = params.value as number;
        return (
          <Chip
            label={`${val.toFixed(1)}%`}
            size="small"
            color={val > 5 ? "error" : val > 3 ? "warning" : "success"}
            variant="outlined"
          />
        );
      },
    },
    { field: "houseName", headerName: "House", flex: 0.8, minWidth: 80 },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load poultry dashboard.</Typography>
        <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Poultry Dashboard</Typography>
        <IconButton onClick={() => refetch()} disabled={isLoading}><RefreshIcon /></IconButton>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card sx={{ height: "100%", borderLeft: `4px solid ${kpi.color}`, transition: "box-shadow 0.2s", "&:hover": { boxShadow: theme.shadows[6] } }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ color: kpi.color, mr: 1 }}>{kpi.icon}</Box>
                  <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">{isLoading ? "—" : kpi.value}</Typography>
                {!isLoading && <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 380 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Mortality Trend (14 Days)</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.mortalityTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="mortalityCount" stroke="#f44336" strokeWidth={2} dot={{ r: 3 }} name="Daily Deaths" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulativeRate" stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="Cumulative %" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 380 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Egg Production Trend</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.eggProductionTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalEggs" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} name="Total" />
                    <Line type="monotone" dataKey="largeEggs" stroke="#2196f3" strokeWidth={2} dot={{ r: 2 }} name="Large" />
                    <Line type="monotone" dataKey="mediumEggs" stroke="#ff9800" strokeWidth={2} dot={{ r: 2 }} name="Medium" />
                    <Line type="monotone" dataKey="smallEggs" stroke="#9c27b0" strokeWidth={2} dot={{ r: 2 }} name="Small" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 + Batches Table */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: 380 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom align="center">Breed Distribution</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.breedDistribution || []} cx="50%" cy="50%" outerRadius={100} dataKey="count" label={({ breedType, count }: any) => `${BREED_LABELS[breedType] || breedType}: ${count}`}>
                      {(data?.breedDistribution || []).map((entry: BreedDistribution, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 380 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom align="center">Age Distribution</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.ageDistribution || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="ageRange" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#2196f3" radius={[4, 4, 0, 0]} name="Batches" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 380 }}>
            <CardContent sx={{ height: "100%", p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ p: 2, pb: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Active Batches</Typography>
              </Box>
              <DataGrid
                rows={data?.activeBatches || []}
                columns={batchColumns}
                loading={isLoading}
                pageSizeOptions={[5, 10]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                pagination
                disableRowSelectionOnClick
                density="compact"
                sx={{ border: "none", height: 310 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PoultryDashboardPage;
