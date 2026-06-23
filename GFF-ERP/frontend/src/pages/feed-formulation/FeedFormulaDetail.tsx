import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip,
  Typography,
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  CompareArrows as CompareArrowsIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";

interface FormulaVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
}

interface ManufacturingOrderRef {
  id: string;
  orderNumber: string;
  quantity: number;
  status: string;
  startDate: string;
  yield: number | null;
}

interface FeedFormulaDetail {
  id: string;
  code: string;
  name: string;
  description: string;
  feedType: string;
  feedTypeLabel: string;
  isActive: boolean;
  targetProtein: number;
  targetEnergy: number;
  targetFiber: number;
  targetCalcium: number;
  targetPhosphorus: number;
  actualProtein: number;
  actualEnergy: number;
  actualFiber: number;
  actualCalcium: number;
  actualPhosphorus: number;
  totalCost: number;
  totalPercentage: number;
  ingredients: FormulaIngredient[];
  versions: FormulaVersion[];
  manufacturingOrders: ManufacturingOrderRef[];
  createdAt: string;
  updatedAt: string;
}

interface FormulaIngredient {
  id: string;
  productName: string;
  productCode: string;
  percentage: number;
  minPercentage: number | null;
  maxPercentage: number | null;
  actualProtein: number;
  actualEnergy: number;
  actualFiber: number;
  actualCalcium: number;
  actualPhosphorus: number;
  costPerKg: number;
  contribution: number;
}

const FEED_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  BROILER_STARTER: { bg: "#e3f2fd", color: "#1565c0" },
  BROILER_GROWER: { bg: "#e8f5e9", color: "#2e7d32" },
  BROILER_FINISHER: { bg: "#fff3e0", color: "#ef6c00" },
  LAYER: { bg: "#fce4ec", color: "#c62828" },
  BREEDER: { bg: "#f3e5f5", color: "#6a1b9a" },
  PREMIX: { bg: "#e0f2f1", color: "#00695c" },
  OTHER: { bg: "#f5f5f5", color: "#616161" },
};

const ORDER_STATUS_CHIP_PROPS: Record<string, { color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"; variant: "filled" | "outlined" }> = {
  DRAFT: { color: "default", variant: "outlined" },
  PLANNED: { color: "primary", variant: "outlined" },
  IN_PROGRESS: { color: "warning", variant: "filled" },
  COMPLETED: { color: "success", variant: "filled" },
  CANCELLED: { color: "error", variant: "outlined" },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const COST_COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0", "#00bcd4", "#795548", "#607d8b"];

const fetchFormulaDetail = async (id: string): Promise<FeedFormulaDetail> => {
  const response = await apiService.get<FeedFormulaDetail>(`/feed-formulation/formulas/${id}/detail`);
  return response.data;
};

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
    {value === index && children}
  </Box>
);

const FeedFormulaDetailPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: formula, isLoading, error } = useQuery<FeedFormulaDetail>({
    queryKey: ["feed-formula-detail", id],
    queryFn: () => fetchFormulaDetail(id!),
    enabled: Boolean(id),
    retry: 2,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const radarData = formula
    ? [
        { nutrient: "Protein", target: formula.targetProtein, actual: formula.actualProtein },
        { nutrient: "Energy", target: formula.targetEnergy / 100, actual: formula.actualEnergy / 100 },
        { nutrient: "Fiber", target: formula.targetFiber * 5, actual: formula.actualFiber * 5 },
        { nutrient: "Calcium", target: formula.targetCalcium * 20, actual: formula.actualCalcium * 20 },
        { nutrient: "Phosphorus", target: formula.targetPhosphorus * 40, actual: formula.actualPhosphorus * 40 },
      ]
    : [];

  const costBreakdownData = formula
    ? formula.ingredients.map((ing, idx) => ({
        name: ing.productName,
        value: Number(((ing.percentage / 100) * ing.costPerKg).toFixed(4)),
        fill: COST_COLORS[idx % COST_COLORS.length],
      }))
    : [];

  const comparisonData = formula
    ? [
        { nutrient: "Protein", target: formula.targetProtein, actual: formula.actualProtein },
        { nutrient: "Energy (ME)", target: formula.targetEnergy, actual: formula.actualEnergy },
        { nutrient: "Fiber", target: formula.targetFiber, actual: formula.actualFiber },
        { nutrient: "Calcium", target: formula.targetCalcium, actual: formula.actualCalcium },
        { nutrient: "Phosphorus", target: formula.targetPhosphorus, actual: formula.actualPhosphorus },
      ]
    : [];

  const moColumns: GridColDef[] = [
    { field: "orderNumber", headerName: "Order #", flex: 1, minWidth: 120 },
    {
      field: "quantity",
      headerName: "Qty (KG)",
      type: "number",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (p: any) => Number(p).toLocaleString(),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<ManufacturingOrderRef>) => {
        const s = params.value as string;
        const cp = ORDER_STATUS_CHIP_PROPS[s] || { color: "default", variant: "outlined" };
        return <Chip label={STATUS_LABELS[s] || s} size="small" color={cp.color} variant={cp.variant} />;
      },
    },
    {
      field: "startDate",
      headerName: "Date",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (p: any) => (p ? new Date(p).toLocaleDateString() : "-"),
    },
    {
      field: "yield",
      headerName: "Yield %",
      flex: 0.6,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<ManufacturingOrderRef>) => {
        const v = params.value as number | null;
        return v !== null ? `${v.toFixed(1)}%` : "-";
      },
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !formula) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load formula details.</Typography>
        <Button onClick={() => navigate("/feed-formulation/formulas")} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  const ftColors = FEED_TYPE_COLORS[formula.feedType] || { bg: "#f5f5f5", color: "#616161" };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <IconButton onClick={() => navigate("/feed-formulation/formulas")}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {formula.code}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              <Typography variant="subtitle1" color="text.secondary">
                {formula.name}
              </Typography>
              <Chip
                label={formula.feedTypeLabel}
                size="small"
                sx={{ backgroundColor: ftColors.bg, color: ftColors.color, fontWeight: 600 }}
              />
              <Chip
                label={formula.isActive ? "Active" : "Inactive"}
                color={formula.isActive ? "success" : "default"}
                size="small"
                variant={formula.isActive ? "filled" : "outlined"}
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            onClick={() => navigate(`/feed-formulation/formulas/compare?formula1=${id}`)}
            size="small"
          >
            Compare
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => navigate(`/feed-formulation/formulas/new?duplicate=${id}`)}
            size="small"
          >
            Duplicate
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/feed-formulation/formulas/${id}/edit`)}
            size="small"
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Protein
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formula.actualProtein.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target: {formula.targetProtein}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Energy (ME)
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formula.actualEnergy.toFixed(0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target: {formula.targetEnergy}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Fiber
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formula.actualFiber.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target: {formula.targetFiber}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Calcium
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formula.actualCalcium.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target: {formula.targetCalcium}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Phosphorus
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formula.actualPhosphorus.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target: {formula.targetPhosphorus}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }}>
            <Typography variant="caption" color="text.secondary">
              Cost/KG
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              ${formula.totalCost.toFixed(3)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Ingredients & Analysis" />
          <Tab label="Nutritional Charts" />
          <Tab label="Version History" />
          <Tab label="Manufacturing Orders" />
        </Tabs>
        <Divider />
        <CardContent>
          {/* Tab 0: Ingredients */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Ingredients ({formula.ingredients.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell>Ingredient</TableCell>
                        <TableCell align="right">%</TableCell>
                        <TableCell align="right">Protein %</TableCell>
                        <TableCell align="right">Energy</TableCell>
                        <TableCell align="right">Fiber %</TableCell>
                        <TableCell align="right">Ca %</TableCell>
                        <TableCell align="right">P %</TableCell>
                        <TableCell align="right">Cost/KG</TableCell>
                        <TableCell align="right">Contribution</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formula.ingredients.map((ing: FormulaIngredient) => (
                        <TableRow key={ing.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {ing.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ing.productCode}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" fontWeight="bold">
                            {ing.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">{ing.actualProtein.toFixed(1)}</TableCell>
                          <TableCell align="right">{ing.actualEnergy.toFixed(0)}</TableCell>
                          <TableCell align="right">{ing.actualFiber.toFixed(1)}</TableCell>
                          <TableCell align="right">{ing.actualCalcium.toFixed(2)}</TableCell>
                          <TableCell align="right">{ing.actualPhosphorus.toFixed(2)}</TableCell>
                          <TableCell align="right">${ing.costPerKg.toFixed(3)}</TableCell>
                          <TableCell align="right">${ing.contribution.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} lg={5}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Target vs Actual Comparison
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell>Nutrient</TableCell>
                        <TableCell align="right">Target</TableCell>
                        <TableCell align="right">Actual</TableCell>
                        <TableCell align="right">Difference</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparisonData.map((row) => {
                        const diff = row.actual - row.target;
                        const isGood = Math.abs(diff) / (row.target || 1) < 0.03;
                        const isOk = Math.abs(diff) / (row.target || 1) < 0.1;
                        return (
                          <TableRow key={row.nutrient} hover>
                            <TableCell fontWeight={500}>{row.nutrient}</TableCell>
                            <TableCell align="right">{row.target.toFixed(row.nutrient === "Energy (ME)" ? 0 : row.nutrient === "Calcium" || row.nutrient === "Phosphorus" ? 2 : 1)}</TableCell>
                            <TableCell align="right" fontWeight="bold">
                              {row.actual.toFixed(row.nutrient === "Energy (ME)" ? 0 : row.nutrient === "Calcium" || row.nutrient === "Phosphorus" ? 2 : 1)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: diff >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                fontWeight: 600,
                              }}
                            >
                              {diff >= 0 ? "+" : ""}
                              {diff.toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={isGood ? "On Target" : isOk ? "Close" : "Off Target"}
                                color={isGood ? "success" : isOk ? "warning" : "error"}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Cost Breakdown
                  </Typography>
                  {formula.ingredients.map((ing, idx) => (
                    <Box key={ing.id} sx={{ mb: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                        <Typography variant="caption">
                          {ing.productName} ({ing.percentage.toFixed(1)}%)
                        </Typography>
                        <Typography variant="caption" fontWeight={500}>
                          ${ing.contribution.toFixed(4)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(
                          (ing.contribution / Math.max(formula.totalCost, 0.001)) * 100,
                          1
                        )}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: COST_COLORS[idx % COST_COLORS.length],
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 1: Charts */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom align="center">
                  Nutrient Profile (Radar)
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="nutrient" />
                      <PolarRadiusAxis />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#2196f3"
                        fill="#2196f3"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Actual"
                        dataKey="actual"
                        stroke="#4caf50"
                        fill="#4caf50"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Legend />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom align="center">
                  Cost Breakdown by Ingredient
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {costBreakdownData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => [`$${Number(value).toFixed(4)}`, "Cost"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Version History */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Version History
            </Typography>
            {formula.versions.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>Version</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Changed By</TableCell>
                      <TableCell>Changes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formula.versions.map((v: FormulaVersion) => (
                      <TableRow key={v.id} hover>
                        <TableCell>
                          <Chip label={`v${v.version}`} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{v.createdBy}</TableCell>
                        <TableCell>{v.changes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No version history available.</Typography>
            )}
          </TabPanel>

          {/* Tab 3: Manufacturing Orders */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Manufacturing Orders Using This Formula
            </Typography>
            <DataGrid
              rows={formula.manufacturingOrders}
              columns={moColumns}
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              pagination
              disableRowSelectionOnClick
              density="compact"
              autoHeight
              sx={{ border: "none" }}
            />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FeedFormulaDetailPage;
