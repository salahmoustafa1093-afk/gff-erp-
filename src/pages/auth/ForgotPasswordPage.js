import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiService } from '@/app/api';
const forgotPasswordValidationSchema = Yup.object({
    email: Yup.string()
        .email('Enter a valid email address')
        .required('Email is required'),
});
export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const formik = useFormik({
        initialValues: {
            email: '',
        },
        validationSchema: forgotPasswordValidationSchema,
        onSubmit: async (values) => {
            setIsLoading(true);
            setError(null);
            try {
                await apiService.post('/auth/forgot-password', { email: values.email });
                setIsSubmitted(true);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to send reset link';
                setError(message);
            }
            finally {
                setIsLoading(false);
            }
        },
    });
    return (_jsxs(Box, { sx: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
            position: 'relative',
            overflow: 'hidden',
            px: 3,
        }, children: [_jsx(Box, { sx: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.05,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                } }), _jsx(Fade, { in: true, timeout: 500, children: _jsx(Card, { sx: {
                        width: '100%',
                        maxWidth: 440,
                        borderRadius: 3,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    }, children: _jsx(CardContent, { sx: { p: 4 }, children: isSubmitted ? (
                        /* Success State */
                        _jsxs(Box, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Box, { sx: {
                                        width: 72,
                                        height: 72,
                                        borderRadius: '50%',
                                        backgroundColor: 'success.light',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 3,
                                    }, children: _jsx(CheckCircleIcon, { sx: { fontSize: 40, color: 'success.main' } }) }), _jsx(Typography, { variant: "h5", fontWeight: 600, gutterBottom: true, children: "Check Your Email" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: ["We've sent a password reset link to", ' ', _jsx("strong", { children: formik.values.email }), ". Please check your inbox and follow the instructions to reset your password."] }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "If you don't see the email, check your spam folder." }), _jsx(Button, { component: Link, to: "/login", variant: "outlined", startIcon: _jsx(ArrowBackIcon, {}), fullWidth: true, sx: { borderRadius: 2 }, children: "Back to Login" })] })) : (
                        /* Form State */
                        _jsxs(_Fragment, { children: [_jsx(Button, { component: Link, to: "/login", startIcon: _jsx(ArrowBackIcon, {}), sx: { mb: 2, pl: 0 }, color: "inherit", children: "Back to Login" }), _jsx(Typography, { variant: "h5", fontWeight: 600, gutterBottom: true, children: "Forgot Password?" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Enter your email address and we'll send you a link to reset your password." }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2.5 }, children: error })), _jsxs("form", { onSubmit: formik.handleSubmit, noValidate: true, children: [_jsx(TextField, { fullWidth: true, id: "email", name: "email", label: "Email Address", type: "email", autoComplete: "email", autoFocus: true, margin: "normal", placeholder: "your@email.com", value: formik.values.email, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.email && Boolean(formik.errors.email), helperText: formik.touched.email && formik.errors.email, disabled: isLoading, InputProps: {
                                                sx: { borderRadius: 2 },
                                                startAdornment: _jsx(EmailIcon, { sx: { mr: 1, color: 'text.secondary' } }),
                                            } }), _jsx(Button, { fullWidth: true, type: "submit", variant: "contained", size: "large", disabled: isLoading || !formik.isValid, startIcon: isLoading ? (_jsx(CircularProgress, { size: 20, color: "inherit" })) : null, sx: {
                                                mt: 2,
                                                py: 1.5,
                                                borderRadius: 2,
                                                fontWeight: 600,
                                            }, children: isLoading ? 'Sending...' : 'Send Reset Link' })] })] })) }) }) })] }));
}
