import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '@/hooks/useAuth';
const loginValidationSchema = Yup.object({
    email: Yup.string()
        .email('Enter a valid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    rememberMe: Yup.boolean(),
});
export default function LoginPage() {
    const { login, isLoading, error: authError } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState(null);
    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
        validationSchema: loginValidationSchema,
        onSubmit: async (values) => {
            setLoginError(null);
            try {
                await login({
                    email: values.email,
                    password: values.password,
                    rememberMe: values.rememberMe,
                });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Login failed';
                setLoginError(message);
            }
        },
    });
    const handleClickShowPassword = () => {
        setShowPassword((prev) => !prev);
    };
    return (_jsxs(Box, { sx: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
            position: 'relative',
            overflow: 'hidden',
        }, children: [_jsx(Box, { sx: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.05,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                } }), _jsx(Fade, { in: true, timeout: 500, children: _jsxs(Box, { sx: {
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        gap: 6,
                        maxWidth: 1000,
                        width: '100%',
                        px: 3,
                    }, children: [_jsxs(Box, { sx: {
                                flex: 1,
                                textAlign: { xs: 'center', md: 'left' },
                                color: 'white',
                            }, children: [_jsx(Box, { sx: {
                                        width: 80,
                                        height: 80,
                                        borderRadius: 3,
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(10px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                        mx: { xs: 'auto', md: 0 },
                                        fontWeight: 700,
                                        fontSize: '1.5rem',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                    }, children: "GFF" }), _jsx(Typography, { variant: "h2", fontWeight: 700, sx: { mb: 2, fontSize: { xs: '2.5rem', md: '3rem' } }, children: "GFF ERP" }), _jsx(Typography, { variant: "h5", sx: { mb: 2, opacity: 0.9, fontWeight: 400 }, children: "Enterprise Resource Planning" }), _jsx(Typography, { variant: "body1", sx: { opacity: 0.8, maxWidth: 400, mx: { xs: 'auto', md: 0 } }, children: "Integrated business management system for Golden Farms. Manage sales, inventory, finance, HR, and production from a single platform." })] }), _jsx(Card, { sx: {
                                width: '100%',
                                maxWidth: 420,
                                borderRadius: 3,
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            }, children: _jsxs(CardContent, { sx: { p: 4 }, children: [_jsx(Typography, { variant: "h5", fontWeight: 600, gutterBottom: true, children: "Welcome Back" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "Please sign in to your account to continue." }), (loginError || authError) && (_jsx(Alert, { severity: "error", sx: { mb: 2.5 }, children: loginError || authError })), _jsxs("form", { onSubmit: formik.handleSubmit, noValidate: true, children: [_jsx(TextField, { fullWidth: true, id: "email", name: "email", label: "Email Address", type: "email", autoComplete: "email", autoFocus: true, margin: "normal", value: formik.values.email, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.email && Boolean(formik.errors.email), helperText: formik.touched.email && formik.errors.email, disabled: isLoading, InputProps: {
                                                    sx: { borderRadius: 2 },
                                                } }), _jsx(TextField, { fullWidth: true, id: "password", name: "password", label: "Password", type: showPassword ? 'text' : 'password', autoComplete: "current-password", margin: "normal", value: formik.values.password, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.password && Boolean(formik.errors.password), helperText: formik.touched.password && formik.errors.password, disabled: isLoading, InputProps: {
                                                    sx: { borderRadius: 2 },
                                                    endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { "aria-label": "toggle password visibility", onClick: handleClickShowPassword, edge: "end", children: showPassword ? _jsx(VisibilityOff, {}) : _jsx(Visibility, {}) }) })),
                                                } }), _jsxs(Box, { sx: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    mt: 1.5,
                                                    mb: 2.5,
                                                }, children: [_jsx(FormControlLabel, { control: _jsx(Checkbox, { id: "rememberMe", name: "rememberMe", checked: formik.values.rememberMe, onChange: formik.handleChange, color: "primary", size: "small" }), label: "Remember me", componentsProps: {
                                                            typography: { variant: 'body2' },
                                                        } }), _jsx(Link, { to: "/forgot-password", style: {
                                                            color: 'inherit',
                                                            textDecoration: 'none',
                                                            fontSize: '0.875rem',
                                                        }, children: _jsx(Typography, { variant: "body2", color: "primary", sx: {
                                                                cursor: 'pointer',
                                                                '&:hover': { textDecoration: 'underline' },
                                                            }, children: "Forgot password?" }) })] }), _jsx(Button, { fullWidth: true, type: "submit", variant: "contained", size: "large", disabled: isLoading || !formik.isValid, startIcon: isLoading ? (_jsx(CircularProgress, { size: 20, color: "inherit" })) : (_jsx(LoginIcon, {})), sx: {
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    fontWeight: 600,
                                                }, children: isLoading ? 'Signing in...' : 'Sign In' })] })] }) })] }) })] }));
}
