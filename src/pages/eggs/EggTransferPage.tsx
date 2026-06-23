import React, { useMemo } from "react";
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
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Warehouse as WarehouseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface Warehouse {
  id: string;
  name: string;
  type: string;
}

interface BatchOption {
  id: string;
  batchNumber: string;
  breedType: string;
  currentQty: number;
}

interface AvailableStock {
  warehouseId: string;
  warehouseName: string;
  largeQty: number;
  mediumQty: number;
  smallQty: number;
}

interface TransferFormValues {
  fromWarehouseId: string;
  toWarehouseId: string;
  largeQty: number;
  mediumQty: number;
  smallQty: number;
  transferDate: Date | null;
  notes: string;
}

const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const response = await apiService.get<Warehouse[]>("/inventory/warehouses?type=FINISHED_GOOD,BOTH");
  return response.data;
};

const fetchEggStock = async (): Promise<AvailableStock[]> => {
  const response = await apiService.get<AvailableStock[]>("/eggs/inventory/stock");
  return response.data;
};

const createTransfer = async (data: TransferFormValues) => {
  const payload = { ...data, transferDate: data.transferDate?.toISOString() };
  const response = await apiService.post("/eggs/transfers", payload);
  return response.data;
};

const EggTransferPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: warehouses, isLoading: whLoading } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-egg"],
    queryFn: fetchWarehouses,
    staleTime: 300000,
  });

  const { data: stock, isLoading: stockLoading } = useQuery<AvailableStock[]>({
    queryKey: ["egg-stock"],
    queryFn: fetchEggStock,
    staleTime: 60000,
  });

  const mutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["egg-stock"] });
      queryClient.invalidateQueries({ queryKey: ["egg-inventory"] });
      navigate("/eggs/inventory");
    },
  });

  const validationSchema = Yup.object({
    fromWarehouseId: Yup.string().required("Source warehouse is required"),
    toWarehouseId: Yup.string()
      .required("Destination warehouse is required")
      .notOneOf([Yup.ref("fromWarehouseId")], "Source and destination must be different"),
    largeQty: Yup.number().min(0, "Min 0").integer("Must be whole number"),
    mediumQty: Yup.number().min(0, "Min 0").integer("Must be whole number"),
    smallQty: Yup.number().min(0, "Min 0").integer("Must be whole number"),
    transferDate: Yup.date().required("Date is required").nullable(),
    notes: Yup.string().max(500, "Max 500 characters"),
  });

  const formik = useFormik<TransferFormValues>({
    initialValues: {
      fromWarehouseId: "",
      toWarehouseId: "",
      largeQty: 0,
      mediumQty: 0,
      smallQty: 0,
      transferDate: new Date(),
      notes: "",
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;

  const selectedStock = useMemo(() => stock?.find((s) => s.warehouseId === values.fromWarehouseId), [stock, values.fromWarehouseId]);

  const totalTransfer = values.largeQty + values.mediumQty + values.smallQty;

  const exceedsStock = selectedStock ? (
    values.largeQty > selectedStock.largeQty ||
    values.mediumQty > selectedStock.mediumQty ||
    values.smallQty > selectedStock.smallQty
  ) : false;

  const availableWarehouses = useMemo(() =>
    (warehouses || []).filter((w) => w.id !== values.fromWarehouseId),
    [warehouses, values.fromWarehouseId]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => navigate("/eggs/inventory")}><ArrowBackIcon /></IconButton>
              <Typography variant="h4" fontWeight="bold" color="primary">Egg Transfer</Typography>
            </Box>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending || exceedsStock || totalTransfer === 0}>
              {mutation.isPending ? "Transferring..." : "Create Transfer"}
            </Button>
          </Box>

          {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>Failed to create transfer.</Alert>}
          {exceedsStock && <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>Transfer quantity exceeds available stock in source warehouse.</Alert>}

          <Grid container spacing={3}>
            {/* Available Stock */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Available Stock</Typography>
                  {stockLoading ? <LinearProgress /> : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead><TableRow sx={{ backgroundColor: theme.palette.grey[100] }}><TableCell>Warehouse</TableCell><TableCell align="right">Large</TableCell><TableCell align="right">Medium</TableCell><TableCell align="right">Small</TableCell></TableRow></TableHead>
                        <TableBody>
                          {(stock || []).map((s: AvailableStock) => (
                            <TableRow key={s.warehouseId} hover selected={s.warehouseId === values.fromWarehouseId}>
                              <TableCell fontWeight={s.warehouseId === values.fromWarehouseId ? "bold" : "normal"}>{s.warehouseName}</TableCell>
                              <TableCell align="right" sx={{ color: "success.main" }}>{s.largeQty.toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ color: "info.main" }}>{s.mediumQty.toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ color: "warning.main" }}>{s.smallQty.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              {/* Selected Stock Detail */}
              {selectedStock && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Selected Source: {selectedStock.warehouseName}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}><Paper sx={{ p: 1.5, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}><Typography variant="caption" color="text.secondary">Large</Typography><Typography variant="h6" fontWeight="bold" color="success.main">{selectedStock.largeQty.toLocaleString()}</Typography></Paper></Grid>
                      <Grid item xs={4}><Paper sx={{ p: 1.5, textAlign: "center", bgcolor: theme.palette.info.light + "20" }}><Typography variant="caption" color="text.secondary">Medium</Typography><Typography variant="h6" fontWeight="bold" color="info.main">{selectedStock.mediumQty.toLocaleString()}</Typography></Paper></Grid>
                      <Grid item xs={4}><Paper sx={{ p: 1.5, textAlign: "center", bgcolor: theme.palette.warning.light + "20" }}><Typography variant="caption" color="text.secondary">Small</Typography><Typography variant="h6" fontWeight="bold" color="warning.main">{selectedStock.smallQty.toLocaleString()}</Typography></Paper></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Transfer Form */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Transfer Details</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={warehouses || []}
                        getOptionLabel={(opt: Warehouse) => `${opt.name} (${opt.type})`}
                        value={(warehouses || []).find((w) => w.id === values.fromWarehouseId) || null}
                        onChange={(_e, val) => {
                          setFieldValue("fromWarehouseId", val?.id || "");
                          setFieldValue("largeQty", 0);
                          setFieldValue("mediumQty", 0);
                          setFieldValue("smallQty", 0);
                        }}
                        loading={whLoading}
                        renderInput={(params) => (
                          <TextField {...params} label="From Warehouse *" error={touched.fromWarehouseId && Boolean(errors.fromWarehouseId)} helperText={touched.fromWarehouseId && errors.fromWarehouseId} />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={availableWarehouses}
                        getOptionLabel={(opt: Warehouse) => `${opt.name} (${opt.type})`}
                        value={availableWarehouses.find((w) => w.id === values.toWarehouseId) || null}
                        onChange={(_e, val) => setFieldValue("toWarehouseId", val?.id || "")}
                        loading={whLoading}
                        renderInput={(params) => (
                          <TextField {...params} label="To Warehouse *" error={touched.toWarehouseId && Boolean(errors.toWarehouseId)} helperText={touched.toWarehouseId && errors.toWarehouseId} />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Transfer Date *" value={values.transferDate} onChange={(val) => setFieldValue("transferDate", val)}
                        slotProps={{ textField: { fullWidth: true, error: touched.transferDate && Boolean(errors.transferDate), helperText: (touched.transferDate && errors.transferDate) as string } }}
                      />
                    </Grid>

                    <Grid item xs={12}><Divider><Chip label="Quantities" size="small" /></Divider></Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth label="Large Eggs" name="largeQty" type="number" inputProps={{ min: 0 }}
                        value={values.largeQty} onChange={handleChange} onBlur={handleBlur}
                        error={touched.largeQty && Boolean(errors.largeQty)} helperText={touched.largeQty && errors.largeQty}
                        color={selectedStock && values.largeQty > selectedStock.largeQty ? "error" : "success"}
                        disabled={!values.fromWarehouseId}
                      />
                      {selectedStock && (
                        <Typography variant="caption" color={values.largeQty > selectedStock.largeQty ? "error" : "text.secondary"}>
                          Available: {selectedStock.largeQty.toLocaleString()}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth label="Medium Eggs" name="mediumQty" type="number" inputProps={{ min: 0 }}
                        value={values.mediumQty} onChange={handleChange} onBlur={handleBlur}
                        error={touched.mediumQty && Boolean(errors.mediumQty)} helperText={touched.mediumQty && errors.mediumQty}
                        color={selectedStock && values.mediumQty > selectedStock.mediumQty ? "error" : "info"}
                        disabled={!values.fromWarehouseId}
                      />
                      {selectedStock && (
                        <Typography variant="caption" color={values.mediumQty > selectedStock.mediumQty ? "error" : "text.secondary"}>
                          Available: {selectedStock.mediumQty.toLocaleString()}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth label="Small Eggs" name="smallQty" type="number" inputProps={{ min: 0 }}
                        value={values.smallQty} onChange={handleChange} onBlur={handleBlur}
                        error={touched.smallQty && Boolean(errors.smallQty)} helperText={touched.smallQty && errors.smallQty}
                        color={selectedStock && values.smallQty > selectedStock.smallQty ? "error" : "warning"}
                        disabled={!values.fromWarehouseId}
                      />
                      {selectedStock && (
                        <Typography variant="caption" color={values.smallQty > selectedStock.smallQty ? "error" : "text.secondary"}>
                          Available: {selectedStock.smallQty.toLocaleString()}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }}>
                        <Typography variant="caption" color="text.secondary">Total Transfer</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">{totalTransfer.toLocaleString()}</Typography>
                        <Typography variant="caption" color={totalTransfer === 0 ? "error" : "text.secondary"}>
                          {totalTransfer === 0 ? "Enter quantities above" : "Ready to transfer"}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth multiline rows={2} label="Notes" name="notes" value={values.notes} onChange={handleChange} error={touched.notes && Boolean(errors.notes)} helperText={touched.notes && errors.notes} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default EggTransferPage;
