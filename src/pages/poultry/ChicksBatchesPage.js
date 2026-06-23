import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, TextField, Tooltip, Typography, useTheme, } from "@mui/material";
import { Add as AddIcon, Visibility as VisibilityIcon, TrendingDown as TrendingDownIcon, Edit as EditIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const BREED_TYPE_OPTIONS = [
    { value: "BROILER", label: "Broiler" },
    { value: "LAYER", label: "Layer" },
    { value: "BREEDER", label: "Breeder" },
    { value: "PIGEON", label: "Pigeon" },
    { value: "OTHER", label: "Other" },
];
const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "Active" },
    { value: "SOLD", label: "Sold" },
    { value: "TRANSFERRED", label: "Transferred" },
    { value: "CLOSED", label: "Closed" },
];
const STATUS_CHIP_PROPS = {
    ACTIVE: { color: "success", variant: "filled" },
    SOLD: { color: "primary", variant: "outlined" },
    TRANSFERRED: { color: "info", variant: "outlined" },
    CLOSED: { color: "default", variant: "outlined" },
};
const BREED_COLORS = {
    BROILER: "#4caf50",
    LAYER: "#2196f3",
    BREEDER: "#ff9800",
    PIGEON: "#9c27b0",
    OTHER: "#607d8b",
};
const fetchBatches = async (params) => {
    const response = await apiService.get("/poultry/batches", { params });
    return response.data;
};
const ChicksBatchesPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [breedFilter, setBreedFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("ACTIVE");
    const [supplierFilter, setSupplierFilter] = useState("");
    const [dateFrom, setDateFrom] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading } = useQuery({
        queryKey: ["chicks-batches", searchQuery, breedFilter, statusFilter, supplierFilter, dateFrom, page, pageSize],
        queryFn: () => fetchBatches({
            search: searchQuery || undefined,
            breedType: breedFilter || undefined,
            status: statusFilter || undefined,
            supplier: supplierFilter || undefined,
            arrivalDateFrom: dateFrom ? dateFrom.toISOString() : undefined,
            page,
            pageSize,
        }),
        keepPreviousData: true,
    });
    const getMortalityColor = (rate) => {
        if (rate < 3)
            return theme.palette.success.main;
        if (rate <= 5)
            return theme.palette.warning.main;
        return theme.palette.error.main;
    };
    const columns = [
        {
            field: "batchNumber",
            headerName: "Batch #",
            flex: 1,
            minWidth: 110,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: "bold", fontFamily: "monospace", children: params.value })),
        },
        {
            field: "breedType",
            headerName: "Breed",
            flex: 0.8,
            minWidth: 90,
            renderCell: (params) => (_jsx(Chip, { label: params.row.breedTypeLabel, size: "small", sx: {
                    backgroundColor: (BREED_COLORS[params.value] || "#607d8b") + "20",
                    color: BREED_COLORS[params.value] || "#607d8b",
                    fontWeight: 600,
                } })),
        },
        { field: "supplierName", headerName: "Supplier", flex: 1, minWidth: 120 },
        {
            field: "arrivalDate",
            headerName: "Arrival",
            flex: 0.9,
            minWidth: 100,
            valueFormatter: (p) => new Date(p).toLocaleDateString(),
        },
        {
            field: "quantity",
            headerName: "Initial Qty",
            type: "number",
            flex: 0.8,
            minWidth: 80,
            valueFormatter: (p) => Number(p).toLocaleString(),
        },
        {
            field: "currentQty",
            headerName: "Current Qty",
            type: "number",
            flex: 0.8,
            minWidth: 80,
            valueFormatter: (p) => Number(p).toLocaleString(),
        },
        {
            field: "mortalityCount",
            headerName: "Deaths",
            type: "number",
            flex: 0.6,
            minWidth: 60,
        },
        {
            field: "mortalityRate",
            headerName: "Mort %",
            type: "number",
            flex: 0.7,
            minWidth: 70,
            renderCell: (params) => {
                const rate = params.value;
                return (_jsx(Chip, { label: `${rate.toFixed(1)}%`, size: "small", sx: {
                        color: getMortalityColor(rate),
                        borderColor: getMortalityColor(rate),
                        fontWeight: 700,
                    }, variant: "outlined" }));
            },
        },
        {
            field: "ageDays",
            headerName: "Age (d)",
            type: "number",
            flex: 0.6,
            minWidth: 60,
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => {
                const s = params.value;
                const cp = STATUS_CHIP_PROPS[s] || { color: "default", variant: "outlined" };
                return _jsx(Chip, { label: params.row.statusLabel || s, size: "small", color: cp.color, variant: cp.variant });
            },
        },
        { field: "houseName", headerName: "House", flex: 0.8, minWidth: 80 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            minWidth: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { sx: { display: "flex", gap: 0.3 }, children: [_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/poultry/batches/${params.row.id}`), children: _jsx(VisibilityIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Record Mortality", children: _jsx(IconButton, { size: "small", color: "warning", onClick: () => navigate(`/poultry/batches/${params.row.id}/mortality`), children: _jsx(TrendingDownIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/poultry/batches/${params.row.id}/edit`), children: _jsx(EditIcon, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Chicks Batches" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate("/poultry/batches/new"), sx: { minWidth: 160 }, children: "New Batch" })] }), _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Search batch #", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, md: 2, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Breed" }), _jsxs(Select, { value: breedFilter, label: "Breed", onChange: (e) => setBreedFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), BREED_TYPE_OPTIONS.map((opt) => _jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, md: 2, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => setStatusFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), STATUS_OPTIONS.map((opt) => _jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, md: 2, children: _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, md: 2, children: _jsx(Button, { variant: "outlined", size: "small", fullWidth: true, onClick: () => { setSearchQuery(""); setBreedFilter(""); setStatusFilter(""); setSupplierFilter(""); setDateFrom(null); }, children: "Clear" }) })] }) }), _jsx(Card, { children: _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, pageSizeOptions: [5, 10, 25, 50], paginationModel: { page, pageSize }, onPaginationModelChange: (model) => { setPage(model.page); setPageSize(model.pageSize); }, paginationMode: "server", disableRowSelectionOnClick: true, density: "compact", sx: { border: "none", minHeight: 400 } }) })] }) }));
};
export default ChicksBatchesPage;
