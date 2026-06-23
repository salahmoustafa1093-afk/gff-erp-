import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Typography, LinearProgress, useTheme, } from "@mui/material";
import { Edit as EditIcon, ArrowBack as ArrowBackIcon, ContentCopy as ContentCopyIcon, CompareArrows as CompareArrowsIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";
const FEED_TYPE_COLORS = {
    BROILER_STARTER: { bg: "#e3f2fd", color: "#1565c0" },
    BROILER_GROWER: { bg: "#e8f5e9", color: "#2e7d32" },
    BROILER_FINISHER: { bg: "#fff3e0", color: "#ef6c00" },
    LAYER: { bg: "#fce4ec", color: "#c62828" },
    BREEDER: { bg: "#f3e5f5", color: "#6a1b9a" },
    PREMIX: { bg: "#e0f2f1", color: "#00695c" },
    OTHER: { bg: "#f5f5f5", color: "#616161" },
};
const ORDER_STATUS_CHIP_PROPS = {
    DRAFT: { color: "default", variant: "outlined" },
    PLANNED: { color: "primary", variant: "outlined" },
    IN_PROGRESS: { color: "warning", variant: "filled" },
    COMPLETED: { color: "success", variant: "filled" },
    CANCELLED: { color: "error", variant: "outlined" },
};
const STATUS_LABELS = {
    DRAFT: "Draft",
    PLANNED: "Planned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};
const COST_COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0", "#00bcd4", "#795548", "#607d8b"];
const fetchFormulaDetail = async (id) => {
    const response = await apiService.get(`/feed-formulation/formulas/${id}/detail`);
    return response.data;
};
const TabPanel = ({ children, value, index }) => (_jsx(Box, { role: "tabpanel", hidden: value !== index, sx: { pt: 2 }, children: value === index && children }));
const FeedFormulaDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState(0);
    const { data: formula, isLoading, error } = useQuery({
        queryKey: ["feed-formula-detail", id],
        queryFn: () => fetchFormulaDetail(id),
        enabled: Boolean(id),
        retry: 2,
    });
    const handleTabChange = (_event, newValue) => {
        setActiveTab(newValue);
    };
    const radarData = formula
        ? [
            { nutrient: "Protein", target: formula.targetProtein, actual: formula.actualProtein },
            { nutrient: "Energy", target: formula.targetEnergy / 100, actual: formula.actualEnergy / 100 },
            { nutrient: "Fiber", target: formula.targetFiber * 5, actual: formula.actualFiber * 5 },
            { nutrient: "Calcium", target: formula.targetCalcium * 20, actual: formula.actualCalcium * 20 },
            { nutrient: "Phosphorus", target: formula.targetPhosphorus * 40, actual: formula.actualPhosphorus * 40 },
        ]
        : [];
    const costBreakdownData = formula
        ? formula.ingredients.map((ing, idx) => ({
            name: ing.productName,
            value: Number(((ing.percentage / 100) * ing.costPerKg).toFixed(4)),
            fill: COST_COLORS[idx % COST_COLORS.length],
        }))
        : [];
    const comparisonData = formula
        ? [
            { nutrient: "Protein", target: formula.targetProtein, actual: formula.actualProtein },
            { nutrient: "Energy (ME)", target: formula.targetEnergy, actual: formula.actualEnergy },
            { nutrient: "Fiber", target: formula.targetFiber, actual: formula.actualFiber },
            { nutrient: "Calcium", target: formula.targetCalcium, actual: formula.actualCalcium },
            { nutrient: "Phosphorus", target: formula.targetPhosphorus, actual: formula.actualPhosphorus },
        ]
        : [];
    const moColumns = [
        { field: "orderNumber", headerName: "Order #", flex: 1, minWidth: 120 },
        {
            field: "quantity",
            headerName: "Qty (KG)",
            type: "number",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (p) => Number(p).toLocaleString(),
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            minWidth: 100,
            renderCell: (params) => {
                const s = params.value;
                const cp = ORDER_STATUS_CHIP_PROPS[s] || { color: "default", variant: "outlined" };
                return _jsx(Chip, { label: STATUS_LABELS[s] || s, size: "small", color: cp.color, variant: cp.variant });
            },
        },
        {
            field: "startDate",
            headerName: "Date",
            flex: 0.8,
            minWidth: 100,
            valueFormatter: (p) => (p ? new Date(p).toLocaleDateString() : "-"),
        },
        {
            field: "yield",
            headerName: "Yield %",
            flex: 0.6,
            minWidth: 80,
            renderCell: (params) => {
                const v = params.value;
                return v !== null ? `${v.toFixed(1)}%` : "-";
            },
        },
    ];
    if (isLoading) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(LinearProgress, {}) }));
    }
    if (error || !formula) {
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { color: "error", children: "Failed to load formula details." }), _jsx(Button, { onClick: () => navigate("/feed-formulation/formulas"), sx: { mt: 2 }, children: "Back to List" })] }));
    }
    const ftColors = FEED_TYPE_COLORS[formula.feedType] || { bg: "#f5f5f5", color: "#616161" };
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }, children: [_jsx(IconButton, { onClick: () => navigate("/feed-formulation/formulas"), children: _jsx(ArrowBackIcon, {}) }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: formula.code }), _jsxs(Box, { sx: { display: "flex", gap: 1, alignItems: "center", mt: 0.5 }, children: [_jsx(Typography, { variant: "subtitle1", color: "text.secondary", children: formula.name }), _jsx(Chip, { label: formula.feedTypeLabel, size: "small", sx: { backgroundColor: ftColors.bg, color: ftColors.color, fontWeight: 600 } }), _jsx(Chip, { label: formula.isActive ? "Active" : "Inactive", color: formula.isActive ? "success" : "default", size: "small", variant: formula.isActive ? "filled" : "outlined" })] })] })] }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(CompareArrowsIcon, {}), onClick: () => navigate(`/feed-formulation/formulas/compare?formula1=${id}`), size: "small", children: "Compare" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(ContentCopyIcon, {}), onClick: () => navigate(`/feed-formulation/formulas/new?duplicate=${id}`), size: "small", children: "Duplicate" }), _jsx(Button, { variant: "contained", startIcon: _jsx(EditIcon, {}), onClick: () => navigate(`/feed-formulation/formulas/${id}/edit`), size: "small", children: "Edit" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Protein" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", children: [formula.actualProtein.toFixed(1), "%"] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Target: ", formula.targetProtein, "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Energy (ME)" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formula.actualEnergy.toFixed(0) }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Target: ", formula.targetEnergy] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Fiber" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", children: [formula.actualFiber.toFixed(1), "%"] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Target: ", formula.targetFiber, "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Calcium" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", children: [formula.actualCalcium.toFixed(2), "%"] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Target: ", formula.targetCalcium, "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Phosphorus" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", children: [formula.actualPhosphorus.toFixed(2), "%"] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Target: ", formula.targetPhosphorus, "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Cost/KG" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: ["$", formula.totalCost.toFixed(3)] })] }) })] }), _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: handleTabChange, variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { label: "Ingredients & Analysis" }), _jsx(Tab, { label: "Nutritional Charts" }), _jsx(Tab, { label: "Version History" }), _jsx(Tab, { label: "Manufacturing Orders" })] }), _jsx(Divider, {}), _jsxs(CardContent, { children: [_jsx(TabPanel, { value: activeTab, index: 0, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, lg: 7, children: [_jsxs(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: ["Ingredients (", formula.ingredients.length, ")"] }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Ingredient" }), _jsx(TableCell, { align: "right", children: "%" }), _jsx(TableCell, { align: "right", children: "Protein %" }), _jsx(TableCell, { align: "right", children: "Energy" }), _jsx(TableCell, { align: "right", children: "Fiber %" }), _jsx(TableCell, { align: "right", children: "Ca %" }), _jsx(TableCell, { align: "right", children: "P %" }), _jsx(TableCell, { align: "right", children: "Cost/KG" }), _jsx(TableCell, { align: "right", children: "Contribution" })] }) }), _jsx(TableBody, { children: formula.ingredients.map((ing) => (_jsxs(TableRow, { hover: true, children: [_jsxs(TableCell, { children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: ing.productName }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: ing.productCode })] }), _jsxs(TableCell, { align: "right", fontWeight: "bold", children: [ing.percentage.toFixed(1), "%"] }), _jsx(TableCell, { align: "right", children: ing.actualProtein.toFixed(1) }), _jsx(TableCell, { align: "right", children: ing.actualEnergy.toFixed(0) }), _jsx(TableCell, { align: "right", children: ing.actualFiber.toFixed(1) }), _jsx(TableCell, { align: "right", children: ing.actualCalcium.toFixed(2) }), _jsx(TableCell, { align: "right", children: ing.actualPhosphorus.toFixed(2) }), _jsxs(TableCell, { align: "right", children: ["$", ing.costPerKg.toFixed(3)] }), _jsxs(TableCell, { align: "right", children: ["$", ing.contribution.toFixed(4)] })] }, ing.id))) })] }) })] }), _jsxs(Grid, { item: true, xs: 12, lg: 5, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Target vs Actual Comparison" }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Nutrient" }), _jsx(TableCell, { align: "right", children: "Target" }), _jsx(TableCell, { align: "right", children: "Actual" }), _jsx(TableCell, { align: "right", children: "Difference" }), _jsx(TableCell, { align: "center", children: "Status" })] }) }), _jsx(TableBody, { children: comparisonData.map((row) => {
                                                                    const diff = row.actual - row.target;
                                                                    const isGood = Math.abs(diff) / (row.target || 1) < 0.03;
                                                                    const isOk = Math.abs(diff) / (row.target || 1) < 0.1;
                                                                    return (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { fontWeight: 500, children: row.nutrient }), _jsx(TableCell, { align: "right", children: row.target.toFixed(row.nutrient === "Energy (ME)" ? 0 : row.nutrient === "Calcium" || row.nutrient === "Phosphorus" ? 2 : 1) }), _jsx(TableCell, { align: "right", fontWeight: "bold", children: row.actual.toFixed(row.nutrient === "Energy (ME)" ? 0 : row.nutrient === "Calcium" || row.nutrient === "Phosphorus" ? 2 : 1) }), _jsxs(TableCell, { align: "right", sx: {
                                                                                    color: diff >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                                                                    fontWeight: 600,
                                                                                }, children: [diff >= 0 ? "+" : "", diff.toFixed(2)] }), _jsx(TableCell, { align: "center", children: _jsx(Chip, { label: isGood ? "On Target" : isOk ? "Close" : "Off Target", color: isGood ? "success" : isOk ? "warning" : "error", size: "small" }) })] }, row.nutrient));
                                                                }) })] }) }), _jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, gutterBottom: true, children: "Cost Breakdown" }), formula.ingredients.map((ing, idx) => (_jsxs(Box, { sx: { mb: 1 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", mb: 0.25 }, children: [_jsxs(Typography, { variant: "caption", children: [ing.productName, " (", ing.percentage.toFixed(1), "%)"] }), _jsxs(Typography, { variant: "caption", fontWeight: 500, children: ["$", ing.contribution.toFixed(4)] })] }), _jsx(LinearProgress, { variant: "determinate", value: Math.max((ing.contribution / Math.max(formula.totalCost, 0.001)) * 100, 1), sx: {
                                                                        height: 6,
                                                                        borderRadius: 3,
                                                                        backgroundColor: theme.palette.grey[200],
                                                                        "& .MuiLinearProgress-bar": {
                                                                            backgroundColor: COST_COLORS[idx % COST_COLORS.length],
                                                                        },
                                                                    } })] }, ing.id)))] })] })] }) }), _jsx(TabPanel, { value: activeTab, index: 1, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Nutrient Profile (Radar)" }), _jsx(Box, { sx: { height: 350 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(RadarChart, { cx: "50%", cy: "50%", outerRadius: "70%", data: radarData, children: [_jsx(PolarGrid, {}), _jsx(PolarAngleAxis, { dataKey: "nutrient" }), _jsx(PolarRadiusAxis, {}), _jsx(Radar, { name: "Target", dataKey: "target", stroke: "#2196f3", fill: "#2196f3", fillOpacity: 0.2, strokeWidth: 2 }), _jsx(Radar, { name: "Actual", dataKey: "actual", stroke: "#4caf50", fill: "#4caf50", fillOpacity: 0.3, strokeWidth: 2 }), _jsx(Legend, {}), _jsx(RechartsTooltip, {})] }) }) })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Cost Breakdown by Ingredient" }), _jsx(Box, { sx: { height: 350 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: costBreakdownData, cx: "50%", cy: "50%", outerRadius: 120, dataKey: "value", label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`, children: costBreakdownData.map((entry, index) => (_jsx(Cell, { fill: entry.fill }, `cell-${index}`))) }), _jsx(RechartsTooltip, { formatter: (value) => [`$${Number(value).toFixed(4)}`, "Cost"] })] }) }) })] })] }) }), _jsxs(TabPanel, { value: activeTab, index: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Version History" }), formula.versions.length > 0 ? (_jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Version" }), _jsx(TableCell, { children: "Date" }), _jsx(TableCell, { children: "Changed By" }), _jsx(TableCell, { children: "Changes" })] }) }), _jsx(TableBody, { children: formula.versions.map((v) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: _jsx(Chip, { label: `v${v.version}`, size: "small", variant: "outlined" }) }), _jsx(TableCell, { children: new Date(v.createdAt).toLocaleString() }), _jsx(TableCell, { children: v.createdBy }), _jsx(TableCell, { children: v.changes || "—" })] }, v.id))) })] }) })) : (_jsx(Typography, { color: "text.secondary", children: "No version history available." }))] }), _jsxs(TabPanel, { value: activeTab, index: 3, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Manufacturing Orders Using This Formula" }), _jsx(DataGrid, { rows: formula.manufacturingOrders, columns: moColumns, pageSizeOptions: [5, 10, 25], initialState: { pagination: { paginationModel: { pageSize: 5 } } }, pagination: true, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } })] })] })] })] }));
};
export default FeedFormulaDetailPage;
