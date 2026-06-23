import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Avatar, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Chip, CircularProgress, } from '@mui/material';
import { Save, Lock, Person, History, VpnKey, } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { formatDateTime } from '../../utils/formatters';
const profileSchema = Yup.object().shape({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string(),
});
const passwordSchema = Yup.object().shape({
    oldPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string().min(8, 'Minimum 8 characters').required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm password is required'),
});
const UserProfilePage = () => {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState(0);
    const { data: profile, isLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: () => settingsService.getUserProfile(),
    });
    const { data: activityData } = useQuery({
        queryKey: ['activity-log'],
        queryFn: () => settingsService.getActivityLog({ pageSize: 50 }),
    });
    const updateMutation = useMutation({
        mutationFn: (data) => settingsService.updateUserProfile(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
    });
    const passwordMutation = useMutation({
        mutationFn: ({ oldPassword, newPassword }) => settingsService.changePassword(oldPassword, newPassword),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
    });
    const activityLog = activityData?.data ?? [];
    if (isLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { p: 3, maxWidth: 1000, mx: "auto", children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: [_jsx(Person, { sx: { mr: 1, verticalAlign: 'middle' } }), "User Profile"] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 3, children: [_jsx(Avatar, { src: profile?.avatarUrl, sx: { width: 80, height: 80, fontSize: 36 }, children: (profile?.fullName ?? 'U').charAt(0) }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h5", fontWeight: "bold", children: profile?.fullName }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: profile?.username }), _jsxs(Box, { display: "flex", gap: 1, mt: 0.5, children: [_jsx(Chip, { label: profile?.role, size: "small", color: "primary" }), _jsx(Chip, { label: profile?.isActive ? 'Active' : 'Inactive', size: "small", color: profile?.isActive ? 'success' : 'error' })] })] }), _jsx(Box, { flex: 1 }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Last login: ", formatDateTime(profile?.lastLogin)] })] }) }) }), _jsxs(Tabs, { value: tab, onChange: (_, v) => setTab(v), sx: { mb: 2 }, children: [_jsx(Tab, { icon: _jsx(Person, { fontSize: "small" }), label: "Profile" }), _jsx(Tab, { icon: _jsx(VpnKey, { fontSize: "small" }), label: "Password" }), _jsx(Tab, { icon: _jsx(History, { fontSize: "small" }), label: "Activity Log" })] }), tab === 0 && (_jsx(Card, { children: _jsxs(CardContent, { children: [updateMutation.isSuccess && (_jsx(Alert, { severity: "success", sx: { mb: 3 }, children: "Profile updated successfully" })), updateMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: "Failed to update profile" })), _jsx(Formik, { initialValues: {
                                fullName: profile?.fullName ?? '',
                                email: profile?.email ?? '',
                                phone: profile?.phone ?? '',
                            }, validationSchema: profileSchema, enableReinitialize: true, onSubmit: (values) => {
                                updateMutation.mutate(values);
                            }, children: ({ isSubmitting }) => (_jsxs(Form, { children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "fullName", label: "Full Name", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "email", label: "Email", fullWidth: true, required: true, type: "email" }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "phone", label: "Phone", fullWidth: true }) })] }), _jsx(Box, { display: "flex", justifyContent: "flex-end", mt: 3, children: _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(Save, {}), disabled: isSubmitting || updateMutation.isPending, children: updateMutation.isPending ? 'Saving...' : 'Save Profile' }) })] })) })] }) })), tab === 1 && (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "h6", gutterBottom: true, children: [_jsx(Lock, { sx: { mr: 0.5, verticalAlign: 'middle' } }), "Change Password"] }), passwordMutation.isSuccess && (_jsx(Alert, { severity: "success", sx: { mb: 3 }, children: "Password changed successfully" })), passwordMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: "Failed to change password" })), _jsx(Formik, { initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' }, validationSchema: passwordSchema, onSubmit: (values, { resetForm }) => {
                                passwordMutation.mutate({ oldPassword: values.oldPassword, newPassword: values.newPassword }, { onSuccess: () => resetForm() });
                            }, children: ({ isSubmitting }) => (_jsxs(Form, { children: [_jsxs(Grid, { container: true, spacing: 2, maxWidth: 500, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "oldPassword", label: "Current Password", type: "password", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "newPassword", label: "New Password", type: "password", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "confirmPassword", label: "Confirm New Password", type: "password", fullWidth: true, required: true }) })] }), _jsx(Box, { display: "flex", justifyContent: "flex-end", mt: 3, children: _jsx(Button, { type: "submit", variant: "contained", color: "warning", startIcon: _jsx(VpnKey, {}), disabled: isSubmitting || passwordMutation.isPending, children: passwordMutation.isPending ? 'Changing...' : 'Change Password' }) })] })) })] }) })), tab === 2 && (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Typography, { variant: "h6", gutterBottom: true, children: [_jsx(History, { sx: { mr: 0.5, verticalAlign: 'middle' } }), "Activity Log"] }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5' }, children: [_jsx(TableCell, { children: "Timestamp" }), _jsx(TableCell, { children: "Action" }), _jsx(TableCell, { children: "Entity" }), _jsx(TableCell, { children: "Details" }), _jsx(TableCell, { children: "IP Address" })] }) }), _jsx(TableBody, { children: activityLog.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 5, align: "center", children: "No activity recorded" }) })) : (activityLog.map((entry) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: formatDateTime(entry.timestamp) }), _jsx(TableCell, { children: _jsx(Chip, { label: entry.action, size: "small", color: "primary" }) }), _jsxs(TableCell, { children: [entry.entityType, " #", entry.entityId] }), _jsx(TableCell, { children: entry.details }), _jsx(TableCell, { children: entry.ipAddress })] }, entry.id)))) })] }) })] }) }))] }));
};
export default UserProfilePage;
