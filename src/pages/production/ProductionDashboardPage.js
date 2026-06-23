import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Box, Card, CardContent, CardHeader, Chip, Divider, Grid, IconButton, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useTheme, useMediaQuery, Alert, } from "@mui/material";
import { Assignment as AssignmentIcon, CheckCircle as CheckCircleIcon, TrendingUp as TrendingUpIcon, Speed as SpeedIcon, AttachMoney as AttachMoneyIcon, VerifiedUser as VerifiedUserIcon, Visibility as VisibilityIcon, Refresh as RefreshIcon, Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
const STATUS_COLORS = {
    DRAFT: "#9e9e9e",
    PLANNED: "#2196f3",
    IN_PROGRESS: "#ff9800",
    COMPLETED: "#4caf50",
    CANCELLED: "#f44336",
};
const STATUS_LABELS = {
    DRAFT: "Draft",
    PLANNED: "Planned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};
const ORDER_STATUS_CHIP_PROPS = {
    DRAFT: { color: "default", variant: "outlined" },
    PLANNED: { color: "primary", variant: "outlined" },
    IN_PROGRESS: { color: "warning", variant: "filled" },
    COMPLETED: { color: "success", variant: "filled" },
    CANCELLED: { color: "error", variant: "outlined" },
};
const fetchDashboardData = async () => {
    const response = await apiService.get("/production/dashboard");
    return response.data;
};
const ProductionDashboardPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["production-dashboard"],
        queryFn: fetchDashboardData,
        refetchInterval: 300000,
        retry: 2,
    });
    const [pageSize, setPageSize] = useState(5);
    const kpis = useMemo(() => {
        if (!data)
            return [];
        const { kpis: k } = data;
        return [
            {
                label: "Active Orders",
                value: k.activeOrders,
                icon: _jsx(AssignmentIcon, { fontSize: "large" }),
                color: theme.palette.primary.main,
                change: k.activeOrdersChange,
                changeLabel: "vs last week",
            },
            {
                label: "Completed Today",
                value: k.completedToday,
                icon: _jsx(CheckCircleIcon, { fontSize: "large" }),
                color: theme.palette.success.main,
                change: k.completedTodayChange,
                changeLabel: "vs yesterday",
            },
            {
                label: "Monthly Output (Tons)",
                value: k.monthlyOutput.toFixed(2),
                icon: _jsx(TrendingUpIcon, { fontSize: "large" }),
                color: theme.palette.info.main,
                change: k.monthlyOutputChange,
                changeLabel: "vs last month",
            },
            {
                label: "Avg Yield %",
                value: `${k.avgYield.toFixed(1)}%`,
                icon: _jsx(SpeedIcon, { fontSize: "large" }),
                color: theme.palette.warning.main,
                change: k.avgYieldChange,
                changeLabel: "vs target",
            },
            {
                label: "Production Cost",
                value: `$${k.totalProductionCost.toLocaleString()}`,
                icon: _jsx(AttachMoneyIcon, { fontSize: "large" }),
                color: theme.palette.error.main,
                change: k.totalProductionCostChange,
                changeLabel: "vs last month",
            },
            {
                label: "Quality Pass Rate",
                value: `${k.qualityPassRate.toFixed(1)}%`,
                icon: _jsx(VerifiedUserIcon, { fontSize: "large" }),
                color: "#4caf50",
                change: k.qualityPassRateChange,
                changeLabel: "vs target",
            },
        ];
    }, [data, theme]);
    const recentOrderColumns = [
        {
            field: "orderNumber",
            headerName: "Order #",
            flex: 1,
            minWidth: 120,
        },
        {
            field: "feedFormulaName",
            headerName: "Feed Formula",
            flex: 1.5,
            minWidth: 140,
        },
        {
            field: "quantity",
            headerName: "Qty (KG)",
            type: "number",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (params) => Number(params).toLocaleString(),
        },
        {
            field: "status",
            headerName: "Status",
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                const status = params.value;
                const chipProps = ORDER_STATUS_CHIP_PROPS[status] || { color: "default", variant: "outlined" };
                return (_jsx(Chip, { label: STATUS_LABELS[status] || status, color: chipProps.color, variant: chipProps.variant, size: "small" }));
            },
        },
        {
            field: "startDate",
            headerName: "Start Date",
            flex: 1,
            minWidth: 110,
            valueFormatter: (params) => params ? new Date(params).toLocaleDateString() : "-",
        },
        {
            field: "yield",
            headerName: "Yield %",
            type: "number",
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => {
                const val = params.value;
                if (val === null || val === undefined)
                    return "-";
                return (_jsx(Chip, { label: `${val.toFixed(1)}%`, color: val >= 98 ? "success" : val >= 95 ? "warning" : "error", size: "small", variant: "outlined" }));
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(Tooltip, { title: "View Details", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/manufacturing/orders/${params.row.id}`), children: _jsx(VisibilityIcon, { fontSize: "small" }) }) })),
        },
    ];
    if (error) {
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to load production dashboard data. Please try again." }), _jsx(IconButton, { onClick: () => refetch(), color: "primary", children: _jsx(RefreshIcon, {}) })] }));
    }
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Production Dashboard" }), _jsx(Box, { children: _jsx(Tooltip, { title: "Refresh Data", children: _jsx(IconButton, { onClick: () => refetch(), disabled: isLoading, children: _jsx(RefreshIcon, {}) }) }) })] }), _jsx(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: kpis.map((kpi, index) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 2, children: _jsx(Card, { sx: {
                            height: "100%",
                            borderLeft: `4px solid ${kpi.color}`,
                            transition: "box-shadow 0.2s",
                            "&:hover": { boxShadow: theme.shadows[6] },
                        }, children: _jsxs(CardContent, { sx: { p: 2, "&:last-child": { pb: 2 } }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", mb: 1 }, children: [_jsx(Box, { sx: { color: kpi.color, mr: 1 }, children: kpi.icon }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: kpi.label })] }), _jsx(Typography, { variant: "h5", fontWeight: "bold", sx: { mb: 0.5 }, children: isLoading ? "—" : kpi.value }), kpi.change !== undefined && !isLoading && (_jsxs(Typography, { variant: "caption", sx: {
                                        color: (kpi.change || 0) >= 0
                                            ? theme.palette.success.main
                                            : theme.palette.error.main,
                                        fontWeight: 500,
                                    }, children: [(kpi.change || 0) >= 0 ? "+" : "", kpi.change?.toFixed(1), "% ", kpi.changeLabel] }))] }) }) }, index))) }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 5, children: _jsxs(Card, { sx: { height: 400 }, children: [_jsx(CardHeader, { title: "Production by Status", subheader: "Current manufacturing orders distribution", titleTypographyProps: { variant: "h6", fontWeight: 600 }, sx: { pb: 0 } }), _jsx(CardContent, { sx: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data?.statusData || [], margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "status", tickFormatter: (val) => STATUS_LABELS[val] || val }), _jsx(YAxis, { allowDecimals: false }), _jsx(RechartsTooltip, { formatter: (value, name) => [value, "Orders"], labelFormatter: (label) => STATUS_LABELS[label] || label }), _jsx(Bar, { dataKey: "count", radius: [4, 4, 0, 0], children: (data?.statusData || []).map((entry, index) => (_jsx(Cell, { fill: entry.fill }, `cell-${index}`))) })] }) }) })] }) }), _jsx(Grid, { item: true, xs: 12, md: 7, children: _jsxs(Card, { sx: { height: 400 }, children: [_jsx(CardHeader, { title: "Daily Output Trend", subheader: "Actual vs Target output (last 14 days)", titleTypographyProps: { variant: "h6", fontWeight: 600 }, sx: { pb: 0 } }), _jsx(CardContent, { sx: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data?.dailyOutput || [], margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "colorOutput", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#4caf50", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#4caf50", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "colorTarget", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#2196f3", stopOpacity: 0.1 }), _jsx("stop", { offset: "95%", stopColor: "#2196f3", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }), tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(RechartsTooltip, { formatter: (value, name) => [
                                                        `${Number(value).toLocaleString()} KG`,
                                                        name === "output" ? "Actual Output" : "Target",
                                                    ], labelFormatter: (label) => new Date(label).toLocaleDateString() }), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "output", stroke: "#4caf50", fillOpacity: 1, fill: "url(#colorOutput)", strokeWidth: 2, name: "Actual Output" }), _jsx(Area, { type: "monotone", dataKey: "target", stroke: "#2196f3", fillOpacity: 1, fill: "url(#colorTarget)", strokeWidth: 2, strokeDasharray: "5 5", name: "Target" })] }) }) })] }) })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Card, { sx: { height: 380 }, children: [_jsx(CardHeader, { title: "Yield Percentage Trend", subheader: "Production yield over time (target: 98%)", titleTypographyProps: { variant: "h6", fontWeight: 600 }, sx: { pb: 0 } }), _jsx(CardContent, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data?.yieldTrend || [], margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }), tick: { fontSize: 12 } }), _jsx(YAxis, { domain: [90, 100], tick: { fontSize: 12 } }), _jsx(RechartsTooltip, { formatter: (value) => [`${Number(value).toFixed(1)}%`, "Yield"], labelFormatter: (label) => new Date(label).toLocaleDateString() }), _jsx(Line, { type: "monotone", dataKey: "yield", stroke: "#ff9800", strokeWidth: 2, dot: { r: 4, fill: "#ff9800" }, activeDot: { r: 6 } })] }) }) })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Card, { sx: { height: 380 }, children: [_jsx(CardHeader, { title: "Feed Cost Trend", subheader: "Cost per KG over time", titleTypographyProps: { variant: "h6", fontWeight: 600 }, sx: { pb: 0 } }), _jsx(CardContent, { sx: { height: 300 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data?.feedCostTrend || [], margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorCost", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#f44336", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#f44336", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }), tick: { fontSize: 12 } }), _jsx(YAxis, { tick: { fontSize: 12 }, tickFormatter: (val) => `$${val}` }), _jsx(RechartsTooltip, { formatter: (value) => [`$${Number(value).toFixed(3)}`, "Cost/KG"], labelFormatter: (label) => new Date(label).toLocaleDateString() }), _jsx(Area, { type: "monotone", dataKey: "cost", stroke: "#f44336", fillOpacity: 1, fill: "url(#colorCost)", strokeWidth: 2 })] }) }) })] }) })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Card, { sx: { height: 380 }, children: [_jsx(CardHeader, { title: "Capacity Utilization", subheader: "Current production line utilization", titleTypographyProps: { variant: "h6", fontWeight: 600 }, sx: { pb: 0 } }), _jsxs(CardContent, { sx: { height: 300, display: "flex", flexDirection: "column", alignItems: "center" }, children: [_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data?.capacityData || [], cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 2, dataKey: "value", startAngle: 90, endAngle: -270, children: (data?.capacityData || []).map((entry, index) => (_jsx(Cell, { fill: entry.fill }, `cell-${index}`))) }), _jsx(RechartsTooltip, { formatter: (value, name) => [`${value}%`, name] })] }) }), _jsxs(Box, { sx: { mt: -2, textAlign: "center" }, children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: [data?.capacityData?.reduce((acc, curr) => acc + curr.value, 0).toFixed(0) || "0", "%"] }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Overall Capacity Used" })] }), _jsx(Box, { sx: { display: "flex", gap: 2, mt: 1 }, children: (data?.capacityData || []).map((item) => (_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 0.5 }, children: [_jsx(Box, { sx: {
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor: item.fill,
                                                        } }), _jsx(Typography, { variant: "caption", children: item.name })] }, item.name))) })] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsxs(Card, { sx: { height: 380 }, children: [_jsx(CardHeader, { title: "Quality Control Alerts", subheader: "Recent quality issues requiring attention", titleTypographyProps: { variant: "h6", fontWeight: 600 }, sx: { pb: 0 } }), _jsx(CardContent, { sx: { height: 320, overflow: "auto" }, children: isLoading ? (_jsx(LinearProgress, {})) : data?.qcAlerts && data.qcAlerts.length > 0 ? (_jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Severity" }), _jsx(TableCell, { children: "Alert" }), _jsx(TableCell, { children: "Order" }), _jsx(TableCell, { children: "Date" })] }) }), _jsx(TableBody, { children: data.qcAlerts.map((alert) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: alert.severity === "error" ? (_jsx(ErrorIcon, { color: "error", fontSize: "small" })) : alert.severity === "warning" ? (_jsx(WarningIcon, { color: "warning", fontSize: "small" })) : (_jsx(InfoIcon, { color: "info", fontSize: "small" })) }), _jsx(TableCell, { children: alert.message }), _jsx(TableCell, { children: _jsx(Chip, { label: alert.orderNumber, size: "small", variant: "outlined", onClick: () => navigate(`/manufacturing/orders/${alert.id}`), sx: { cursor: "pointer" } }) }), _jsx(TableCell, { children: new Date(alert.date).toLocaleDateString() })] }, alert.id))) })] }) })) : (_jsxs(Box, { sx: {
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            height: "100%",
                                        }, children: [_jsx(VerifiedUserIcon, { sx: { fontSize: 48, color: theme.palette.success.main, mb: 1 } }), _jsx(Typography, { variant: "h6", color: "success.main", children: "All Clear" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No quality control alerts at this time" })] })) })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { title: "Recent Manufacturing Orders", subheader: "Latest production orders with status and yield", titleTypographyProps: { variant: "h6", fontWeight: 600 }, action: _jsx(Chip, { label: "View All", color: "primary", size: "small", onClick: () => navigate("/manufacturing/orders"), sx: { cursor: "pointer", mt: 1, mr: 1 } }) }), _jsx(Divider, {}), _jsx(CardContent, { sx: { p: 0 }, children: _jsx(DataGrid, { rows: data?.recentOrders || [], columns: recentOrderColumns, loading: isLoading, pageSizeOptions: [5, 10, 25], initialState: {
                                pagination: { paginationModel: { pageSize: 5 } },
                            }, pagination: true, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } }) })] })] }));
};
export default ProductionDashboardPage;
