import React from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface Supplier {
  id: string;
  name: string;
}

interface House {
  id: string;
  name: string;
  type: string;
  currentOccupancy: number;
  capacity: number;
}

interface BatchFormValues {
  batchNumber: string;
  breedType: string;
  supplierId: string;
  arrivalDate: Date | null;
  quantity: number;
  unitCost: number;
  houseId: string;
  notes: string;
}

const BREED_TYPE_OPTIONS = [
  { value: "BROILER", label: "Broiler" },
  { value: "LAYER", label: "Layer" },
  { value: "BREEDER", label: "Breeder" },
  { value: "PIGEON", label: "Pigeon" },
  { value: "OTHER", label: "Other" },
];

const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await apiService.get<Supplier[]>("/purchasing/suppliers?type=CHICKS_SUPPLIER");
  return response.data;
};

const fetchHouses = async (): Promise<House[]> => {
  const response = await apiService.get<House[]>("/poultry/houses?hasCapacity=true");
  return response.data;
};

const createBatch = async (data: BatchFormValues) => {
  const payload = {
    ...data,
    arrivalDate: data.arrivalDate?.toISOString(),
    totalCost: data.quantity * data.unitCost,
  };
  const response = await apiService.post("/poultry/batches", payload);
  return response.data;
};

const ChicksBatchForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
    staleTime: 300000,
  });

  const { data: houses, isLoading: housesLoading } = useQuery<House[]>({
    queryKey: ["houses"],
    queryFn: fetchHouses,
    staleTime: 300000,
  });

  const mutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chicks-batches"] });
      navigate("/poultry/batches");
    },
  });

  const validationSchema = Yup.object({
    batchNumber: Yup.string().required("Batch number is required").max(30, "Max 30 characters"),
    breedType: Yup.string().required("Breed type is required"),
    supplierId: Yup.string().required("Supplier is required"),
    arrivalDate: Yup.date().required("Arrival date is required").nullable(),
    quantity: Yup.number().required("Quantity is required").min(1, "Min 1").max(100000, "Max 100,000").integer("Must be whole number"),
    unitCost: Yup.number().required("Unit cost is required").min(0, "Min 0"),
    houseId: Yup.string().required("House is required"),
    notes: Yup.string().max(1000, "Max 1000 characters"),
  });

  const formik = useFormik<BatchFormValues>({
    initialValues: {
      batchNumber: "",
      breedType: "BROILER",
      supplierId: "",
      arrivalDate: new Date(),
      quantity: 1000,
      unitCost: 0,
      houseId: "",
      notes: "",
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;

  const totalCost = values.quantity * values.unitCost;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => navigate("/poultry/batches")}><ArrowBackIcon /></IconButton>
              <Typography variant="h4" fontWeight="bold" color="primary">Create Chicks Batch</Typography>
            </Box>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Batch"}
            </Button>
          </Box>

          {mutation.error && <Alert severity="error" sx={{ mb: 2 }}>Failed to create batch. Please try again.</Alert>}

          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Batch Number *"
                    name="batchNumber"
                    value={values.batchNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.batchNumber && Boolean(errors.batchNumber)}
                    helperText={touched.batchNumber && errors.batchNumber}
                    placeholder="e.g., BR-2024-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Breed Type *" name="breedType" value={values.breedType} onChange={handleChange} onBlur={handleBlur} error={touched.breedType && Boolean(errors.breedType)} helperText={touched.breedType && errors.breedType}>
                    {BREED_TYPE_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={suppliers || []}
                    getOptionLabel={(opt) => opt.name}
                    value={(suppliers || []).find((s) => s.id === values.supplierId) || null}
                    onChange={(_e, val) => setFieldValue("supplierId", val?.id || "")}
                    loading={suppliersLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="Supplier *" error={touched.supplierId && Boolean(errors.supplierId)} helperText={touched.supplierId && errors.supplierId} />
                    )}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Arrival Date *"
                    value={values.arrivalDate}
                    onChange={(val) => setFieldValue("arrivalDate", val)}
                    slotProps={{ textField: { fullWidth: true, error: touched.arrivalDate && Boolean(errors.arrivalDate), helperText: (touched.arrivalDate && errors.arrivalDate) as string } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Quantity *"
                    name="quantity"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={values.quantity}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.quantity && Boolean(errors.quantity)}
                    helperText={touched.quantity && errors.quantity}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Unit Cost ($) *"
                    name="unitCost"
                    type="number"
                    inputProps={{ step: 0.01, min: 0 }}
                    value={values.unitCost}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.unitCost && Boolean(errors.unitCost)}
                    helperText={touched.unitCost && errors.unitCost}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: "primary.light + 20", textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={houses || []}
                    getOptionLabel={(opt) => `${opt.name} (${opt.currentOccupancy}/${opt.capacity})`}
                    value={(houses || []).find((h) => h.id === values.houseId) || null}
                    onChange={(_e, val) => setFieldValue("houseId", val?.id || "")}
                    loading={housesLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="House Location *" error={touched.houseId && Boolean(errors.houseId)} helperText={touched.houseId && errors.houseId} />
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
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default ChicksBatchForm;
