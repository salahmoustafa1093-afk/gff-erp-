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
  LinearProgress,
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
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Edit as EditIcon,
  LocalShipping as LocalShippingIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";

interface MortalityRecord {
  id: string;
  date: string;
  count: number;
  cause: string;
  causeLabel: string;
  notes: string;
  recordedBy: string;
}

interface DistributionRecord {
  id: string;
  date: string;
  type: string;
  typeLabel: string;
  quantity: number;
  destination: string;
  notes: string;
}

interface GrowthMilestone {
  day: number;
  label: string;
  achieved: boolean;
  actualDate: string | null;
}

interface BatchDetail {
  id: string;
  batchNumber: string;
  breedType: string;
  breedTypeLabel: string;
  supplierName: string;
  arrivalDate: string;
  quantity: number;
  currentQty: number;
  mortalityCount: number;
  mortalityRate: number;
  ageDays: number;
  status: string;
  statusLabel: string;
  houseName: string;
  unitCost: number;
  totalCost: number;
  notes: string;
  mortalityRecords: MortalityRecord[];
  distributionRecords: DistributionRecord[];
  growthMilestones: GrowthMilestone[];
  mortalityTrend: { date: string; count: number; cumulativeRate: number }[];
}

const BREED_COLORS: Record<string, string> = {
  BROILER: "#4caf50",
  LAYER: "#2196f3",
  BREEDER: "#ff9800",
  PIGEON: "#9c27b0",
  OTHER: "#607d8b",
};

const CAUSE_LABELS: Record<string, string> = {
  DISEASE: "Disease",
  HEAT: "Heat Stress",
  COLD: "Cold Stress",
  PREDATOR: "Predator",
  OTHER: "Other",
};

const CAUSE_COLORS: Record<string, string> = {
  DISEASE: "#f44336",
  HEAT: "#ff9800",
  COLD: "#2196f3",
  PREDATOR: "#795548",
  OTHER: "#9e9e9e",
};

const DIST_TYPE_LABELS: Record<string, string> = {
  SALE: "Sale",
  INTERNAL_TRANSFER: "Internal Transfer",
  FARM_TRANSFER: "Farm Transfer",
  RETURN: "Return",
};

const STATUS_CHIP_PROPS: Record<string, { color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"; variant: "filled" | "outlined" }> = {
  ACTIVE: { color: "success", variant: "filled" },
  SOLD: { color: "primary", variant: "outlined" },
  TRANSFERRED: { color: "info", variant: "outlined" },
  CLOSED: { color: "default", variant: "outlined" },
};

const fetchBatchDetail = async (id: string): Promise<BatchDetail> => {
  const response = await apiService.get<BatchDetail>(`/poultry/batches/${id}`);
  return response.data;
};

interface TabPanelProps { children: React.ReactNode; value: number; index: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>{value === index && children}</Box>
);

const ChicksBatchDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: batch, isLoading, error } = useQuery<BatchDetail>({
    queryKey: ["batch-detail", id],
    queryFn: () => fetchBatchDetail(id!),
    enabled: Boolean(id),
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);

  const distColumns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 0.8, minWidth: 100, valueFormatter: (p: any) => new Date(p).toLocaleDateString() },
    { field: "typeLabel", headerName: "Type", flex: 0.8, minWidth: 90 },
    { field: "quantity", headerName: "Qty", type: "number", flex: 0.6, minWidth: 60, valueFormatter: (p: any) => Number(p).toLocaleString() },
    { field: "destination", headerName: "Destination", flex: 1, minWidth: 120 },
    { field: "notes", headerName: "Notes", flex: 1, minWidth: 100 },
  ];

  if (isLoading) return <Box sx={{ p: 3 }}><LinearProgress /></Box>;
  if (error || !batch) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">Failed to load batch details.</Typography>
      <Button onClick={() => navigate("/poultry/batches")} sx={{ mt: 2 }}>Back</Button>
    </Box>
  );

  const breedColor = BREED_COLORS[batch.breedType] || "#607d8b";
  const mortColor = batch.mortalityRate > 5 ? "error" : batch.mortalityRate > 3 ? "warning" : "success";

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate("/poultry/batches")}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">{batch.batchNumber}</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              <Chip label={batch.breedTypeLabel} size="small" sx={{ bgcolor: breedColor + "20", color: breedColor, fontWeight: 600 }} />
              <Chip label={batch.statusLabel} size="small" color={STATUS_CHIP_PROPS[batch.status]?.color || "default"} variant={STATUS_CHIP_PROPS[batch.status]?.variant || "outlined"} />
              <Chip label={`${batch.ageDays} days old`} size="small" variant="outlined" />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {batch.status === "ACTIVE" && (
            <Button variant="outlined" color="warning" size="small" startIcon={<TrendingDownIcon />} onClick={() => navigate(`/poultry/batches/${id}/mortality`)}>
              Record Mortality
            </Button>
          )}
          <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => navigate(`/poultry/batches/${id}/edit`)}>Edit</Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Initial Qty</Typography><Typography variant="h6" fontWeight="bold">{batch.quantity.toLocaleString()}</Typography></Paper></Grid>
        <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Current Qty</Typography><Typography variant="h6" fontWeight="bold" color="primary">{batch.currentQty.toLocaleString()}</Typography></Paper></Grid>
        <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Mortality</Typography><Typography variant="h6" fontWeight="bold" color={`${mortColor}.main`}>{batch.mortalityCount} ({batch.mortalityRate.toFixed(1)}%)</Typography></Paper></Grid>
        <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Cost</Typography><Typography variant="h6" fontWeight="bold" color="primary">${batch.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography></Paper></Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Mortality (${batch.mortalityRecords.length})`} />
          <Tab label={`Distribution (${batch.distributionRecords.length})`} />
          <Tab label="Age Tracking" />
        </Tabs>
        <Divider />
        <CardContent>
          {/* Overview */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Batch Information</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Batch Number</TableCell><TableCell>{batch.batchNumber}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Breed Type</TableCell><TableCell>{batch.breedTypeLabel}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell><TableCell>{batch.supplierName}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Arrival Date</TableCell><TableCell>{new Date(batch.arrivalDate).toLocaleDateString()}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Current Age</TableCell><TableCell>{batch.ageDays} days</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell><Chip label={batch.statusLabel} size="small" color={STATUS_CHIP_PROPS[batch.status]?.color || "default"} /></TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>House</TableCell><TableCell>{batch.houseName}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Unit Cost</TableCell><TableCell>${batch.unitCost.toFixed(2)}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Notes</Typography>
                <Paper sx={{ p: 2 }} variant="outlined"><Typography variant="body2">{batch.notes || "No notes recorded."}</Typography></Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Mortality */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Mortality Records</Typography>
                  {batch.status === "ACTIVE" && (
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate(`/poultry/batches/${id}/mortality`)}>
                      Add Record
                    </Button>
                  )}
                </Box>
                {batch.mortalityRecords.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead><TableRow sx={{ backgroundColor: theme.palette.grey[100] }}><TableCell>Date</TableCell><TableCell>Count</TableCell><TableCell>Cause</TableCell><TableCell>Notes</TableCell><TableCell>Recorded By</TableCell></TableRow></TableHead>
                      <TableBody>
                        {batch.mortalityRecords.map((rec: MortalityRecord) => (
                          <TableRow key={rec.id} hover>
                            <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                            <TableCell fontWeight="bold" color="error">{rec.count}</TableCell>
                            <TableCell><Chip label={rec.causeLabel} size="small" sx={{ bgcolor: (CAUSE_COLORS[rec.cause] || "#9e9e9e") + "20", color: CAUSE_COLORS[rec.cause] || "#9e9e9e", fontWeight: 600 }} /></TableCell>
                            <TableCell>{rec.notes || "—"}</TableCell>
                            <TableCell>{rec.recordedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography color="text.secondary">No mortality records.</Typography>}
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Mortality Trend</Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={batch.mortalityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="mortGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f44336" stopOpacity={0.3} /><stop offset="95%" stopColor="#f44336" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val: string) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="count" stroke="#f44336" fill="url(#mortGrad)" strokeWidth={2} name="Deaths" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Cumulative Mortality Rate</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: batch.mortalityRate > 5 ? theme.palette.error.main : batch.mortalityRate > 3 ? theme.palette.warning.main : theme.palette.success.main }}>
                    {batch.mortalityRate.toFixed(2)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Distribution */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Distribution / Sales Records</Typography>
            {batch.distributionRecords.length > 0 ? (
              <DataGrid
                rows={batch.distributionRecords}
                columns={distColumns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                pagination
                disableRowSelectionOnClick
                density="compact"
                autoHeight
                sx={{ border: "none" }}
              />
            ) : <Typography color="text.secondary">No distribution records.</Typography>}
          </TabPanel>

          {/* Age Tracking */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Growth Milestones</Typography>
            <Grid container spacing={2}>
              {batch.growthMilestones.map((ms: GrowthMilestone) => (
                <Grid item xs={12} sm={6} md={4} key={ms.day}>
                  <Paper sx={{ p: 2, borderLeft: `4px solid ${ms.achieved ? theme.palette.success.main : theme.palette.grey[400]}` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {ms.achieved ? <CalendarTodayIcon color="success" /> : <CalendarTodayIcon color="disabled" />}
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>Day {ms.day}: {ms.label}</Typography>
                        <Typography variant="caption" color={ms.achieved ? "success.main" : "text.secondary"}>
                          {ms.achieved && ms.actualDate ? `Achieved: ${new Date(ms.actualDate).toLocaleDateString()}` : batch.ageDays >= ms.day ? "Expected now" : "Upcoming"}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChicksBatchDetail;
