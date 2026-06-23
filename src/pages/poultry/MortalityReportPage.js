import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Typography, useTheme, } from "@mui/material";
import { FilterList as FilterListIcon, Refresh as RefreshIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid } from "@mui/x-data-grid";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, } from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";
const CAUSE_COLORS = {
    DISEASE: "#f44336",
    HEAT: "#ff9800",
    COLD: "#2196f3",
    PREDATOR: "#795548",
    OTHER: "#9e9e9e",
};
const BREED_COLORS = {
    BROILER: "#4caf50",
    LAYER: "#2196f3",
    BREEDER: "#ff9800",
    PIGEON: "#9c27b0",
    OTHER: "#607d8b",
};
const fetchMortalityReport = async (params) => {
    const response = await apiService.get("/poultry/reports/mortality", { params });
    return response.data;
};
const MortalityReportPage = () => {
    const theme = useTheme();
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [breedFilter, setBreedFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["mortality-report", dateFrom, dateTo, breedFilter],
        queryFn: () => fetchMortalityReport({
            startDate: dateFrom ? dateFrom.toISOString() : undefined,
            endDate: dateTo ? dateTo.toISOString() : undefined,
            breedType: breedFilter || undefined,
        }),
    });
    const summary = data?.summary;
    const batchColumns = [
        { field: "batchNumber", headerName: "Batch #", flex: 1, minWidth: 100 },
        { field: "breedTypeLabel", headerName: "Breed", flex: 0.7, minWidth: 70 },
        { field: "supplierName", headerName: "Supplier", flex: 0.8, minWidth: 80 },
        { field: "initialQty", headerName: "Initial", type: "number", flex: 0.7, minWidth: 70, valueFormatter: (p) => Number(p).toLocaleString() },
        { field: "currentQty", headerName: "Current", type: "number", flex: 0.7, minWidth: 70, valueFormatter: (p) => Number(p).toLocaleString() },
        { field: "totalDeaths", headerName: "Deaths", type: "number", flex: 0.6, minWidth: 60 },
        {
            field: "mortalityRate",
            headerName: "Mort %",
            type: "number",
            flex: 0.7,
            minWidth: 70,
            renderCell: (params) => {
                const val = params.value;
                return _jsx(Chip, { label: `${val.toFixed(1)}%`, size: "small", color: val > 5 ? "error" : val > 3 ? "warning" : "success", variant: "outlined", sx: { fontWeight: 700 } });
            },
        },
    ];
    const supplierColumns = [
        { field: "supplierName", headerName: "Supplier", flex: 1.2, minWidth: 130 },
        { field: "totalBatches", headerName: "Batches", type: "number", flex: 0.7, minWidth: 60 },
        { field: "totalChicks", headerName: "Chicks", type: "number", flex: 0.8, minWidth: 70, valueFormatter: (p) => Number(p).toLocaleString() },
        { field: "totalDeaths", headerName: "Deaths", type: "number", flex: 0.7, minWidth: 60 },
        {
            field: "avgMortalityRate",
            headerName: "Avg Mort %",
            type: "number",
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => {
                const val = params.value;
                return _jsx(Chip, { label: `${val.toFixed(1)}%`, size: "small", color: val > 5 ? "error" : val > 3 ? "warning" : "success", variant: "outlined", sx: { fontWeight: 700 } });
            },
        },
    ];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Mortality Analysis Report" }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { variant: "outlined", size: "small", startIcon: _jsx(FilterListIcon, {}), onClick: () => setShowFilters(!showFilters), children: "Filters" }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] })] }), showFilters && (_jsx(Paper, { sx: { p: 2, mb: 3 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Breed" }), _jsxs(Select, { value: breedFilter, label: "Breed", onChange: (e) => setBreedFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "BROILER", children: "Broiler" }), _jsx(MenuItem, { value: "LAYER", children: "Layer" }), _jsx(MenuItem, { value: "BREEDER", children: "Breeder" }), _jsx(MenuItem, { value: "PIGEON", children: "Pigeon" })] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 1, children: _jsx(Button, { variant: "outlined", size: "small", fullWidth: true, onClick: () => { setDateFrom(null); setDateTo(null); setBreedFilter(""); }, children: "Clear" }) })] }) })), error && _jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsx(Typography, { color: "error", children: "Failed to load report." }) }), summary && (_jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Batches" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalBatches })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Chicks" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalChicks.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Deaths" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "error", children: summary.totalDeaths.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Overall Mort %" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: summary.overallMortalityRate > 5 ? "error" : summary.overallMortalityRate > 3 ? "warning.main" : "success.main", children: [summary.overallMortalityRate.toFixed(2), "%"] })] }) })] })), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Deaths by Cause" }), _jsx(Box, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data?.byCause || [], cx: "50%", cy: "50%", outerRadius: 120, dataKey: "count", label: ({ causeLabel, percentage }) => `${causeLabel}: ${percentage.toFixed(1)}%`, children: (data?.byCause || []).map((entry, index) => (_jsx(Cell, { fill: CAUSE_COLORS[entry.cause] || "#9e9e9e" }, `cell-${index}`))) }), _jsx(RechartsTooltip, {})] }) }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Mortality Trend by Batch" }), _jsx(Box, { sx: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data?.trends || [], margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 }, tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(RechartsTooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", stroke: "#f44336", strokeWidth: 2, dot: { r: 3 }, name: "Daily Deaths" })] }) }) })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Batch Comparison" }), _jsx(DataGrid, { rows: data?.batchSummaries || [], columns: batchColumns, loading: isLoading, pageSizeOptions: [5, 10], initialState: { pagination: { paginationModel: { pageSize: 5 } } }, pagination: true, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Supplier Performance" }), _jsx(DataGrid, { rows: data?.supplierPerformance || [], columns: supplierColumns, loading: isLoading, pageSizeOptions: [5, 10], initialState: { pagination: { paginationModel: { pageSize: 5 } } }, pagination: true, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } })] }) }) })] })] }) }));
};
export default MortalityReportPage;
