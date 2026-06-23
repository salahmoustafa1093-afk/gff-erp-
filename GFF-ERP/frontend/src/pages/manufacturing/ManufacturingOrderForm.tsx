import React, { useEffect, useMemo, useState } from "react";
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
  LinearProgress,
  Paper,
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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";

interface FeedFormulaOption {
  id: string;
  code: string;
  name: string;
  feedType: string;
  totalCost: number;
}

interface Warehouse {
  id: string;
  name: string;
  type: string;
}

interface FormulaIngredient {
  productName: string;
  percentage: number;
  costPerKg: number;
}

interface FeedFormulaDetail {
  id: string;
  code: string;
  name: string;
  totalCost: number;
  ingredients: FormulaIngredient[];
}

interface OrderFormValues {
  feedFormulaId: string;
  plannedQuantity: number;
  expectedStartDate: Date | null;
  expectedEndDate: Date | null;
  rawMaterialWarehouseId: string;
  finishedGoodsWarehouseId: string;
  notes: string;
}

const fetchFormulaOptions = async (): Promise<FeedFormulaOption[]> => {
  const response = await apiService.get<{ data: FeedFormulaOption[] }>("/feed-formulation/formulas", {
    params: { isActive: true, pageSize: 1000 },
  });
  return response.data.data;
};

const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const response = await apiService.get<Warehouse[]>("/inventory/warehouses");
  return response.data;
};

const fetchFormulaDetail = async (id: string): Promise<FeedFormulaDetail> => {
  const response = await apiService.get<FeedFormulaDetail>(`/feed-formulation/formulas/${id}/detail`);
  return response.data;
};

const createOrder = async (data: OrderFormValues): Promise<{ id: string }> => {
  const payload = {
    ...data,
    expectedStartDate: data.expectedStartDate?.toISOString(),
    expectedEndDate: data.expectedEndDate?.toISOString(),
  };
  const response = await apiService.post<{ id: string }>("/manufacturing/orders", payload);
  return response.data;
};

const validationSchema = Yup.object({
  feedFormulaId: Yup.string().required("Feed formula is required"),
  plannedQuantity: Yup.number().required("Planned quantity is required").min(1, "Must be at least 1 KG").max(1000000, "Max 1,000,000 KG"),
  expectedStartDate: Yup.date().required("Start date is required").nullable(),
  expectedEndDate: Yup.date()
    .required("End date is required")
    .nullable()
    .min(Yup.ref("expectedStartDate"), "End date must be after start date"),
  rawMaterialWarehouseId: Yup.string().required("Raw material warehouse is required"),
  finishedGoodsWarehouseId: Yup.string()
    .required("Finished goods warehouse is required")
    .notOneOf([Yup.ref("rawMaterialWarehouseId")], "Must be different from raw material warehouse"),
  notes: Yup.string().max(1000, "Max 1000 characters"),
});

const ManufacturingOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== "new");

  const [selectedFormulaId, setSelectedFormulaId] = useState<string>("");

  const { data: formulas, isLoading: formulasLoading } = useQuery<FeedFormulaOption[]>({
    queryKey: ["formula-options"],
    queryFn: fetchFormulaOptions,
    staleTime: 300000,
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
    staleTime: 300000,
  });

  const { data: selectedFormula, isLoading: formulaDetailLoading } = useQuery<FeedFormulaDetail>({
    queryKey: ["formula-detail", selectedFormulaId],
    queryFn: () => fetchFormulaDetail(selectedFormulaId),
    enabled: Boolean(selectedFormulaId),
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
      navigate("/manufacturing/orders");
    },
  });

  const formik = useFormik<OrderFormValues>({
    initialValues: {
      feedFormulaId: "",
      plannedQuantity: 1000,
      expectedStartDate: new Date(),
      expectedEndDate: new Date(Date.now() + 86400000),
      rawMaterialWarehouseId: "",
      finishedGoodsWarehouseId: "",
      notes: "",
    },
    validationSchema,
    onSubmit: (values) => {
      createMutation.mutate(values);
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;

  useEffect(() => {
    if (values.feedFormulaId !== selectedFormulaId) {
      setSelectedFormulaId(values.feedFormulaId);
    }
  }, [values.feedFormulaId, selectedFormulaId]);

  const plannedCost = useMemo(() => {
    if (!selectedFormula || !values.plannedQuantity) return 0;
    return selectedFormula.totalCost * values.plannedQuantity;
  }, [selectedFormula, values.plannedQuantity]);

  const rawMaterialWarehouses = useMemo(
    () => (warehouses || []).filter((w) => w.type === "RAW_MATERIAL" || w.type === "BOTH"),
    [warehouses]
  );

  const finishedGoodWarehouses = useMemo(
    () => (warehouses || []).filter((w) => w.type === "FINISHED_GOOD" || w.type === "BOTH"),
    [warehouses]
  );

  const isLoading = formulasLoading || warehousesLoading || formulaDetailLoading;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => navigate("/manufacturing/orders")}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {isEditing ? "Edit Manufacturing Order" : "Create Manufacturing Order"}
              </Typography>
            </Box>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={createMutation.isPending || !formik.isValid}
            >
              {createMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </Box>

          {createMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>Failed to create order. Please try again.</Alert>
          )}

          {isLoading && <LinearProgress sx={{ mb: 2 }} />}

          <Grid container spacing={3}>
            {/* Left: Form */}
            <Grid item xs={12} lg={7}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Order Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={formulas || []}
                        getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                        value={(formulas || []).find((f) => f.id === values.feedFormulaId) || null}
                        onChange={(_e, val) => {
                          setFieldValue("feedFormulaId", val?.id || "");
                        }}
                        loading={formulasLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Feed Formula *"
                            error={touched.feedFormulaId && Boolean(errors.feedFormulaId)}
                            helperText={touched.feedFormulaId && errors.feedFormulaId}
                          />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Planned Quantity (KG) *"
                        name="plannedQuantity"
                        type="number"
                        inputProps={{ min: 1, step: 1 }}
                        value={values.plannedQuantity}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.plannedQuantity && Boolean(errors.plannedQuantity)}
                        helperText={touched.plannedQuantity && errors.plannedQuantity}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Expected Start Date *"
                        value={values.expectedStartDate}
                        onChange={(val) => setFieldValue("expectedStartDate", val)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: touched.expectedStartDate && Boolean(errors.expectedStartDate),
                            helperText: (touched.expectedStartDate && errors.expectedStartDate) as string,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Expected End Date *"
                        value={values.expectedEndDate}
                        onChange={(val) => setFieldValue("expectedEndDate", val)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: touched.expectedEndDate && Boolean(errors.expectedEndDate),
                            helperText: (touched.expectedEndDate && errors.expectedEndDate) as string,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={rawMaterialWarehouses}
                        getOptionLabel={(opt) => opt.name}
                        value={rawMaterialWarehouses.find((w) => w.id === values.rawMaterialWarehouseId) || null}
                        onChange={(_e, val) => setFieldValue("rawMaterialWarehouseId", val?.id || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Raw Material Warehouse *"
                            error={touched.rawMaterialWarehouseId && Boolean(errors.rawMaterialWarehouseId)}
                            helperText={touched.rawMaterialWarehouseId && errors.rawMaterialWarehouseId}
                          />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={finishedGoodWarehouses}
                        getOptionLabel={(opt) => opt.name}
                        value={finishedGoodWarehouses.find((w) => w.id === values.finishedGoodsWarehouseId) || null}
                        onChange={(_e, val) => setFieldValue("finishedGoodsWarehouseId", val?.id || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Finished Goods Warehouse *"
                            error={touched.finishedGoodsWarehouseId && Boolean(errors.finishedGoodsWarehouseId)}
                            helperText={touched.finishedGoodsWarehouseId && errors.finishedGoodsWarehouseId}
                          />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.notes && Boolean(errors.notes)}
                        helperText={touched.notes && errors.notes}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Preview */}
            <Grid item xs={12} lg={5}>
              {selectedFormula && (
                <>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Cost Estimate</Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Formula Cost/KG</Typography>
                        <Typography variant="body1" fontWeight="bold">${selectedFormula.totalCost.toFixed(3)}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Planned Quantity</Typography>
                        <Typography variant="body1" fontWeight="bold">{values.plannedQuantity.toLocaleString()} KG</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body1" fontWeight="bold">Estimated Total Cost</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          ${plannedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Formula Ingredients Preview</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {selectedFormula.code} - {selectedFormula.name}
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Ingredient</TableCell>
                              <TableCell align="right">%</TableCell>
                              <TableCell align="right">Cost/KG</TableCell>
                              <TableCell align="right">Req. Qty (KG)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedFormula.ingredients.map((ing, idx) => (
                              <TableRow key={idx} hover>
                                <TableCell>{ing.productName}</TableCell>
                                <TableCell align="right">{ing.percentage.toFixed(1)}%</TableCell>
                                <TableCell align="right">${ing.costPerKg.toFixed(3)}</TableCell>
                                <TableCell align="right" fontWeight="bold">
                                  {((ing.percentage / 100) * values.plannedQuantity).toFixed(1)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default ManufacturingOrderForm;
