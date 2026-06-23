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
  Step,
  StepLabel,
  Stepper,
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
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Pause as PauseIcon,
  Science as ScienceIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";
import QualityControlForm from "./QualityControlForm";

interface ConsumptionRecord {
  id: string;
  ingredientName: string;
  plannedQty: number;
  actualQty: number;
  unit: string;
  unitCost: number;
  variance: number;
  variancePercent: number;
}

interface QualityTest {
  id: string;
  testType: string;
  testValue: number;
  acceptableMin: number;
  acceptableMax: number;
  result: string;
  notes: string;
  testedBy: string;
  testedDate: string;
}

interface OutputRecord {
  id: string;
  batchNumber: string;
  quantity: number;
  qualityGrade: string;
  producedDate: string;
  expiryDate: string;
}

interface CostBreakdown {
  materialCost: number;
  overheadCost: number;
  laborCost: number;
  totalCost: number;
  costPerKg: number;
}

interface ManufacturingOrderDetail {
  id: string;
  orderNumber: string;
  feedFormulaId: string;
  feedFormulaName: string;
  feedFormulaCode: string;
  quantity: number;
  actualQuantity: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  expectedStartDate: string;
  expectedEndDate: string;
  yield: number | null;
  actualCost: number | null;
  plannedCost: number;
  notes: string;
  createdAt: string;
  rawMaterialWarehouse: string;
  finishedGoodsWarehouse: string;
  consumption: ConsumptionRecord[];
  qualityTests: QualityTest[];
  outputs: OutputRecord[];
  costBreakdown: CostBreakdown | null;
}

const STATUS_WORKFLOW = ["DRAFT", "PLANNED", "IN_PROGRESS", "COMPLETED"];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
};
const STATUS_COLORS: Record<string, "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"> = {
  DRAFT: "default",
  PLANNED: "primary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  ON_HOLD: "info",
};

const TEST_TYPE_LABELS: Record<string, string> = {
  PROTEIN: "Protein",
  MOISTURE: "Moisture",
  ASH: "Ash",
  FIBER: "Fiber",
  FAT: "Fat",
  AFLATOXIN: "Aflatoxin",
  OTHER: "Other",
};

const fetchOrderDetail = async (id: string): Promise<ManufacturingOrderDetail> => {
  const response = await apiService.get<ManufacturingOrderDetail>(`/manufacturing/orders/${id}`);
  return response.data;
};

const updateOrderStatus = async ({ id, status }: { id: string; status: string }): Promise<void> => {
  await apiService.patch(`/manufacturing/orders/${id}/status`, { status });
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

const ManufacturingOrderDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [qcFormOpen, setQcFormOpen] = useState(false);

  const { data: order, isLoading, error } = useQuery<ManufacturingOrderDetail>({
    queryKey: ["manufacturing-order", id],
    queryFn: () => fetchOrderDetail(id!),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-order", id] });
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getWorkflowStep = (status: string) => {
    if (status === "CANCELLED") return -1;
    return STATUS_WORKFLOW.indexOf(status);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load order details.</Typography>
        <Button onClick={() => navigate("/manufacturing/orders")} sx={{ mt: 2 }}>Back to Orders</Button>
      </Box>
    );
  }

  const workflowStep = getWorkflowStep(order.status);
  const yieldPercent = order.yield !== null ? order.yield : 0;
  const costBreakdown = order.costBreakdown;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate("/manufacturing/orders")}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {order.orderNumber}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              <Chip label={STATUS_LABELS[order.status] || order.status} color={STATUS_COLORS[order.status] || "default"} size="small" />
              <Typography variant="body2" color="text.secondary">
                {order.feedFormulaName}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {order.status === "DRAFT" && (
            <Button variant="outlined" size="small" onClick={() => statusMutation.mutate({ id: order.id, status: "PLANNED" })}>Plan</Button>
          )}
          {(order.status === "DRAFT" || order.status === "PLANNED") && (
            <Button variant="contained" color="warning" size="small" startIcon={<PlayArrowIcon />} onClick={() => statusMutation.mutate({ id: order.id, status: "IN_PROGRESS" })}>
              Start Production
            </Button>
          )}
          {order.status === "IN_PROGRESS" && (
            <>
              <Button variant="outlined" size="small" startIcon={<PauseIcon />} onClick={() => statusMutation.mutate({ id: order.id, status: "ON_HOLD" })}>Hold</Button>
              <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => statusMutation.mutate({ id: order.id, status: "COMPLETED" })}>
                Complete
              </Button>
            </>
          )}
          {order.status === "ON_HOLD" && (
            <Button variant="contained" color="warning" size="small" startIcon={<PlayArrowIcon />} onClick={() => statusMutation.mutate({ id: order.id, status: "IN_PROGRESS" })}>
              Resume
            </Button>
          )}
          {(order.status === "DRAFT" || order.status === "PLANNED") && (
            <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon />} onClick={() => statusMutation.mutate({ id: order.id, status: "CANCELLED" })}>
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      {/* Workflow Visual */}
      {order.status !== "CANCELLED" && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Stepper activeStep={workflowStep} alternativeLabel>
            {STATUS_WORKFLOW.map((label) => (
              <Step key={label}>
                <StepLabel>{STATUS_LABELS[label]}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>
      )}

      {order.status === "CANCELLED" && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.error.light + "20", border: `1px solid ${theme.palette.error.main}` }}>
          <Typography variant="h6" color="error" fontWeight="bold">This order has been cancelled.</Typography>
        </Paper>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">Planned Qty</Typography>
            <Typography variant="h6" fontWeight="bold">{order.quantity.toLocaleString()} KG</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">Actual Qty</Typography>
            <Typography variant="h6" fontWeight="bold" color={order.actualQuantity !== null ? "success.main" : "text.secondary"}>
              {order.actualQuantity !== null ? order.actualQuantity.toLocaleString() : "—"} KG
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">Yield</Typography>
            <Typography variant="h6" fontWeight="bold" color={order.yield !== null ? (order.yield >= 98 ? "success.main" : "warning.main") : "text.secondary"}>
              {order.yield !== null ? `${order.yield.toFixed(1)}%` : "—"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">Cost/KG</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {order.actualCost !== null ? `$${order.actualCost.toFixed(3)}` : "—"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Consumption (${order.consumption.length})`} />
          <Tab label={`Quality Control (${order.qualityTests.length})`} />
          <Tab label={`Output (${order.outputs.length})`} />
          <Tab label="Cost Analysis" />
        </Tabs>
        <Divider />
        <CardContent>
          {/* Overview */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Order Information</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Order Number</TableCell><TableCell>{order.orderNumber}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Feed Formula</TableCell><TableCell>{order.feedFormulaCode} - {order.feedFormulaName}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell><Chip label={STATUS_LABELS[order.status]} color={STATUS_COLORS[order.status]} size="small" /></TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Expected Start</TableCell><TableCell>{new Date(order.expectedStartDate).toLocaleString()}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Expected End</TableCell><TableCell>{new Date(order.expectedEndDate).toLocaleString()}</TableCell></TableRow>
                      {order.startDate && <TableRow><TableCell sx={{ fontWeight: 600 }}>Actual Start</TableCell><TableCell>{new Date(order.startDate).toLocaleString()}</TableCell></TableRow>}
                      {order.endDate && <TableRow><TableCell sx={{ fontWeight: 600 }}>Actual End</TableCell><TableCell>{new Date(order.endDate).toLocaleString()}</TableCell></TableRow>}
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Raw Material WH</TableCell><TableCell>{order.rawMaterialWarehouse}</TableCell></TableRow>
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Finished Goods WH</TableCell><TableCell>{order.finishedGoodsWarehouse}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Notes</Typography>
                <Paper sx={{ p: 2 }} variant="outlined">
                  <Typography variant="body2">{order.notes || "No notes."}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Consumption */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Ingredient Consumption</Typography>
            {order.consumption.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>Ingredient</TableCell>
                      <TableCell align="right">Planned</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell align="right">Variance</TableCell>
                      <TableCell align="right">Variance %</TableCell>
                      <TableCell align="right">Unit Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.consumption.map((c: ConsumptionRecord) => (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.ingredientName}</TableCell>
                        <TableCell align="right">{c.plannedQty.toFixed(2)} {c.unit}</TableCell>
                        <TableCell align="right" fontWeight="bold">{c.actualQty.toFixed(2)} {c.unit}</TableCell>
                        <TableCell align="right" sx={{ color: c.variance > 0 ? theme.palette.error.main : c.variance < 0 ? theme.palette.success.main : "inherit", fontWeight: 600 }}>
                          {c.variance > 0 ? "+" : ""}{c.variance.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${c.variancePercent.toFixed(1)}%`} color={Math.abs(c.variancePercent) > 5 ? "error" : Math.abs(c.variancePercent) > 2 ? "warning" : "success"} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">${c.unitCost.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No consumption records yet.</Typography>
            )}
          </TabPanel>

          {/* Quality Control */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Quality Control Tests</Typography>
              {order.status === "IN_PROGRESS" || order.status === "COMPLETED" ? (
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setQcFormOpen(true)}>
                  Add Test
                </Button>
              ) : null}
            </Box>
            {order.qualityTests.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>Test Type</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Acceptable Range</TableCell>
                      <TableCell align="center">Result</TableCell>
                      <TableCell>Tested By</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.qualityTests.map((test: QualityTest) => (
                      <TableRow key={test.id} hover>
                        <TableCell>{TEST_TYPE_LABELS[test.testType] || test.testType}</TableCell>
                        <TableCell align="right" fontWeight="bold">{test.testValue.toFixed(2)}</TableCell>
                        <TableCell align="right">{test.acceptableMin} - {test.acceptableMax}</TableCell>
                        <TableCell align="center">
                          <Chip label={test.result} color={test.result === "PASS" ? "success" : "error"} size="small" />
                        </TableCell>
                        <TableCell>{test.testedBy}</TableCell>
                        <TableCell>{new Date(test.testedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{test.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No quality tests recorded yet.</Typography>
            )}
          </TabPanel>

          {/* Output */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Production Output</Typography>
            {order.outputs.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>Batch #</TableCell>
                      <TableCell align="right">Quantity (KG)</TableCell>
                      <TableCell align="center">Grade</TableCell>
                      <TableCell>Produced</TableCell>
                      <TableCell>Expiry</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.outputs.map((o: OutputRecord) => (
                      <TableRow key={o.id} hover>
                        <TableCell fontWeight="bold" fontFamily="monospace">{o.batchNumber}</TableCell>
                        <TableCell align="right">{o.quantity.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <Chip label={o.qualityGrade} color={o.qualityGrade === "A" ? "success" : o.qualityGrade === "B" ? "warning" : "default"} size="small" />
                        </TableCell>
                        <TableCell>{new Date(o.producedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(o.expiryDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No production output yet.</Typography>
            )}
          </TabPanel>

          {/* Cost Analysis */}
          <TabPanel value={activeTab} index={4}>
            {costBreakdown ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Cost Breakdown</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Material Cost</TableCell>
                          <TableCell align="right">${costBreakdown.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Overhead Cost</TableCell>
                          <TableCell align="right">${costBreakdown.overheadCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Labor Cost</TableCell>
                          <TableCell align="right">${costBreakdown.laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                          <TableCell sx={{ fontWeight: "bold" }}>Total Cost</TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                            ${costBreakdown.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>Cost per KG</TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main", fontSize: "1.1rem" }}>
                            ${costBreakdown.costPerKg.toFixed(3)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Planned vs Actual Cost</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Planned Cost</TableCell>
                          <TableCell align="right">${order.plannedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Actual Cost</TableCell>
                          <TableCell align="right" fontWeight="bold" color={order.actualCost !== null && order.actualCost > order.plannedCost ? "error" : "success"}>
                            {order.actualCost !== null ? `$${order.actualCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </TableCell>
                        </TableRow>
                        {order.actualCost !== null && (
                          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                            <TableCell sx={{ fontWeight: "bold" }}>Cost Variance</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold", color: order.actualCost > order.plannedCost ? theme.palette.error.main : theme.palette.success.main }}>
                              {((order.actualCost - order.plannedCost) > 0 ? "+" : "")}${(order.actualCost - order.plannedCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              ({((order.actualCost / order.plannedCost - 1) * 100).toFixed(1)}%)
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">No cost data available yet.</Typography>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* QC Form Dialog */}
      {qcFormOpen && (
        <QualityControlForm
          orderId={order.id}
          open={qcFormOpen}
          onClose={() => setQcFormOpen(false)}
        />
      )}
    </Box>
  );
};

export default ManufacturingOrderDetail;
