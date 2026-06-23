import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Typography, useTheme, } from "@mui/material";
import { ArrowBack as ArrowBackIcon, TrendingDown as TrendingDownIcon, Add as AddIcon, Edit as EditIcon, CalendarToday as CalendarTodayIcon, } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";
const BREED_COLORS = {
    BROILER: "#4caf50",
    LAYER: "#2196f3",
    BREEDER: "#ff9800",
    PIGEON: "#9c27b0",
    OTHER: "#607d8b",
};
const CAUSE_LABELS = {
    DISEASE: "Disease",
    HEAT: "Heat Stress",
    COLD: "Cold Stress",
    PREDATOR: "Predator",
    OTHER: "Other",
};
const CAUSE_COLORS = {
    DISEASE: "#f44336",
    HEAT: "#ff9800",
    COLD: "#2196f3",
    PREDATOR: "#795548",
    OTHER: "#9e9e9e",
};
const DIST_TYPE_LABELS = {
    SALE: "Sale",
    INTERNAL_TRANSFER: "Internal Transfer",
    FARM_TRANSFER: "Farm Transfer",
    RETURN: "Return",
};
const STATUS_CHIP_PROPS = {
    ACTIVE: { color: "success", variant: "filled" },
    SOLD: { color: "primary", variant: "outlined" },
    TRANSFERRED: { color: "info", variant: "outlined" },
    CLOSED: { color: "default", variant: "outlined" },
};
const fetchBatchDetail = async (id) => {
    const response = await apiService.get(`/poultry/batches/${id}`);
    return response.data;
};
const TabPanel = ({ children, value, index }) => (_jsx(Box, { role: "tabpanel", hidden: value !== index, sx: { pt: 2 }, children: value === index && children }));
const ChicksBatchDetail = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState(0);
    const { data: batch, isLoading, error } = useQuery({
        queryKey: ["batch-detail", id],
        queryFn: () => fetchBatchDetail(id),
        enabled: Boolean(id),
    });
    const handleTabChange = (_event, newValue) => setActiveTab(newValue);
    const distColumns = [
        { field: "date", headerName: "Date", flex: 0.8, minWidth: 100, valueFormatter: (p) => new Date(p).toLocaleDateString() },
        { field: "typeLabel", headerName: "Type", flex: 0.8, minWidth: 90 },
        { field: "quantity", headerName: "Qty", type: "number", flex: 0.6, minWidth: 60, valueFormatter: (p) => Number(p).toLocaleString() },
        { field: "destination", headerName: "Destination", flex: 1, minWidth: 120 },
        { field: "notes", headerName: "Notes", flex: 1, minWidth: 100 },
    ];
    if (isLoading)
        return _jsx(Box, { sx: { p: 3 }, children: _jsx(LinearProgress, {}) });
    if (error || !batch)
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { color: "error", children: "Failed to load batch details." }), _jsx(Button, { onClick: () => navigate("/poultry/batches"), sx: { mt: 2 }, children: "Back" })] }));
    const breedColor = BREED_COLORS[batch.breedType] || "#607d8b";
    const mortColor = batch.mortalityRate > 5 ? "error" : batch.mortalityRate > 3 ? "warning" : "success";
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(IconButton, { onClick: () => navigate("/poultry/batches"), children: _jsx(ArrowBackIcon, {}) }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: batch.batchNumber }), _jsxs(Box, { sx: { display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }, children: [_jsx(Chip, { label: batch.breedTypeLabel, size: "small", sx: { bgcolor: breedColor + "20", color: breedColor, fontWeight: 600 } }), _jsx(Chip, { label: batch.statusLabel, size: "small", color: STATUS_CHIP_PROPS[batch.status]?.color || "default", variant: STATUS_CHIP_PROPS[batch.status]?.variant || "outlined" }), _jsx(Chip, { label: `${batch.ageDays} days old`, size: "small", variant: "outlined" })] })] })] }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [batch.status === "ACTIVE" && (_jsx(Button, { variant: "outlined", color: "warning", size: "small", startIcon: _jsx(TrendingDownIcon, {}), onClick: () => navigate(`/poultry/batches/${id}/mortality`), children: "Record Mortality" })), _jsx(Button, { variant: "contained", size: "small", startIcon: _jsx(EditIcon, {}), onClick: () => navigate(`/poultry/batches/${id}/edit`), children: "Edit" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Initial Qty" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: batch.quantity.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Current Qty" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: batch.currentQty.toLocaleString() })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Mortality" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: `${mortColor}.main`, children: [batch.mortalityCount, " (", batch.mortalityRate.toFixed(1), "%)"] })] }) }), _jsx(Grid, { item: true, xs: 6, sm: 3, children: _jsxs(Paper, { sx: { p: 2, textAlign: "center" }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Cost" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: ["$", batch.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })] })] }) })] }), _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: handleTabChange, variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { label: "Overview" }), _jsx(Tab, { label: `Mortality (${batch.mortalityRecords.length})` }), _jsx(Tab, { label: `Distribution (${batch.distributionRecords.length})` }), _jsx(Tab, { label: "Age Tracking" })] }), _jsx(Divider, {}), _jsxs(CardContent, { children: [_jsx(TabPanel, { value: activeTab, index: 0, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Batch Information" }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsx(Table, { size: "small", children: _jsxs(TableBody, { children: [_jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Batch Number" }), _jsx(TableCell, { children: batch.batchNumber })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Breed Type" }), _jsx(TableCell, { children: batch.breedTypeLabel })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Supplier" }), _jsx(TableCell, { children: batch.supplierName })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Arrival Date" }), _jsx(TableCell, { children: new Date(batch.arrivalDate).toLocaleDateString() })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Current Age" }), _jsxs(TableCell, { children: [batch.ageDays, " days"] })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Status" }), _jsx(TableCell, { children: _jsx(Chip, { label: batch.statusLabel, size: "small", color: STATUS_CHIP_PROPS[batch.status]?.color || "default" }) })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "House" }), _jsx(TableCell, { children: batch.houseName })] }), _jsxs(TableRow, { children: [_jsx(TableCell, { sx: { fontWeight: 600 }, children: "Unit Cost" }), _jsxs(TableCell, { children: ["$", batch.unitCost.toFixed(2)] })] })] }) }) })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Notes" }), _jsx(Paper, { sx: { p: 2 }, variant: "outlined", children: _jsx(Typography, { variant: "body2", children: batch.notes || "No notes recorded." }) })] })] }) }), _jsx(TabPanel, { value: activeTab, index: 1, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 7, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "Mortality Records" }), batch.status === "ACTIVE" && (_jsx(Button, { variant: "contained", size: "small", startIcon: _jsx(AddIcon, {}), onClick: () => navigate(`/poultry/batches/${id}/mortality`), children: "Add Record" }))] }), batch.mortalityRecords.length > 0 ? (_jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Date" }), _jsx(TableCell, { children: "Count" }), _jsx(TableCell, { children: "Cause" }), _jsx(TableCell, { children: "Notes" }), _jsx(TableCell, { children: "Recorded By" })] }) }), _jsx(TableBody, { children: batch.mortalityRecords.map((rec) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: new Date(rec.date).toLocaleDateString() }), _jsx(TableCell, { fontWeight: "bold", color: "error", children: rec.count }), _jsx(TableCell, { children: _jsx(Chip, { label: rec.causeLabel, size: "small", sx: { bgcolor: (CAUSE_COLORS[rec.cause] || "#9e9e9e") + "20", color: CAUSE_COLORS[rec.cause] || "#9e9e9e", fontWeight: 600 } }) }), _jsx(TableCell, { children: rec.notes || "—" }), _jsx(TableCell, { children: rec.recordedBy })] }, rec.id))) })] }) })) : _jsx(Typography, { color: "text.secondary", children: "No mortality records." })] }), _jsxs(Grid, { item: true, xs: 12, md: 5, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Mortality Trend" }), _jsx(Box, { sx: { height: 250 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: batch.mortalityTrend, margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "mortGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#f44336", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#f44336", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 }, tickFormatter: (val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(RechartsTooltip, {}), _jsx(Area, { type: "monotone", dataKey: "count", stroke: "#f44336", fill: "url(#mortGrad)", strokeWidth: 2, name: "Deaths" })] }) }) }), _jsxs(Box, { sx: { mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1, textAlign: "center" }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Cumulative Mortality Rate" }), _jsxs(Typography, { variant: "h4", fontWeight: "bold", sx: { color: batch.mortalityRate > 5 ? theme.palette.error.main : batch.mortalityRate > 3 ? theme.palette.warning.main : theme.palette.success.main }, children: [batch.mortalityRate.toFixed(2), "%"] })] })] })] }) }), _jsxs(TabPanel, { value: activeTab, index: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Distribution / Sales Records" }), batch.distributionRecords.length > 0 ? (_jsx(DataGrid, { rows: batch.distributionRecords, columns: distColumns, pageSizeOptions: [5, 10, 25], initialState: { pagination: { paginationModel: { pageSize: 5 } } }, pagination: true, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, sx: { border: "none" } })) : _jsx(Typography, { color: "text.secondary", children: "No distribution records." })] }), _jsxs(TabPanel, { value: activeTab, index: 3, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Growth Milestones" }), _jsx(Grid, { container: true, spacing: 2, children: batch.growthMilestones.map((ms) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(Paper, { sx: { p: 2, borderLeft: `4px solid ${ms.achieved ? theme.palette.success.main : theme.palette.grey[400]}` }, children: _jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [ms.achieved ? _jsx(CalendarTodayIcon, { color: "success" }) : _jsx(CalendarTodayIcon, { color: "disabled" }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "subtitle2", fontWeight: 600, children: ["Day ", ms.day, ": ", ms.label] }), _jsx(Typography, { variant: "caption", color: ms.achieved ? "success.main" : "text.secondary", children: ms.achieved && ms.actualDate ? `Achieved: ${new Date(ms.actualDate).toLocaleDateString()}` : batch.ageDays >= ms.day ? "Expected now" : "Upcoming" })] })] }) }) }, ms.day))) })] })] })] })] }));
};
export default ChicksBatchDetail;
