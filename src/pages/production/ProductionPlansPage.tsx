import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  Tooltip,
  Typography,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";

interface ProductionPlan {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  targetQuantity: number;
  actualQuantity: number;
  variance: number;
  variancePercent: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  targets: PlanTarget[];
}

interface PlanTarget {
  id: string;
  feedFormulaName: string;
  feedFormulaId: string;
  targetQuantity: number;
  actualQuantity: number;
  variance: number;
}

interface FetchPlansParams {
  search?: string;
  status?: string;
  periodStart?: string;
  periodEnd?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", color: "default" as const },
  { value: "ACTIVE", label: "Active", color: "success" as const },
  { value: "ARCHIVED", label: "Archived", color: "warning" as const },
  { value: "CANCELLED", label: "Cancelled", color: "error" as const },
];

const STATUS_CHIP_PROPS: Record<string, { color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"; variant: "filled" | "outlined" }> = {
  DRAFT: { color: "default", variant: "outlined" },
  ACTIVE: { color: "success", variant: "filled" },
  ARCHIVED: { color: "warning", variant: "outlined" },
  CANCELLED: { color: "error", variant: "outlined" },
};

const fetchProductionPlans = async (params: FetchPlansParams): Promise<ApiListResponse<ProductionPlan>> => {
  const response = await apiService.get<ApiListResponse<ProductionPlan>>("/production/plans", { params });
  return response.data;
};

const createPlan = async (data: PlanFormValues): Promise<ProductionPlan> => {
  const response = await apiService.post<ProductionPlan>("/production/plans", data);
  return response.data;
};

const updatePlan = async ({ id, data }: { id: string; data: PlanFormValues }): Promise<ProductionPlan> => {
  const response = await apiService.put<ProductionPlan>(`/production/plans/${id}`, data);
  return response.data;
};

const deletePlan = async (id: string): Promise<void> => {
  await apiService.delete(`/production/plans/${id}`);
};

interface PlanFormValues {
  name: string;
  description: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  status: string;
}

const planValidationSchema = Yup.object({
  name: Yup.string().required("Plan name is required").max(100, "Max 100 characters"),
  description: Yup.string().max(500, "Max 500 characters"),
  periodStart: Yup.date().required("Start date is required").nullable(),
  periodEnd: Yup.date()
    .required("End date is required")
    .nullable()
    .min(Yup.ref("periodStart"), "End date must be after start date"),
  status: Yup.string().required("Status is required"),
});

const ProductionPlansPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState<ProductionPlan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const { data, isLoading, error } = useQuery<ApiListResponse<ProductionPlan>>({
    queryKey: ["production-plans", searchQuery, statusFilter, page, pageSize],
    queryFn: () =>
      fetchProductionPlans({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      }),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      setDialogOpen(false);
      setEditingPlan(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      setDeleteConfirmOpen(false);
      setDeleteId("");
    },
  });

  const formik = useFormik<PlanFormValues>({
    initialValues: {
      name: "",
      description: "",
      periodStart: null,
      periodEnd: null,
      status: "DRAFT",
    },
    validationSchema: planValidationSchema,
    onSubmit: (values) => {
      if (editingPlan) {
        updateMutation.mutate({ id: editingPlan.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const { resetForm, setValues, handleSubmit } = formik;

  const openCreateDialog = useCallback(() => {
    setEditingPlan(null);
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback(
    (plan: ProductionPlan) => {
      setEditingPlan(plan);
      setValues({
        name: plan.name,
        description: plan.description,
        periodStart: new Date(plan.periodStart),
        periodEnd: new Date(plan.periodEnd),
        status: plan.status,
      });
      setDialogOpen(true);
    },
    [setValues]
  );

  const openDetailDialog = useCallback((plan: ProductionPlan) => {
    setDetailPlan(plan);
    setDetailDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Plan Name",
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: "period",
      headerName: "Period",
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params: any) => {
        const row = params.row as ProductionPlan;
        const start = new Date(row.periodStart).toLocaleDateString();
        const end = new Date(row.periodEnd).toLocaleDateString();
        return `${start} - ${end}`;
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<ProductionPlan>) => {
        const status = params.value as string;
        const chipProps = STATUS_CHIP_PROPS[status] || { color: "default", variant: "outlined" };
        const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
        return <Chip label={statusLabel} size="small" color={chipProps.color} variant={chipProps.variant} />;
      },
    },
    {
      field: "targetQuantity",
      headerName: "Target (KG)",
      type: "number",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (params: any) => Number(params).toLocaleString(),
    },
    {
      field: "actualQuantity",
      headerName: "Actual (KG)",
      type: "number",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (params: any) => Number(params).toLocaleString(),
    },
    {
      field: "variancePercent",
      headerName: "Variance %",
      type: "number",
      flex: 0.8,
      minWidth: 90,
      renderCell: (params: GridRenderCellParams<ProductionPlan>) => {
        const val = params.value as number;
        const color = val >= 0 ? theme.palette.success.main : theme.palette.error.main;
        return (
          <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
            {val >= 0 ? "+" : ""}
            {val.toFixed(1)}%
          </Typography>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 140,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<ProductionPlan>) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => openDetailDialog(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load production plans. Please refresh the page.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            Production Plans
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{ minWidth: 160 }}
          >
            Create Plan
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter plan name..."
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* DataGrid */}
        <Card>
          <DataGrid
            rows={data?.data || []}
            columns={columns}
            loading={isLoading}
            rowCount={data?.total || 0}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            paginationMode="server"
            disableRowSelectionOnClick
            density="compact"
            sx={{ border: "none", minHeight: 400 }}
            slots={{
              loadingOverlay: LinearProgress,
            }}
          />
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {editingPlan ? "Edit Production Plan" : "Create Production Plan"}
              <IconButton onClick={() => setDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Plan Name"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Period Start"
                    value={formik.values.periodStart}
                    onChange={(val) => formik.setFieldValue("periodStart", val)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.periodStart && Boolean(formik.errors.periodStart),
                        helperText: (formik.touched.periodStart && formik.errors.periodStart) as string,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Period End"
                    value={formik.values.periodEnd}
                    onChange={(val) => formik.setFieldValue("periodEnd", val)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.periodEnd && Boolean(formik.errors.periodEnd),
                        helperText: (formik.touched.periodEnd && formik.errors.periodEnd) as string,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formik.values.status}
                      label="Status"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.status && Boolean(formik.errors.status)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={formik.isSubmitting || !formik.isValid}
              >
                {editingPlan ? "Update" : "Create"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Plan Details
              <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {detailPlan && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" fontWeight="bold">
                    {detailPlan.name}
                  </Typography>
                  <Chip
                    label={STATUS_OPTIONS.find((o) => o.value === detailPlan.status)?.label || detailPlan.status}
                    color={STATUS_CHIP_PROPS[detailPlan.status]?.color || "default"}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Period Start
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(detailPlan.periodStart).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Period End
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(detailPlan.periodEnd).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {detailPlan.description || "No description provided."}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Targets vs Actual
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Target
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {detailPlan.targetQuantity.toLocaleString()} KG
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Actual
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {detailPlan.actualQuantity.toLocaleString()} KG
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Variance
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{
                        color: detailPlan.variancePercent >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      }}
                    >
                      {detailPlan.variancePercent >= 0 ? "+" : ""}
                      {detailPlan.variancePercent.toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        (detailPlan.actualQuantity / Math.max(detailPlan.targetQuantity, 1)) * 100,
                        100
                      )}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {((detailPlan.actualQuantity / Math.max(detailPlan.targetQuantity, 1)) * 100).toFixed(1)}%
                      completed
                    </Typography>
                  </Box>
                </Grid>
                {detailPlan.targets && detailPlan.targets.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                      Formula Targets
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                            <TableCell>Feed Formula</TableCell>
                            <TableCell align="right">Target (KG)</TableCell>
                            <TableCell align="right">Actual (KG)</TableCell>
                            <TableCell align="right">Variance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detailPlan.targets.map((target: PlanTarget) => (
                            <TableRow key={target.id} hover>
                              <TableCell>{target.feedFormulaName}</TableCell>
                              <TableCell align="right">{target.targetQuantity.toLocaleString()}</TableCell>
                              <TableCell align="right">{target.actualQuantity.toLocaleString()}</TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  color: target.variance >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                  fontWeight: 600,
                                }}
                              >
                                {target.variance >= 0 ? "+" : ""}
                                {target.variance.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            {detailPlan && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  openEditDialog(detailPlan);
                }}
              >
                Edit
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs">
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this production plan? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductionPlansPage;
