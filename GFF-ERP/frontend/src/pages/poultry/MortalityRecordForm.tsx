import React, { useMemo } from "react";
import {
  Autocomplete,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";

interface BatchOption {
  id: string;
  batchNumber: string;
  breedType: string;
  currentQty: number;
  mortalityCount: number;
  mortalityRate: number;
  ageDays: number;
}

interface MortalityFormValues {
  batchId: string;
  date: Date | null;
  count: number;
  cause: string;
  notes: string;
}

const CAUSE_OPTIONS = [
  { value: "DISEASE", label: "Disease" },
  { value: "HEAT", label: "Heat Stress" },
  { value: "COLD", label: "Cold Stress" },
  { value: "PREDATOR", label: "Predator" },
  { value: "OTHER", label: "Other" },
];

const CAUSE_COLORS: Record<string, string> = {
  DISEASE: "#f44336",
  HEAT: "#ff9800",
  COLD: "#2196f3",
  PREDATOR: "#795548",
  OTHER: "#9e9e9e",
};

const fetchBatches = async (): Promise<BatchOption[]> => {
  const response = await apiService.get<{ data: BatchOption[] }>("/poultry/batches", { params: { status: "ACTIVE", pageSize: 1000 } });
  return response.data.data;
};

const fetchBatchDetail = async (id: string): Promise<BatchOption> => {
  const response = await apiService.get<BatchOption>(`/poultry/batches/${id}/summary`);
  return response.data;
};

const recordMortality = async (data: MortalityFormValues) => {
  const payload = {
    ...data,
    date: data.date?.toISOString(),
  };
  const response = await apiService.post("/poultry/mortality", payload);
  return response.data;
};

const MortalityRecordForm: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: batchIdParam } = useParams<{ id: string }>();
  const preselectedBatchId = batchIdParam || "";

  const { data: batches, isLoading: batchesLoading } = useQuery<BatchOption[]>({
    queryKey: ["active-batches"],
    queryFn: fetchBatches,
    staleTime: 300000,
  });

  const { data: selectedBatch, isLoading: batchLoading } = useQuery<BatchOption>({
    queryKey: ["batch-summary", preselectedBatchId],
    queryFn: () => fetchBatchDetail(preselectedBatchId),
    enabled: Boolean(preselectedBatchId),
  });

  const mutation = useMutation({
    mutationFn: recordMortality,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chicks-batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      queryClient.invalidateQueries({ queryKey: ["active-batches"] });
      queryClient.invalidateQueries({ queryKey: ["poultry-dashboard"] });
      if (preselectedBatchId) {
        navigate(`/poultry/batches/${preselectedBatchId}`);
      } else {
        navigate("/poultry/batches");
      }
    },
  });

  const validationSchema = Yup.object({
    batchId: Yup.string().required("Batch is required"),
    date: Yup.date().required("Date is required").nullable(),
    count: Yup.number().required("Count is required").min(1, "Min 1").integer("Must be whole number"),
    cause: Yup.string().required("Cause is required"),
    notes: Yup.string().max(500, "Max 500 characters"),
  });

  const formik = useFormik<MortalityFormValues>({
    initialValues: {
      batchId: preselectedBatchId,
      date: new Date(),
      count: 1,
      cause: "DISEASE",
      notes: "",
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;

  const remainingAfter = selectedBatch ? Math.max(selectedBatch.currentQty - values.count, 0) : 0;
  const projectedRate = selectedBatch && selectedBatch.quantity > 0
    ? ((selectedBatch.mortalityCount + values.count) / selectedBatch.quantity) * 100
    : 0;

  const isOverLimit = selectedBatch ? values.count > selectedBatch.currentQty : false;
  const isWarning = projectedRate > 5;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => preselectedBatchId ? navigate(`/poultry/batches/${preselectedBatchId}`) : navigate("/poultry/batches")}><ArrowBackIcon /></IconButton>
              <Typography variant="h4" fontWeight="bold" color="primary">Record Mortality</Typography>
            </Box>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending || isOverLimit}>
              {mutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </Box>

          {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>Failed to save mortality record.</Alert>}
          {isOverLimit && <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>Cannot record more deaths than current quantity ({selectedBatch?.currentQty.toLocaleString()}).</Alert>}
          {isWarning && !isOverLimit && <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>Projected mortality rate will be {projectedRate.toFixed(1)}% (above 5% threshold).</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={batches || []}
                        getOptionLabel={(opt: BatchOption) => `${opt.batchNumber} (${opt.breedType} - ${opt.currentQty.toLocaleString()} remaining)`}
                        value={(batches || []).find((b) => b.id === values.batchId) || null}
                        onChange={(_e, val) => setFieldValue("batchId", val?.id || "")}
                        loading={batchesLoading}
                        disabled={Boolean(preselectedBatchId)}
                        renderInput={(params) => (
                          <TextField {...params} label="Batch *" error={touched.batchId && Boolean(errors.batchId)} helperText={touched.batchId && errors.batchId} />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date *"
                        value={values.date}
                        onChange={(val) => setFieldValue("date", val)}
                        slotProps={{ textField: { fullWidth: true, error: touched.date && Boolean(errors.date), helperText: (touched.date && errors.date) as string } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Death Count *"
                        name="count"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={values.count}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.count && Boolean(errors.count)}
                        helperText={touched.count && errors.count}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth select label="Cause *" name="cause" value={values.cause} onChange={handleChange} onBlur={handleBlur} error={touched.cause && Boolean(errors.cause)} helperText={touched.cause && errors.cause}>
                        {CAUSE_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth multiline rows={2} label="Notes" name="notes" value={values.notes} onChange={handleChange} onBlur={handleBlur}
                        error={touched.notes && Boolean(errors.notes)} helperText={touched.notes && errors.notes}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Summary Panel */}
            <Grid item xs={12} md={5}>
              {selectedBatch ? (
                <>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Current Batch Status</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow><TableCell sx={{ fontWeight: 600 }}>Batch</TableCell><TableCell>{selectedBatch.batchNumber}</TableCell></TableRow>
                            <TableRow><TableCell sx={{ fontWeight: 600 }}>Breed</TableCell><TableCell>{selectedBatch.breedType}</TableCell></TableRow>
                            <TableRow><TableCell sx={{ fontWeight: 600 }}>Current Qty</TableCell><TableCell fontWeight="bold" color="primary">{selectedBatch.currentQty.toLocaleString()}</TableCell></TableRow>
                            <TableRow><TableCell sx={{ fontWeight: 600 }}>Age (days)</TableCell><TableCell>{selectedBatch.ageDays}</TableCell></TableRow>
                            <TableRow><TableCell sx={{ fontWeight: 600 }}>Current Mort %</TableCell><TableCell><Chip label={`${selectedBatch.mortalityRate.toFixed(1)}%`} size="small" color={selectedBatch.mortalityRate > 5 ? "error" : selectedBatch.mortalityRate > 3 ? "warning" : "success"} /></TableCell></TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Projected Impact</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Before</TableCell>
                              <TableCell align="right" fontWeight="bold">{selectedBatch.currentQty.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Deaths</TableCell>
                              <TableCell align="right" fontWeight="bold" color="error">-{values.count}</TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                              <TableCell sx={{ fontWeight: "bold" }}>Remaining</TableCell>
                              <TableCell align="right" fontWeight="bold" color={remainingAfter < selectedBatch.currentQty * 0.5 ? "error" : "primary"}>
                                {remainingAfter.toLocaleString()}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Projected Mort %</TableCell>
                              <TableCell align="right">
                                <Chip label={`${projectedRate.toFixed(2)}%`} size="small" color={projectedRate > 5 ? "error" : projectedRate > 3 ? "warning" : "success"} sx={{ fontWeight: 700 }} />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <TrendingDownIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                  <Typography color="text.secondary">Select a batch to see projected impact</Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default MortalityRecordForm;
