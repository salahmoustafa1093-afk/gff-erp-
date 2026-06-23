import React, { useState, useEffect } from "react";
import {
  Autocomplete,
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
  TextField,
  Typography,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Save as SaveIcon,
  Egg as EggIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";

interface BatchOption {
  id: string;
  batchNumber: string;
  breedType: string;
  ageDays: number;
  currentQty: number;
}

interface ProductionRecord {
  id: string;
  date: string;
  batchNumber: string;
  totalEggs: number;
  largeEggs: number;
  mediumEggs: number;
  smallEggs: number;
  brokenEggs: number;
  dirtyEggs: number;
  collectionTime: string;
  collectedBy: string;
}

interface ProductionFormValues {
  date: Date | null;
  batchId: string;
  totalEggs: number;
  largeEggs: number;
  mediumEggs: number;
  smallEggs: number;
  brokenEggs: number;
  dirtyEggs: number;
  collectionTime: string;
  collectedBy: string;
  notes: string;
}

const fetchActiveLayerBatches = async (): Promise<BatchOption[]> => {
  const response = await apiService.get<BatchOption[]>("/poultry/batches/active-layers");
  return response.data;
};

const fetchTodayProduction = async (date: string): Promise<ProductionRecord[]> => {
  const response = await apiService.get<ProductionRecord[]>("/eggs/production", { params: { date } });
  return response.data;
};

const saveProduction = async (data: ProductionFormValues) => {
  const payload = { ...data, date: data.date?.toISOString() };
  const response = await apiService.post("/eggs/production", payload);
  return response.data;
};

const EggProductionPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todaySummary, setTodaySummary] = useState({ totalGood: 0, large: 0, medium: 0, small: 0, broken: 0, dirty: 0 });

  const { data: batches, isLoading: batchesLoading } = useQuery<BatchOption[]>({
    queryKey: ["active-layer-batches"],
    queryFn: fetchActiveLayerBatches,
    staleTime: 300000,
  });

  const { data: todayRecords, isLoading: recordsLoading } = useQuery<ProductionRecord[]>({
    queryKey: ["today-production", selectedDate.toISOString().split("T")[0]],
    queryFn: () => fetchTodayProduction(selectedDate.toISOString().split("T")[0]),
  });

  useEffect(() => {
    if (todayRecords) {
      setTodaySummary({
        totalGood: todayRecords.reduce((s, r) => s + r.totalEggs, 0),
        large: todayRecords.reduce((s, r) => s + r.largeEggs, 0),
        medium: todayRecords.reduce((s, r) => s + r.mediumEggs, 0),
        small: todayRecords.reduce((s, r) => s + r.smallEggs, 0),
        broken: todayRecords.reduce((s, r) => s + r.brokenEggs, 0),
        dirty: todayRecords.reduce((s, r) => s + r.dirtyEggs, 0),
      });
    }
  }, [todayRecords]);

  const mutation = useMutation({
    mutationFn: saveProduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-production"] });
      queryClient.invalidateQueries({ queryKey: ["egg-production"] });
      resetForm();
    },
  });

  const formik = useFormik<ProductionFormValues>({
    initialValues: {
      date: new Date(),
      batchId: "",
      totalEggs: 0,
      largeEggs: 0,
      mediumEggs: 0,
      smallEggs: 0,
      brokenEggs: 0,
      dirtyEggs: 0,
      collectionTime: new Date().toTimeString().slice(0, 5),
      collectedBy: "",
      notes: "",
    },
    validationSchema: Yup.object({
      date: Yup.date().required().nullable(),
      batchId: Yup.string().required("Batch is required"),
      totalEggs: Yup.number().required().min(0).integer(),
      largeEggs: Yup.number().min(0).integer(),
      mediumEggs: Yup.number().min(0).integer(),
      smallEggs: Yup.number().min(0).integer(),
      brokenEggs: Yup.number().min(0).integer(),
      dirtyEggs: Yup.number().min(0).integer(),
      collectionTime: Yup.string().required("Collection time is required"),
      collectedBy: Yup.string().required("Collector name is required").max(100),
      notes: Yup.string().max(500),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit, resetForm } = formik;

  // Auto-sync: total = large + medium + small + broken + dirty
  useEffect(() => {
    const computedTotal = values.largeEggs + values.mediumEggs + values.smallEggs + values.brokenEggs + values.dirtyEggs;
    if (computedTotal !== values.totalEggs) {
      setFieldValue("totalEggs", computedTotal);
    }
  }, [values.largeEggs, values.mediumEggs, values.smallEggs, values.brokenEggs, values.dirtyEggs]);

  const goodEggs = values.totalEggs - values.brokenEggs - values.dirtyEggs;
  const breakageRate = values.totalEggs > 0 ? (values.brokenEggs / values.totalEggs) * 100 : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Daily Egg Production Entry</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DatePicker label="Date" value={selectedDate} onChange={(val) => val && setSelectedDate(val)} slotProps={{ textField: { size: "small" } }} />
          </Box>
        </Box>

        {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>Failed to save production record.</Alert>}
        {mutation.isSuccess && <Alert severity="success" sx={{ mb: 2 }}>Production record saved successfully!</Alert>}

        {/* Today's Summary */}
        <Card sx={{ mb: 3, bgcolor: theme.palette.success.light + "10" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Today's Summary - {selectedDate.toLocaleDateString()}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Collected</Typography><Typography variant="h5" fontWeight="bold">{todaySummary.totalGood.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}><Typography variant="caption" color="text.secondary">Good Eggs</Typography><Typography variant="h5" fontWeight="bold" color="success.main">{(todaySummary.totalGood - todaySummary.broken - todaySummary.dirty).toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Large</Typography><Typography variant="h5" fontWeight="bold">{todaySummary.large.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Medium</Typography><Typography variant="h5" fontWeight="bold">{todaySummary.medium.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }}><Typography variant="caption" color="text.secondary">Broken</Typography><Typography variant="h5" fontWeight="bold" color="error">{todaySummary.broken.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.warning.light + "20" }}><Typography variant="caption" color="text.secondary">Dirty</Typography><Typography variant="h5" fontWeight="bold" color="warning.main">{todaySummary.dirty.toLocaleString()}</Typography></Paper></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Entry Form */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>New Collection Entry</Typography>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={batches || []}
                        getOptionLabel={(opt: BatchOption) => `${opt.batchNumber} (${opt.breedType} - ${opt.ageDays} days)`}
                        value={(batches || []).find((b) => b.id === values.batchId) || null}
                        onChange={(_e, val) => setFieldValue("batchId", val?.id || "")}
                        loading={batchesLoading}
                        renderInput={(params) => <TextField {...params} label="Batch *" error={touched.batchId && Boolean(errors.batchId)} helperText={touched.batchId && errors.batchId} />}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date *" value={values.date} onChange={(val) => setFieldValue("date", val)}
                        slotProps={{ textField: { fullWidth: true, error: touched.date && Boolean(errors.date), helperText: (touched.date && errors.date) as string } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Collection Time *" name="collectionTime" type="time" value={values.collectionTime} onChange={handleChange} onBlur={handleBlur} error={touched.collectionTime && Boolean(errors.collectionTime)} helperText={touched.collectionTime && errors.collectionTime} InputLabelProps={{ shrink: true }} />
                    </Grid>

                    <Grid item xs={12}><Divider><Chip label="Size Counts" size="small" /></Divider></Grid>

                    <Grid item xs={6} sm={4}>
                      <TextField fullWidth label="Large Eggs" name="largeEggs" type="number" inputProps={{ min: 0 }} value={values.largeEggs} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <TextField fullWidth label="Medium Eggs" name="mediumEggs" type="number" inputProps={{ min: 0 }} value={values.mediumEggs} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <TextField fullWidth label="Small Eggs" name="smallEggs" type="number" inputProps={{ min: 0 }} value={values.smallEggs} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <TextField fullWidth label="Broken Eggs" name="brokenEggs" type="number" inputProps={{ min: 0 }} value={values.brokenEggs} onChange={handleChange} color="error" />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <TextField fullWidth label="Dirty Eggs" name="dirtyEggs" type="number" inputProps={{ min: 0 }} value={values.dirtyEggs} onChange={handleChange} color="warning" />
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Total Eggs (auto)" name="totalEggs" type="number" value={values.totalEggs} InputProps={{ readOnly: true }} sx={{ bgcolor: theme.palette.grey[50] }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Good Eggs" type="number" value={goodEggs} InputProps={{ readOnly: true }} sx={{ bgcolor: theme.palette.success.light + "10" }} color="success" />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Collected By *" name="collectedBy" value={values.collectedBy} onChange={handleChange} onBlur={handleBlur} error={touched.collectedBy && Boolean(errors.collectedBy)} helperText={touched.collectedBy && errors.collectedBy} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, bgcolor: breakageRate > 3 ? theme.palette.error.light + "20" : theme.palette.success.light + "20", borderRadius: 1, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">Breakage Rate</Typography>
                        <Typography variant="h6" fontWeight="bold" color={breakageRate > 3 ? "error" : "success"}>{breakageRate.toFixed(1)}%</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={2} label="Notes" name="notes" value={values.notes} onChange={handleChange} error={touched.notes && Boolean(errors.notes)} helperText={touched.notes && errors.notes} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending} fullWidth size="large">
                        {mutation.isPending ? "Saving..." : "Save Production Entry"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Today's History */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Today's Entries</Typography>
                {recordsLoading ? <LinearProgress /> : todayRecords && todayRecords.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead><TableRow sx={{ backgroundColor: theme.palette.grey[100] }}><TableCell>Time</TableCell><TableCell>Batch</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Good</TableCell><TableCell align="right">Broken</TableCell><TableCell align="right">Dirty</TableCell><TableCell>By</TableCell></TableRow></TableHead>
                      <TableBody>
                        {todayRecords.map((rec: ProductionRecord) => {
                          const good = rec.totalEggs - rec.brokenEggs - rec.dirtyEggs;
                          return (
                            <TableRow key={rec.id} hover>
                              <TableCell>{rec.collectionTime}</TableCell>
                              <TableCell fontWeight={500}>{rec.batchNumber}</TableCell>
                              <TableCell align="right" fontWeight="bold">{rec.totalEggs}</TableCell>
                              <TableCell align="right" color="success">{good}</TableCell>
                              <TableCell align="right" sx={{ color: theme.palette.error.main }}>{rec.brokenEggs}</TableCell>
                              <TableCell align="right" sx={{ color: theme.palette.warning.main }}>{rec.dirtyEggs}</TableCell>
                              <TableCell>{rec.collectedBy}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>No entries recorded today.</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default EggProductionPage;
