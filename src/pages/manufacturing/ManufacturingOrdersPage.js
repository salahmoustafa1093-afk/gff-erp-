import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, TextField, Tooltip, Typography, useTheme, } from "@mui/material";
import { Add as AddIcon, Visibility as VisibilityIcon, PlayArrow as PlayArrowIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid } from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const STATUS_CHIP_PROPS = {
    DRAFT: { color: "default", variant: "outlined" },
    PLANNED: { color: "primary", variant: "outlined" },
    IN_PROGRESS: { color: "warning", variant: "filled" },
    COMPLETED: { color: "success", variant: "filled" },
    CANCELLED: { color: "error", variant: "outlined" },
    ON_HOLD: { color: "info", variant: "outlined" },
};
const STATUS_LABELS = {
    DRAFT: "Draft",
    PLANNED: "Planned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    ON_HOLD: "On Hold",
};
const fetchOrders = async (params) => {
    const response = await apiService.get("/manufacturing/orders", { params });
    return response.data;
};
const updateOrderStatus = async ({ id, status }) => {
    const response = await apiService.patch(`/manufacturing/orders/${id}/status`, { status });
    return response.data;
};
const ManufacturingOrdersPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading } = useQuery({
        queryKey: ["manufacturing-orders", searchQuery, statusFilter, dateFrom, dateTo, page, pageSize],
        queryFn: () => fetchOrders({
            search: searchQuery || undefined,
            status: statusFilter || undefined,
            startDate: dateFrom ? dateFrom.toISOString() : undefined,
            endDate: dateTo ? dateTo.toISOString() : undefined,
            page,
            pageSize,
        }),
        keepPreviousData: true,
    });
    const statusMutation = useMutation({
        mutationFn: updateOrderStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manufacturing-orders"] });
        },
    });
    const handleStart = (id) => statusMutation.mutate({ id, status: "IN_PROGRESS" });
    const handleComplete = (id) => statusMutation.mutate({ id, status: "COMPLETED" });
    const handleCancel = (id) => statusMutation.mutate({ id, status: "CANCELLED" });
    const columns = [
        {
            field: "orderNumber",
            headerName: "Order #",
            flex: 0.9,
            minWidth: 110,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: "bold", fontFamily: "monospace", children: params.value })),
        },
        {
            field: "feedFormulaName",
            headerName: "Feed Formula",
            flex: 1.3,
            minWidth: 150,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", children: params.value }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: params.row.feedFormulaCode })] })),
        },
        {
            field: "quantity",
            headerName: "Qty (KG)",
            type: "number",
            flex: 0.7,
            minWidth: 90,
            valueFormatter: (params) => Number(params).toLocaleString(),
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.9,
            minWidth: 110,
            renderCell: (params) => {
                const status = params.value;
                const chipProps = STATUS_CHIP_PROPS[status] || { color: "default", variant: "outlined" };
                return (_jsx(Chip, { label: STATUS_LABELS[status] || status, color: chipProps.color, variant: chipProps.variant, size: "small" }));
            },
        },
        {
            field: "startDate",
            headerName: "Start Date",
            flex: 0.9,
            minWidth: 100,
            valueFormatter: (params) => (params ? new Date(params).toLocaleDateString() : "-"),
        },
        {
            field: "endDate",
            headerName: "End Date",
            flex: 0.9,
            minWidth: 100,
            valueFormatter: (params) => (params ? new Date(params).toLocaleDateString() : "-"),
        },
        {
            field: "yield",
            headerName: "Yield %",
            type: "number",
            flex: 0.7,
            minWidth: 80,
            renderCell: (params) => {
                const val = params.value;
                if (val === null || val === undefined)
                    return "—";
                return (_jsx(Chip, { label: `${val.toFixed(1)}%`, color: val >= 98 ? "success" : val >= 95 ? "warning" : "error", size: "small", variant: "outlined" }));
            },
        },
        {
            field: "actualCost",
            headerName: "Cost/KG",
            type: "number",
            flex: 0.7,
            minWidth: 80,
            valueFormatter: (params) => (params !== null ? `$${Number(params).toFixed(3)}` : "—"),
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1.2,
            minWidth: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { sx: { display: "flex", gap: 0.3 }, children: [_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/manufacturing/orders/${params.row.id}`), children: _jsx(VisibilityIcon, { fontSize: "small" }) }) }), params.row.status === "DRAFT" || params.row.status === "PLANNED" ? (_jsx(Tooltip, { title: "Start Production", children: _jsx(IconButton, { size: "small", color: "primary", onClick: () => handleStart(params.row.id), children: _jsx(PlayArrowIcon, { fontSize: "small" }) }) })) : null, params.row.status === "IN_PROGRESS" ? (_jsx(Tooltip, { title: "Complete", children: _jsx(IconButton, { size: "small", color: "success", onClick: () => handleComplete(params.row.id), children: _jsx(CheckCircleIcon, { fontSize: "small" }) }) })) : null, (params.row.status === "DRAFT" || params.row.status === "PLANNED") ? (_jsx(Tooltip, { title: "Cancel", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => handleCancel(params.row.id), children: _jsx(CancelIcon, { fontSize: "small" }) }) })) : null] })),
        },
    ];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Manufacturing Orders" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate("/manufacturing/orders/new"), sx: { minWidth: 160 }, children: "Create Order" })] }), _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 4, md: 3, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search orders", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Order # or formula..." }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, md: 2, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => setStatusFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), Object.entries(STATUS_LABELS).map(([key, label]) => (_jsx(MenuItem, { value: key, children: label }, key)))] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, md: 2, children: _jsx(Button, { variant: "outlined", size: "small", fullWidth: true, onClick: () => { setSearchQuery(""); setStatusFilter(""); setDateFrom(null); setDateTo(null); }, children: "Clear" }) })] }) }), _jsx(Card, { children: _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, pageSizeOptions: [5, 10, 25, 50], paginationModel: { page, pageSize }, onPaginationModelChange: (model) => { setPage(model.page); setPageSize(model.pageSize); }, paginationMode: "server", disableRowSelectionOnClick: true, density: "compact", sx: { border: "none", minHeight: 400 } }) })] }) }));
};
export default ManufacturingOrdersPage;
