import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Alert, useTheme, } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, Close as CloseIcon, Save as SaveIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";
const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Draft", color: "default" },
    { value: "ACTIVE", label: "Active", color: "success" },
    { value: "ARCHIVED", label: "Archived", color: "warning" },
    { value: "CANCELLED", label: "Cancelled", color: "error" },
];
const STATUS_CHIP_PROPS = {
    DRAFT: { color: "default", variant: "outlined" },
    ACTIVE: { color: "success", variant: "filled" },
    ARCHIVED: { color: "warning", variant: "outlined" },
    CANCELLED: { color: "error", variant: "outlined" },
};
const fetchProductionPlans = async (params) => {
    const response = await apiService.get("/production/plans", { params });
    return response.data;
};
const createPlan = async (data) => {
    const response = await apiService.post("/production/plans", data);
    return response.data;
};
const updatePlan = async ({ id, data }) => {
    const response = await apiService.put(`/production/plans/${id}`, data);
    return response.data;
};
const deletePlan = async (id) => {
    await apiService.delete(`/production/plans/${id}`);
};
const planValidationSchema = Yup.object({
    name: Yup.string().required("Plan name is required").max(100, "Max 100 characters"),
    description: Yup.string().max(500, "Max 500 characters"),
    periodStart: Yup.date().required("Start date is required").nullable(),
    periodEnd: Yup.date()
        .required("End date is required")
        .nullable()
        .min(Yup.ref("periodStart"), "End date must be after start date"),
    status: Yup.string().required("Status is required"),
});
const ProductionPlansPage = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailPlan, setDetailPlan] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState("");
    const { data, isLoading, error } = useQuery({
        queryKey: ["production-plans", searchQuery, statusFilter, page, pageSize],
        queryFn: () => fetchProductionPlans({
            search: searchQuery || undefined,
            status: statusFilter || undefined,
        }),
        keepPreviousData: true,
    });
    const createMutation = useMutation({
        mutationFn: createPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-plans"] });
            setDialogOpen(false);
            resetForm();
        },
    });
    const updateMutation = useMutation({
        mutationFn: updatePlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-plans"] });
            setDialogOpen(false);
            setEditingPlan(null);
            resetForm();
        },
    });
    const deleteMutation = useMutation({
        mutationFn: deletePlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-plans"] });
            setDeleteConfirmOpen(false);
            setDeleteId("");
        },
    });
    const formik = useFormik({
        initialValues: {
            name: "",
            description: "",
            periodStart: null,
            periodEnd: null,
            status: "DRAFT",
        },
        validationSchema: planValidationSchema,
        onSubmit: (values) => {
            if (editingPlan) {
                updateMutation.mutate({ id: editingPlan.id, data: values });
            }
            else {
                createMutation.mutate(values);
            }
        },
    });
    const { resetForm, setValues, handleSubmit } = formik;
    const openCreateDialog = useCallback(() => {
        setEditingPlan(null);
        resetForm();
        setDialogOpen(true);
    }, [resetForm]);
    const openEditDialog = useCallback((plan) => {
        setEditingPlan(plan);
        setValues({
            name: plan.name,
            description: plan.description,
            periodStart: new Date(plan.periodStart),
            periodEnd: new Date(plan.periodEnd),
            status: plan.status,
        });
        setDialogOpen(true);
    }, [setValues]);
    const openDetailDialog = useCallback((plan) => {
        setDetailPlan(plan);
        setDetailDialogOpen(true);
    }, []);
    const handleDeleteClick = useCallback((id) => {
        setDeleteId(id);
        setDeleteConfirmOpen(true);
    }, []);
    const columns = [
        {
            field: "name",
            headerName: "Plan Name",
            flex: 1.5,
            minWidth: 180,
        },
        {
            field: "period",
            headerName: "Period",
            flex: 1.5,
            minWidth: 200,
            valueGetter: (params) => {
                const row = params.row;
                const start = new Date(row.periodStart).toLocaleDateString();
                const end = new Date(row.periodEnd).toLocaleDateString();
                return `${start} - ${end}`;
            },
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            minWidth: 100,
            renderCell: (params) => {
                const status = params.value;
                const chipProps = STATUS_CHIP_PROPS[status] || { color: "default", variant: "outlined" };
                const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
                return _jsx(Chip, { label: statusLabel, size: "small", color: chipProps.color, variant: chipProps.variant });
            },
        },
        {
            field: "targetQuantity",
            headerName: "Target (KG)",
            type: "number",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (params) => Number(params).toLocaleString(),
        },
        {
            field: "actualQuantity",
            headerName: "Actual (KG)",
            type: "number",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (params) => Number(params).toLocaleString(),
        },
        {
            field: "variancePercent",
            headerName: "Variance %",
            type: "number",
            flex: 0.8,
            minWidth: 90,
            renderCell: (params) => {
                const val = params.value;
                const color = val >= 0 ? theme.palette.success.main : theme.palette.error.main;
                return (_jsxs(Typography, { variant: "body2", sx: { color, fontWeight: 600 }, children: [val >= 0 ? "+" : "", val.toFixed(1), "%"] }));
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            minWidth: 140,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { sx: { display: "flex", gap: 0.5 }, children: [_jsx(Tooltip, { title: "View Details", children: _jsx(IconButton, { size: "small", onClick: () => openDetailDialog(params.row), children: _jsx(VisibilityIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => openEditDialog(params.row), children: _jsx(EditIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDeleteClick(params.row.id), children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] })),
        },
    ];
    if (error) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "Failed to load production plans. Please refresh the page." }) }));
    }
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        mb: 3,
                    }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Production Plans" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: openCreateDialog, sx: { minWidth: 160 }, children: "Create Plan" })] }), _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 5, md: 4, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search by name", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Enter plan name..." }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, md: 3, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => setStatusFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), STATUS_OPTIONS.map((opt) => (_jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value)))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, md: 2, children: _jsx(Button, { variant: "outlined", size: "small", onClick: () => {
                                        setSearchQuery("");
                                        setStatusFilter("");
                                    }, fullWidth: true, children: "Clear Filters" }) })] }) }), _jsx(Card, { children: _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, pageSizeOptions: [5, 10, 25, 50], paginationModel: { page, pageSize }, onPaginationModelChange: (model) => {
                            setPage(model.page);
                            setPageSize(model.pageSize);
                        }, paginationMode: "server", disableRowSelectionOnClick: true, density: "compact", sx: { border: "none", minHeight: 400 }, slots: {
                            loadingOverlay: LinearProgress,
                        } }) }), _jsxs(Dialog, { open: dialogOpen, onClose: () => setDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [editingPlan ? "Edit Production Plan" : "Create Production Plan", _jsx(IconButton, { onClick: () => setDialogOpen(false), size: "small", children: _jsx(CloseIcon, {}) })] }) }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Plan Name", name: "name", value: formik.values.name, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.name && Boolean(formik.errors.name), helperText: formik.touched.name && formik.errors.name }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Description", name: "description", multiline: true, rows: 3, value: formik.values.description, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.description && Boolean(formik.errors.description), helperText: formik.touched.description && formik.errors.description }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Period Start", value: formik.values.periodStart, onChange: (val) => formik.setFieldValue("periodStart", val), slotProps: {
                                                        textField: {
                                                            fullWidth: true,
                                                            error: formik.touched.periodStart && Boolean(formik.errors.periodStart),
                                                            helperText: (formik.touched.periodStart && formik.errors.periodStart),
                                                        },
                                                    } }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(DatePicker, { label: "Period End", value: formik.values.periodEnd, onChange: (val) => formik.setFieldValue("periodEnd", val), slotProps: {
                                                        textField: {
                                                            fullWidth: true,
                                                            error: formik.touched.periodEnd && Boolean(formik.errors.periodEnd),
                                                            helperText: (formik.touched.periodEnd && formik.errors.periodEnd),
                                                        },
                                                    } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Status" }), _jsx(Select, { name: "status", value: formik.values.status, label: "Status", onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.status && Boolean(formik.errors.status), children: STATUS_OPTIONS.map((opt) => (_jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))) })] }) })] }) }), _jsxs(DialogActions, { sx: { px: 3, pb: 2 }, children: [_jsx(Button, { onClick: () => setDialogOpen(false), startIcon: _jsx(CloseIcon, {}), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: formik.isSubmitting || !formik.isValid, children: editingPlan ? "Update" : "Create" })] })] })] }), _jsxs(Dialog, { open: detailDialogOpen, onClose: () => setDetailDialogOpen(false), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: ["Plan Details", _jsx(IconButton, { onClick: () => setDetailDialogOpen(false), size: "small", children: _jsx(CloseIcon, {}) })] }) }), _jsx(DialogContent, { children: detailPlan && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "h5", fontWeight: "bold", children: detailPlan.name }), _jsx(Chip, { label: STATUS_OPTIONS.find((o) => o.value === detailPlan.status)?.label || detailPlan.status, color: STATUS_CHIP_PROPS[detailPlan.status]?.color || "default", size: "small", sx: { mt: 1 } })] }), _jsxs(Grid, { item: true, xs: 12, sm: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Period Start" }), _jsx(Typography, { variant: "body1", fontWeight: 500, children: new Date(detailPlan.periodStart).toLocaleDateString() })] }), _jsxs(Grid, { item: true, xs: 12, sm: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Period End" }), _jsx(Typography, { variant: "body1", fontWeight: 500, children: new Date(detailPlan.periodEnd).toLocaleDateString() })] }), _jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Description" }), _jsx(Typography, { variant: "body1", children: detailPlan.description || "No description provided." })] }), _jsxs(Grid, { item: true, xs: 12, children: [_jsx(Divider, { sx: { my: 1 } }), _jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Targets vs Actual" })] }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Target" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: "primary", children: [detailPlan.targetQuantity.toLocaleString(), " KG"] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Actual" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: [detailPlan.actualQuantity.toLocaleString(), " KG"] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Variance" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", sx: {
                                                        color: detailPlan.variancePercent >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                                    }, children: [detailPlan.variancePercent >= 0 ? "+" : "", detailPlan.variancePercent.toFixed(1), "%"] })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(Box, { sx: { mt: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: "Progress" }), _jsx(LinearProgress, { variant: "determinate", value: Math.min((detailPlan.actualQuantity / Math.max(detailPlan.targetQuantity, 1)) * 100, 100), sx: { height: 10, borderRadius: 5 } }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [((detailPlan.actualQuantity / Math.max(detailPlan.targetQuantity, 1)) * 100).toFixed(1), "% completed"] })] }) }), detailPlan.targets && detailPlan.targets.length > 0 && (_jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, sx: { mt: 1 }, children: "Formula Targets" }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Feed Formula" }), _jsx(TableCell, { align: "right", children: "Target (KG)" }), _jsx(TableCell, { align: "right", children: "Actual (KG)" }), _jsx(TableCell, { align: "right", children: "Variance" })] }) }), _jsx(TableBody, { children: detailPlan.targets.map((target) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: target.feedFormulaName }), _jsx(TableCell, { align: "right", children: target.targetQuantity.toLocaleString() }), _jsx(TableCell, { align: "right", children: target.actualQuantity.toLocaleString() }), _jsxs(TableCell, { align: "right", sx: {
                                                                            color: target.variance >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                                                            fontWeight: 600,
                                                                        }, children: [target.variance >= 0 ? "+" : "", target.variance.toLocaleString()] })] }, target.id))) })] }) })] }))] })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDetailDialogOpen(false), children: "Close" }), detailPlan && (_jsx(Button, { variant: "contained", startIcon: _jsx(EditIcon, {}), onClick: () => {
                                        setDetailDialogOpen(false);
                                        openEditDialog(detailPlan);
                                    }, children: "Edit" }))] })] }), _jsxs(Dialog, { open: deleteConfirmOpen, onClose: () => setDeleteConfirmOpen(false), maxWidth: "xs", children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this production plan? This action cannot be undone." }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteConfirmOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => deleteMutation.mutate(deleteId), disabled: deleteMutation.isPending, children: deleteMutation.isPending ? "Deleting..." : "Delete" })] })] })] }) }));
};
export default ProductionPlansPage;
