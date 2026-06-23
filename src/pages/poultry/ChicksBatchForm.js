import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Autocomplete, Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField, Typography, Alert, } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const BREED_TYPE_OPTIONS = [
    { value: "BROILER", label: "Broiler" },
    { value: "LAYER", label: "Layer" },
    { value: "BREEDER", label: "Breeder" },
    { value: "PIGEON", label: "Pigeon" },
    { value: "OTHER", label: "Other" },
];
const fetchSuppliers = async () => {
    const response = await apiService.get("/purchasing/suppliers?type=CHICKS_SUPPLIER");
    return response.data;
};
const fetchHouses = async () => {
    const response = await apiService.get("/poultry/houses?hasCapacity=true");
    return response.data;
};
const createBatch = async (data) => {
    const payload = {
        ...data,
        arrivalDate: data.arrivalDate?.toISOString(),
        totalCost: data.quantity * data.unitCost,
    };
    const response = await apiService.post("/poultry/batches", payload);
    return response.data;
};
const ChicksBatchForm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: suppliers, isLoading: suppliersLoading } = useQuery({
        queryKey: ["suppliers"],
        queryFn: fetchSuppliers,
        staleTime: 300000,
    });
    const { data: houses, isLoading: housesLoading } = useQuery({
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
    const formik = useFormik({
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
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(IconButton, { onClick: () => navigate("/poultry/batches"), children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Create Chicks Batch" })] }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: mutation.isPending, children: mutation.isPending ? "Creating..." : "Create Batch" })] }), mutation.error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create batch. Please try again." }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Batch Number *", name: "batchNumber", value: values.batchNumber, onChange: handleChange, onBlur: handleBlur, error: touched.batchNumber && Boolean(errors.batchNumber), helperText: touched.batchNumber && errors.batchNumber, placeholder: "e.g., BR-2024-001" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, select: true, label: "Breed Type *", name: "breedType", value: values.breedType, onChange: handleChange, onBlur: handleBlur, error: touched.breedType && Boolean(errors.breedType), helperText: touched.breedType && errors.breedType, children: BREED_TYPE_OPTIONS.map((opt) => _jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value)) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Autocomplete, { options: suppliers || [], getOptionLabel: (opt) => opt.name, value: (suppliers || []).find((s) => s.id === values.supplierId) || null, onChange: (_e, val) => setFieldValue("supplierId", val?.id || ""), loading: suppliersLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "Supplier *", error: touched.supplierId && Boolean(errors.supplierId), helperText: touched.supplierId && errors.supplierId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Arrival Date *", value: values.arrivalDate, onChange: (val) => setFieldValue("arrivalDate", val), slotProps: { textField: { fullWidth: true, error: touched.arrivalDate && Boolean(errors.arrivalDate), helperText: (touched.arrivalDate && errors.arrivalDate) } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Quantity *", name: "quantity", type: "number", inputProps: { min: 1 }, value: values.quantity, onChange: handleChange, onBlur: handleBlur, error: touched.quantity && Boolean(errors.quantity), helperText: touched.quantity && errors.quantity }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Unit Cost ($) *", name: "unitCost", type: "number", inputProps: { step: 0.01, min: 0 }, value: values.unitCost, onChange: handleChange, onBlur: handleBlur, error: touched.unitCost && Boolean(errors.unitCost), helperText: touched.unitCost && errors.unitCost }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Paper, { sx: { p: 2, bgcolor: "primary.light + 20", textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Cost" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: ["$", totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Autocomplete, { options: houses || [], getOptionLabel: (opt) => `${opt.name} (${opt.currentOccupancy}/${opt.capacity})`, value: (houses || []).find((h) => h.id === values.houseId) || null, onChange: (_e, val) => setFieldValue("houseId", val?.id || ""), loading: housesLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "House Location *", error: touched.houseId && Boolean(errors.houseId), helperText: touched.houseId && errors.houseId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 3, label: "Notes", name: "notes", value: values.notes, onChange: handleChange, onBlur: handleBlur, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes }) })] }) }) })] }) }) }));
};
export default ChicksBatchForm;
