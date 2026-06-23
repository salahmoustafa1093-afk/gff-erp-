import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTheme, setLanguage } from '@/app/slices/appSlice';
import { useBranch } from '@/hooks/useBranch';
function TabPanel({ children, value, index }) {
    if (value !== index)
        return null;
    return _jsx(Box, { sx: { py: 3 }, children: children });
}
const companyValidationSchema = Yup.object({
    companyName: Yup.string().required('Company name is required'),
    legalName: Yup.string(),
    taxId: Yup.string(),
    registrationNumber: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    country: Yup.string(),
    phone: Yup.string(),
    email: Yup.string().email('Invalid email'),
    website: Yup.string().url('Invalid URL'),
});
const profileValidationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string(),
});
const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Must contain at least one number')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm password is required'),
});
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState(0);
    const dispatch = useAppDispatch();
    const { user, updateProfile, changePassword, isLoading: authLoading } = useAuth();
    const { currentBranch, branchList, switchBranch } = useBranch();
    const appTheme = useAppSelector((state) => state.app.theme);
    const appLanguage = useAppSelector((state) => state.app.language);
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
    };
    // Company Settings Form
    const companyForm = useFormik({
        initialValues: {
            companyName: 'Golden Farms Foods',
            legalName: 'Golden Farms Foods Ltd.',
            taxId: '',
            registrationNumber: '',
            address: '',
            city: '',
            country: '',
            phone: '',
            email: '',
            website: '',
        },
        validationSchema: companyValidationSchema,
        onSubmit: async (_values) => {
            // Company settings update - will be implemented when API is ready
        },
    });
    // Profile Form
    const profileForm = useFormik({
        initialValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phone || '',
        },
        validationSchema: profileValidationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            await updateProfile(values);
        },
    });
    // Password Form
    const passwordForm = useFormik({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: passwordValidationSchema,
        onSubmit: async (values) => {
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword,
            });
            passwordForm.resetForm();
        },
    });
    const tabs = [
        { label: 'Company', icon: _jsx(BusinessIcon, { fontSize: "small" }) },
        { label: 'Profile', icon: _jsx(PersonIcon, { fontSize: "small" }) },
        { label: 'Password', icon: _jsx(LockIcon, { fontSize: "small" }) },
        { label: 'Notifications', icon: _jsx(NotificationsIcon, { fontSize: "small" }) },
        { label: 'Appearance', icon: _jsx(PaletteIcon, { fontSize: "small" }) },
        { label: 'Branch', icon: _jsx(StorefrontIcon, { fontSize: "small" }) },
    ];
    return (_jsxs(Box, { children: [_jsx(PageHeader, { title: "Settings", subtitle: "Manage your application preferences" }), _jsxs(Card, { variant: "outlined", children: [_jsx(Tabs, { value: activeTab, onChange: handleTabChange, variant: "scrollable", scrollButtons: "auto", sx: { borderBottom: 1, borderColor: 'divider', px: 2 }, children: tabs.map((tab, i) => (_jsx(Tab, { label: tab.label, icon: tab.icon, iconPosition: "start" }, i))) }), _jsxs(CardContent, { sx: { px: { xs: 2, md: 4 }, py: 0 }, children: [_jsxs(TabPanel, { value: activeTab, index: 0, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Company Information" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Update your company details and business information." }), _jsxs("form", { onSubmit: companyForm.handleSubmit, children: [_jsxs(Grid, { container: true, spacing: 2.5, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Company Name", name: "companyName", value: companyForm.values.companyName, onChange: companyForm.handleChange, onBlur: companyForm.handleBlur, error: companyForm.touched.companyName && Boolean(companyForm.errors.companyName), helperText: companyForm.touched.companyName && companyForm.errors.companyName }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Legal Name", name: "legalName", value: companyForm.values.legalName, onChange: companyForm.handleChange, onBlur: companyForm.handleBlur }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Tax ID", name: "taxId", value: companyForm.values.taxId, onChange: companyForm.handleChange }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Registration Number", name: "registrationNumber", value: companyForm.values.registrationNumber, onChange: companyForm.handleChange }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Address", name: "address", multiline: true, rows: 2, value: companyForm.values.address, onChange: companyForm.handleChange }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "City", name: "city", value: companyForm.values.city, onChange: companyForm.handleChange }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Country", name: "country", value: companyForm.values.country, onChange: companyForm.handleChange }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Phone", name: "phone", value: companyForm.values.phone, onChange: companyForm.handleChange }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Email", name: "email", type: "email", value: companyForm.values.email, onChange: companyForm.handleChange, onBlur: companyForm.handleBlur, error: companyForm.touched.email && Boolean(companyForm.errors.email), helperText: companyForm.touched.email && companyForm.errors.email }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Website", name: "website", value: companyForm.values.website, onChange: companyForm.handleChange, onBlur: companyForm.handleBlur, error: companyForm.touched.website && Boolean(companyForm.errors.website), helperText: companyForm.touched.website && companyForm.errors.website }) })] }), _jsx(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'flex-end' }, children: _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(SaveIcon, {}), disabled: !companyForm.dirty || companyForm.isSubmitting, children: "Save Changes" }) })] })] }), _jsxs(TabPanel, { value: activeTab, index: 1, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "User Profile" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Manage your personal information and contact details." }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 4 }, children: [_jsxs(Avatar, { sx: {
                                                    width: 80,
                                                    height: 80,
                                                    bgcolor: 'primary.main',
                                                    fontSize: '1.75rem',
                                                    fontWeight: 600,
                                                    mr: 2.5,
                                                }, children: [user?.firstName?.[0], user?.lastName?.[0]] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "h6", fontWeight: 600, children: [user?.firstName, " ", user?.lastName] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: user?.email }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Role: ", user?.role] })] })] }), _jsx(Divider, { sx: { mb: 3 } }), _jsxs("form", { onSubmit: profileForm.handleSubmit, children: [_jsxs(Grid, { container: true, spacing: 2.5, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "First Name", name: "firstName", value: profileForm.values.firstName, onChange: profileForm.handleChange, onBlur: profileForm.handleBlur, error: profileForm.touched.firstName && Boolean(profileForm.errors.firstName), helperText: profileForm.touched.firstName && profileForm.errors.firstName }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Last Name", name: "lastName", value: profileForm.values.lastName, onChange: profileForm.handleChange, onBlur: profileForm.handleBlur, error: profileForm.touched.lastName && Boolean(profileForm.errors.lastName), helperText: profileForm.touched.lastName && profileForm.errors.lastName }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Email", name: "email", type: "email", value: profileForm.values.email, onChange: profileForm.handleChange, onBlur: profileForm.handleBlur, error: profileForm.touched.email && Boolean(profileForm.errors.email), helperText: profileForm.touched.email && profileForm.errors.email }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { fullWidth: true, label: "Phone", name: "phone", value: profileForm.values.phone, onChange: profileForm.handleChange, onBlur: profileForm.handleBlur }) })] }), _jsx(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'flex-end' }, children: _jsx(Button, { type: "submit", variant: "contained", startIcon: authLoading ? _jsx(CircularProgress, { size: 16, color: "inherit" }) : _jsx(SaveIcon, {}), disabled: !profileForm.dirty || profileForm.isSubmitting || authLoading, children: "Save Profile" }) })] })] }), _jsxs(TabPanel, { value: activeTab, index: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Change Password" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Update your password to keep your account secure." }), _jsxs("form", { onSubmit: passwordForm.handleSubmit, children: [_jsxs(Grid, { container: true, spacing: 2.5, maxWidth: 600, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Current Password", name: "currentPassword", type: "password", value: passwordForm.values.currentPassword, onChange: passwordForm.handleChange, onBlur: passwordForm.handleBlur, error: passwordForm.touched.currentPassword && Boolean(passwordForm.errors.currentPassword), helperText: passwordForm.touched.currentPassword && passwordForm.errors.currentPassword }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "New Password", name: "newPassword", type: "password", value: passwordForm.values.newPassword, onChange: passwordForm.handleChange, onBlur: passwordForm.handleBlur, error: passwordForm.touched.newPassword && Boolean(passwordForm.errors.newPassword), helperText: passwordForm.touched.newPassword && passwordForm.errors.newPassword }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { fullWidth: true, label: "Confirm New Password", name: "confirmPassword", type: "password", value: passwordForm.values.confirmPassword, onChange: passwordForm.handleChange, onBlur: passwordForm.handleBlur, error: passwordForm.touched.confirmPassword && Boolean(passwordForm.errors.confirmPassword), helperText: passwordForm.touched.confirmPassword && passwordForm.errors.confirmPassword }) })] }), _jsx(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'flex-start' }, children: _jsx(Button, { type: "submit", variant: "contained", startIcon: authLoading ? _jsx(CircularProgress, { size: 16, color: "inherit" }) : _jsx(SaveIcon, {}), disabled: !passwordForm.dirty || passwordForm.isSubmitting || authLoading, children: "Update Password" }) })] })] }), _jsxs(TabPanel, { value: activeTab, index: 3, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Notification Preferences" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Choose which notifications you want to receive." }), _jsx(NotificationSettingsTab, {})] }), _jsxs(TabPanel, { value: activeTab, index: 4, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Appearance" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Customize the look and feel of the application." }), _jsxs(Grid, { container: true, spacing: 3, maxWidth: 600, children: [_jsx(Grid, { item: true, xs: 12, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Theme" }), _jsxs(Select, { value: appTheme, onChange: (e) => dispatch(setTheme(e.target.value)), label: "Theme", children: [_jsx(MenuItem, { value: "light", children: "Light" }), _jsx(MenuItem, { value: "dark", children: "Dark" })] })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Language" }), _jsxs(Select, { value: appLanguage, onChange: (e) => dispatch(setLanguage(e.target.value)), label: "Language", children: [_jsx(MenuItem, { value: "en", children: "English" }), _jsx(MenuItem, { value: "ar", children: "Arabic" })] })] }) })] })] }), _jsxs(TabPanel, { value: activeTab, index: 5, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Branch Settings" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Manage your branch preferences and settings." }), _jsxs(FormControl, { fullWidth: true, sx: { mb: 3 }, children: [_jsx(InputLabel, { children: "Current Branch" }), _jsx(Select, { value: currentBranch?.id || '', onChange: (e) => switchBranch(e.target.value), label: "Current Branch", children: branchList.map((branch) => (_jsxs(MenuItem, { value: branch.id, children: [branch.name, " ", branch.isMain ? '(Main)' : ''] }, branch.id))) })] }), currentBranch && (_jsx(Card, { variant: "outlined", children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: "Branch Code" }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: currentBranch.code })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: "Status" }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: currentBranch.isActive ? 'Active' : 'Inactive' })] }), currentBranch.address && (_jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: "Address" }), _jsxs(Typography, { variant: "body2", children: [currentBranch.address, currentBranch.city && `, ${currentBranch.city}`] })] })), currentBranch.currency && (_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: "Currency" }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: currentBranch.currency })] })), currentBranch.timezone && (_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: "Timezone" }), _jsx(Typography, { variant: "body2", children: currentBranch.timezone })] }))] }) }) }))] })] })] })] }));
}
// ============================================
// Notification Settings Sub-component
// ============================================
function NotificationSettingsTab() {
    const [prefs, setPrefs] = useState({
        email: true,
        push: true,
        sms: false,
        orderAlerts: true,
        stockAlerts: true,
        paymentAlerts: true,
        systemAlerts: true,
    });
    const handleToggle = (key) => {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const items = [
        { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
        { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' },
        { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via text message' },
        { key: 'orderAlerts', label: 'Order Alerts', description: 'New orders, order status changes' },
        { key: 'stockAlerts', label: 'Stock Alerts', description: 'Low stock, stock movements' },
        { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Payments received, overdue invoices' },
        { key: 'systemAlerts', label: 'System Alerts', description: 'System updates, maintenance notices' },
    ];
    return (_jsxs(Box, { children: [items.map((item) => (_jsxs(Box, { sx: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: item.label }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: item.description })] }), _jsx(Switch, { checked: prefs[item.key], onChange: () => handleToggle(item.key) })] }, item.key))), _jsx(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'flex-end' }, children: _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), children: "Save Preferences" }) })] }));
}
