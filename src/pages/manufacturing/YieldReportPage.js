import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, Paper, Typography, useTheme, } from "@mui/material";
import { FilterList as FilterListIcon, Refresh as RefreshIcon, } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataGrid } from "@mui/x-data-grid";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, } from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";
const fetchYieldReport = async (params) => {
    const response = await apiService.get("/manufacturing/reports/yield", { params });
    return response.data;
};
const YieldReportPage = () => {
    const theme = useTheme();
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [formulaFilter, setFormulaFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["yield-report", dateFrom, dateTo, formulaFilter, branchFilter],
        queryFn: () => fetchYieldReport({
            startDate: dateFrom ? dateFrom.toISOString() : undefined,
            endDate: dateTo ? dateTo.toISOString() : undefined,
            formulaId: formulaFilter || undefined,
            branchId: branchFilter || undefined,
        }),
    });
    const summary = data?.summary;
    const columns = [
        { field: "orderNumber", headerName: "Order #", flex: 0.8, minWidth: 100 },
        { field: "feedFormulaName", headerName: "Formula", flex: 1.2, minWidth: 140 },
        { field: "branch", headerName: "Branch", flex: 0.8, minWidth: 100 },
        {
            field: "plannedQty",
            headerName: "Planned (KG)",
            type: "number",
            flex: 0.8,
            minWidth: 90,
            valueFormatter: (p) => Number(p).toLocaleString(),
        },
        {
            field: "actualQty",
            headerName: "Actual (KG)",
            type: "number",
            flex: 0.8,
            minWidth: 90,
            valueFormatter: (p) => Number(p).toLocaleString(),
        },
        {
            field: "yieldPercent",
            headerName: "Yield %",
            type: "number",
            flex: 0.7,
            minWidth: 80,
            renderCell: (params) => {
                const val = params.value;
                return (_jsx(Chip, { label: `${val.toFixed(1)}%`, color: val >= 98 ? "success" : val >= 95 ? "warning" : "error", size: "small", variant: "outlined" }));
            },
        },
        {
            field: "costPerKg",
            headerName: "Cost/KG",
            type: "number",
            flex: 0.7,
            minWidth: 80,
            valueFormatter: (p) => `$${Number(p).toFixed(3)}`,
        },
        {
            field: "startDate",
            headerName: "Date",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (p) => new Date(p).toLocaleDateString(),
        },
    ];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Yield Analysis Report" }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { variant: "outlined", size: "small", startIcon: _jsx(FilterListIcon, {}), onClick: () => setShowFilters(!showFilters), children: "Filters" }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] })] }), showFilters && (_jsx(Paper, { sx: { p: 2, mb: 3 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: "small", fullWidth: true } } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Formula", value: formulaFilter, onChange: (e) => setFormulaFilter(e.target.value), placeholder: "Formula ID..." }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Branch", value: branchFilter, onChange: (e) => setBranchFilter(e.target.value), placeholder: "Branch ID..." }) })] }) })), error && (_jsx(Paper, { sx: { p: 2, mb: 2 }, children: _jsx(Typography, { color: "error", children: "Failed to load report data." }) })), summary && (_jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Orders" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalOrders })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Avg Yield" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: [summary.avgYield.toFixed(1), "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Overall Yield" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", children: [summary.overallYield.toFixed(1), "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Min Yield" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: summary.minYield < 95 ? "error" : "inherit", children: [summary.minYield.toFixed(1), "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Max Yield" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: [summary.maxYield.toFixed(1), "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Avg Cost/KG" }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", color: "primary", children: ["$", summary.avgCostPerKg.toFixed(3)] })] }) })] })), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { height: 400 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Average Yield by Formula" }), _jsx(Box, { sx: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data?.yieldByFormula || [], margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "feedFormulaCode", tick: { fontSize: 12 } }), _jsx(YAxis, { domain: [90, 100], tick: { fontSize: 12 } }), _jsx(RechartsTooltip, { formatter: (value) => [`${Number(value).toFixed(1)}%`, "Avg Yield"] }), _jsx(Bar, { dataKey: "avgYield", fill: "#4caf50", radius: [4, 4, 0, 0], name: "Avg Yield %" })] }) }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { height: 400 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Yield Trend Over Time" }), _jsx(Box, { sx: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data?.yieldTrend || [], margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), _jsx(YAxis, { domain: [90, 100], tick: { fontSize: 12 } }), _jsx(RechartsTooltip, { formatter: (value, name) => [name === "yield" ? `${Number(value).toFixed(1)}%` : `$${Number(value).toFixed(3)}`, name === "yield" ? "Yield" : "Cost/KG"] }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "yield", stroke: "#4caf50", strokeWidth: 2, dot: { r: 3 }, name: "Yield %" })] }) }) })] }) }) })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Cost per KG Trend" }), _jsx(Box, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data?.yieldTrend || [], margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), _jsx(YAxis, { tick: { fontSize: 12 }, tickFormatter: (val) => `$${val}` }), _jsx(RechartsTooltip, { formatter: (value) => [`$${Number(value).toFixed(3)}`, "Cost/KG"] }), _jsx(Line, { type: "monotone", dataKey: "costPerKg", stroke: "#f44336", strokeWidth: 2, dot: { r: 3 }, name: "Cost/KG" })] }) }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Yield Records" }), _jsx(DataGrid, { rows: data?.records || [], columns: columns, loading: isLoading, pageSizeOptions: [10, 25, 50, 100], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, pagination: true, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } })] }) })] }) }));
};
export default YieldReportPage;
