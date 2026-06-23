import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Alert, useTheme, } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Warning as WarningIcon, Error as ErrorIcon, CheckCircle as CheckCircleIcon, ArrowBack as ArrowBackIcon, Save as SaveIcon, } from "@mui/icons-material";
import { useFormik, FormikProvider, FieldArray } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
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
const fetchRawMaterials = async () => {
    const response = await apiService.get("/inventory/products/raw-materials");
    return response.data;
};
const fetchFormula = async (id) => {
    const response = await apiService.get(`/feed-formulation/formulas/${id}`);
    return response.data;
};
const createFormula = async (data) => {
    const response = await apiService.post("/feed-formulation/formulas", data);
    return response.data;
};
const updateFormula = async ({ id, data }) => {
    const response = await apiService.put(`/feed-formulation/formulas/${id}`, data);
    return response.data;
};
const getNutrientStatus = (actual, target) => {
    if (target <= 0)
        return "success";
    const ratio = actual / target;
    if (ratio >= 0.97 && ratio <= 1.03)
        return "success";
    if (ratio >= 0.9 && ratio <= 1.1)
        return "warning";
    return "error";
};
const getStatusColor = (status, theme) => {
    switch (status) {
        case "success":
            return theme.palette.success.main;
        case "warning":
            return theme.palette.warning.main;
        case "error":
            return theme.palette.error.main;
    }
};
const getStatusIcon = (status) => {
    switch (status) {
        case "success":
            return _jsx(CheckCircleIcon, { color: "success", fontSize: "small" });
        case "warning":
            return _jsx(WarningIcon, { color: "warning", fontSize: "small" });
        case "error":
            return _jsx(ErrorIcon, { color: "error", fontSize: "small" });
    }
};
const FeedFormulaForm = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEditing = Boolean(id && id !== "new");
    const [percentageError, setPercentageError] = useState("");
    const { data: rawMaterials, isLoading: materialsLoading } = useQuery({
        queryKey: ["raw-materials"],
        queryFn: fetchRawMaterials,
        staleTime: 300000,
    });
    const { data: existingFormula, isLoading: formulaLoading } = useQuery({
        queryKey: ["feed-formula", id],
        queryFn: () => fetchFormula(id),
        enabled: isEditing,
    });
    const materialMap = useMemo(() => {
        const map = {};
        if (rawMaterials) {
            rawMaterials.forEach((m) => {
                map[m.id] = m;
            });
        }
        return map;
    }, [rawMaterials]);
    const createMutation = useMutation({
        mutationFn: createFormula,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
            navigate("/feed-formulation/formulas");
        },
    });
    const updateMutation = useMutation({
        mutationFn: updateFormula,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
            navigate("/feed-formulation/formulas");
        },
    });
    const validationSchema = Yup.object({
        code: Yup.string().required("Code is required").max(20, "Max 20 characters"),
        name: Yup.string().required("Name is required").max(100, "Max 100 characters"),
        description: Yup.string().max(500, "Max 500 characters"),
        feedType: Yup.string().required("Feed type is required"),
        targetProtein: Yup.number().required().min(0).max(100),
        targetEnergy: Yup.number().required().min(0).max(5000),
        targetFiber: Yup.number().required().min(0).max(100),
        targetCalcium: Yup.number().required().min(0).max(100),
        targetPhosphorus: Yup.number().required().min(0).max(100),
        ingredients: Yup.array()
            .of(Yup.object({
            productId: Yup.string().required("Select a product"),
            percentage: Yup.number().required("Percentage required").min(0).max(100),
            minPercentage: Yup.number().min(0).max(100).nullable(),
            maxPercentage: Yup.number().min(0).max(100).nullable(),
        }))
            .min(2, "At least 2 ingredients required"),
    });
    const formik = useFormik({
        initialValues: {
            code: "",
            name: "",
            description: "",
            feedType: "BROILER_STARTER",
            targetProtein: 20,
            targetEnergy: 3200,
            targetFiber: 4,
            targetCalcium: 1,
            targetPhosphorus: 0.5,
            ingredients: [
                {
                    productId: "",
                    productName: "",
                    percentage: 0,
                    minPercentage: null,
                    maxPercentage: null,
                    actualProtein: 0,
                    actualEnergy: 0,
                    actualFiber: 0,
                    actualCalcium: 0,
                    actualPhosphorus: 0,
                    costPerKg: 0,
                },
                {
                    productId: "",
                    productName: "",
                    percentage: 0,
                    minPercentage: null,
                    maxPercentage: null,
                    actualProtein: 0,
                    actualEnergy: 0,
                    actualFiber: 0,
                    actualCalcium: 0,
                    actualPhosphorus: 0,
                    costPerKg: 0,
                },
            ],
            isActive: true,
        },
        validationSchema,
        validate: (values) => {
            const totalPercent = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
            if (Math.abs(totalPercent - 100) > 0.01) {
                setPercentageError(`Total percentage must equal 100% (currently ${totalPercent.toFixed(2)}%)`);
                return { ingredients: "Total percentage must equal 100%" };
            }
            setPercentageError("");
            return {};
        },
        onSubmit: (values) => {
            const totalPercent = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
            if (Math.abs(totalPercent - 100) > 0.01) {
                setPercentageError(`Total percentage must equal 100% (currently ${totalPercent.toFixed(2)}%)`);
                return;
            }
            if (isEditing && id) {
                updateMutation.mutate({ id, data: values });
            }
            else {
                createMutation.mutate(values);
            }
        },
    });
    // Populate form when editing
    useEffect(() => {
        if (existingFormula) {
            formik.setValues({
                code: existingFormula.code,
                name: existingFormula.name,
                description: existingFormula.description || "",
                feedType: existingFormula.feedType,
                targetProtein: existingFormula.targetProtein,
                targetEnergy: existingFormula.targetEnergy,
                targetFiber: existingFormula.targetFiber,
                targetCalcium: existingFormula.targetCalcium,
                targetPhosphorus: existingFormula.targetPhosphorus,
                ingredients: existingFormula.ingredients.map((ing) => ({
                    ...ing,
                    minPercentage: ing.minPercentage ?? null,
                    maxPercentage: ing.maxPercentage ?? null,
                })),
                isActive: existingFormula.isActive,
            });
        }
    }, [existingFormula]);
    const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;
    // Nutritional calculations
    const analysis = useMemo(() => {
        const totalPercent = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
        const totalCost = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.costPerKg) || 0), 0);
        const actualProtein = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualProtein) || 0), 0);
        const actualEnergy = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualEnergy) || 0), 0);
        const actualFiber = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualFiber) || 0), 0);
        const actualCalcium = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualCalcium) || 0), 0);
        const actualPhosphorus = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualPhosphorus) || 0), 0);
        return {
            totalPercent,
            totalCost,
            actualProtein,
            actualEnergy,
            actualFiber,
            actualCalcium,
            actualPhosphorus,
            proteinStatus: getNutrientStatus(actualProtein, values.targetProtein),
            energyStatus: getNutrientStatus(actualEnergy, values.targetEnergy),
            fiberStatus: getNutrientStatus(actualFiber, values.targetFiber),
            calciumStatus: getNutrientStatus(actualCalcium, values.targetCalcium),
            phosphorusStatus: getNutrientStatus(actualPhosphorus, values.targetPhosphorus),
        };
    }, [values]);
    const handleIngredientSelect = useCallback((index, materialId) => {
        const material = materialMap[materialId];
        if (material) {
            setFieldValue(`ingredients.${index}.productId`, material.id);
            setFieldValue(`ingredients.${index}.productName`, material.name);
            setFieldValue(`ingredients.${index}.actualProtein`, material.proteinPercent || 0);
            setFieldValue(`ingredients.${index}.actualEnergy`, material.energyKcal || 0);
            setFieldValue(`ingredients.${index}.actualFiber`, material.fiberPercent || 0);
            setFieldValue(`ingredients.${index}.actualCalcium`, material.calciumPercent || 0);
            setFieldValue(`ingredients.${index}.actualPhosphorus`, material.phosphorusPercent || 0);
            setFieldValue(`ingredients.${index}.costPerKg`, material.costPerKg || 0);
        }
    }, [materialMap, setFieldValue]);
    const addIngredient = useCallback((arrayHelpers) => {
        arrayHelpers.push({
            productId: "",
            productName: "",
            percentage: 0,
            minPercentage: null,
            maxPercentage: null,
            actualProtein: 0,
            actualEnergy: 0,
            actualFiber: 0,
            actualCalcium: 0,
            actualPhosphorus: 0,
            costPerKg: 0,
        });
    }, []);
    const isLoading = formulaLoading || materialsLoading;
    const isSubmitting = createMutation.isPending || updateMutation.isPending;
    const mutationError = createMutation.error || updateMutation.error;
    if (isLoading) {
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(LinearProgress, {}), _jsx(Typography, { sx: { mt: 2 }, children: "Loading formula data..." })] }));
    }
    return (_jsx(Box, { sx: { p: { xs: 1, sm: 2, md: 3 } }, children: _jsx(FormikProvider, { value: formik, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(IconButton, { onClick: () => navigate("/feed-formulation/formulas"), children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: isEditing ? "Edit Feed Formula" : "New Feed Formula" })] }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: isSubmitting || Boolean(percentageError), children: isSubmitting ? "Saving..." : isEditing ? "Update Formula" : "Save Formula" })] }), mutationError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to save formula. Please try again." })), percentageError && (_jsx(Alert, { severity: "warning", icon: _jsx(WarningIcon, {}), sx: { mb: 2 }, children: percentageError })), _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, lg: 8, children: [_jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Basic Information" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Formula Code", name: "code", value: values.code, onChange: handleChange, onBlur: handleBlur, error: touched.code && Boolean(errors.code), helperText: touched.code && errors.code, placeholder: "e.g., BR-STR-001" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Formula Name", name: "name", value: values.name, onChange: handleChange, onBlur: handleBlur, error: touched.name && Boolean(errors.name), helperText: touched.name && errors.name, placeholder: "e.g., Broiler Starter Formula A" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, select: true, label: "Feed Type", name: "feedType", value: values.feedType, onChange: handleChange, onBlur: handleBlur, error: touched.feedType && Boolean(errors.feedType), helperText: touched.feedType && errors.feedType, children: FEED_TYPE_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(TextField, { fullWidth: true, select: true, label: "Status", name: "isActive", value: values.isActive ? "true" : "false", onChange: (e) => setFieldValue("isActive", e.target.value === "true"), children: [_jsx("option", { value: "true", children: "Active" }), _jsx("option", { value: "false", children: "Inactive" })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 2, label: "Description", name: "description", value: values.description, onChange: handleChange, onBlur: handleBlur, error: touched.description && Boolean(errors.description), helperText: touched.description && errors.description }) })] })] }) }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Nutritional Targets" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 6, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Target Protein %", name: "targetProtein", type: "number", inputProps: { step: 0.1 }, value: values.targetProtein, onChange: handleChange, onBlur: handleBlur, error: touched.targetProtein && Boolean(errors.targetProtein), helperText: touched.targetProtein && errors.targetProtein }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Target Energy (ME kcal/kg)", name: "targetEnergy", type: "number", inputProps: { step: 10 }, value: values.targetEnergy, onChange: handleChange, onBlur: handleBlur, error: touched.targetEnergy && Boolean(errors.targetEnergy), helperText: touched.targetEnergy && errors.targetEnergy }) }), _jsx(Grid, { item: true, xs: 6, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Target Fiber %", name: "targetFiber", type: "number", inputProps: { step: 0.1 }, value: values.targetFiber, onChange: handleChange, onBlur: handleBlur, error: touched.targetFiber && Boolean(errors.targetFiber), helperText: touched.targetFiber && errors.targetFiber }) }), _jsx(Grid, { item: true, xs: 6, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Target Calcium %", name: "targetCalcium", type: "number", inputProps: { step: 0.01 }, value: values.targetCalcium, onChange: handleChange, onBlur: handleBlur, error: touched.targetCalcium && Boolean(errors.targetCalcium), helperText: touched.targetCalcium && errors.targetCalcium }) }), _jsx(Grid, { item: true, xs: 6, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Target Phosphorus %", name: "targetPhosphorus", type: "number", inputProps: { step: 0.01 }, value: values.targetPhosphorus, onChange: handleChange, onBlur: handleBlur, error: touched.targetPhosphorus && Boolean(errors.targetPhosphorus), helperText: touched.targetPhosphorus && errors.targetPhosphorus }) })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }, children: [_jsxs(Typography, { variant: "h6", fontWeight: 600, children: ["Ingredients (", values.ingredients.length, ")"] }), _jsx(Chip, { label: `Total: ${analysis.totalPercent.toFixed(2)}%`, color: Math.abs(analysis.totalPercent - 100) < 0.01 ? "success" : "warning", size: "small", sx: { fontWeight: "bold" } })] }), _jsx(FieldArray, { name: "ingredients", children: (arrayHelpers) => (_jsxs(_Fragment, { children: [_jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: theme.palette.grey[100] }, children: [_jsx(TableCell, { children: "Ingredient" }), _jsx(TableCell, { align: "right", children: "%" }), _jsx(TableCell, { align: "right", children: "Min %" }), _jsx(TableCell, { align: "right", children: "Max %" }), _jsx(TableCell, { align: "right", children: "Protein %" }), _jsx(TableCell, { align: "right", children: "Energy" }), _jsx(TableCell, { align: "right", children: "Cost/KG" }), _jsx(TableCell, { align: "center", children: "Actions" })] }) }), _jsx(TableBody, { children: values.ingredients.map((ingredient, index) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { sx: { minWidth: 180 }, children: _jsx(Autocomplete, { size: "small", options: rawMaterials || [], getOptionLabel: (opt) => typeof opt === "string" ? opt : `${opt.code} - ${opt.name}`, value: rawMaterials?.find((m) => m.id === ingredient.productId) || null, onChange: (_event, newValue) => {
                                                                                                if (newValue && typeof newValue !== "string") {
                                                                                                    handleIngredientSelect(index, newValue.id);
                                                                                                }
                                                                                            }, renderInput: (params) => (_jsx(TextField, { ...params, placeholder: "Select ingredient", error: touched.ingredients &&
                                                                                                    errors.ingredients &&
                                                                                                    Array.isArray(errors.ingredients) &&
                                                                                                    Boolean(errors.ingredients[index]?.productId), size: "small" })), isOptionEqualToValue: (option, value) => option.id === value.id }) }), _jsx(TableCell, { align: "right", sx: { minWidth: 80 }, children: _jsx(TextField, { size: "small", type: "number", inputProps: { step: 0.1, min: 0, max: 100 }, name: `ingredients.${index}.percentage`, value: ingredient.percentage, onChange: handleChange, onBlur: handleBlur, sx: { width: 80 } }) }), _jsx(TableCell, { align: "right", sx: { minWidth: 70 }, children: _jsx(TextField, { size: "small", type: "number", inputProps: { step: 0.1, min: 0 }, name: `ingredients.${index}.minPercentage`, value: ingredient.minPercentage ?? "", onChange: handleChange, onBlur: handleBlur, placeholder: "Min", sx: { width: 65 } }) }), _jsx(TableCell, { align: "right", sx: { minWidth: 70 }, children: _jsx(TextField, { size: "small", type: "number", inputProps: { step: 0.1, min: 0 }, name: `ingredients.${index}.maxPercentage`, value: ingredient.maxPercentage ?? "", onChange: handleChange, onBlur: handleBlur, placeholder: "Max", sx: { width: 65 } }) }), _jsx(TableCell, { align: "right", sx: { color: "text.secondary" }, children: ingredient.actualProtein?.toFixed(1) || "—" }), _jsx(TableCell, { align: "right", sx: { color: "text.secondary" }, children: ingredient.actualEnergy?.toFixed(0) || "—" }), _jsxs(TableCell, { align: "right", sx: { color: "text.secondary" }, children: ["$", ingredient.costPerKg?.toFixed(3) || "—"] }), _jsx(TableCell, { align: "center", children: _jsx(Tooltip, { title: "Remove ingredient", children: _jsx(IconButton, { size: "small", color: "error", onClick: () => arrayHelpers.remove(index), disabled: values.ingredients.length <= 2, children: _jsx(DeleteIcon, { fontSize: "small" }) }) }) })] }, index))) })] }) }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: () => addIngredient(arrayHelpers), sx: { mt: 2 }, size: "small", children: "Add Ingredient" })] })) })] }) })] }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsx(Card, { sx: { position: "sticky", top: 16 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Nutritional Analysis" }), _jsx(Divider, { sx: { mb: 2 } }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", mb: 0.5 }, children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: "Total Percentage" }), _jsxs(Typography, { variant: "body2", fontWeight: "bold", sx: {
                                                                    color: Math.abs(analysis.totalPercent - 100) < 0.01
                                                                        ? theme.palette.success.main
                                                                        : theme.palette.error.main,
                                                                }, children: [analysis.totalPercent.toFixed(2), "%"] })] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(analysis.totalPercent, 100), sx: {
                                                            height: 10,
                                                            borderRadius: 5,
                                                            backgroundColor: theme.palette.grey[200],
                                                            "& .MuiLinearProgress-bar": {
                                                                backgroundColor: Math.abs(analysis.totalPercent - 100) < 0.01
                                                                    ? theme.palette.success.main
                                                                    : theme.palette.error.main,
                                                            },
                                                        } }), Math.abs(analysis.totalPercent - 100) >= 0.01 && (_jsx(Typography, { variant: "caption", color: "error", sx: { mt: 0.5, display: "block" }, children: "Must equal exactly 100%" }))] }), _jsxs(Box, { sx: { mb: 3, p: 1.5, bgcolor: theme.palette.grey[50], borderRadius: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Cost per KG" }), _jsxs(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: ["$", analysis.totalCost.toFixed(3)] })] }), [
                                                { label: "Protein", actual: analysis.actualProtein, target: values.targetProtein, status: analysis.proteinStatus, unit: "%" },
                                                { label: "Energy (ME)", actual: analysis.actualEnergy, target: values.targetEnergy, status: analysis.energyStatus, unit: "kcal" },
                                                { label: "Fiber", actual: analysis.actualFiber, target: values.targetFiber, status: analysis.fiberStatus, unit: "%" },
                                                { label: "Calcium", actual: analysis.actualCalcium, target: values.targetCalcium, status: analysis.calciumStatus, unit: "%" },
                                                { label: "Phosphorus", actual: analysis.actualPhosphorus, target: values.targetPhosphorus, status: analysis.phosphorusStatus, unit: "%" },
                                            ].map((nutrient) => {
                                                const progress = nutrient.target > 0 ? (nutrient.actual / nutrient.target) * 100 : 0;
                                                return (_jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 0.5 }, children: [getStatusIcon(nutrient.status), _jsx(Typography, { variant: "body2", fontWeight: 500, children: nutrient.label })] }), _jsxs(Typography, { variant: "caption", fontWeight: 600, children: [nutrient.actual.toFixed(nutrient.label === "Energy (ME)" ? 0 : nutrient.label === "Calcium" || nutrient.label === "Phosphorus" ? 2 : 1), nutrient.unit, " / ", nutrient.target, nutrient.unit] })] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(progress, 100), sx: {
                                                                height: 8,
                                                                borderRadius: 4,
                                                                backgroundColor: theme.palette.grey[200],
                                                                "& .MuiLinearProgress-bar": {
                                                                    backgroundColor: getStatusColor(nutrient.status, theme),
                                                                },
                                                            } }), _jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { display: "block", mt: 0.25 }, children: [progress.toFixed(1), "% of target"] })] }, nutrient.label));
                                            }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, gutterBottom: true, children: "Cost Contribution" }), values.ingredients
                                                .filter((ing) => ing.percentage > 0 && ing.productName)
                                                .map((ing, idx) => {
                                                const contribution = ((ing.percentage / 100) * ing.costPerKg).toFixed(3);
                                                return (_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", mb: 0.5 }, children: [_jsx(Typography, { variant: "caption", noWrap: true, sx: { maxWidth: 150 }, children: ing.productName }), _jsxs(Typography, { variant: "caption", fontWeight: 500, children: ["$", contribution] })] }, idx));
                                            })] }) }) })] })] }) }) }));
};
export default FeedFormulaForm;
