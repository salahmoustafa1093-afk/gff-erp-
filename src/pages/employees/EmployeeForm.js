import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Grid, TextField, MenuItem, Autocomplete, Tabs, Tab, Typography, Divider, Paper, IconButton, InputAdornment } from '@mui/material';
import { Close, Calculate } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const TabPanel = ({ children, value, index }) => (value === index ? _jsx(Box, { sx: { py: 2 }, children: children }) : null);
const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required').max(100),
    lastName: Yup.string().required('Last name is required').max(100),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().required('Phone is required').matches(/^[+]?[\d\s-()]+$/, 'Invalid phone number'),
    nationalId: Yup.string().required('National ID is required'),
    dateOfBirth: Yup.date().required('Date of birth is required').max(new Date(), 'Cannot be in the future'),
    gender: Yup.string().required('Gender is required'),
    maritalStatus: Yup.string().required('Marital status is required'),
    employeeNumber: Yup.string().required('Employee number is required'),
    hireDate: Yup.date().required('Hire date is required'),
    department: Yup.string().required('Department is required'),
    jobTitle: Yup.string().required('Job title is required'),
    employmentType: Yup.string().required('Employment type is required'),
    status: Yup.string().required('Status is required'),
    branch: Yup.string().required('Branch is required'),
    basicSalary: Yup.number().required('Basic salary is required').min(0, 'Must be positive'),
    housingAllowance: Yup.number().min(0),
    transportAllowance: Yup.number().min(0),
    otherAllowances: Yup.number().min(0),
    currency: Yup.string().required('Currency is required'),
    bankName: Yup.string(),
    accountNumber: Yup.string(),
    iban: Yup.string(),
    emergencyContactName: Yup.string(),
    emergencyContactPhone: Yup.string(),
    emergencyContactRelationship: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    country: Yup.string(),
});
const EmployeeForm = ({ employeeId, onClose }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState(0);
    const [salaryPreview, setSalaryPreview] = useState(false);
    const { data: existingEmployee, isLoading: loadingEmployee } = useQuery({
        queryKey: ['employee', employeeId],
        queryFn: () => employeeId ? apiService.getEmployee(employeeId) : null,
        enabled: !!employeeId,
    });
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => apiService.getDepartments(),
    });
    const { data: jobTitles } = useQuery({
        queryKey: ['job-titles'],
        queryFn: () => apiService.getJobTitles(),
    });
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: () => apiService.getBranches(),
    });
    const { data: supervisors } = useQuery({
        queryKey: ['supervisors'],
        queryFn: () => apiService.getSupervisors(),
    });
    const mutation = useMutation({
        mutationFn: (values) => employeeId ? apiService.updateEmployee(employeeId, values) : apiService.createEmployee(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            if (employeeId) {
                queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
            }
            onClose();
        },
    });
    const formik = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            nationalId: '',
            dateOfBirth: null,
            gender: 'MALE',
            maritalStatus: 'SINGLE',
            employeeNumber: '',
            hireDate: new Date(),
            department: '',
            jobTitle: '',
            employmentType: 'FULL_TIME',
            status: 'ACTIVE',
            branch: '',
            supervisorId: '',
            basicSalary: 0,
            housingAllowance: 0,
            transportAllowance: 0,
            otherAllowances: 0,
            currency: 'USD',
            bankName: '',
            accountNumber: '',
            iban: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            emergencyContactRelationship: '',
            address: '',
            city: '',
            country: '',
        },
        validationSchema,
        onSubmit: (values) => {
            const payload = {
                ...values,
                dateOfBirth: values.dateOfBirth?.toISOString(),
                hireDate: values.hireDate?.toISOString(),
            };
            mutation.mutate(payload);
        },
    });
    useEffect(() => {
        if (existingEmployee) {
            formik.setValues({
                firstName: existingEmployee.firstName || '',
                lastName: existingEmployee.lastName || '',
                email: existingEmployee.email || '',
                phone: existingEmployee.phone || '',
                nationalId: existingEmployee.nationalId || '',
                dateOfBirth: existingEmployee.dateOfBirth ? new Date(existingEmployee.dateOfBirth) : null,
                gender: existingEmployee.gender || 'MALE',
                maritalStatus: existingEmployee.maritalStatus || 'SINGLE',
                employeeNumber: existingEmployee.employeeNumber || '',
                hireDate: existingEmployee.hireDate ? new Date(existingEmployee.hireDate) : new Date(),
                department: existingEmployee.department || '',
                jobTitle: existingEmployee.jobTitle || '',
                employmentType: existingEmployee.employmentType || 'FULL_TIME',
                status: existingEmployee.status || 'ACTIVE',
                branch: existingEmployee.branch || '',
                supervisorId: existingEmployee.supervisorId || '',
                basicSalary: existingEmployee.basicSalary || 0,
                housingAllowance: existingEmployee.housingAllowance || 0,
                transportAllowance: existingEmployee.transportAllowance || 0,
                otherAllowances: existingEmployee.otherAllowances || 0,
                currency: existingEmployee.currency || 'USD',
                bankName: existingEmployee.bankName || '',
                accountNumber: existingEmployee.accountNumber || '',
                iban: existingEmployee.iban || '',
                emergencyContactName: existingEmployee.emergencyContactName || '',
                emergencyContactPhone: existingEmployee.emergencyContactPhone || '',
                emergencyContactRelationship: existingEmployee.emergencyContactRelationship || '',
                address: existingEmployee.address || '',
                city: existingEmployee.city || '',
                country: existingEmployee.country || '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingEmployee]);
    const totalSalary = (Number(formik.values.basicSalary) || 0) +
        (Number(formik.values.housingAllowance) || 0) +
        (Number(formik.values.transportAllowance) || 0) +
        (Number(formik.values.otherAllowances) || 0);
    const hasErrors = (fields) => fields.some((f) => !!formik.errors[f] && formik.touched[f]);
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsx(DialogTitle, { children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "h6", children: employeeId ? 'Edit Employee' : 'Create New Employee' }), _jsx(IconButton, { onClick: onClose, size: "small", children: _jsx(Close, {}) })] }) }), _jsxs("form", { onSubmit: formik.handleSubmit, children: [_jsxs(DialogContent, { dividers: true, sx: { p: 0 }, children: [_jsxs(Tabs, { value: activeTab, onChange: (_, v) => setActiveTab(v), variant: "scrollable", scrollButtons: "auto", sx: { px: 2, borderBottom: 1, borderColor: 'divider' }, children: [_jsx(Tab, { label: "Personal Info", sx: { color: hasErrors(['firstName', 'lastName', 'email', 'phone', 'nationalId', 'dateOfBirth', 'gender', 'maritalStatus']) ? 'error.main' : undefined } }), _jsx(Tab, { label: "Employment", sx: { color: hasErrors(['employeeNumber', 'hireDate', 'department', 'jobTitle', 'employmentType', 'status', 'branch']) ? 'error.main' : undefined } }), _jsx(Tab, { label: "Compensation" }), _jsx(Tab, { label: "Banking" }), _jsx(Tab, { label: "Emergency Contact" }), _jsx(Tab, { label: "Address" })] }), _jsxs(Box, { sx: { px: 3, py: 1 }, children: [_jsx(TabPanel, { value: activeTab, index: 0, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "First Name", name: "firstName", value: formik.values.firstName, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.firstName && Boolean(formik.errors.firstName), helperText: formik.touched.firstName && formik.errors.firstName }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Last Name", name: "lastName", value: formik.values.lastName, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.lastName && Boolean(formik.errors.lastName), helperText: formik.touched.lastName && formik.errors.lastName }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Email", name: "email", type: "email", value: formik.values.email, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.email && Boolean(formik.errors.email), helperText: formik.touched.email && formik.errors.email }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Phone", name: "phone", value: formik.values.phone, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.phone && Boolean(formik.errors.phone), helperText: formik.touched.phone && formik.errors.phone }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "National ID", name: "nationalId", value: formik.values.nationalId, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.nationalId && Boolean(formik.errors.nationalId), helperText: formik.touched.nationalId && formik.errors.nationalId }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Date of Birth", value: formik.values.dateOfBirth, onChange: (val) => formik.setFieldValue('dateOfBirth', val), slotProps: {
                                                            textField: {
                                                                fullWidth: true,
                                                                size: 'small',
                                                                error: formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth),
                                                                helperText: formik.touched.dateOfBirth && typeof formik.errors.dateOfBirth === 'string' ? formik.errors.dateOfBirth : '',
                                                            }
                                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Gender", name: "gender", value: formik.values.gender, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.gender && Boolean(formik.errors.gender), helperText: formik.touched.gender && formik.errors.gender, children: [_jsx(MenuItem, { value: "MALE", children: "Male" }), _jsx(MenuItem, { value: "FEMALE", children: "Female" }), _jsx(MenuItem, { value: "OTHER", children: "Other" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Marital Status", name: "maritalStatus", value: formik.values.maritalStatus, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.maritalStatus && Boolean(formik.errors.maritalStatus), helperText: formik.touched.maritalStatus && formik.errors.maritalStatus, children: [_jsx(MenuItem, { value: "SINGLE", children: "Single" }), _jsx(MenuItem, { value: "MARRIED", children: "Married" }), _jsx(MenuItem, { value: "DIVORCED", children: "Divorced" }), _jsx(MenuItem, { value: "WIDOWED", children: "Widowed" })] }) })] }) }), _jsx(TabPanel, { value: activeTab, index: 1, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Employee Number", name: "employeeNumber", value: formik.values.employeeNumber, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.employeeNumber && Boolean(formik.errors.employeeNumber), helperText: formik.touched.employeeNumber && formik.errors.employeeNumber }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Hire Date", value: formik.values.hireDate, onChange: (val) => formik.setFieldValue('hireDate', val), slotProps: {
                                                            textField: {
                                                                fullWidth: true,
                                                                size: 'small',
                                                                error: formik.touched.hireDate && Boolean(formik.errors.hireDate),
                                                                helperText: formik.touched.hireDate && typeof formik.errors.hireDate === 'string' ? formik.errors.hireDate : '',
                                                            }
                                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", select: true, label: "Department", name: "department", value: formik.values.department, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.department && Boolean(formik.errors.department), helperText: formik.touched.department && formik.errors.department, children: (departments || []).map((d) => (_jsx(MenuItem, { value: d, children: d }, d))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", select: true, label: "Job Title", name: "jobTitle", value: formik.values.jobTitle, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.jobTitle && Boolean(formik.errors.jobTitle), helperText: formik.touched.jobTitle && formik.errors.jobTitle, children: (jobTitles || []).map((j) => (_jsx(MenuItem, { value: j, children: j }, j))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Employment Type", name: "employmentType", value: formik.values.employmentType, onChange: formik.handleChange, children: [_jsx(MenuItem, { value: "FULL_TIME", children: "Full Time" }), _jsx(MenuItem, { value: "PART_TIME", children: "Part Time" }), _jsx(MenuItem, { value: "CONTRACT", children: "Contract" }), _jsx(MenuItem, { value: "INTERN", children: "Intern" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Status", name: "status", value: formik.values.status, onChange: formik.handleChange, children: [_jsx(MenuItem, { value: "ACTIVE", children: "Active" }), _jsx(MenuItem, { value: "INACTIVE", children: "Inactive" }), _jsx(MenuItem, { value: "ON_LEAVE", children: "On Leave" }), _jsx(MenuItem, { value: "SUSPENDED", children: "Suspended" }), _jsx(MenuItem, { value: "TERMINATED", children: "Terminated" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", select: true, label: "Branch", name: "branch", value: formik.values.branch, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.branch && Boolean(formik.errors.branch), helperText: formik.touched.branch && formik.errors.branch, children: (branches || []).map((b) => (_jsx(MenuItem, { value: b, children: b }, b))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Autocomplete, { options: supervisors || [], getOptionLabel: (opt) => opt.name, value: (supervisors || []).find((s) => s.id === formik.values.supervisorId) || null, onChange: (_, val) => formik.setFieldValue('supervisorId', val?.id || ''), renderInput: (params) => (_jsx(TextField, { ...params, size: "small", label: "Supervisor", fullWidth: true })) }) })] }) }), _jsx(TabPanel, { value: activeTab, index: 2, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Currency", name: "currency", value: formik.values.currency, onChange: formik.handleChange, children: [_jsx(MenuItem, { value: "USD", children: "USD" }), _jsx(MenuItem, { value: "EUR", children: "EUR" }), _jsx(MenuItem, { value: "GBP", children: "GBP" }), _jsx(MenuItem, { value: "AED", children: "AED" }), _jsx(MenuItem, { value: "SAR", children: "SAR" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 } }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Basic Salary", name: "basicSalary", type: "number", value: formik.values.basicSalary, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.basicSalary && Boolean(formik.errors.basicSalary), helperText: formik.touched.basicSalary && formik.errors.basicSalary, slotProps: {
                                                            input: {
                                                                startAdornment: _jsx(InputAdornment, { position: "start", children: formik.values.currency }),
                                                            }
                                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Housing Allowance", name: "housingAllowance", type: "number", value: formik.values.housingAllowance, onChange: formik.handleChange, slotProps: {
                                                            input: {
                                                                startAdornment: _jsx(InputAdornment, { position: "start", children: formik.values.currency }),
                                                            }
                                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Transport Allowance", name: "transportAllowance", type: "number", value: formik.values.transportAllowance, onChange: formik.handleChange, slotProps: {
                                                            input: {
                                                                startAdornment: _jsx(InputAdornment, { position: "start", children: formik.values.currency }),
                                                            }
                                                        } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Other Allowances", name: "otherAllowances", type: "number", value: formik.values.otherAllowances, onChange: formik.handleChange, slotProps: {
                                                            input: {
                                                                startAdornment: _jsx(InputAdornment, { position: "start", children: formik.values.currency }),
                                                            }
                                                        } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsxs(Button, { variant: "outlined", size: "small", startIcon: _jsx(Calculate, {}), onClick: () => setSalaryPreview(!salaryPreview), children: [salaryPreview ? 'Hide' : 'Show', " Salary Preview"] }) }), salaryPreview && (_jsx(Grid, { size: { xs: 12 }, children: _jsxs(Paper, { variant: "outlined", sx: { p: 2, bgcolor: 'grey.50' }, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Salary Breakdown" }), _jsxs(Grid, { container: true, spacing: 1, children: [_jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: "Basic Salary:" }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", fontWeight: 600, children: Number(formik.values.basicSalary).toLocaleString() }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: "Housing:" }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: Number(formik.values.housingAllowance).toLocaleString() }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: "Transport:" }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: Number(formik.values.transportAllowance).toLocaleString() }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: "Other:" }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "body2", children: Number(formik.values.otherAllowances).toLocaleString() }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Divider, { sx: { my: 1 } }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsx(Typography, { variant: "subtitle2", children: "Total Package:" }) }), _jsx(Grid, { size: { xs: 6 }, children: _jsxs(Typography, { variant: "subtitle2", color: "primary", children: [totalSalary.toLocaleString(), " ", formik.values.currency] }) })] })] }) }))] }) }), _jsx(TabPanel, { value: activeTab, index: 3, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Bank Name", name: "bankName", value: formik.values.bankName, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Account Number", name: "accountNumber", value: formik.values.accountNumber, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "IBAN", name: "iban", value: formik.values.iban, onChange: formik.handleChange }) })] }) }), _jsx(TabPanel, { value: activeTab, index: 4, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Contact Name", name: "emergencyContactName", value: formik.values.emergencyContactName, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Contact Phone", name: "emergencyContactPhone", value: formik.values.emergencyContactPhone, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Relationship", name: "emergencyContactRelationship", value: formik.values.emergencyContactRelationship, onChange: formik.handleChange }) })] }) }), _jsx(TabPanel, { value: activeTab, index: 5, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Address", name: "address", multiline: true, rows: 3, value: formik.values.address, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "City", name: "city", value: formik.values.city, onChange: formik.handleChange }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Country", name: "country", value: formik.values.country, onChange: formik.handleChange }) })] }) })] })] }), _jsxs(DialogActions, { sx: { px: 3, py: 2 }, children: [_jsx(Button, { onClick: onClose, variant: "outlined", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: formik.isSubmitting || mutation.isPending, children: mutation.isPending ? 'Saving...' : employeeId ? 'Update Employee' : 'Create Employee' })] })] })] }));
};
export default EmployeeForm;
