import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, Button, Card, CardContent, Divider, Grid, IconButton, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Alert, } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";
const fetchFormulaOptions = async () => {
    const response = await apiService.get("/feed-formulation/formulas", {
        params: { isActive: true, pageSize: 1000 },
    });
    return response.data.data;
};
const fetchWarehouses = async () => {
    const response = await apiService.get("/inventory/warehouses");
    return response.data;
};
const fetchFormulaDetail = async (id) => {
    const response = await apiService.get(`/feed-formulation/formulas/${id}/detail`);
    return response.data;
};
const createOrder = async (data) => {
    const payload = {
        ...data,
        expectedStartDate: data.expectedStartDate?.toISOString(),
        expectedEndDate: data.expectedEndDate?.toISOString(),
    };
    const response = await apiService.post("/manufacturing/orders", payload);
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
const ManufacturingOrderForm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEditing = Boolean(id && id !== "new");
    const [selectedFormulaId, setSelectedFormulaId] = useState("");
    const { data: formulas, isLoading: formulasLoading } = useQuery({
        queryKey: ["formula-options"],
        queryFn: fetchFormulaOptions,
        staleTime: 300000,
    });
    const { data: warehouses, isLoading: warehousesLoading } = useQuery({
        queryKey: ["warehouses"],
        queryFn: fetchWarehouses,
        staleTime: 300000,
    });
    const { data: selectedFormula, isLoading: formulaDetailLoading } = useQuery({
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
    const formik = useFormik({
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
        if (!selectedFormula || !values.plannedQuantity)
            return 0;
        return selectedFormula.totalCost * values.plannedQuantity;
    }, [selectedFormula, values.plannedQuantity]);
    const rawMaterialWarehouses = useMemo(() => (warehouses || []).filter((w) => w.type === "RAW_MATERIAL" || w.type === "BOTH"), [warehouses]);
    const finishedGoodWarehouses = useMemo(() => (warehouses || []).filter((w) => w.type === "FINISHED_GOOD" || w.type === "BOTH"), [warehouses]);
    const isLoading = formulasLoading || warehousesLoading || formulaDetailLoading;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsx(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(IconButton, { onClick: () => navigate("/manufacturing/orders"), children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEditing ? "Edit Manufacturing Order" : "Create Manufacturing Order" })] }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: createMutation.isPending || !formik.isValid, children: createMutation.isPending ? "Creating..." : "Create Order" })] }), createMutation.error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create order. Please try again." })), isLoading && _jsx(LinearProgress, { sx: { mb: 2 } }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, lg: 7, children: _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Order Details" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(Autocomplete, { options: formulas || [], getOptionLabel: (opt) => `${opt.code} - ${opt.name}`, value: (formulas || []).find((f) => f.id === values.feedFormulaId) || null, onChange: (_e, val) => {
                                                                setFieldValue("feedFormulaId", val?.id || "");
                                                            }, loading: formulasLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "Feed Formula *", error: touched.feedFormulaId && Boolean(errors.feedFormulaId), helperText: touched.feedFormulaId && errors.feedFormulaId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Planned Quantity (KG) *", name: "plannedQuantity", type: "number", inputProps: { min: 1, step: 1 }, value: values.plannedQuantity, onChange: handleChange, onBlur: handleBlur, error: touched.plannedQuantity && Boolean(errors.plannedQuantity), helperText: touched.plannedQuantity && errors.plannedQuantity }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Expected Start Date *", value: values.expectedStartDate, onChange: (val) => setFieldValue("expectedStartDate", val), slotProps: {
                                                                textField: {
                                                                    fullWidth: true,
                                                                    error: touched.expectedStartDate && Boolean(errors.expectedStartDate),
                                                                    helperText: (touched.expectedStartDate && errors.expectedStartDate),
                                                                },
                                                            } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Expected End Date *", value: values.expectedEndDate, onChange: (val) => setFieldValue("expectedEndDate", val), slotProps: {
                                                                textField: {
                                                                    fullWidth: true,
                                                                    error: touched.expectedEndDate && Boolean(errors.expectedEndDate),
                                                                    helperText: (touched.expectedEndDate && errors.expectedEndDate),
                                                                },
                                                            } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Autocomplete, { options: rawMaterialWarehouses, getOptionLabel: (opt) => opt.name, value: rawMaterialWarehouses.find((w) => w.id === values.rawMaterialWarehouseId) || null, onChange: (_e, val) => setFieldValue("rawMaterialWarehouseId", val?.id || ""), renderInput: (params) => (_jsx(TextField, { ...params, label: "Raw Material Warehouse *", error: touched.rawMaterialWarehouseId && Boolean(errors.rawMaterialWarehouseId), helperText: touched.rawMaterialWarehouseId && errors.rawMaterialWarehouseId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Autocomplete, { options: finishedGoodWarehouses, getOptionLabel: (opt) => opt.name, value: finishedGoodWarehouses.find((w) => w.id === values.finishedGoodsWarehouseId) || null, onChange: (_e, val) => setFieldValue("finishedGoodsWarehouseId", val?.id || ""), renderInput: (params) => (_jsx(TextField, { ...params, label: "Finished Goods Warehouse *", error: touched.finishedGoodsWarehouseId && Boolean(errors.finishedGoodsWarehouseId), helperText: touched.finishedGoodsWarehouseId && errors.finishedGoodsWarehouseId })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 3, label: "Notes", name: "notes", value: values.notes, onChange: handleChange, onBlur: handleBlur, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes }) })] })] }) }) }), _jsx(Grid, { item: true, xs: 12, lg: 5, children: selectedFormula && (_jsxs(_Fragment, { children: [_jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Cost Estimate" }), _jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", mb: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Formula Cost/KG" }), _jsxs(Typography, { variant: "body1", fontWeight: "bold", children: ["$", selectedFormula.totalCost.toFixed(3)] })] }), _jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", mb: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Planned Quantity" }), _jsxs(Typography, { variant: "body1", fontWeight: "bold", children: [values.plannedQuantity.toLocaleString(), " KG"] })] }), _jsx(Divider, { sx: { my: 1 } }), _jsxs(Box, { sx: { display: "flex", justifyContent: "space-between" }, children: [_jsx(Typography, { variant: "body1", fontWeight: "bold", children: "Estimated Total Cost" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: ["$", plannedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Formula Ingredients Preview" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: [selectedFormula.code, " - ", selectedFormula.name] }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Ingredient" }), _jsx(TableCell, { align: "right", children: "%" }), _jsx(TableCell, { align: "right", children: "Cost/KG" }), _jsx(TableCell, { align: "right", children: "Req. Qty (KG)" })] }) }), _jsx(TableBody, { children: selectedFormula.ingredients.map((ing, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: ing.productName }), _jsxs(TableCell, { align: "right", children: [ing.percentage.toFixed(1), "%"] }), _jsxs(TableCell, { align: "right", children: ["$", ing.costPerKg.toFixed(3)] }), _jsx(TableCell, { align: "right", fontWeight: "bold", children: ((ing.percentage / 100) * values.plannedQuantity).toFixed(1) })] }, idx))) })] }) })] }) })] })) })] })] }) }) }));
};
export default ManufacturingOrderForm;
