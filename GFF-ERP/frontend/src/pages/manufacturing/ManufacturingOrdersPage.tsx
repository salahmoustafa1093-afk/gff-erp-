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
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface ManufacturingOrder {
  id: string;
  orderNumber: string;
  feedFormulaId: string;
  feedFormulaName: string;
  feedFormulaCode: string;
  quantity: number;
  actualQuantity: number | null;
  status: string;
  startDate: string;
  endDate: string | null;
  yield: number | null;
  actualCost: number | null;
  plannedCost: number | null;
  notes: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_CHIP_PROPS: Record<string, { color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"; variant: "filled" | "outlined" }> = {
  DRAFT: { color: "default", variant: "outlined" },
  PLANNED: { color: "primary", variant: "outlined" },
  IN_PROGRESS: { color: "warning", variant: "filled" },
  COMPLETED: { color: "success", variant: "filled" },
  CANCELLED: { color: "error", variant: "outlined" },
  ON_HOLD: { color: "info", variant: "outlined" },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
};

interface FetchOrdersParams {
  search?: string;
  status?: string;
  feedFormulaId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const fetchOrders = async (params: FetchOrdersParams): Promise<ApiListResponse<ManufacturingOrder>> => {
  const response = await apiService.get<ApiListResponse<ManufacturingOrder>>("/manufacturing/orders", { params });
  return response.data;
};

const updateOrderStatus = async ({ id, status }: { id: string; status: string }): Promise<ManufacturingOrder> => {
  const response = await apiService.patch<ManufacturingOrder>(`/manufacturing/orders/${id}/status`, { status });
  return response.data;
};

const ManufacturingOrdersPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery<ApiListResponse<ManufacturingOrder>>({
    queryKey: ["manufacturing-orders", searchQuery, statusFilter, dateFrom, dateTo, page, pageSize],
    queryFn: () =>
      fetchOrders({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        startDate: dateFrom ? dateFrom.toISOString() : undefined,
        endDate: dateTo ? dateTo.toISOString() : undefined,
        page,
        pageSize,
      }),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
    },
  });

  const handleStart = (id: string) => statusMutation.mutate({ id, status: "IN_PROGRESS" });
  const handleComplete = (id: string) => statusMutation.mutate({ id, status: "COMPLETED" });
  const handleCancel = (id: string) => statusMutation.mutate({ id, status: "CANCELLED" });

  const columns: GridColDef[] = [
    {
      field: "orderNumber",
      headerName: "Order #",
      flex: 0.9,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams<ManufacturingOrder>) => (
        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
          {params.value as string}
        </Typography>
      ),
    },
    {
      field: "feedFormulaName",
      headerName: "Feed Formula",
      flex: 1.3,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<ManufacturingOrder>) => (
        <Box>
          <Typography variant="body2">{params.value as string}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.feedFormulaCode}
          </Typography>
        </Box>
      ),
    },
    {
      field: "quantity",
      headerName: "Qty (KG)",
      type: "number",
      flex: 0.7,
      minWidth: 90,
      valueFormatter: (params: any) => Number(params).toLocaleString(),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.9,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams<ManufacturingOrder>) => {
        const status = params.value as string;
        const chipProps = STATUS_CHIP_PROPS[status] || { color: "default", variant: "outlined" };
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
      flex: 0.9,
      minWidth: 100,
      valueFormatter: (params: any) => (params ? new Date(params).toLocaleDateString() : "-"),
    },
    {
      field: "endDate",
      headerName: "End Date",
      flex: 0.9,
      minWidth: 100,
      valueFormatter: (params: any) => (params ? new Date(params).toLocaleDateString() : "-"),
    },
    {
      field: "yield",
      headerName: "Yield %",
      type: "number",
      flex: 0.7,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<ManufacturingOrder>) => {
        const val = params.value as number | null;
        if (val === null || val === undefined) return "—";
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
      field: "actualCost",
      headerName: "Cost/KG",
      type: "number",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (params: any) => (params !== null ? `$${Number(params).toFixed(3)}` : "—"),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<ManufacturingOrder>) => (
        <Box sx={{ display: "flex", gap: 0.3 }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => navigate(`/manufacturing/orders/${params.row.id}`)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === "DRAFT" || params.row.status === "PLANNED" ? (
            <Tooltip title="Start Production">
              <IconButton size="small" color="primary" onClick={() => handleStart(params.row.id)}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {params.row.status === "IN_PROGRESS" ? (
            <Tooltip title="Complete">
              <IconButton size="small" color="success" onClick={() => handleComplete(params.row.id)}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {(params.row.status === "DRAFT" || params.row.status === "PLANNED") ? (
            <Tooltip title="Cancel">
              <IconButton size="small" color="error" onClick={() => handleCancel(params.row.id)}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Manufacturing Orders
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/manufacturing/orders/new")} sx={{ minWidth: 160 }}>
            Create Order
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField fullWidth size="small" label="Search orders" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Order # or formula..." />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <Button variant="outlined" size="small" fullWidth onClick={() => { setSearchQuery(""); setStatusFilter(""); setDateFrom(null); setDateTo(null); }}>
                Clear
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
            onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
            paginationMode="server"
            disableRowSelectionOnClick
            density="compact"
            sx={{ border: "none", minHeight: 400 }}
          />
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ManufacturingOrdersPage;
