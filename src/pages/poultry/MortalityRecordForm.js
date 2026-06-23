import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Grid, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography, Alert, useTheme, } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, TrendingDown as TrendingDownIcon, Warning as WarningIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";
const CAUSE_OPTIONS = [
    { value: "DISEASE", label: "Disease" },
    { value: "HEAT", label: "Heat Stress" },
    { value: "COLD", label: "Cold Stress" },
    { value: "PREDATOR", label: "Predator" },
    { value: "OTHER", label: "Other" },
];
const CAUSE_COLORS = {
    DISEASE: "#f44336",
    HEAT: "#ff9800",
    COLD: "#2196f3",
    PREDATOR: "#795548",
    OTHER: "#9e9e9e",
};
const fetchBatches = async () => {
    const response = await apiService.get("/poultry/batches", { params: { status: "ACTIVE", pageSize: 1000 } });
    return response.data.data;
};
const fetchBatchDetail = async (id) => {
    const response = await apiService.get(`/poultry/batches/${id}/summary`);
    return response.data;
};
const recordMortality = async (data) => {
    const payload = {
        ...data,
        date: data.date?.toISOString(),
    };
    const response = await apiService.post("/poultry/mortality", payload);
    return response.data;
};
const MortalityRecordForm = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id: batchIdParam } = useParams();
    const preselectedBatchId = batchIdParam || "";
    const { data: batches, isLoading: batchesLoading } = useQuery({
        queryKey: ["active-batches"],
        queryFn: fetchBatches,
        staleTime: 300000,
    });
    const { data: selectedBatch, isLoading: batchLoading } = useQuery({
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
            }
            else {
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
    const formik = useFormik({
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
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(IconButton, { onClick: () => preselectedBatchId ? navigate(`/poultry/batches/${preselectedBatchId}`) : navigate("/poultry/batches"), children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Record Mortality" })] }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: mutation.isPending || isOverLimit, children: mutation.isPending ? "Saving..." : "Save Record" })] }), mutation.error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to save mortality record." }), isOverLimit && _jsxs(Alert, { severity: "error", icon: _jsx(WarningIcon, {}), sx: { mb: 2 }, children: ["Cannot record more deaths than current quantity (", selectedBatch?.currentQty.toLocaleString(), ")."] }), isWarning && !isOverLimit && _jsxs(Alert, { severity: "warning", icon: _jsx(WarningIcon, {}), sx: { mb: 2 }, children: ["Projected mortality rate will be ", projectedRate.toFixed(1), "% (above 5% threshold)."] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 7, children: _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(Autocomplete, { options: batches || [], getOptionLabel: (opt) => `${opt.batchNumber} (${opt.breedType} - ${opt.currentQty.toLocaleString()} remaining)`, value: (batches || []).find((b) => b.id === values.batchId) || null, onChange: (_e, val) => setFieldValue("batchId", val?.id || ""), loading: batchesLoading, disabled: Boolean(preselectedBatchId), renderInput: (params) => (_jsx(TextField, { ...params, label: "Batch *", error: touched.batchId && Boolean(errors.batchId), helperText: touched.batchId && errors.batchId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Date *", value: values.date, onChange: (val) => setFieldValue("date", val), slotProps: { textField: { fullWidth: true, error: touched.date && Boolean(errors.date), helperText: (touched.date && errors.date) } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Death Count *", name: "count", type: "number", inputProps: { min: 1 }, value: values.count, onChange: handleChange, onBlur: handleBlur, error: touched.count && Boolean(errors.count), helperText: touched.count && errors.count }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, select: true, label: "Cause *", name: "cause", value: values.cause, onChange: handleChange, onBlur: handleBlur, error: touched.cause && Boolean(errors.cause), helperText: touched.cause && errors.cause, children: CAUSE_OPTIONS.map((opt) => _jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value)) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 2, label: "Notes", name: "notes", value: values.notes, onChange: handleChange, onBlur: handleBlur, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes }) })] }) }) }) }), _jsx(Grid, { item: true, xs: 12, md: 5, children: selectedBatch ? (_jsxs(_Fragment, { children: [_jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Current Batch Status" }), _jsx(TableContainer, { children: _jsx(Table, { size: "small", children: _jsxs(TableBody, { children: [_jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Batch" }), _jsx(TableCell, { children: selectedBatch.batchNumber })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Breed" }), _jsx(TableCell, { children: selectedBatch.breedType })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Current Qty" }), _jsx(TableCell, { fontWeight: "bold", color: "primary", children: selectedBatch.currentQty.toLocaleString() })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Age (days)" }), _jsx(TableCell, { children: selectedBatch.ageDays })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Current Mort %" }), _jsx(TableCell, { children: _jsx(Chip, { label: `${selectedBatch.mortalityRate.toFixed(1)}%`, size: "small", color: selectedBatch.mortalityRate > 5 ? "error" : selectedBatch.mortalityRate > 3 ? "warning" : "success" }) })] })] }) }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Projected Impact" }), _jsx(TableContainer, { children: _jsx(Table, { size: "small", children: _jsxs(TableBody, { children: [_jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Before" }), _jsx(TableCell, { align: "right", fontWeight: "bold", children: selectedBatch.currentQty.toLocaleString() })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Deaths" }), _jsxs(TableCell, { align: "right", fontWeight: "bold", color: "error", children: ["-", values.count] })] }), _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { sx: { fontWeight: "bold" }, children: "Remaining" }), _jsx(TableCell, { align: "right", fontWeight: "bold", color: remainingAfter < selectedBatch.currentQty * 0.5 ? "error" : "primary", children: remainingAfter.toLocaleString() })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Projected Mort %" }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: `${projectedRate.toFixed(2)}%`, size: "small", color: projectedRate > 5 ? "error" : projectedRate > 3 ? "warning" : "success", sx: { fontWeight: 700 } }) })] })] }) }) })] }) })] })) : (_jsxs(Paper, { sx: { p: 3, textAlign: "center" }, children: [_jsx(TrendingDownIcon, { sx: { fontSize: 48, color: "text.secondary", mb: 1 } }), _jsx(Typography, { color: "text.secondary", children: "Select a batch to see projected impact" })] })) })] })] }) }) }));
};
export default MortalityRecordForm;
