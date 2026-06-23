import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button, IconButton, Chip, Skeleton, Alert, Paper, Divider, List, ListItem, ListItemText, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import { ArrowBack, Edit, Transform, Phone, Email, Business, LocalActivity, Timeline, CheckCircle, Add } from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService } from '../../services/api';
import ConvertLeadModal from './ConvertLeadModal';
const statusColors = {
    NEW: '#0288d1',
    CONTACTED: '#ed6c02',
    QUALIFIED: '#2e7d32',
    PROPOSAL: '#9c27b0',
    NEGOTIATION: '#795548',
    WON: '#2e7d32',
    LOST: '#d32f2f',
};
const statusFlow = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];
const TabPanel = ({ children, value, index }) => (value === index ? _jsx(Box, { sx: { py: 3 }, children: children }) : null);
const InfoRow = ({ label, value }) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.75, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: value || '-' })] }));
const LeadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(0);
    const [convertOpen, setConvertOpen] = useState(searchParams.get('convert') === 'true');
    const [activityFormOpen, setActivityFormOpen] = useState(false);
    const { data: lead, isLoading, error } = useQuery({
        queryKey: ['lead', id],
        queryFn: () => apiService.getLead(id),
        enabled: !!id,
    });
    const { data: activities } = useQuery({
        queryKey: ['lead-activities', id],
        queryFn: () => apiService.getActivities({ relatedTo: id, limit: 100 }),
        enabled: !!id,
    });
    const statusMutation = useMutation({
        mutationFn: (status) => apiService.updateLeadStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', id] });
        },
    });
    const activityMutation = useMutation({
        mutationFn: (data) => apiService.createActivity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
            setActivityFormOpen(false);
        },
    });
    const activityFormik = useFormik({
        initialValues: {
            type: 'CALL',
            subject: '',
            description: '',
            dueDate: null,
        },
        validationSchema: Yup.object({
            type: Yup.string().required(),
            subject: Yup.string().required('Subject is required'),
            description: Yup.string(),
            dueDate: Yup.date().required(),
        }),
        onSubmit: (values) => {
            if (!lead)
                return;
            activityMutation.mutate({
                ...values,
                relatedTo: lead.id,
                relatedToType: 'LEAD',
                relatedToName: `${lead.firstName} ${lead.lastName}`,
                assignedTo: lead.assignedTo,
                dueDate: values.dueDate?.toISOString(),
            });
        },
    });
    if (error) {
        return _jsx(Alert, { severity: "error", sx: { m: 3 }, children: "Failed to load lead details." });
    }
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(IconButton, { onClick: () => navigate('/leads'), children: _jsx(ArrowBack, {}) }), _jsx(Typography, { variant: "h4", fontWeight: 700, children: "Lead Detail" })] }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(Edit, {}), onClick: () => navigate(`/leads/edit/${id}`), size: "small", children: "Edit" }), lead && lead.status !== 'WON' && lead.status !== 'LOST' && (_jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(Transform, {}), onClick: () => setConvertOpen(true), children: "Convert" }))] })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: isLoading ? (_jsx(Skeleton, { height: 80 })) : lead ? (_jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsxs(Avatar, { sx: { width: 60, height: 60, bgcolor: statusColors[lead.status], fontSize: 28 }, children: [lead.firstName[0], lead.lastName[0]] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "h5", fontWeight: 700, children: [lead.firstName, " ", lead.lastName] }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: lead.company }), _jsxs(Box, { display: "flex", gap: 1, mt: 0.5, children: [_jsx(Chip, { label: lead.status, size: "small", sx: {
                                                                    bgcolor: `${statusColors[lead.status]}15`,
                                                                    color: statusColors[lead.status],
                                                                    fontWeight: 600,
                                                                } }), _jsx(Chip, { label: lead.source, size: "small", variant: "outlined" })] })] })] }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Box, { display: "flex", flexWrap: "wrap", gap: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 0.5, children: [_jsx(Email, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "body2", children: lead.email })] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 0.5, children: [_jsx(Phone, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "body2", children: lead.phone })] }), lead.estimatedValue > 0 && (_jsx(Chip, { label: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.estimatedValue), color: "success", size: "small", variant: "outlined" })), lead.expectedCloseDate && (_jsx(Chip, { label: `Close: ${new Date(lead.expectedCloseDate).toLocaleDateString()}`, size: "small", variant: "outlined" }))] }) })] })) : null }) }), !isLoading && lead && (_jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, gutterBottom: true, children: "Pipeline Progress" }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", children: [statusFlow.map((s, idx) => {
                                        const currentIdx = statusFlow.indexOf(lead.status);
                                        const isActive = idx <= currentIdx;
                                        const isCurrent = s === lead.status;
                                        return (_jsxs(React.Fragment, { children: [idx > 0 && _jsx(Box, { sx: { width: 20, height: 2, bgcolor: isActive ? statusColors[s] : 'grey.300' } }), _jsx(Button, { size: "small", variant: isCurrent ? 'contained' : 'outlined', sx: {
                                                        bgcolor: isCurrent ? statusColors[s] : isActive ? `${statusColors[s]}15` : undefined,
                                                        borderColor: statusColors[s],
                                                        color: isCurrent ? '#fff' : statusColors[s],
                                                        fontWeight: 600,
                                                        fontSize: '0.7rem',
                                                        py: 0.3,
                                                        minWidth: 80,
                                                    }, onClick: () => statusMutation.mutate(s), disabled: statusMutation.isPending, children: s })] }, s));
                                    }), _jsx(Box, { sx: { width: 20, height: 2, bgcolor: lead.status === 'LOST' ? statusColors.LOST : 'grey.300' } }), _jsx(Button, { size: "small", variant: lead.status === 'LOST' ? 'contained' : 'outlined', color: "error", sx: { fontWeight: 600, fontSize: '0.7rem', py: 0.3, minWidth: 60 }, onClick: () => statusMutation.mutate('LOST'), disabled: statusMutation.isPending, children: "LOST" })] })] }) })), _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: (_, v) => setActiveTab(v), variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { label: "Information", icon: _jsx(Business, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Activities", icon: _jsx(LocalActivity, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Timeline", icon: _jsx(Timeline, { fontSize: "small" }), iconPosition: "start" })] }), _jsxs(CardContent, { children: [_jsx(TabPanel, { value: activeTab, index: 0, children: isLoading ? _jsx(Skeleton, { height: 200 }) : lead && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Contact Details" }), _jsx(InfoRow, { label: "Full Name", value: `${lead.firstName} ${lead.lastName}` }), _jsx(InfoRow, { label: "Email", value: lead.email }), _jsx(InfoRow, { label: "Phone", value: lead.phone }), _jsx(InfoRow, { label: "Company", value: lead.company })] }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Lead Details" }), _jsx(InfoRow, { label: "Source", value: _jsx(Chip, { label: lead.source, size: "small" }) }), _jsx(InfoRow, { label: "Status", value: _jsx(Chip, { label: lead.status, size: "small", sx: { color: statusColors[lead.status], bgcolor: `${statusColors[lead.status]}15` } }) }), _jsx(InfoRow, { label: "Estimated Value", value: lead.estimatedValue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.estimatedValue) : '-' }), _jsx(InfoRow, { label: "Expected Close", value: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "Assigned To", value: lead.assignedToName })] }) }), lead.notes && (_jsx(Grid, { size: { xs: 12 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, gutterBottom: true, children: "Notes" }), _jsx(Typography, { variant: "body2", sx: { whiteSpace: 'pre-wrap' }, children: lead.notes })] }) }))] })) }), _jsxs(TabPanel, { value: activeTab, index: 1, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "Activities" }), _jsx(Button, { variant: "contained", size: "small", startIcon: _jsx(Add, {}), onClick: () => setActivityFormOpen(true), children: "Add Activity" })] }), _jsxs(List, { children: [(activities?.data || []).length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", py: 3, children: "No activities yet" })), (activities?.data || []).map((activity, idx) => (_jsxs(React.Fragment, { children: [_jsx(ListItem, { secondaryAction: activity.status !== 'COMPLETED' && (_jsx(Button, { size: "small", variant: "outlined", startIcon: _jsx(CheckCircle, {}), onClick: () => apiService.markActivityComplete(activity.id), children: "Complete" })), children: _jsx(ListItemText, { primary: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: activity.subject }), _jsx(Chip, { label: activity.type, size: "small", variant: "outlined" }), _jsx(Chip, { label: activity.status, size: "small", color: activity.status === 'COMPLETED' ? 'success' : activity.status === 'OVERDUE' ? 'error' : 'warning', variant: "outlined" })] }), secondary: _jsxs(_Fragment, { children: [activity.description && _jsx(Typography, { variant: "body2", children: activity.description }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Due: ", new Date(activity.dueDate).toLocaleString(), " | Assigned: ", activity.assignedToName] })] }) }) }), idx < (activities?.data?.length || 0) - 1 && _jsx(Divider, {})] }, activity.id)))] }), _jsxs(Dialog, { open: activityFormOpen, onClose: () => setActivityFormOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Add Activity" }), _jsxs("form", { onSubmit: activityFormik.handleSubmit, children: [_jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Type", name: "type", value: activityFormik.values.type, onChange: activityFormik.handleChange, children: [_jsx(MenuItem, { value: "CALL", children: "Call" }), _jsx(MenuItem, { value: "MEETING", children: "Meeting" }), _jsx(MenuItem, { value: "EMAIL", children: "Email" }), _jsx(MenuItem, { value: "TASK", children: "Task" }), _jsx(MenuItem, { value: "NOTE", children: "Note" }), _jsx(MenuItem, { value: "REMINDER", children: "Reminder" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Due Date", value: activityFormik.values.dueDate, onChange: (v) => activityFormik.setFieldValue('dueDate', v), slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Subject", name: "subject", value: activityFormik.values.subject, onChange: activityFormik.handleChange, onBlur: activityFormik.handleBlur, error: activityFormik.touched.subject && Boolean(activityFormik.errors.subject), helperText: activityFormik.touched.subject && activityFormik.errors.subject }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Description", name: "description", multiline: true, rows: 3, value: activityFormik.values.description, onChange: activityFormik.handleChange }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setActivityFormOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: activityMutation.isPending, children: activityMutation.isPending ? 'Adding...' : 'Add Activity' })] })] })] })] }), _jsxs(TabPanel, { value: activeTab, index: 2, children: [lead && (_jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', mb: 2 }, children: [_jsxs(Box, { sx: { mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx(Box, { sx: { width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' } }), _jsx(Box, { sx: { width: 2, flex: 1, bgcolor: 'divider', my: 0.5 } })] }), _jsxs(Box, { pb: 2, children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: "Lead Created" }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: new Date(lead.createdAt).toLocaleString() })] })] }), _jsxs(Box, { sx: { display: 'flex', mb: 2 }, children: [_jsxs(Box, { sx: { mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx(Box, { sx: { width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' } }), _jsx(Box, { sx: { width: 2, flex: 1, bgcolor: 'divider', my: 0.5 } })] }), _jsxs(Box, { pb: 2, children: [_jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">Status: ", lead.status] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Last updated: ", new Date(lead.updatedAt).toLocaleString()] })] })] })), (activities?.data || []).map((activity) => (_jsxs(Box, { sx: { display: 'flex', mb: 2 }, children: [_jsxs(Box, { sx: { mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx(Box, { sx: { width: 12, height: 12, borderRadius: '50%', bgcolor: activity.status === 'COMPLETED' ? 'success.main' : 'warning.main' } }), _jsx(Box, { sx: { width: 2, flex: 1, bgcolor: 'divider', my: 0.5 } })] }), _jsxs(Box, { pb: 2, children: [_jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", activity.type, ": ", activity.subject] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [new Date(activity.createdAt).toLocaleString(), " | ", activity.status] })] }, activity.id)))] }), "))}"] }), ")}"] })] }) })) /* Convert Lead Modal */;
    { /* Convert Lead Modal */ }
    {
        lead && (_jsx(ConvertLeadModal, { open: convertOpen, onClose: () => setConvertOpen(false), lead: lead }));
    }
};
Box >
;
LocalizationProvider >
;
;
;
export default LeadDetail;
