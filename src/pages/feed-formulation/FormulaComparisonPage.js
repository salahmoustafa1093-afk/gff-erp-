import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Autocomplete, Box, Card, CardContent, Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme, LinearProgress, } from "@mui/material";
import { CompareArrows as CompareArrowsIcon, } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, } from "recharts";
import { useQuery } from "@tanstack/react-query";
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
const COST_COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0", "#00bcd4", "#795548"];
const fetchFormulaList = async () => {
    const response = await apiService.get("/feed-formulation/formulas", {
        params: { pageSize: 1000 },
    });
    return response.data.data;
};
const fetchFormulaDetail = async (id) => {
    const response = await apiService.get(`/feed-formulation/formulas/${id}/detail`);
    return response.data;
};
const FormulaComparisonPage = () => {
    const theme = useTheme();
    const [formulaAId, setFormulaAId] = useState("");
    const [formulaBId, setFormulaBId] = useState("");
    const { data: formulaList, isLoading: listLoading } = useQuery({
        queryKey: ["formula-list-for-comparison"],
        queryFn: fetchFormulaList,
        staleTime: 300000,
    });
    const { data: formulaA, isLoading: aLoading } = useQuery({
        queryKey: ["formula-detail", formulaAId],
        queryFn: () => fetchFormulaDetail(formulaAId),
        enabled: Boolean(formulaAId),
    });
    const { data: formulaB, isLoading: bLoading } = useQuery({
        queryKey: ["formula-detail", formulaBId],
        queryFn: () => fetchFormulaDetail(formulaBId),
        enabled: Boolean(formulaBId),
    });
    const isReady = formulaA && formulaB;
    const isLoading = listLoading || aLoading || bLoading;
    const comparisonRows = useMemo(() => {
        if (!isReady)
            return [];
        return [
            {
                nutrient: "Protein %",
                formulaA: formulaA.actualProtein,
                formulaB: formulaB.actualProtein,
                targetA: formulaA.targetProtein,
                targetB: formulaB.targetProtein,
                unit: "%",
            },
            {
                nutrient: "Energy (ME kcal/kg)",
                formulaA: formulaA.actualEnergy,
                formulaB: formulaB.actualEnergy,
                targetA: formulaA.targetEnergy,
                targetB: formulaB.targetEnergy,
                unit: "kcal",
            },
            {
                nutrient: "Fiber %",
                formulaA: formulaA.actualFiber,
                formulaB: formulaB.actualFiber,
                targetA: formulaA.targetFiber,
                targetB: formulaB.targetFiber,
                unit: "%",
            },
            {
                nutrient: "Calcium %",
                formulaA: formulaA.actualCalcium,
                formulaB: formulaB.actualCalcium,
                targetA: formulaA.targetCalcium,
                targetB: formulaB.targetCalcium,
                unit: "%",
            },
            {
                nutrient: "Phosphorus %",
                formulaA: formulaA.actualPhosphorus,
                formulaB: formulaB.actualPhosphorus,
                targetA: formulaA.targetPhosphorus,
                targetB: formulaB.targetPhosphorus,
                unit: "%",
            },
            {
                nutrient: "Total Cost/KG",
                formulaA: formulaA.totalCost,
                formulaB: formulaB.totalCost,
                targetA: 0,
                targetB: 0,
                unit: "$/kg",
            },
        ];
    }, [formulaA, formulaB, isReady]);
    const barChartData = useMemo(() => {
        if (!isReady)
            return [];
        return [
            { nutrient: "Protein", [formulaA.code]: formulaA.actualProtein, [formulaB.code]: formulaB.actualProtein },
            { nutrient: "Fiber", [formulaA.code]: formulaA.actualFiber, [formulaB.code]: formulaB.actualFiber },
            { nutrient: "Calcium x10", [formulaA.code]: formulaA.actualCalcium * 10, [formulaB.code]: formulaB.actualCalcium * 10 },
            { nutrient: "Phos x10", [formulaA.code]: formulaA.actualPhosphorus * 10, [formulaB.code]: formulaB.actualPhosphorus * 10 },
        ];
    }, [formulaA, formulaB, isReady]);
    const ingredientComparison = useMemo(() => {
        if (!isReady)
            return [];
        const allIngredients = new Map();
        formulaA.ingredients.forEach((ing) => {
            allIngredients.set(ing.productName, {
                name: ing.productName,
                aPercent: ing.percentage,
                bPercent: 0,
                aContribution: ing.contribution,
                bContribution: 0,
            });
        });
        formulaB.ingredients.forEach((ing) => {
            const existing = allIngredients.get(ing.productName);
            if (existing) {
                existing.bPercent = ing.percentage;
                existing.bContribution = ing.contribution;
            }
            else {
                allIngredients.set(ing.productName, {
                    name: ing.productName,
                    aPercent: 0,
                    bPercent: ing.percentage,
                    aContribution: 0,
                    bContribution: ing.contribution,
                });
            }
        });
        return Array.from(allIngredients.values()).sort((a, b) => (b.aPercent + b.bPercent) - (a.aPercent + a.bPercent));
    }, [formulaA, formulaB, isReady]);
    const formulaOptions = formulaList || [];
    return (_jsxs(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", sx: { mb: 3 }, children: "Formula Comparison" }), _jsx(Paper, { sx: { p: 3, mb: 3 }, children: _jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, md: 5, children: _jsx(Autocomplete, { options: formulaOptions, getOptionLabel: (opt) => `${opt.code} - ${opt.name}`, value: formulaOptions.find((f) => f.id === formulaAId) || null, onChange: (_e, val) => setFormulaAId(val?.id || ""), loading: listLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "Select Formula A", variant: "outlined", fullWidth: true })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { item: true, xs: 12, md: 2, sx: { textAlign: "center" }, children: _jsx(CompareArrowsIcon, { sx: { fontSize: 36, color: theme.palette.primary.main } }) }), _jsx(Grid, { item: true, xs: 12, md: 5, children: _jsx(Autocomplete, { options: formulaOptions.filter((f) => f.id !== formulaAId), getOptionLabel: (opt) => `${opt.code} - ${opt.name}`, value: formulaOptions.find((f) => f.id === formulaBId) || null, onChange: (_e, val) => setFormulaBId(val?.id || ""), loading: listLoading, renderInput: (params) => (_jsx(TextField, { ...params, label: "Select Formula B", variant: "outlined", fullWidth: true })), isOptionEqualToValue: (a, b) => a.id === b.id }) })] }) }), isLoading && _jsx(LinearProgress, { sx: { mb: 3 } }), isReady && (_jsxs(_Fragment, { children: [_jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, mb: 1 }, children: [_jsx(Chip, { label: "Formula A", color: "primary", size: "small" }), formulaA && (_jsx(Chip, { label: formulaA.feedTypeLabel, size: "small", sx: {
                                                            backgroundColor: (FEED_TYPE_COLORS[formulaA.feedType] || FEED_TYPE_COLORS.OTHER).bg,
                                                            color: (FEED_TYPE_COLORS[formulaA.feedType] || FEED_TYPE_COLORS.OTHER).color,
                                                        } }))] }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formulaA.code }), _jsx(Typography, { variant: "body1", children: formulaA.name }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: "primary", sx: { mt: 1 }, children: ["$", formulaA.totalCost.toFixed(3), " / KG"] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, mb: 1 }, children: [_jsx(Chip, { label: "Formula B", color: "secondary", size: "small" }), formulaB && (_jsx(Chip, { label: formulaB.feedTypeLabel, size: "small", sx: {
                                                            backgroundColor: (FEED_TYPE_COLORS[formulaB.feedType] || FEED_TYPE_COLORS.OTHER).bg,
                                                            color: (FEED_TYPE_COLORS[formulaB.feedType] || FEED_TYPE_COLORS.OTHER).color,
                                                        } }))] }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: formulaB.code }), _jsx(Typography, { variant: "body1", children: formulaB.name }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", color: "secondary", sx: { mt: 1 }, children: ["$", formulaB.totalCost.toFixed(3), " / KG"] })] }) }) })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Nutritional Comparison" }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Nutrient" }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: formulaA.code, color: "primary", size: "small", variant: "outlined" }) }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: formulaB.code, color: "secondary", size: "small", variant: "outlined" }) }), _jsx(TableCell, { align: "right", children: "Difference (B - A)" }), _jsx(TableCell, { align: "center", children: "Winner" })] }) }), _jsx(TableBody, { children: comparisonRows.map((row) => {
                                                    const diff = row.formulaB - row.formulaA;
                                                    const isCost = row.nutrient === "Total Cost/KG";
                                                    const aWins = isCost ? row.formulaA < row.formulaB : row.formulaA > row.formulaB;
                                                    const bWins = isCost ? row.formulaB < row.formulaA : row.formulaB > row.formulaA;
                                                    return (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { fontWeight: 500, children: row.nutrient }), _jsx(TableCell, { align: "right", fontWeight: "bold", children: row.nutrient === "Total Cost/KG"
                                                                    ? `$${row.formulaA.toFixed(3)}`
                                                                    : row.formulaA.toFixed(row.nutrient === "Energy (ME kcal/kg)" ? 0 : row.nutrient.includes("Calcium") || row.nutrient.includes("Phosphorus") ? 2 : 1) }), _jsx(TableCell, { align: "right", fontWeight: "bold", children: row.nutrient === "Total Cost/KG"
                                                                    ? `$${row.formulaB.toFixed(3)}`
                                                                    : row.formulaB.toFixed(row.nutrient === "Energy (ME kcal/kg)" ? 0 : row.nutrient.includes("Calcium") || row.nutrient.includes("Phosphorus") ? 2 : 1) }), _jsxs(TableCell, { align: "right", sx: {
                                                                    color: diff > 0 ? theme.palette.success.main : diff < 0 ? theme.palette.error.main : theme.palette.text.secondary,
                                                                    fontWeight: 600,
                                                                }, children: [diff > 0 ? "+" : "", diff.toFixed(row.nutrient === "Energy (ME kcal/kg)" ? 0 : row.nutrient === "Total Cost/KG" ? 3 : 2), row.unit !== "$/kg" ? ` ${row.unit}` : ""] }), _jsx(TableCell, { align: "center", children: aWins ? (_jsx(Chip, { label: "A", color: "primary", size: "small" })) : bWins ? (_jsx(Chip, { label: "B", color: "secondary", size: "small" })) : (_jsx(Chip, { label: "Tie", size: "small" })) })] }, row.nutrient));
                                                }) })] }) })] }) }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { height: 400 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Nutrient Comparison Chart" }), _jsx(Box, { sx: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: barChartData, margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "nutrient", tick: { fontSize: 12 } }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: formulaA.code, fill: "#2196f3", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: formulaB.code, fill: "#ff9800", radius: [4, 4, 0, 0] })] }) }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { height: 400 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, align: "center", children: "Cost Comparison" }), _jsxs(Box, { sx: { height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, children: [_jsxs(Grid, { container: true, spacing: 3, sx: { width: "100%", px: 2 }, children: [_jsx(Grid, { item: true, xs: 6, children: _jsxs(Paper, { sx: { p: 3, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: formulaA.code }), _jsxs(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: ["$", formulaA.totalCost.toFixed(3)] }), _jsx(Typography, { variant: "caption", children: "per KG" })] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Paper, { sx: { p: 3, textAlign: "center", bgcolor: theme.palette.secondary.light + "20" }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: formulaB.code }), _jsxs(Typography, { variant: "h4", fontWeight: "bold", color: "secondary", children: ["$", formulaB.totalCost.toFixed(3)] }), _jsx(Typography, { variant: "caption", children: "per KG" })] }) })] }), _jsxs(Box, { sx: { mt: 3, textAlign: "center" }, children: [_jsxs(Typography, { variant: "body1", children: ["Cost Difference: ", " ", _jsxs(Typography, { component: "span", fontWeight: "bold", sx: {
                                                                            color: formulaB.totalCost <= formulaA.totalCost ? theme.palette.success.main : theme.palette.error.main,
                                                                        }, children: ["$", (formulaB.totalCost - formulaA.totalCost).toFixed(3)] })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: formulaB.totalCost < formulaA.totalCost
                                                                    ? `${formulaB.code} is cheaper by ${((1 - formulaB.totalCost / formulaA.totalCost) * 100).toFixed(1)}%`
                                                                    : formulaB.totalCost > formulaA.totalCost
                                                                        ? `${formulaA.code} is cheaper by ${((1 - formulaA.totalCost / formulaB.totalCost) * 100).toFixed(1)}%`
                                                                        : "Same cost" })] })] })] }) }) })] }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Ingredient Comparison" }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Ingredient" }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: `${formulaA.code} %`, color: "primary", size: "small", variant: "outlined" }) }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: `${formulaB.code} %`, color: "secondary", size: "small", variant: "outlined" }) }), _jsx(TableCell, { align: "right", children: "Difference" }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: `${formulaA.code} Cost`, color: "primary", size: "small", variant: "outlined" }) }), _jsx(TableCell, { align: "right", children: _jsx(Chip, { label: `${formulaB.code} Cost`, color: "secondary", size: "small", variant: "outlined" }) })] }) }), _jsx(TableBody, { children: ingredientComparison.map((ing, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { fontWeight: 500, children: ing.name }), _jsxs(TableCell, { align: "right", children: [ing.aPercent.toFixed(1), "%"] }), _jsxs(TableCell, { align: "right", children: [ing.bPercent.toFixed(1), "%"] }), _jsxs(TableCell, { align: "right", sx: {
                                                                color: ing.bPercent - ing.aPercent > 0 ? theme.palette.success.main : ing.bPercent - ing.aPercent < 0 ? theme.palette.error.main : "inherit",
                                                                fontWeight: 600,
                                                            }, children: [(ing.bPercent - ing.aPercent) > 0 ? "+" : "", (ing.bPercent - ing.aPercent).toFixed(1), "%"] }), _jsxs(TableCell, { align: "right", children: ["$", ing.aContribution.toFixed(4)] }), _jsxs(TableCell, { align: "right", children: ["$", ing.bContribution.toFixed(4)] })] }, ing.name))) })] }) })] }) })] })), "Card>"] }));
};
Box >
;
;
;
export default FormulaComparisonPage;
