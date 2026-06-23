import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Grid, Chip, Typography, } from "@mui/material";
import { Close as CloseIcon, Save as SaveIcon, Science as ScienceIcon, } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";
const TEST_TYPE_OPTIONS = [
    { value: "PROTEIN", label: "Protein" },
    { value: "MOISTURE", label: "Moisture" },
    { value: "ASH", label: "Ash" },
    { value: "FIBER", label: "Fiber" },
    { value: "FAT", label: "Fat" },
    { value: "AFLATOXIN", label: "Aflatoxin" },
    { value: "OTHER", label: "Other" },
];
const TEST_TYPE_RANGES = {
    PROTEIN: { min: 18, max: 24 },
    MOISTURE: { min: 0, max: 12 },
    ASH: { min: 0, max: 8 },
    FIBER: { min: 0, max: 6 },
    FAT: { min: 1, max: 8 },
    AFLATOXIN: { min: 0, max: 0.02 },
    OTHER: { min: 0, max: 100 },
};
const addQualityTest = async ({ orderId, data }) => {
    const response = await apiService.post(`/manufacturing/orders/${orderId}/quality-tests`, data);
    return response.data;
};
const QualityControlForm = ({ orderId, open, onClose }) => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: addQualityTest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manufacturing-order", orderId] });
            onClose();
        },
    });
    const validationSchema = Yup.object({
        testType: Yup.string().required("Test type is required"),
        testValue: Yup.number().required("Test value is required"),
        acceptableMin: Yup.number().required("Minimum value is required"),
        acceptableMax: Yup.number()
            .required("Maximum value is required")
            .min(Yup.ref("acceptableMin"), "Max must be >= min"),
        testedBy: Yup.string().required("Tester name is required").max(100, "Max 100 characters"),
        testedDate: Yup.string().required("Test date is required"),
        notes: Yup.string().max(500, "Max 500 characters"),
    });
    const formik = useFormik({
        initialValues: {
            testType: "PROTEIN",
            testValue: 0,
            acceptableMin: 18,
            acceptableMax: 24,
            notes: "",
            testedBy: "",
            testedDate: new Date().toISOString().split("T")[0],
        },
        validationSchema,
        onSubmit: (values) => {
            mutation.mutate({ orderId, data: values });
        },
    });
    const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;
    // Auto-populate acceptable ranges when test type changes
    useEffect(() => {
        const range = TEST_TYPE_RANGES[values.testType];
        if (range) {
            setFieldValue("acceptableMin", range.min);
            setFieldValue("acceptableMax", range.max);
        }
    }, [values.testType, setFieldValue]);
    const result = values.testValue >= values.acceptableMin && values.testValue <= values.acceptableMax ? "PASS" : "FAIL";
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(ScienceIcon, { color: "primary" }), "Add Quality Control Test"] }) }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, error: touched.testType && Boolean(errors.testType), children: [_jsx(InputLabel, { children: "Test Type *" }), _jsx(Select, { name: "testType", value: values.testType, label: "Test Type *", onChange: handleChange, onBlur: handleBlur, children: TEST_TYPE_OPTIONS.map((opt) => (_jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value))) })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Test Value *", name: "testValue", type: "number", inputProps: { step: 0.01 }, value: values.testValue, onChange: handleChange, onBlur: handleBlur, error: touched.testValue && Boolean(errors.testValue), helperText: touched.testValue && errors.testValue }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Acceptable Min *", name: "acceptableMin", type: "number", inputProps: { step: 0.01 }, value: values.acceptableMin, onChange: handleChange, onBlur: handleBlur, error: touched.acceptableMin && Boolean(errors.acceptableMin), helperText: touched.acceptableMin && errors.acceptableMin }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Acceptable Max *", name: "acceptableMax", type: "number", inputProps: { step: 0.01 }, value: values.acceptableMax, onChange: handleChange, onBlur: handleBlur, error: touched.acceptableMax && Boolean(errors.acceptableMax), helperText: touched.acceptableMax && errors.acceptableMax }) }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, mb: 1 }, children: [_jsx(Typography, { variant: "body2", children: "Result:" }), _jsx(Chip, { label: result, color: result === "PASS" ? "success" : "error", size: "small", sx: { fontWeight: "bold" } })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Tested By *", name: "testedBy", value: values.testedBy, onChange: handleChange, onBlur: handleBlur, error: touched.testedBy && Boolean(errors.testedBy), helperText: touched.testedBy && errors.testedBy, placeholder: "Enter name..." }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { fullWidth: true, label: "Test Date *", name: "testedDate", type: "date", value: values.testedDate, onChange: handleChange, onBlur: handleBlur, error: touched.testedDate && Boolean(errors.testedDate), helperText: touched.testedDate && errors.testedDate, InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 3, label: "Notes", name: "notes", value: values.notes, onChange: handleChange, onBlur: handleBlur, error: touched.notes && Boolean(errors.notes), helperText: touched.notes && errors.notes }) })] }) }), _jsxs(DialogActions, { sx: { px: 3, pb: 2 }, children: [_jsx(Button, { onClick: onClose, startIcon: _jsx(CloseIcon, {}), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: mutation.isPending, children: mutation.isPending ? "Saving..." : "Save Test" })] })] })] }));
};
export default QualityControlForm;
