import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Alert, useTheme, } from "@mui/material";
import { Save as SaveIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";
const fetchActiveLayerBatches = async () => {
    const response = await apiService.get("/poultry/batches/active-layers");
    return response.data;
};
const fetchTodayProduction = async (date) => {
    const response = await apiService.get("/eggs/production", { params: { date } });
    return response.data;
};
const saveProduction = async (data) => {
    const payload = { ...data, date: data.date?.toISOString() };
    const response = await apiService.post("/eggs/production", payload);
    return response.data;
};
const EggProductionPage = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [todaySummary, setTodaySummary] = useState({ totalGood: 0, large: 0, medium: 0, small: 0, broken: 0, dirty: 0 });
    const { data: batches, isLoading: batchesLoading } = useQuery({
        queryKey: ["active-layer-batches"],
        queryFn: fetchActiveLayerBatches,
        staleTime: 300000,
    });
    const { data: todayRecords, isLoading: recordsLoading } = useQuery({
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
    const formik = useFormik({
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
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Daily Egg Production Entry" }), _jsx(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: _jsx(DatePicker, { label: "Date", value: selectedDate, onChange: (val) => val && setSelectedDate(val), slotProps: { textField: { size: "small" } } }) })] }), mutation.error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to save production record." }), mutation.isSuccess && _jsx(Alert, { severity: "success", sx: { mb: 2 }, children: "Production record saved successfully!" }), _jsx(Card, { sx: { mb: 3, bgcolor: theme.palette.success.light + "10" }, children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: ["Today's Summary - ", selectedDate.toLocaleDateString()] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Collected" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: todaySummary.totalGood.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Good Eggs" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: (todaySummary.totalGood - todaySummary.broken - todaySummary.dirty).toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Large" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: todaySummary.large.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Medium" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: todaySummary.medium.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Broken" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "error", children: todaySummary.broken.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.warning.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Dirty" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "warning.main", children: todaySummary.dirty.toLocaleString() })] }) })] })] }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, lg: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "New Collection Entry" }), _jsx("form", { onSubmit: handleSubmit, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(Autocomplete, { options: batches || [], getOptionLabel: (opt) => `${opt.batchNumber} (${opt.breedType} - ${opt.ageDays} days)`, value: (batches || []).find((b) => b.id === values.batchId) || null, onChange: (_e, val) => setFieldValue("batchId", val?.id || ""), loading: batchesLoading, renderInput: (params) => _jsx(TextField, { ...params, label: "Batch *", error: touched.batchId && Boolean(errors.batchId), helperText: touched.batchId && errors.batchId }), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Date *", value: values.date, onChange: (val) => setFieldValue("date", val), slotProps: { textField: { fullWidth: true, error: touched.date && Boolean(errors.date), helperText: (touched.date && errors.date) } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Collection Time *", name: "collectionTime", type: "time", value: values.collectionTime, onChange: handleChange, onBlur: handleBlur, error: touched.collectionTime && Boolean(errors.collectionTime), helperText: touched.collectionTime && errors.collectionTime, InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Divider, { children: _jsx(Chip, { label: "Size Counts", size: "small" }) }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Large Eggs", name: "largeEggs", type: "number", inputProps: { min: 0 }, value: values.largeEggs, onChange: handleChange }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Medium Eggs", name: "mediumEggs", type: "number", inputProps: { min: 0 }, value: values.mediumEggs, onChange: handleChange }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Small Eggs", name: "smallEggs", type: "number", inputProps: { min: 0 }, value: values.smallEggs, onChange: handleChange }) }), _jsx(Grid, { item: true, xs: 6, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Broken Eggs", name: "brokenEggs", type: "number", inputProps: { min: 0 }, value: values.brokenEggs, onChange: handleChange, color: "error" }) }), _jsx(Grid, { item: true, xs: 6, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Dirty Eggs", name: "dirtyEggs", type: "number", inputProps: { min: 0 }, value: values.dirtyEggs, onChange: handleChange, color: "warning" }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Divider, {}) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Total Eggs (auto)", name: "totalEggs", type: "number", value: values.totalEggs, InputProps: { readOnly: true }, sx: { bgcolor: theme.palette.grey[50] } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Good Eggs", type: "number", value: goodEggs, InputProps: { readOnly: true }, sx: { bgcolor: theme.palette.success.light + "10" }, color: "success" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Collected By *", name: "collectedBy", value: values.collectedBy, onChange: handleChange, onBlur: handleBlur, error: touched.collectedBy && Boolean(errors.collectedBy), helperText: touched.collectedBy && errors.collectedBy }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(Box, { sx: { p: 1.5, bgcolor: breakageRate > 3 ? theme.palette.error.light + "20" : theme.palette.success.light + "20", borderRadius: 1, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Breakage Rate" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: breakageRate > 3 ? "error" : "success", children: [breakageRate.toFixed(1), "%"] })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 2, label: "Notes", name: "notes", value: values.notes, onChange: handleChange, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: mutation.isPending, fullWidth: true, size: "large", children: mutation.isPending ? "Saving..." : "Save Production Entry" }) })] }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, lg: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Today's Entries" }), recordsLoading ? _jsx(LinearProgress, {}) : todayRecords && todayRecords.length > 0 ? (_jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Time" }), _jsx(TableCell, { children: "Batch" }), _jsx(TableCell, { align: "right", children: "Total" }), _jsx(TableCell, { align: "right", children: "Good" }), _jsx(TableCell, { align: "right", children: "Broken" }), _jsx(TableCell, { align: "right", children: "Dirty" }), _jsx(TableCell, { children: "By" })] }) }), _jsx(TableBody, { children: todayRecords.map((rec) => {
                                                            const good = rec.totalEggs - rec.brokenEggs - rec.dirtyEggs;
                                                            return (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: rec.collectionTime }), _jsx(TableCell, { fontWeight: 500, children: rec.batchNumber }), _jsx(TableCell, { align: "right", fontWeight: "bold", children: rec.totalEggs }), _jsx(TableCell, { align: "right", color: "success", children: good }), _jsx(TableCell, { align: "right", sx: { color: theme.palette.error.main }, children: rec.brokenEggs }), _jsx(TableCell, { align: "right", sx: { color: theme.palette.warning.main }, children: rec.dirtyEggs }), _jsx(TableCell, { children: rec.collectedBy })] }, rec.id));
                                                        }) })] }) })) : _jsx(Typography, { color: "text.secondary", sx: { py: 3, textAlign: "center" }, children: "No entries recorded today." })] }) }) })] })] }) }));
};
export default EggProductionPage;
