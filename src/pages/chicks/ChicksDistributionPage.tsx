import React, { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Close as CloseIcon,
  Save as SaveIcon,
  LocalShipping as LocalShippingIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";

interface DistributionRecord {
  id: string;
  date: string;
  batchId: string;
  batchNumber: string;
  breedType: string;
  type: string;
  typeLabel: string;
  quantity: number;
  destination: string;
  notes: string;
  createdBy: string;
}

interface BatchAvailability {
  batchId: string;
  batchNumber: string;
  breedType: string;
  breedTypeLabel: string;
  currentQty: number;
  availableForDistribution: number;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const DIST_TYPE_OPTIONS = [
  { value: "SALE", label: "Sale", color: "success" as const },
  { value: "INTERNAL_TRANSFER", label: "Internal Transfer", color: "primary" as const },
  { value: "FARM_TRANSFER", label: "Farm Transfer", color: "info" as const },
  { value: "RETURN", label: "Return", color: "warning" as const },
];

const DIST_COLORS: Record<string, string> = {
  SALE: "#4caf50",
  INTERNAL_TRANSFER: "#2196f3",
  FARM_TRANSFER: "#00bcd4",
  RETURN: "#ff9800",
};

const fetchDistributions = async (params: any): Promise<ApiListResponse<DistributionRecord>> => {
  const response = await apiService.get<ApiListResponse<DistributionRecord>>("/poultry/distributions", { params });
  return response.data;
};

const fetchBatchAvailability = async (): Promise<BatchAvailability[]> => {
  const response = await apiService.get<BatchAvailability[]>("/poultry/batches/availability");
  return response.data;
};

const createDistribution = async (data: DistributionFormValues) => {
  const payload = { ...data, date: data.date?.toISOString() };
  const response = await apiService.post("/poultry/distributions", payload);
  return response.data;
};

interface DistributionFormValues {
  batchId: string;
  date: Date | null;
  type: string;
  quantity: number;
  destination: string;
  notes: string;
}

const ChicksDistributionPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: distributions, isLoading: distLoading } = useQuery<ApiListResponse<DistributionRecord>>({
    queryKey: ["chicks-distributions", typeFilter, searchQuery, page, pageSize],
    queryFn: () => fetchDistributions({ type: typeFilter || undefined, search: searchQuery || undefined, page, pageSize }),
    keepPreviousData: true,
  });

  const { data: availability, isLoading: availLoading } = useQuery<BatchAvailability[]>({
    queryKey: ["batch-availability"],
    queryFn: fetchBatchAvailability,
    staleTime: 300000,
  });

  const mutation = useMutation({
    mutationFn: createDistribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chicks-distributions"] });
      queryClient.invalidateQueries({ queryKey: ["batch-availability"] });
      setDialogOpen(false);
    },
  });

  const formik = useFormik<DistributionFormValues>({
    initialValues: {
      batchId: "",
      date: new Date(),
      type: "SALE",
      quantity: 0,
      destination: "",
      notes: "",
    },
    validationSchema: Yup.object({
      batchId: Yup.string().required("Batch is required"),
      date: Yup.date().required("Date is required").nullable(),
      type: Yup.string().required("Type is required"),
      quantity: Yup.number().required("Quantity is required").min(1, "Min 1").integer("Must be whole number"),
      destination: Yup.string().required("Destination is required").max(200, "Max 200 characters"),
      notes: Yup.string().max(500, "Max 500 characters"),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit, resetForm } = formik;

  const selectedBatchAvail = availability?.find((b) => b.batchId === values.batchId);
  const exceedsAvailable = selectedBatchAvail ? values.quantity > selectedBatchAvail.availableForDistribution : false;

  const columns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 0.8, minWidth: 100, valueFormatter: (p: any) => new Date(p).toLocaleDateString() },
    { field: "batchNumber", headerName: "Batch #", flex: 0.9, minWidth: 100 },
    {
      field: "type",
      headerName: "Type",
      flex: 0.9,
      minWidth: 90,
      renderCell: (params: GridRenderCellParams<DistributionRecord>) => {
        const type = params.value as string;
        const label = DIST_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
        return <Chip label={label} size="small" sx={{ bgcolor: (DIST_COLORS[type] || "#9e9e9e") + "20", color: DIST_COLORS[type] || "#9e9e9e", fontWeight: 600 }} />;
      },
    },
    { field: "quantity", headerName: "Qty", type: "number", flex: 0.6, minWidth: 60, valueFormatter: (p: any) => Number(p).toLocaleString() },
    { field: "destination", headerName: "Destination", flex: 1, minWidth: 120 },
    { field: "notes", headerName: "Notes", flex: 1, minWidth: 100 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Chicks Distribution</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setDialogOpen(true); }}>New Distribution</Button>
        </Box>

        {/* Availability Panel */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Available Stock by Batch</Typography>
            {availLoading ? <LinearProgress /> : (
              <Grid container spacing={2}>
                {(availability || []).map((batch: BatchAvailability) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={batch.batchId}>
                    <Paper sx={{ p: 2, borderLeft: `4px solid ${batch.availableForDistribution > 100 ? theme.palette.success.main : theme.palette.warning.main}` }}>
                      <Typography variant="subtitle2" fontWeight="bold">{batch.batchNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{batch.breedTypeLabel}</Typography>
                      <Typography variant="h6" fontWeight="bold" color={batch.availableForDistribution > 100 ? "success.main" : "warning.main"}>
                        {batch.availableForDistribution.toLocaleString()} available
                      </Typography>
                      <Typography variant="caption" color="text.secondary">of {batch.currentQty.toLocaleString()} current</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Filters + Grid */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Batch # or destination..." />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {DIST_TYPE_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2} md={2}>
              <Button variant="outlined" size="small" fullWidth onClick={() => { setSearchQuery(""); setTypeFilter(""); }}>Clear</Button>
            </Grid>
          </Grid>
        </Paper>

        <Card>
          <DataGrid rows={distributions?.data || []} columns={columns} loading={distLoading} rowCount={distributions?.total || 0} pageSizeOptions={[5, 10, 25]} paginationModel={{ page, pageSize }} onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }} paginationMode="server" disableRowSelectionOnClick density="compact" autoHeight sx={{ border: "none" }} />
        </Card>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Distribution</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>Failed to save distribution.</Alert>}
              {exceedsAvailable && selectedBatchAvail && <Alert severity="error" sx={{ mb: 2 }}>Quantity exceeds available stock ({selectedBatchAvail.availableForDistribution.toLocaleString()}).</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={availability || []}
                    getOptionLabel={(opt: BatchAvailability) => `${opt.batchNumber} - ${opt.breedTypeLabel} (${opt.availableForDistribution.toLocaleString()} available)`}
                    value={(availability || []).find((b) => b.batchId === values.batchId) || null}
                    onChange={(_e, val) => setFieldValue("batchId", val?.batchId || "")}
                    renderInput={(params) => <TextField {...params} label="Batch *" error={touched.batchId && Boolean(errors.batchId)} helperText={touched.batchId && errors.batchId} />}
                    isOptionEqualToValue={(a, b) => a.batchId === b.batchId}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Date *" value={values.date} onChange={(val) => setFieldValue("date", val)} slotProps={{ textField: { fullWidth: true, error: touched.date && Boolean(errors.date), helperText: (touched.date && errors.date) as string } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Type *" name="type" value={values.type} onChange={handleChange}>
                    {DIST_TYPE_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Quantity *" name="quantity" type="number" inputProps={{ min: 1 }} value={values.quantity} onChange={handleChange} onBlur={handleBlur} error={touched.quantity && Boolean(errors.quantity)} helperText={touched.quantity && errors.quantity} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Destination *" name="destination" value={values.destination} onChange={handleChange} onBlur={handleBlur} error={touched.destination && Boolean(errors.destination)} helperText={touched.destination && errors.destination} placeholder="Customer, farm, or warehouse..." />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Notes" name="notes" value={values.notes} onChange={handleChange} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>Cancel</Button>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending || exceedsAvailable}>Save</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ChicksDistributionPage;
