import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Paper, Select, TextField, Typography, Alert, useTheme, } from "@mui/material";
import { Add as AddIcon, Close as CloseIcon, Save as SaveIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid } from "@mui/x-data-grid";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";
const DIST_TYPE_OPTIONS = [
    { value: "SALE", label: "Sale", color: "success" },
    { value: "INTERNAL_TRANSFER", label: "Internal Transfer", color: "primary" },
    { value: "FARM_TRANSFER", label: "Farm Transfer", color: "info" },
    { value: "RETURN", label: "Return", color: "warning" },
];
const DIST_COLORS = {
    SALE: "#4caf50",
    INTERNAL_TRANSFER: "#2196f3",
    FARM_TRANSFER: "#00bcd4",
    RETURN: "#ff9800",
};
const fetchDistributions = async (params) => {
    const response = await apiService.get("/poultry/distributions", { params });
    return response.data;
};
const fetchBatchAvailability = async () => {
    const response = await apiService.get("/poultry/batches/availability");
    return response.data;
};
const createDistribution = async (data) => {
    const payload = { ...data, date: data.date?.toISOString() };
    const response = await apiService.post("/poultry/distributions", payload);
    return response.data;
};
const ChicksDistributionPage = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [typeFilter, setTypeFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data: distributions, isLoading: distLoading } = useQuery({
        queryKey: ["chicks-distributions", typeFilter, searchQuery, page, pageSize],
        queryFn: () => fetchDistributions({ type: typeFilter || undefined, search: searchQuery || undefined, page, pageSize }),
        keepPreviousData: true,
    });
    const { data: availability, isLoading: availLoading } = useQuery({
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
    const formik = useFormik({
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
    const columns = [
        { field: "date", headerName: "Date", flex: 0.8, minWidth: 100, valueFormatter: (p) => new Date(p).toLocaleDateString() },
        { field: "batchNumber", headerName: "Batch #", flex: 0.9, minWidth: 100 },
        {
            field: "type",
            headerName: "Type",
            flex: 0.9,
            minWidth: 90,
            renderCell: (params) => {
                const type = params.value;
                const label = DIST_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
                return _jsx(Chip, { label: label, size: "small", sx: { bgcolor: (DIST_COLORS[type] || "#9e9e9e") + "20", color: DIST_COLORS[type] || "#9e9e9e", fontWeight: 600 } });
            },
        },
        { field: "quantity", headerName: "Qty", type: "number", flex: 0.6, minWidth: 60, valueFormatter: (p) => Number(p).toLocaleString() },
        { field: "destination", headerName: "Destination", flex: 1, minWidth: 120 },
        { field: "notes", headerName: "Notes", flex: 1, minWidth: 100 },
    ];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Chicks Distribution" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => { resetForm(); setDialogOpen(true); }, children: "New Distribution" })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Available Stock by Batch" }), availLoading ? _jsx(LinearProgress, {}) : (_jsx(Grid, { container: true, spacing: 2, children: (availability || []).map((batch) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 3, children: _jsxs(Paper, { sx: { p: 2, borderLeft: `4px solid ${batch.availableForDistribution > 100 ? theme.palette.success.main : theme.palette.warning.main}` }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: "bold", children: batch.batchNumber }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: batch.breedTypeLabel }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: batch.availableForDistribution > 100 ? "success.main" : "warning.main", children: [batch.availableForDistribution.toLocaleString(), " available"] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["of ", batch.currentQty.toLocaleString(), " current"] })] }) }, batch.batchId))) }))] }) }), _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Batch # or destination..." }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, md: 3, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: typeFilter, label: "Type", onChange: (e) => setTypeFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), DIST_TYPE_OPTIONS.map((opt) => _jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 2, md: 2, children: _jsx(Button, { variant: "outlined", size: "small", fullWidth: true, onClick: () => { setSearchQuery(""); setTypeFilter(""); }, children: "Clear" }) })] }) }), _jsx(Card, { children: _jsx(DataGrid, { rows: distributions?.data || [], columns: columns, loading: distLoading, rowCount: distributions?.total || 0, pageSizeOptions: [5, 10, 25], paginationModel: { page, pageSize }, onPaginationModelChange: (m) => { setPage(m.page); setPageSize(m.pageSize); }, paginationMode: "server", disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } }) }), _jsxs(Dialog, { open: dialogOpen, onClose: () => setDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "New Distribution" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(DialogContent, { children: [mutation.error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to save distribution." }), exceedsAvailable && selectedBatchAvail && _jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["Quantity exceeds available stock (", selectedBatchAvail.availableForDistribution.toLocaleString(), ")."] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(Autocomplete, { options: availability || [], getOptionLabel: (opt) => `${opt.batchNumber} - ${opt.breedTypeLabel} (${opt.availableForDistribution.toLocaleString()} available)`, value: (availability || []).find((b) => b.batchId === values.batchId) || null, onChange: (_e, val) => setFieldValue("batchId", val?.batchId || ""), renderInput: (params) => _jsx(TextField, { ...params, label: "Batch *", error: touched.batchId && Boolean(errors.batchId), helperText: touched.batchId && errors.batchId }), isOptionEqualToValue: (a, b) => a.batchId === b.batchId }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Date *", value: values.date, onChange: (val) => setFieldValue("date", val), slotProps: { textField: { fullWidth: true, error: touched.date && Boolean(errors.date), helperText: (touched.date && errors.date) } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, select: true, label: "Type *", name: "type", value: values.type, onChange: handleChange, children: DIST_TYPE_OPTIONS.map((opt) => _jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value)) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Quantity *", name: "quantity", type: "number", inputProps: { min: 1 }, value: values.quantity, onChange: handleChange, onBlur: handleBlur, error: touched.quantity && Boolean(errors.quantity), helperText: touched.quantity && errors.quantity }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Destination *", name: "destination", value: values.destination, onChange: handleChange, onBlur: handleBlur, error: touched.destination && Boolean(errors.destination), helperText: touched.destination && errors.destination, placeholder: "Customer, farm, or warehouse..." }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 2, label: "Notes", name: "notes", value: values.notes, onChange: handleChange }) })] })] }), _jsxs(DialogActions, { sx: { px: 3, pb: 2 }, children: [_jsx(Button, { onClick: () => setDialogOpen(false), startIcon: _jsx(CloseIcon, {}), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: mutation.isPending || exceedsAvailable, children: "Save" })] })] })] })] }) }));
};
export default ChicksDistributionPage;
