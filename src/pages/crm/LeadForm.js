import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Grid, TextField, MenuItem, IconButton, Autocomplete, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required').max(100),
    lastName: Yup.string().required('Last name is required').max(100),
    company: Yup.string().max(200),
    email: Yup.string().email('Invalid email').max(200),
    phone: Yup.string().max(50),
    source: Yup.string().required('Source is required'),
    status: Yup.string().required('Status is required'),
    estimatedValue: Yup.number().min(0),
    expectedCloseDate: Yup.date().nullable(),
    assignedTo: Yup.string(),
    notes: Yup.string().max(2000),
});
const LeadForm = ({ leadId, onClose }) => {
    const queryClient = useQueryClient();
    const { data: existingLead } = useQuery({
        queryKey: ['lead', leadId],
        queryFn: () => leadId ? apiService.getLead(leadId) : null,
        enabled: !!leadId,
    });
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => apiService.getSupervisors(),
    });
    const mutation = useMutation({
        mutationFn: (values) => leadId ? apiService.updateLead(leadId, values) : apiService.createLead(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            if (leadId)
                queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            onClose();
        },
    });
    const formik = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            company: '',
            email: '',
            phone: '',
            source: 'WEB',
            status: 'NEW',
            estimatedValue: 0,
            expectedCloseDate: null,
            assignedTo: '',
            notes: '',
        },
        validationSchema,
        onSubmit: (values) => {
            const payload = {
                ...values,
                expectedCloseDate: values.expectedCloseDate?.toISOString(),
            };
            mutation.mutate(payload);
        },
    });
    useEffect(() => {
        if (existingLead) {
            formik.setValues({
                firstName: existingLead.firstName || '',
                lastName: existingLead.lastName || '',
                company: existingLead.company || '',
                email: existingLead.email || '',
                phone: existingLead.phone || '',
                source: existingLead.source || 'WEB',
                status: existingLead.status || 'NEW',
                estimatedValue: existingLead.estimatedValue || 0,
                expectedCloseDate: existingLead.expectedCloseDate ? new Date(existingLead.expectedCloseDate) : null,
                assignedTo: existingLead.assignedTo || '',
                notes: existingLead.notes || '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingLead]);
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsx(DialogTitle, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "h6", children: leadId ? 'Edit Lead' : 'Create New Lead' }), _jsx(IconButton, { onClick: onClose, size: "small", children: _jsx(Close, {}) })] }) }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsx(DialogContent, { dividers: true, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "First Name", name: "firstName", value: formik.values.firstName, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.firstName && Boolean(formik.errors.firstName), helperText: formik.touched.firstName && formik.errors.firstName, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Last Name", name: "lastName", value: formik.values.lastName, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.lastName && Boolean(formik.errors.lastName), helperText: formik.touched.lastName && formik.errors.lastName, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Company", name: "company", value: formik.values.company, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Email", name: "email", type: "email", value: formik.values.email, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.email && Boolean(formik.errors.email), helperText: formik.touched.email && formik.errors.email }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Phone", name: "phone", value: formik.values.phone, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Source", name: "source", value: formik.values.source, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "WEB", children: "Web" }), _jsx(MenuItem, { value: "REFERRAL", children: "Referral" }), _jsx(MenuItem, { value: "CALL", children: "Call" }), _jsx(MenuItem, { value: "SOCIAL", children: "Social Media" }), _jsx(MenuItem, { value: "EMAIL", children: "Email" }), _jsx(MenuItem, { value: "EXHIBITION", children: "Exhibition" }), _jsx(MenuItem, { value: "OTHER", children: "Other" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Status", name: "status", value: formik.values.status, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "NEW", children: "New" }), _jsx(MenuItem, { value: "CONTACTED", children: "Contacted" }), _jsx(MenuItem, { value: "QUALIFIED", children: "Qualified" }), _jsx(MenuItem, { value: "PROPOSAL", children: "Proposal" }), _jsx(MenuItem, { value: "NEGOTIATION", children: "Negotiation" }), _jsx(MenuItem, { value: "WON", children: "Won" }), _jsx(MenuItem, { value: "LOST", children: "Lost" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Estimated Value", name: "estimatedValue", type: "number", value: formik.values.estimatedValue, onChange: formik.handleChange, slotProps: {
                                            input: { startAdornment: _jsx(Typography, { variant: "body2", sx: { mr: 0.5 }, children: "$" }) }
                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Expected Close Date", value: formik.values.expectedCloseDate, onChange: (val) => formik.setFieldValue('expectedCloseDate', val), slotProps: {
                                            textField: { fullWidth: true, size: 'small' }
                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Autocomplete, { options: users || [], getOptionLabel: (opt) => opt.name, value: (users || []).find((u) => u.id === formik.values.assignedTo) || null, onChange: (_, val) => formik.setFieldValue('assignedTo', val?.id || ''), renderInput: (params) => (_jsx(TextField, { ...params, size: "small", label: "Assigned To", fullWidth: true })) }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", name: "notes", multiline: true, rows: 4, value: formik.values.notes, onChange: formik.handleChange }) })] }) }), _jsxs(DialogActions, { sx: { px: 3, py: 2 }, children: [_jsx(Button, { onClick: onClose, variant: "outlined", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: mutation.isPending, children: mutation.isPending ? 'Saving...' : leadId ? 'Update Lead' : 'Create Lead' })] })] })] }));
};
export default LeadForm;
