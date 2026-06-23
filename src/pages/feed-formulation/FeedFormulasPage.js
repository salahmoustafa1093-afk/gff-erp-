import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Box, Button, Card, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, TextField, Tooltip, Typography, useTheme, } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, ContentCopy as ContentCopyIcon, CompareArrows as CompareArrowsIcon, Delete as DeleteIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const FEED_TYPE_OPTIONS = [
    { value: "BROILER_STARTER", label: "Broiler Starter" },
    { value: "BROILER_GROWER", label: "Broiler Grower" },
    { value: "BROILER_FINISHER", label: "Broiler Finisher" },
    { value: "LAYER", label: "Layer" },
    { value: "BREEDER", label: "Breeder" },
    { value: "PREMIX", label: "Premix" },
    { value: "OTHER", label: "Other" },
];
const FEED_TYPE_COLORS = {
    BROILER_STARTER: { bg: "#e3f2fd", color: "#1565c0" },
    BROILER_GROWER: { bg: "#e8f5e9", color: "#2e7d32" },
    BROILER_FINISHER: { bg: "#fff3e0", color: "#ef6c00" },
    LAYER: { bg: "#fce4ec", color: "#c62828" },
    BREEDER: { bg: "#f3e5f5", color: "#6a1b9a" },
    PREMIX: { bg: "#e0f2f1", color: "#00695c" },
    OTHER: { bg: "#f5f5f5", color: "#616161" },
};
const fetchFeedFormulas = async (params) => {
    const response = await apiService.get("/feed-formulation/formulas", { params });
    return response.data;
};
const deleteFormula = async (id) => {
    await apiService.delete(`/feed-formulation/formulas/${id}`);
};
const duplicateFormula = async (id) => {
    const response = await apiService.post(`/feed-formulation/formulas/${id}/duplicate`);
    return response.data;
};
const FeedFormulasPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [feedTypeFilter, setFeedTypeFilter] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading, error } = useQuery({
        queryKey: ["feed-formulas", searchQuery, feedTypeFilter, page, pageSize],
        queryFn: () => fetchFeedFormulas({
            search: searchQuery || undefined,
            feedType: feedTypeFilter || undefined,
            page,
            pageSize,
        }),
        keepPreviousData: true,
    });
    const deleteMutation = useMutation({
        mutationFn: deleteFormula,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
        },
    });
    const duplicateMutation = useMutation({
        mutationFn: duplicateFormula,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
        },
    });
    const handleDelete = useCallback((id) => {
        if (window.confirm("Are you sure you want to delete this formula?")) {
            deleteMutation.mutate(id);
        }
    }, [deleteMutation]);
    const handleDuplicate = useCallback((id) => {
        duplicateMutation.mutate(id);
    }, [duplicateMutation]);
    const columns = [
        {
            field: "code",
            headerName: "Code",
            flex: 0.8,
            minWidth: 100,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: "bold", fontFamily: "monospace", children: params.value })),
        },
        {
            field: "name",
            headerName: "Formula Name",
            flex: 1.5,
            minWidth: 180,
        },
        {
            field: "feedType",
            headerName: "Feed Type",
            flex: 1,
            minWidth: 130,
            renderCell: (params) => {
                const type = params.value;
                const label = FEED_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
                const colors = FEED_TYPE_COLORS[type] || { bg: "#f5f5f5", color: "#616161" };
                return (_jsx(Chip, { label: label, size: "small", sx: {
                        backgroundColor: colors.bg,
                        color: colors.color,
                        fontWeight: 600,
                    } }));
            },
        },
        {
            field: "targetProtein",
            headerName: "Protein %",
            type: "number",
            flex: 0.7,
            minWidth: 80,
            valueFormatter: (params) => `${Number(params).toFixed(1)}%`,
        },
        {
            field: "targetEnergy",
            headerName: "Energy (ME)",
            type: "number",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (params) => `${Number(params).toFixed(0)} kcal`,
        },
        {
            field: "totalCost",
            headerName: "Cost/KG",
            type: "number",
            flex: 0.8,
            minWidth: 90,
            valueFormatter: (params) => `$${Number(params).toFixed(3)}`,
        },
        {
            field: "isActive",
            headerName: "Status",
            flex: 0.6,
            minWidth: 80,
            renderCell: (params) => {
                const active = params.value;
                return (_jsx(Chip, { label: active ? "Active" : "Inactive", color: active ? "success" : "default", size: "small", variant: active ? "filled" : "outlined" }));
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1.2,
            minWidth: 180,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { sx: { display: "flex", gap: 0.3 }, children: [_jsx(Tooltip, { title: "View Details", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/feed-formulation/formulas/${params.row.id}`), children: _jsx(VisibilityIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/feed-formulation/formulas/${params.row.id}/edit`), children: _jsx(EditIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Duplicate", children: _jsx(IconButton, { size: "small", onClick: () => handleDuplicate(params.row.id), children: _jsx(ContentCopyIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Compare", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/feed-formulation/formulas/compare?formula1=${params.row.id}`), children: _jsx(CompareArrowsIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDelete(params.row.id), children: _jsx(DeleteIcon, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    mb: 3,
                }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Feed Formulas" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate("/feed-formulation/formulas/new"), sx: { minWidth: 160 }, children: "New Formula" })] }), error && (_jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsx(Typography, { color: "error", children: "Failed to load feed formulas. Please try again." }) })), _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 5, md: 4, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search by code or name", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Enter code or formula name..." }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, md: 3, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Feed Type" }), _jsxs(Select, { value: feedTypeFilter, label: "Feed Type", onChange: (e) => setFeedTypeFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All Types" }), FEED_TYPE_OPTIONS.map((opt) => (_jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value)))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, md: 2, children: _jsx(Button, { variant: "outlined", size: "small", onClick: () => {
                                    setSearchQuery("");
                                    setFeedTypeFilter("");
                                }, fullWidth: true, children: "Clear Filters" }) })] }) }), _jsx(Card, { children: _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, pageSizeOptions: [5, 10, 25, 50], paginationModel: { page, pageSize }, onPaginationModelChange: (model) => {
                        setPage(model.page);
                        setPageSize(model.pageSize);
                    }, paginationMode: "server", disableRowSelectionOnClick: true, density: "compact", sx: { border: "none", minHeight: 400 } }) })] }));
};
export default FeedFormulasPage;
