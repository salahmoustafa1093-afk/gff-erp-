import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, MenuItem, Typography, Alert, Chip } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
const validationSchema = Yup.object({
    code: Yup.string().required('Customer code is required').max(50),
    creditLimit: Yup.number().min(0),
    taxNumber: Yup.string().max(50),
    customerType: Yup.string().required('Customer type is required'),
});
const ConvertLeadModal = ({ open, onClose, lead }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const convertMutation = useMutation({
        mutationFn: (data) => apiService.convertLead(lead.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            onClose();
            // Navigate to customers or show success
        },
    });
    const formik = useFormik({
        initialValues: {
            code: `CUST-${lead.firstName?.substring(0, 3).toUpperCase()}${Date.now().toString(36).substring(0, 4).toUpperCase()}`,
            creditLimit: 0,
            taxNumber: '',
            customerType: 'BUSINESS',
        },
        validationSchema,
        onSubmit: (values) => {
            convertMutation.mutate({
                ...values,
                name: lead.company || `${lead.firstName} ${lead.lastName}`,
                email: lead.email,
                phone: lead.phone,
            });
        },
    });
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Convert Lead to Customer" }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsxs(DialogContent, { dividers: true, children: [_jsxs(Alert, { severity: "info", sx: { mb: 2 }, children: ["Converting ", _jsxs("strong", { children: [lead.firstName, " ", lead.lastName] }), " from ", lead.company || 'N/A', " to a customer. This will mark the lead as ", _jsx("strong", { children: "WON" }), "."] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsxs(Box, { display: "flex", gap: 1, flexWrap: "wrap", mb: 1, children: [_jsx(Chip, { label: lead.source, size: "small", variant: "outlined" }), _jsx(Chip, { label: lead.email, size: "small", variant: "outlined" }), _jsx(Chip, { label: lead.phone, size: "small", variant: "outlined" })] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Customer Code", name: "code", value: formik.values.code, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.code && Boolean(formik.errors.code), helperText: formik.touched.code && formik.errors.code, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Customer Type", name: "customerType", value: formik.values.customerType, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "BUSINESS", children: "Business" }), _jsx(MenuItem, { value: "INDIVIDUAL", children: "Individual" }), _jsx(MenuItem, { value: "GOVERNMENT", children: "Government" }), _jsx(MenuItem, { value: "NON_PROFIT", children: "Non-Profit" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Credit Limit", name: "creditLimit", type: "number", value: formik.values.creditLimit, onChange: formik.handleChange, slotProps: {
                                                input: { startAdornment: _jsx(Typography, { variant: "body2", sx: { mr: 0.5 }, children: "$" }) }
                                            } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Tax Number / VAT ID", name: "taxNumber", value: formik.values.taxNumber, onChange: formik.handleChange }) })] })] }), _jsxs(DialogActions, { sx: { px: 3, py: 2 }, children: [_jsx(Button, { onClick: onClose, variant: "outlined", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", color: "success", disabled: convertMutation.isPending, children: convertMutation.isPending ? 'Converting...' : 'Convert to Customer' })] })] })] }));
};
export default ConvertLeadModal;
