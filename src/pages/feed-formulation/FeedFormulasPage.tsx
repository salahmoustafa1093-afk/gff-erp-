import React, { useState, useCallback } from "react";
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
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  CompareArrows as CompareArrowsIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

export interface FeedFormula {
  id: string;
  code: string;
  name: string;
  feedType: string;
  targetProtein: number;
  targetEnergy: number;
  totalCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FetchFormulasParams {
  search?: string;
  feedType?: string;
  page?: number;
  pageSize?: number;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const FEED_TYPE_OPTIONS = [
  { value: "BROILER_STARTER", label: "Broiler Starter" },
  { value: "BROILER_GROWER", label: "Broiler Grower" },
  { value: "BROILER_FINISHER", label: "Broiler Finisher" },
  { value: "LAYER", label: "Layer" },
  { value: "BREEDER", label: "Breeder" },
  { value: "PREMIX", label: "Premix" },
  { value: "OTHER", label: "Other" },
];

const FEED_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  BROILER_STARTER: { bg: "#e3f2fd", color: "#1565c0" },
  BROILER_GROWER: { bg: "#e8f5e9", color: "#2e7d32" },
  BROILER_FINISHER: { bg: "#fff3e0", color: "#ef6c00" },
  LAYER: { bg: "#fce4ec", color: "#c62828" },
  BREEDER: { bg: "#f3e5f5", color: "#6a1b9a" },
  PREMIX: { bg: "#e0f2f1", color: "#00695c" },
  OTHER: { bg: "#f5f5f5", color: "#616161" },
};

const fetchFeedFormulas = async (params: FetchFormulasParams): Promise<ApiListResponse<FeedFormula>> => {
  const response = await apiService.get<ApiListResponse<FeedFormula>>("/feed-formulation/formulas", { params });
  return response.data;
};

const deleteFormula = async (id: string): Promise<void> => {
  await apiService.delete(`/feed-formulation/formulas/${id}`);
};

const duplicateFormula = async (id: string): Promise<FeedFormula> => {
  const response = await apiService.post<FeedFormula>(`/feed-formulation/formulas/${id}/duplicate`);
  return response.data;
};

const FeedFormulasPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [feedTypeFilter, setFeedTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useQuery<ApiListResponse<FeedFormula>>({
    queryKey: ["feed-formulas", searchQuery, feedTypeFilter, page, pageSize],
    queryFn: () =>
      fetchFeedFormulas({
        search: searchQuery || undefined,
        feedType: feedTypeFilter || undefined,
        page,
        pageSize,
      }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFormula,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateFormula,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("Are you sure you want to delete this formula?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateMutation.mutate(id);
    },
    [duplicateMutation]
  );

  const columns: GridColDef[] = [
    {
      field: "code",
      headerName: "Code",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<FeedFormula>) => (
        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
          {params.value as string}
        </Typography>
      ),
    },
    {
      field: "name",
      headerName: "Formula Name",
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: "feedType",
      headerName: "Feed Type",
      flex: 1,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams<FeedFormula>) => {
        const type = params.value as string;
        const label = FEED_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
        const colors = FEED_TYPE_COLORS[type] || { bg: "#f5f5f5", color: "#616161" };
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      field: "targetProtein",
      headerName: "Protein %",
      type: "number",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (params: any) => `${Number(params).toFixed(1)}%`,
    },
    {
      field: "targetEnergy",
      headerName: "Energy (ME)",
      type: "number",
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (params: any) => `${Number(params).toFixed(0)} kcal`,
    },
    {
      field: "totalCost",
      headerName: "Cost/KG",
      type: "number",
      flex: 0.8,
      minWidth: 90,
      valueFormatter: (params: any) => `$${Number(params).toFixed(3)}`,
    },
    {
      field: "isActive",
      headerName: "Status",
      flex: 0.6,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams<FeedFormula>) => {
        const active = params.value as boolean;
        return (
          <Chip
            label={active ? "Active" : "Inactive"}
            color={active ? "success" : "default"}
            size="small"
            variant={active ? "filled" : "outlined"}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<FeedFormula>) => (
        <Box sx={{ display: "flex", gap: 0.3 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => navigate(`/feed-formulation/formulas/${params.row.id}`)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/feed-formulation/formulas/${params.row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={() => handleDuplicate(params.row.id)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compare">
            <IconButton
              size="small"
              onClick={() => navigate(`/feed-formulation/formulas/compare?formula1=${params.row.id}`)}
            >
              <CompareArrowsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
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
          Feed Formulas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/feed-formulation/formulas/new")}
          sx={{ minWidth: 160 }}
        >
          New Formula
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">Failed to load feed formulas. Please try again.</Typography>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search by code or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter code or formula name..."
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Feed Type</InputLabel>
              <Select
                value={feedTypeFilter}
                label="Feed Type"
                onChange={(e) => setFeedTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {FEED_TYPE_OPTIONS.map((opt) => (
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
                setFeedTypeFilter("");
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
        />
      </Card>
    </Box>
  );
};

export default FeedFormulasPage;
