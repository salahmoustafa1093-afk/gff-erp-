import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Alert, useTheme, } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Warning as WarningIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const fetchWarehouses = async () => {
    const response = await apiService.get("/inventory/warehouses?type=FINISHED_GOOD,BOTH");
    return response.data;
};
const fetchEggStock = async () => {
    const response = await apiService.get("/eggs/inventory/stock");
    return response.data;
};
const createTransfer = async (data) => {
    const payload = { ...data, transferDate: data.transferDate?.toISOString() };
    const response = await apiService.post("/eggs/transfers", payload);
    return response.data;
};
const EggTransferPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: warehouses, isLoading: whLoading } = useQuery({
        queryKey: ["warehouses-egg"],
        queryFn: fetchWarehouses,
        staleTime: 300000,
    });
    const { data: stock, isLoading: stockLoading } = useQuery({
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
    const formik = useFormik({
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
    const exceedsStock = selectedStock ? (values.largeQty > selectedStock.largeQty ||
        values.mediumQty > selectedStock.mediumQty ||
        values.smallQty > selectedStock.smallQty) : false;
    const availableWarehouses = useMemo(() => (warehouses || []).filter((w) => w.id !== values.fromWarehouseId), [warehouses, values.fromWarehouseId]);
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(IconButton, { onClick: () => navigate("/eggs/inventory"), children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Egg Transfer" })] }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: mutation.isPending || exceedsStock || totalTransfer === 0, children: mutation.isPending ? "Transferring..." : "Create Transfer" })] }), mutation.error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create transfer." }), exceedsStock && _jsx(Alert, { severity: "error", icon: _jsx(WarningIcon, {}), sx: { mb: 2 }, children: "Transfer quantity exceeds available stock in source warehouse." }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, lg: 4, children: [_jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Available Stock" }), stockLoading ? _jsx(LinearProgress, {}) : (_jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Warehouse" }), _jsx(TableCell, { align: "right", children: "Large" }), _jsx(TableCell, { align: "right", children: "Medium" }), _jsx(TableCell, { align: "right", children: "Small" })] }) }), _jsx(TableBody, { children: (stock || []).map((s) => (_jsxs(TableRow, { hover: true, selected: s.warehouseId === values.fromWarehouseId, children: [_jsx(TableCell, { fontWeight: s.warehouseId === values.fromWarehouseId ? "bold" : "normal", children: s.warehouseName }), _jsx(TableCell, { align: "right", sx: { color: "success.main" }, children: s.largeQty.toLocaleString() }), _jsx(TableCell, { align: "right", sx: { color: "info.main" }, children: s.mediumQty.toLocaleString() }), _jsx(TableCell, { align: "right", sx: { color: "warning.main" }, children: s.smallQty.toLocaleString() })] }, s.warehouseId))) })] }) }))] }) }), selectedStock && (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: ["Selected Source: ", selectedStock.warehouseName] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 4, children: _jsxs(Paper, { sx: { p: 1.5, textAlign: "center", bgcolor: theme.palette.success.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Large" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "success.main", children: selectedStock.largeQty.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 4, children: _jsxs(Paper, { sx: { p: 1.5, textAlign: "center", bgcolor: theme.palette.info.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Medium" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "info.main", children: selectedStock.mediumQty.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 4, children: _jsxs(Paper, { sx: { p: 1.5, textAlign: "center", bgcolor: theme.palette.warning.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Small" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "warning.main", children: selectedStock.smallQty.toLocaleString() })] }) })] })] }) }))] }), _jsx(Grid, { item: true, xs: 12, lg: 8, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Transfer Details" }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Autocomplete, { options: warehouses || [], getOptionLabel: (opt) => `${opt.name} (${opt.type})`, value: (warehouses || []).find((w) => w.id === values.fromWarehouseId) || null, onChange: (_e, val) => {
                                                                setFieldValue("fromWarehouseId", val?.id || "");
                                                                setFieldValue("largeQty", 0);
                                                                setFieldValue("mediumQty", 0);
                                                                setFieldValue("smallQty", 0);
                                                            }, loading: whLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "From Warehouse *", error: touched.fromWarehouseId && Boolean(errors.fromWarehouseId), helperText: touched.fromWarehouseId && errors.fromWarehouseId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Autocomplete, { options: availableWarehouses, getOptionLabel: (opt) => `${opt.name} (${opt.type})`, value: availableWarehouses.find((w) => w.id === values.toWarehouseId) || null, onChange: (_e, val) => setFieldValue("toWarehouseId", val?.id || ""), loading: whLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "To Warehouse *", error: touched.toWarehouseId && Boolean(errors.toWarehouseId), helperText: touched.toWarehouseId && errors.toWarehouseId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Transfer Date *", value: values.transferDate, onChange: (val) => setFieldValue("transferDate", val), slotProps: { textField: { fullWidth: true, error: touched.transferDate && Boolean(errors.transferDate), helperText: (touched.transferDate && errors.transferDate) } } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Divider, { children: _jsx(Chip, { label: "Quantities", size: "small" }) }) }), _jsxs(Grid, { item: true, xs: 12, sm: 4, children: [_jsx(TextField, { fullWidth: true, label: "Large Eggs", name: "largeQty", type: "number", inputProps: { min: 0 }, value: values.largeQty, onChange: handleChange, onBlur: handleBlur, error: touched.largeQty && Boolean(errors.largeQty), helperText: touched.largeQty && errors.largeQty, color: selectedStock && values.largeQty > selectedStock.largeQty ? "error" : "success", disabled: !values.fromWarehouseId }), selectedStock && (_jsxs(Typography, { variant: "caption", color: values.largeQty > selectedStock.largeQty ? "error" : "text.secondary", children: ["Available: ", selectedStock.largeQty.toLocaleString()] }))] }), _jsxs(Grid, { item: true, xs: 12, sm: 4, children: [_jsx(TextField, { fullWidth: true, label: "Medium Eggs", name: "mediumQty", type: "number", inputProps: { min: 0 }, value: values.mediumQty, onChange: handleChange, onBlur: handleBlur, error: touched.mediumQty && Boolean(errors.mediumQty), helperText: touched.mediumQty && errors.mediumQty, color: selectedStock && values.mediumQty > selectedStock.mediumQty ? "error" : "info", disabled: !values.fromWarehouseId }), selectedStock && (_jsxs(Typography, { variant: "caption", color: values.mediumQty > selectedStock.mediumQty ? "error" : "text.secondary", children: ["Available: ", selectedStock.mediumQty.toLocaleString()] }))] }), _jsxs(Grid, { item: true, xs: 12, sm: 4, children: [_jsx(TextField, { fullWidth: true, label: "Small Eggs", name: "smallQty", type: "number", inputProps: { min: 0 }, value: values.smallQty, onChange: handleChange, onBlur: handleBlur, error: touched.smallQty && Boolean(errors.smallQty), helperText: touched.smallQty && errors.smallQty, color: selectedStock && values.smallQty > selectedStock.smallQty ? "error" : "warning", disabled: !values.fromWarehouseId }), selectedStock && (_jsxs(Typography, { variant: "caption", color: values.smallQty > selectedStock.smallQty ? "error" : "text.secondary", children: ["Available: ", selectedStock.smallQty.toLocaleString()] }))] }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Divider, {}) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Transfer" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: totalTransfer.toLocaleString() }), _jsx(Typography, { variant: "caption", color: totalTransfer === 0 ? "error" : "text.secondary", children: totalTransfer === 0 ? "Enter quantities above" : "Ready to transfer" })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 2, label: "Notes", name: "notes", value: values.notes, onChange: handleChange, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes }) })] })] }) }) })] })] }) }) }));
};
export default EggTransferPage;
