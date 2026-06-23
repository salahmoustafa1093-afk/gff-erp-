import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Avatar, Alert, CircularProgress, Divider, } from '@mui/material';
import { Save, CloudUpload, Business } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
const companySchema = Yup.object().shape({
    name: Yup.string().required('Company name is required').max(100),
    taxNumber: Yup.string().required('Tax number is required'),
    commercialRegister: Yup.string(),
    address: Yup.string().required('Address is required'),
    city: Yup.string().required('City is required'),
    country: Yup.string().required('Country is required'),
    phone: Yup.string().required('Phone is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    website: Yup.string().url('Invalid URL'),
    defaultCurrency: Yup.string().required('Currency is required'),
    fiscalYearStart: Yup.string().required('Fiscal year start is required'),
    fiscalYearEnd: Yup.string().required('Fiscal year end is required'),
});
const CompanySettingsPage = () => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const { data: settings, isLoading } = useQuery({
        queryKey: ['company-settings'],
        queryFn: () => settingsService.getCompanySettings(),
    });
    const updateMutation = useMutation({
        mutationFn: (data) => settingsService.updateCompanySettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-settings'] });
        },
    });
    const uploadMutation = useMutation({
        mutationFn: (file) => settingsService.uploadLogo(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['company-settings'] });
            setLogoPreview(data.logoUrl);
        },
    });
    const initialValues = {
        name: '',
        taxNumber: '',
        commercialRegister: '',
        address: '',
        city: '',
        country: 'Egypt',
        phone: '',
        email: '',
        website: '',
        defaultCurrency: 'EGP',
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
    };
    if (isLoading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { p: 3, maxWidth: 900, mx: "auto", children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: [_jsx(Business, { sx: { mr: 1, verticalAlign: 'middle' } }), "Company Settings"] }), _jsx(Card, { children: _jsxs(CardContent, { children: [updateMutation.isSuccess && (_jsx(Alert, { severity: "success", sx: { mb: 3 }, children: "Company settings saved successfully" })), updateMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: "Failed to save settings" })), _jsx(Formik, { initialValues: settings ?? initialValues, validationSchema: companySchema, enableReinitialize: true, onSubmit: (values) => {
                                updateMutation.mutate(values);
                            }, children: ({ isSubmitting, values }) => (_jsxs(Form, { children: [_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 3, mb: 2, children: [_jsx(Avatar, { src: logoPreview ?? values.logoUrl, sx: { width: 80, height: 80 }, variant: "rounded", children: (values.name ?? 'C').charAt(0) }), _jsxs(Box, { children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            setLogoPreview(URL.createObjectURL(file));
                                                                            uploadMutation.mutate(file);
                                                                        }
                                                                    } }), _jsx(Button, { variant: "outlined", startIcon: _jsx(CloudUpload, {}), onClick: () => fileInputRef.current?.click(), size: "small", disabled: uploadMutation.isPending, children: uploadMutation.isPending ? 'Uploading...' : 'Upload Logo' })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "name", label: "Company Name", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "taxNumber", label: "Tax Number", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "address", label: "Address", fullWidth: true, multiline: true, rows: 2, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "city", label: "City", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "country", label: "Country", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "phone", label: "Phone", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "email", label: "Email", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "website", label: "Website", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Default Currency" }), _jsxs(Field, { component: Select, name: "defaultCurrency", label: "Default Currency", children: [_jsx(MenuItem, { value: "EGP", children: "EGP - Egyptian Pound" }), _jsx(MenuItem, { value: "USD", children: "USD - US Dollar" }), _jsx(MenuItem, { value: "EUR", children: "EUR - Euro" }), _jsx(MenuItem, { value: "SAR", children: "SAR - Saudi Riyal" }), _jsx(MenuItem, { value: "AED", children: "AED - UAE Dirham" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "fiscalYearStart", label: "Fiscal Year Start (MM-DD)", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "fiscalYearEnd", label: "Fiscal Year End (MM-DD)", fullWidth: true, required: true }) })] }), _jsx(Divider, { sx: { my: 3 } }), _jsx(Box, { display: "flex", justifyContent: "flex-end", children: _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(Save, {}), disabled: isSubmitting || updateMutation.isPending, size: "large", children: updateMutation.isPending ? (_jsx(CircularProgress, { size: 20 })) : ('Save Settings') }) })] })) })] }) })] }));
};
export default CompanySettingsPage;
