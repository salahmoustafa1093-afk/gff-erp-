import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Box, Card, CardContent, Chip, Grid, IconButton, Typography, useTheme, } from "@mui/material";
import { Egg as EggIcon, Pets as PetsIcon, TrendingDown as TrendingDownIcon, Home as HomeIcon, Refresh as RefreshIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const BREED_COLORS = {
    BROILER: "#4caf50",
    LAYER: "#2196f3",
    BREEDER: "#ff9800",
    PIGEON: "#9c27b0",
    OTHER: "#607d8b",
};
const BREED_LABELS = {
    BROILER: "Broiler",
    LAYER: "Layer",
    BREEDER: "Breeder",
    PIGEON: "Pigeon",
    OTHER: "Other",
};
const fetchPoultryDashboard = async () => {
    const response = await apiService.get("/poultry/dashboard");
    return response.data;
};
const PoultryDashboardPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["poultry-dashboard"],
        queryFn: fetchPoultryDashboard,
        refetchInterval: 300000,
    });
    const kpiCards = useMemo(() => {
        if (!data)
            return [];
        const { kpis: k } = data;
        return [
            { label: "Active Batches", value: k.activeBatches, sub: `${k.activeHouses} houses`, icon: _jsx(PetsIcon, { fontSize: "large" }), color: theme.palette.primary.main },
            { label: "Total Chicks", value: k.totalChicks.toLocaleString(), sub: "current stock", icon: _jsx(PetsIcon, { fontSize: "large" }), color: theme.palette.success.main },
            { label: "Mortality Rate", value: `${k.mortalityRate.toFixed(1)}%`, sub: "cumulative", icon: _jsx(TrendingDownIcon, { fontSize: "large" }), color: k.mortalityRate > 5 ? theme.palette.error.main : k.mortalityRate > 3 ? theme.palette.warning.main : theme.palette.success.main },
            { label: "Today's Eggs", value: k.todayEggProduction.toLocaleString(), sub: "collected today", icon: _jsx(EggIcon, { fontSize: "large" }), color: theme.palette.info.main },
            { label: "Active Houses", value: k.activeHouses, sub: `of ${k.totalCapacity} capacity`, icon: _jsx(HomeIcon, { fontSize: "large" }), color: theme.palette.secondary.main },
            { label: "Capacity Used", value: `${k.capacityUtilization.toFixed(0)}%`, sub: "utilization", icon: _jsx(HomeIcon, { fontSize: "large" }), color: k.capacityUtilization > 90 ? theme.palette.error.main : theme.palette.warning.main },
        ];
    }, [data, theme]);
    const batchColumns = [
        { field: "batchNumber", headerName: "Batch #", flex: 1, minWidth: 100 },
        {
            field: "breedType",
            headerName: "Breed",
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => (_jsx(Chip, { label: BREED_LABELS[params.value] || params.value, size: "small", color: "primary", variant: "outlined" })),
        },
        { field: "ageDays", headerName: "Age (Days)", type: "number", flex: 0.7, minWidth: 70 },
        { field: "currentQty", headerName: "Current Qty", type: "number", flex: 0.8, minWidth: 80, valueFormatter: (p) => Number(p).toLocaleString() },
        {
            field: "mortalityRate",
            headerName: "Mort %",
            type: "number",
            flex: 0.7,
            minWidth: 70,
            renderCell: (params) => {
                const val = params.value;
                return (_jsx(Chip, { label: `${val.toFixed(1)}%`, size: "small", color: val > 5 ? "error" : val > 3 ? "warning" : "success", variant: "outlined" }));
            },
        },
        { field: "houseName", headerName: "House", flex: 0.8, minWidth: 80 },
    ];
    if (error) {
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { color: "error", children: "Failed to load poultry dashboard." }), _jsx(IconButton, { onClick: () => refetch(), children: _jsx(RefreshIcon, {}) })] }));
    }
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Poultry Dashboard" }), _jsx(IconButton, { onClick: () => refetch(), disabled: isLoading, children: _jsx(RefreshIcon, {}) })] }), _jsx(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: kpiCards.map((kpi, index) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2, children: _jsx(Card, { sx: { height: "100%", borderLeft: `4px solid ${kpi.color}`, transition: "box-shadow 0.2s", "&:hover": { boxShadow: theme.shadows[6] } }, children: _jsxs(CardContent, { sx: { p: 2, "&:last-child": { pb: 2 } }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", mb: 1 }, children: [_jsx(Box, { sx: { color: kpi.color, mr: 1 }, children: kpi.icon }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: kpi.label })] }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: isLoading ? "—" : kpi.value }), !isLoading && _jsx(Typography, { variant: "caption", color: "text.secondary", children: kpi.sub })] }) }) }, index))) }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Mortality Trend (14 Days)" }), _jsx(Box, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data?.mortalityTrend || [], margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), _jsx(YAxis, { yAxisId: "left", tick: { fontSize: 12 } }), _jsx(YAxis, { yAxisId: "right", orientation: "right", domain: [0, 10], tick: { fontSize: 12 } }), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "mortalityCount", stroke: "#f44336", strokeWidth: 2, dot: { r: 3 }, name: "Daily Deaths" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "cumulativeRate", stroke: "#ff9800", strokeWidth: 2, dot: { r: 3 }, strokeDasharray: "5 5", name: "Cumulative %" })] }) }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Egg Production Trend" }), _jsx(Box, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data?.eggProductionTrend || [], margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "totalEggs", stroke: "#4caf50", strokeWidth: 2, dot: { r: 3 }, name: "Total" }), _jsx(Line, { type: "monotone", dataKey: "largeEggs", stroke: "#2196f3", strokeWidth: 2, dot: { r: 2 }, name: "Large" }), _jsx(Line, { type: "monotone", dataKey: "mediumEggs", stroke: "#ff9800", strokeWidth: 2, dot: { r: 2 }, name: "Medium" }), _jsx(Line, { type: "monotone", dataKey: "smallEggs", stroke: "#9c27b0", strokeWidth: 2, dot: { r: 2 }, name: "Small" })] }) }) })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Breed Distribution" }), _jsx(Box, { sx: { height: 280 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data?.breedDistribution || [], cx: "50%", cy: "50%", outerRadius: 100, dataKey: "count", label: ({ breedType, count }) => `${BREED_LABELS[breedType] || breedType}: ${count}`, children: (data?.breedDistribution || []).map((entry, index) => (_jsx(Cell, { fill: entry.fill }, `cell-${index}`))) }), _jsx(RechartsTooltip, {})] }) }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Age Distribution" }), _jsx(Box, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data?.ageDistribution || [], margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "ageRange", tick: { fontSize: 12 } }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 12 } }), _jsx(RechartsTooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#2196f3", radius: [4, 4, 0, 0], name: "Batches" })] }) }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 5, children: _jsx(Card, { sx: { height: 380 }, children: _jsxs(CardContent, { sx: { height: "100%", p: 0, "&:last-child": { pb: 0 } }, children: [_jsx(Box, { sx: { p: 2, pb: 0 }, children: _jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Active Batches" }) }), _jsx(DataGrid, { rows: data?.activeBatches || [], columns: batchColumns, loading: isLoading, pageSizeOptions: [5, 10], initialState: { pagination: { paginationModel: { pageSize: 5 } } }, pagination: true, disableRowSelectionOnClick: true, density: "compact", sx: { border: "none", height: 310 } })] }) }) })] })] }));
};
export default PoultryDashboardPage;
