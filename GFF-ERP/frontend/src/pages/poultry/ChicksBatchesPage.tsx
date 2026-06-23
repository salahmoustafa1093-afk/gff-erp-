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
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface ChicksBatch {
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
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const BREED_TYPE_OPTIONS = [
  { value: "BROILER", label: "Broiler" },
  { value: "LAYER", label: "Layer" },
  { value: "BREEDER", label: "Breeder" },
  { value: "PIGEON", label: "Pigeon" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SOLD", label: "Sold" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_CHIP_PROPS: Record<string, { color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"; variant: "filled" | "outlined" }> = {
  ACTIVE: { color: "success", variant: "filled" },
  SOLD: { color: "primary", variant: "outlined" },
  TRANSFERRED: { color: "info", variant: "outlined" },
  CLOSED: { color: "default", variant: "outlined" },
};

const BREED_COLORS: Record<string, string> = {
  BROILER: "#4caf50",
  LAYER: "#2196f3",
  BREEDER: "#ff9800",
  PIGEON: "#9c27b0",
  OTHER: "#607d8b",
};

const fetchBatches = async (params: any): Promise<ApiListResponse<ChicksBatch>> => {
  const response = await apiService.get<ApiListResponse<ChicksBatch>>("/poultry/batches", { params });
  return response.data;
};

const ChicksBatchesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery<ApiListResponse<ChicksBatch>>({
    queryKey: ["chicks-batches", searchQuery, breedFilter, statusFilter, supplierFilter, dateFrom, page, pageSize],
    queryFn: () =>
      fetchBatches({
        search: searchQuery || undefined,
        breedType: breedFilter || undefined,
        status: statusFilter || undefined,
        supplier: supplierFilter || undefined,
        arrivalDateFrom: dateFrom ? dateFrom.toISOString() : undefined,
        page,
        pageSize,
      }),
    keepPreviousData: true,
  });

  const getMortalityColor = (rate: number): string => {
    if (rate < 3) return theme.palette.success.main;
    if (rate <= 5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const columns: GridColDef[] = [
    {
      field: "batchNumber",
      headerName: "Batch #",
      flex: 1,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams<ChicksBatch>) => (
        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">{params.value as string}</Typography>
      ),
    },
    {
      field: "breedType",
      headerName: "Breed",
      flex: 0.8,
      minWidth: 90,
      renderCell: (params: GridRenderCellParams<ChicksBatch>) => (
        <Chip
          label={params.row.breedTypeLabel}
          size="small"
          sx={{
            backgroundColor: (BREED_COLORS[params.value as string] || "#607d8b") + "20",
            color: BREED_COLORS[params.value as string] || "#607d8b",
            fontWeight: 600,
          }}
        />
      ),
    },
    { field: "supplierName", headerName: "Supplier", flex: 1, minWidth: 120 },
    {
      field: "arrivalDate",
      headerName: "Arrival",
      flex: 0.9,
      minWidth: 100,
      valueFormatter: (p: any) => new Date(p).toLocaleDateString(),
    },
    {
      field: "quantity",
      headerName: "Initial Qty",
      type: "number",
      flex: 0.8,
      minWidth: 80,
      valueFormatter: (p: any) => Number(p).toLocaleString(),
    },
    {
      field: "currentQty",
      headerName: "Current Qty",
      type: "number",
      flex: 0.8,
      minWidth: 80,
      valueFormatter: (p: any) => Number(p).toLocaleString(),
    },
    {
      field: "mortalityCount",
      headerName: "Deaths",
      type: "number",
      flex: 0.6,
      minWidth: 60,
    },
    {
      field: "mortalityRate",
      headerName: "Mort %",
      type: "number",
      flex: 0.7,
      minWidth: 70,
      renderCell: (params: GridRenderCellParams<ChicksBatch>) => {
        const rate = params.value as number;
        return (
          <Chip
            label={`${rate.toFixed(1)}%`}
            size="small"
            sx={{
              color: getMortalityColor(rate),
              borderColor: getMortalityColor(rate),
              fontWeight: 700,
            }}
            variant="outlined"
          />
        );
      },
    },
    {
      field: "ageDays",
      headerName: "Age (d)",
      type: "number",
      flex: 0.6,
      minWidth: 60,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<ChicksBatch>) => {
        const s = params.value as string;
        const cp = STATUS_CHIP_PROPS[s] || { color: "default", variant: "outlined" };
        return <Chip label={params.row.statusLabel || s} size="small" color={cp.color} variant={cp.variant} />;
      },
    },
    { field: "houseName", headerName: "House", flex: 0.8, minWidth: 80 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<ChicksBatch>) => (
        <Box sx={{ display: "flex", gap: 0.3 }}>
          <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/poultry/batches/${params.row.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Record Mortality"><IconButton size="small" color="warning" onClick={() => navigate(`/poultry/batches/${params.row.id}/mortality`)}><TrendingDownIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/poultry/batches/${params.row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Chicks Batches</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/poultry/batches/new")} sx={{ minWidth: 160 }}>
            New Batch
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Search batch #" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Breed</InputLabel>
                <Select value={breedFilter} label="Breed" onChange={(e) => setBreedFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {BREED_TYPE_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {STATUS_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Button variant="outlined" size="small" fullWidth onClick={() => { setSearchQuery(""); setBreedFilter(""); setStatusFilter(""); setSupplierFilter(""); setDateFrom(null); }}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

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

export default ChicksBatchesPage;
