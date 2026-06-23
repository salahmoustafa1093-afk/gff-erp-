import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
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
  useMediaQuery,
  Alert,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  AttachMoney as AttachMoneyIcon,
  VerifiedUser as VerifiedUserIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
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
  AreaChart,
  Area,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface ProductionKPI {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  change?: number;
  changeLabel?: string;
}

interface ProductionStatusData {
  status: string;
  count: number;
  fill: string;
}

interface DailyOutputData {
  date: string;
  output: number;
  target: number;
}

interface YieldTrendData {
  date: string;
  yield: number;
}

interface FeedCostData {
  date: string;
  cost: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  feedFormulaName: string;
  quantity: number;
  status: string;
  startDate: string;
  endDate: string | null;
  yield: number | null;
  actualCost: number | null;
}

interface QCAlert {
  id: string;
  severity: "warning" | "error" | "info";
  message: string;
  orderNumber: string;
  date: string;
}

interface CapacityData {
  name: string;
  value: number;
  fill: string;
}

interface DashboardData {
  kpis: {
    activeOrders: number;
    completedToday: number;
    monthlyOutput: number;
    avgYield: number;
    totalProductionCost: number;
    qualityPassRate: number;
    activeOrdersChange: number;
    completedTodayChange: number;
    monthlyOutputChange: number;
    avgYieldChange: number;
    totalProductionCostChange: number;
    qualityPassRateChange: number;
  };
  statusData: ProductionStatusData[];
  dailyOutput: DailyOutputData[];
  yieldTrend: YieldTrendData[];
  feedCostTrend: FeedCostData[];
  recentOrders: RecentOrder[];
  qcAlerts: QCAlert[];
  capacityData: CapacityData[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9e9e9e",
  PLANNED: "#2196f3",
  IN_PROGRESS: "#ff9800",
  COMPLETED: "#4caf50",
  CANCELLED: "#f44336",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ORDER_STATUS_CHIP_PROPS: Record<string, { color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"; variant: "filled" | "outlined" }> = {
  DRAFT: { color: "default", variant: "outlined" },
  PLANNED: { color: "primary", variant: "outlined" },
  IN_PROGRESS: { color: "warning", variant: "filled" },
  COMPLETED: { color: "success", variant: "filled" },
  CANCELLED: { color: "error", variant: "outlined" },
};

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await apiService.get<DashboardData>("/production/dashboard");
  return response.data;
};

const ProductionDashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["production-dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 300000,
    retry: 2,
  });

  const [pageSize, setPageSize] = useState<number>(5);

  const kpis: ProductionKPI[] = useMemo(() => {
    if (!data) return [];
    const { kpis: k } = data;
    return [
      {
        label: "Active Orders",
        value: k.activeOrders,
        icon: <AssignmentIcon fontSize="large" />,
        color: theme.palette.primary.main,
        change: k.activeOrdersChange,
        changeLabel: "vs last week",
      },
      {
        label: "Completed Today",
        value: k.completedToday,
        icon: <CheckCircleIcon fontSize="large" />,
        color: theme.palette.success.main,
        change: k.completedTodayChange,
        changeLabel: "vs yesterday",
      },
      {
        label: "Monthly Output (Tons)",
        value: k.monthlyOutput.toFixed(2),
        icon: <TrendingUpIcon fontSize="large" />,
        color: theme.palette.info.main,
        change: k.monthlyOutputChange,
        changeLabel: "vs last month",
      },
      {
        label: "Avg Yield %",
        value: `${k.avgYield.toFixed(1)}%`,
        icon: <SpeedIcon fontSize="large" />,
        color: theme.palette.warning.main,
        change: k.avgYieldChange,
        changeLabel: "vs target",
      },
      {
        label: "Production Cost",
        value: `$${k.totalProductionCost.toLocaleString()}`,
        icon: <AttachMoneyIcon fontSize="large" />,
        color: theme.palette.error.main,
        change: k.totalProductionCostChange,
        changeLabel: "vs last month",
      },
      {
        label: "Quality Pass Rate",
        value: `${k.qualityPassRate.toFixed(1)}%`,
        icon: <VerifiedUserIcon fontSize="large" />,
        color: "#4caf50",
        change: k.qualityPassRateChange,
        changeLabel: "vs target",
      },
    ];
  }, [data, theme]);

  const recentOrderColumns: GridColDef[] = [
    {
      field: "orderNumber",
      headerName: "Order #",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "feedFormulaName",
      headerName: "Feed Formula",
      flex: 1.5,
      minWidth: 140,
    },
    {
      field: "quantity",
      headerName: "Qty (KG)",
      type: "number",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (params: any) => Number(params).toLocaleString(),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<RecentOrder>) => {
        const status = params.value as string;
        const chipProps = ORDER_STATUS_CHIP_PROPS[status] || { color: "default", variant: "outlined" };
        return (
          <Chip
            label={STATUS_LABELS[status] || status}
            color={chipProps.color}
            variant={chipProps.variant}
            size="small"
          />
        );
      },
    },
    {
      field: "startDate",
      headerName: "Start Date",
      flex: 1,
      minWidth: 110,
      valueFormatter: (params: any) =>
        params ? new Date(params).toLocaleDateString() : "-",
    },
    {
      field: "yield",
      headerName: "Yield %",
      type: "number",
      flex: 0.8,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<RecentOrder>) => {
        const val = params.value as number | null;
        if (val === null || val === undefined) return "-";
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
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<RecentOrder>) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => navigate(`/manufacturing/orders/${params.row.id}`)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load production dashboard data. Please try again.
        </Alert>
        <IconButton onClick={() => refetch()} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="primary">
          Production Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              sx={{
                height: "100%",
                borderLeft: `4px solid ${kpi.color}`,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: theme.shadows[6] },
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ color: kpi.color, mr: 1 }}>{kpi.icon}</Box>
                  <Typography variant="caption" color="text.secondary">
                    {kpi.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {isLoading ? "—" : kpi.value}
                </Typography>
                {kpi.change !== undefined && !isLoading && (
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        (kpi.change || 0) >= 0
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                      fontWeight: 500,
                    }}
                  >
                    {(kpi.change || 0) >= 0 ? "+" : ""}
                    {kpi.change?.toFixed(1)}% {kpi.changeLabel}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1: Status Bar + Daily Output */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 400 }}>
            <CardHeader
              title="Production by Status"
              subheader="Current manufacturing orders distribution"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.statusData || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tickFormatter={(val: string) => STATUS_LABELS[val] || val}
                  />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [value, "Orders"]}
                    labelFormatter={(label: string) => STATUS_LABELS[label] || label}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(data?.statusData || []).map((entry: ProductionStatusData, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 400 }}>
            <CardHeader
              title="Daily Output Trend"
              subheader="Actual vs Target output (last 14 days)"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.dailyOutput || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString()} KG`,
                      name === "output" ? "Actual Output" : "Target",
                    ]}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="output"
                    stroke="#4caf50"
                    fillOpacity={1}
                    fill="url(#colorOutput)"
                    strokeWidth={2}
                    name="Actual Output"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#2196f3"
                    fillOpacity={1}
                    fill="url(#colorTarget)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2: Yield Trend + Feed Cost */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 380 }}>
            <CardHeader
              title="Yield Percentage Trend"
              subheader="Production yield over time (target: 98%)"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data?.yieldTrend || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Yield"]}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke="#ff9800"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#ff9800" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 380 }}>
            <CardHeader
              title="Feed Cost Trend"
              subheader="Cost per KG over time"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.feedCostTrend || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f44336" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f44336" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(val: number) => `$${val}`} />
                  <RechartsTooltip
                    formatter={(value: any) => [`$${Number(value).toFixed(3)}`, "Cost/KG"]}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#f44336"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Capacity Utilization + QC Alerts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 380 }}>
            <CardHeader
              title="Capacity Utilization"
              subheader="Current production line utilization"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.capacityData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {(data?.capacityData || []).map((entry: CapacityData, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any, name: any) => [`${value}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: -2, textAlign: "center" }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {data?.capacityData?.reduce((acc: number, curr: CapacityData) => acc + curr.value, 0).toFixed(0) || "0"}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overall Capacity Used
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                {(data?.capacityData || []).map((item: CapacityData) => (
                  <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: item.fill,
                      }}
                    />
                    <Typography variant="caption">{item.name}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 380 }}>
            <CardHeader
              title="Quality Control Alerts"
              subheader="Recent quality issues requiring attention"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320, overflow: "auto" }}>
              {isLoading ? (
                <LinearProgress />
              ) : data?.qcAlerts && data.qcAlerts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Severity</TableCell>
                        <TableCell>Alert</TableCell>
                        <TableCell>Order</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.qcAlerts.map((alert: QCAlert) => (
                        <TableRow key={alert.id} hover>
                          <TableCell>
                            {alert.severity === "error" ? (
                              <ErrorIcon color="error" fontSize="small" />
                            ) : alert.severity === "warning" ? (
                              <WarningIcon color="warning" fontSize="small" />
                            ) : (
                              <InfoIcon color="info" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell>{alert.message}</TableCell>
                          <TableCell>
                            <Chip
                              label={alert.orderNumber}
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/manufacturing/orders/${alert.id}`)}
                              sx={{ cursor: "pointer" }}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(alert.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <VerifiedUserIcon
                    sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1 }}
                  />
                  <Typography variant="h6" color="success.main">
                    All Clear
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No quality control alerts at this time
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Manufacturing Orders */}
      <Card>
        <CardHeader
          title="Recent Manufacturing Orders"
          subheader="Latest production orders with status and yield"
          titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
          action={
            <Chip
              label="View All"
              color="primary"
              size="small"
              onClick={() => navigate("/manufacturing/orders")}
              sx={{ cursor: "pointer", mt: 1, mr: 1 }}
            />
          }
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={data?.recentOrders || []}
            columns={recentOrderColumns}
            loading={isLoading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
            pagination
            disableRowSelectionOnClick
            density="compact"
            autoHeight
            sx={{ border: "none" }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductionDashboardPage;
