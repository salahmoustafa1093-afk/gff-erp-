import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Avatar, Grid, Card, CardContent, Chip, Tabs, Tab, Button, IconButton, Divider, List, ListItem, ListItemText, Skeleton, Alert, Paper, Badge } from '@mui/material';
import { Edit, Print, Block, ArrowBack, CalendarMonth, AttachMoney, LocalAtm, BeachAccess, FolderOpen, Timeline, Email, Phone, LocationOn, Business, Person } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid } from '@mui/x-data-grid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { apiService } from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
const statusColors = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    TERMINATED: 'error',
    ON_LEAVE: 'info',
    SUSPENDED: 'warning',
};
const attendanceStatusColors = {
    PRESENT: '#2e7d32',
    ABSENT: '#d32f2f',
    LATE: '#ed6c02',
    HALF_DAY: '#fbc02d',
    ON_LEAVE: '#0288d1',
    HOLIDAY: '#9e9e9e',
};
const TabPanel = ({ children, value, index }) => (value === index ? _jsx(Box, { sx: { py: 3 }, children: children }) : null);
const InfoRow = ({ label, value }) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.75, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: value || '-' })] }));
const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState(0);
    const [leaveFormOpen, setLeaveFormOpen] = useState(false);
    const { data: employee, isLoading, error } = useQuery({
        queryKey: ['employee', id],
        queryFn: () => apiService.getEmployee(id),
        enabled: !!id,
    });
    const { data: leaveBalance } = useQuery({
        queryKey: ['leave-balance', id],
        queryFn: () => apiService.getLeaveBalance(id),
        enabled: !!id && activeTab === 3,
    });
    const { data: attendanceData } = useQuery({
        queryKey: ['employee-attendance', id],
        queryFn: () => apiService.getEmployeeMonthlyAttendance(id, new Date().getMonth() + 1, new Date().getFullYear()),
        enabled: !!id && activeTab === 1,
    });
    const { data: leaveRequests } = useQuery({
        queryKey: ['employee-leaves', id],
        queryFn: () => apiService.getLeaveRequests({ employeeId: id, limit: 100 }),
        enabled: !!id && activeTab === 3,
    });
    const deactivateMutation = useMutation({
        mutationFn: () => apiService.updateEmployee(id, { status: 'INACTIVE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee', id] }),
    });
    const leaveMutation = useMutation({
        mutationFn: (data) => apiService.createLeaveRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-leaves', id] });
            queryClient.invalidateQueries({ queryKey: ['leave-balance', id] });
            setLeaveFormOpen(false);
        },
    });
    const handlePrint = () => window.print();
    if (error) {
        return (_jsxs(Alert, { severity: "error", sx: { m: 3 }, children: ["Failed to load employee details. ", _jsx(Button, { onClick: () => navigate('/employees'), children: "Go Back" })] }));
    }
    const attendanceSummary = (attendanceData || []).reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(attendanceSummary).map(([name, value]) => ({ name, value }));
    const leaveFormik = useFormik({
        initialValues: {
            leaveType: 'ANNUAL',
            startDate: null,
            endDate: null,
            reason: '',
        },
        validationSchema: Yup.object({
            leaveType: Yup.string().required(),
            startDate: Yup.date().required(),
            endDate: Yup.date().required().min(Yup.ref('startDate'), 'Must be after start date'),
            reason: Yup.string().required('Reason is required'),
        }),
        onSubmit: (values) => {
            const days = values.startDate && values.endDate
                ? Math.ceil((values.endDate.getTime() - values.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                : 0;
            leaveMutation.mutate({
                employeeId: id,
                leaveType: values.leaveType,
                startDate: values.startDate?.toISOString(),
                endDate: values.endDate?.toISOString(),
                days,
                reason: values.reason,
            });
        },
    });
    const attendanceColumns = [
        { field: 'date', headerName: 'Date', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString() },
        { field: 'checkIn', headerName: 'Check In', width: 100 },
        { field: 'checkOut', headerName: 'Check Out', width: 100 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", sx: { bgcolor: attendanceStatusColors[params.value] + '20', color: attendanceStatusColors[params.value], fontWeight: 600 } })),
        },
        { field: 'workingHours', headerName: 'Hours', width: 80, type: 'number' },
        { field: 'overtime', headerName: 'OT', width: 60, type: 'number' },
        { field: 'notes', headerName: 'Notes', flex: 1 },
    ];
    const leaveColumns = [
        { field: 'leaveType', headerName: 'Type', width: 120 },
        { field: 'startDate', headerName: 'From', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString() },
        { field: 'endDate', headerName: 'To', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString() },
        { field: 'days', headerName: 'Days', width: 70, type: 'number' },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, color: params.value === 'APPROVED' ? 'success' : params.value === 'REJECTED' ? 'error' : 'warning', size: "small", variant: "outlined" })),
        },
        { field: 'reason', headerName: 'Reason', flex: 1 },
    ];
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(IconButton, { onClick: () => navigate('/employees'), children: _jsx(ArrowBack, {}) }), _jsx(Typography, { variant: "h4", fontWeight: 700, children: "Employee Profile" })] }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(Print, {}), onClick: handlePrint, size: "small", children: "Print" }), _jsx(Button, { variant: "outlined", color: "warning", startIcon: _jsx(Block, {}), onClick: () => deactivateMutation.mutate(), disabled: deactivateMutation.isPending, size: "small", children: "Deactivate" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Edit, {}), onClick: () => navigate(`/employees/edit/${id}`), children: "Edit" })] })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 'auto' }, children: isLoading ? (_jsx(Skeleton, { variant: "circular", width: 120, height: 120 })) : (_jsx(Badge, { overlap: "circular", anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, badgeContent: _jsx(Chip, { label: employee?.status, color: statusColors[employee?.status || ''] || 'default', size: "small", sx: { fontWeight: 600 } }), children: _jsxs(Avatar, { src: employee?.photoUrl, sx: { width: 120, height: 120, fontSize: 48, bgcolor: 'primary.main' }, children: [employee?.firstName?.[0], employee?.lastName?.[0]] }) })) }), _jsx(Grid, { size: { xs: 12, sm: true }, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { width: 300, height: 40 }), _jsx(Skeleton, { width: 200, height: 24 }), _jsx(Skeleton, { width: 250, height: 20 })] })) : (_jsxs(_Fragment, { children: [_jsxs(Typography, { variant: "h4", fontWeight: 700, children: [employee?.firstName, " ", employee?.lastName] }), _jsx(Typography, { variant: "h6", color: "text.secondary", fontWeight: 400, children: employee?.jobTitle }), _jsxs(Box, { display: "flex", gap: 2, mt: 1, flexWrap: "wrap", children: [_jsx(Chip, { icon: _jsx(Business, { fontSize: "small" }), label: employee?.department, size: "small", variant: "outlined" }), _jsx(Chip, { icon: _jsx(Email, { fontSize: "small" }), label: employee?.email, size: "small", variant: "outlined" }), _jsx(Chip, { icon: _jsx(Phone, { fontSize: "small" }), label: employee?.phone, size: "small", variant: "outlined" }), _jsx(Chip, { icon: _jsx(LocationOn, { fontSize: "small" }), label: employee?.branch, size: "small", variant: "outlined" })] })] })) })] }) }) }), _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: (_, v) => setActiveTab(v), variant: "scrollable", scrollButtons: "auto", children: [_jsx(Tab, { label: "Overview", icon: _jsx(Person, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Attendance", icon: _jsx(CalendarMonth, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Payroll", icon: _jsx(AttachMoney, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Leaves", icon: _jsx(BeachAccess, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Documents", icon: _jsx(FolderOpen, { fontSize: "small" }), iconPosition: "start" }), _jsx(Tab, { label: "Activity", icon: _jsx(Timeline, { fontSize: "small" }), iconPosition: "start" })] }), _jsxs(CardContent, { children: [_jsx(TabPanel, { value: activeTab, index: 0, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Basic Information" }), _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(InfoRow, { label: "Employee Number", value: employee?.employeeNumber }), _jsx(InfoRow, { label: "Full Name", value: `${employee?.firstName || ''} ${employee?.lastName || ''}` }), _jsx(InfoRow, { label: "Email", value: employee?.email }), _jsx(InfoRow, { label: "Phone", value: employee?.phone }), _jsx(InfoRow, { label: "National ID", value: employee?.nationalId }), _jsx(InfoRow, { label: "Date of Birth", value: employee?.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "Gender", value: employee?.gender }), _jsx(InfoRow, { label: "Marital Status", value: employee?.maritalStatus })] })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Employment Details" }), _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(InfoRow, { label: "Department", value: employee?.department }), _jsx(InfoRow, { label: "Job Title", value: employee?.jobTitle }), _jsx(InfoRow, { label: "Employment Type", value: employee?.employmentType }), _jsx(InfoRow, { label: "Hire Date", value: employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-' }), _jsx(InfoRow, { label: "Branch", value: employee?.branch }), _jsx(InfoRow, { label: "Supervisor", value: employee?.supervisorName || '-' }), _jsx(InfoRow, { label: "Status", value: _jsx(Chip, { label: employee?.status, color: statusColors[employee?.status || ''] || 'default', size: "small" }) })] })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Salary Summary" }), _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(InfoRow, { label: "Basic Salary", value: `${employee?.currency} ${(employee?.basicSalary || 0).toLocaleString()}` }), _jsx(InfoRow, { label: "Housing Allowance", value: `${employee?.currency} ${(employee?.housingAllowance || 0).toLocaleString()}` }), _jsx(InfoRow, { label: "Transport Allowance", value: `${employee?.currency} ${(employee?.transportAllowance || 0).toLocaleString()}` }), _jsx(InfoRow, { label: "Other Allowances", value: `${employee?.currency} ${(employee?.otherAllowances || 0).toLocaleString()}` }), _jsx(Divider, { sx: { my: 1 } }), _jsx(InfoRow, { label: "Total Package", value: _jsxs(Typography, { fontWeight: 700, color: "primary", children: [employee?.currency, " ", ((employee?.basicSalary || 0) + (employee?.housingAllowance || 0) + (employee?.transportAllowance || 0) + (employee?.otherAllowances || 0)).toLocaleString()] }) })] })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Contact Information" }), _jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(InfoRow, { label: "Address", value: employee?.address }), _jsx(InfoRow, { label: "City", value: employee?.city }), _jsx(InfoRow, { label: "Country", value: employee?.country }), _jsx(Divider, { sx: { my: 1 } }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Emergency Contact" }), _jsx(InfoRow, { label: "Name", value: employee?.emergencyContactName }), _jsx(InfoRow, { label: "Phone", value: employee?.emergencyContactPhone }), _jsx(InfoRow, { label: "Relationship", value: employee?.emergencyContactRelationship })] })] })] }) }), _jsx(TabPanel, { value: activeTab, index: 1, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(DataGrid, { rows: attendanceData || [], columns: attendanceColumns, loading: !attendanceData, pageSizeOptions: [25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, density: "compact", autoHeight: true }) }), _jsxs(Grid, { size: { xs: 12, md: 4 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Monthly Summary" }), _jsx(Paper, { variant: "outlined", sx: { p: 2, mb: 2 }, children: _jsx(Box, { height: 200, children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", outerRadius: 80, dataKey: "value", nameKey: "name", label: true, children: pieData.map((entry) => (_jsx(Cell, { fill: attendanceStatusColors[entry.name] || '#757575' }, entry.name))) }), _jsx(RechartsTooltip, {})] }) }) }) }), Object.entries(attendanceSummary).map(([status, count]) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.5, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Box, { width: 12, height: 12, borderRadius: "50%", bgcolor: attendanceStatusColors[status] }), _jsx(Typography, { variant: "body2", children: status })] }), _jsxs(Typography, { variant: "body2", fontWeight: 600, children: [count, " days"] })] }, status)))] })] }) }), _jsxs(TabPanel, { value: activeTab, index: 2, children: [_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Payroll history is linked to payroll periods. View detailed payslips from the Payroll module." }), _jsx(Button, { variant: "contained", startIcon: _jsx(LocalAtm, {}), onClick: () => navigate(`/payroll?employeeId=${id}`), sx: { mb: 2 }, children: "View Payroll History" }), _jsxs(Paper, { variant: "outlined", sx: { p: 3, textAlign: 'center' }, children: [_jsx(AttachMoney, { sx: { fontSize: 48, color: 'text.secondary', mb: 1 } }), _jsx(Typography, { color: "text.secondary", children: "Detailed payroll information available in the Payroll module" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", mt: 1, children: ["Current Salary: ", employee?.currency, " ", ((employee?.basicSalary || 0) + (employee?.housingAllowance || 0) + (employee?.transportAllowance || 0)).toLocaleString()] })] })] }), _jsxs(TabPanel, { value: activeTab, index: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "Leave Balance" }), _jsx(Button, { variant: "contained", startIcon: _jsx(BeachAccess, {}), onClick: () => setLeaveFormOpen(true), children: "Request Leave" })] }), _jsx(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: (leaveBalance || []).map((lb) => (_jsx(Grid, { size: { xs: 6, sm: 4, md: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: lb.leaveType }), _jsx(Typography, { variant: "h5", fontWeight: 700, color: "primary", children: lb.remainingDays }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["of ", lb.totalDays, " remaining"] })] }) }) }, lb.leaveType))) }), _jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Leave History" }), _jsx(DataGrid, { rows: leaveRequests?.data || [], columns: leaveColumns, loading: !leaveRequests, pageSizeOptions: [10, 25], initialState: { pagination: { paginationModel: { pageSize: 10 } } }, density: "compact", autoHeight: true }), _jsxs(Dialog, { open: leaveFormOpen, onClose: () => setLeaveFormOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Request Leave" }), _jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs("form", { onSubmit: leaveFormik.handleSubmit, children: [_jsx(DialogContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Leave Type", name: "leaveType", value: leaveFormik.values.leaveType, onChange: leaveFormik.handleChange, error: leaveFormik.touched.leaveType && Boolean(leaveFormik.errors.leaveType), children: [_jsx(MenuItem, { value: "ANNUAL", children: "Annual Leave" }), _jsx(MenuItem, { value: "SICK", children: "Sick Leave" }), _jsx(MenuItem, { value: "UNPAID", children: "Unpaid Leave" }), _jsx(MenuItem, { value: "EMERGENCY", children: "Emergency Leave" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Start Date", value: leaveFormik.values.startDate, onChange: (v) => leaveFormik.setFieldValue('startDate', v), slotProps: {
                                                                                textField: {
                                                                                    fullWidth: true,
                                                                                    size: 'small',
                                                                                    error: leaveFormik.touched.startDate && Boolean(leaveFormik.errors.startDate),
                                                                                    helperText: leaveFormik.touched.startDate && typeof leaveFormik.errors.startDate === 'string' ? leaveFormik.errors.startDate : '',
                                                                                }
                                                                            } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "End Date", value: leaveFormik.values.endDate, onChange: (v) => leaveFormik.setFieldValue('endDate', v), slotProps: {
                                                                                textField: {
                                                                                    fullWidth: true,
                                                                                    size: 'small',
                                                                                    error: leaveFormik.touched.endDate && Boolean(leaveFormik.errors.endDate),
                                                                                    helperText: leaveFormik.touched.endDate && typeof leaveFormik.errors.endDate === 'string' ? leaveFormik.errors.endDate : '',
                                                                                }
                                                                            } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, multiline: true, rows: 3, size: "small", label: "Reason", name: "reason", value: leaveFormik.values.reason, onChange: leaveFormik.handleChange, error: leaveFormik.touched.reason && Boolean(leaveFormik.errors.reason), helperText: leaveFormik.touched.reason && leaveFormik.errors.reason }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setLeaveFormOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: leaveMutation.isPending, children: leaveMutation.isPending ? 'Submitting...' : 'Submit Request' })] })] }) })] })] }), _jsx(TabPanel, { value: activeTab, index: 4, children: _jsxs(Paper, { variant: "outlined", sx: { p: 4, textAlign: 'center' }, children: [_jsx(FolderOpen, { sx: { fontSize: 48, color: 'text.secondary', mb: 2 } }), _jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "Document Management" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Upload and manage employee documents (contracts, IDs, certifications)" }), _jsxs(Button, { variant: "outlined", component: "label", children: ["Upload Document", _jsx("input", { type: "file", hidden: true })] }), _jsx(List, { sx: { mt: 3, textAlign: 'left', maxWidth: 500, mx: 'auto' }, children: ['Employment Contract', 'National ID Copy', 'Academic Certificates', 'Work Visa'].map((doc) => (_jsxs(ListItem, { divider: true, children: [_jsx(ListItemText, { primary: doc, secondary: "Not uploaded" }), _jsx(Button, { size: "small", variant: "outlined", children: "Upload" })] }, doc))) })] }) }), _jsx(TabPanel, { value: activeTab, index: 5, children: _jsx(Timeline, { children: [
                                        { label: 'Profile Created', date: employee?.createdAt },
                                        { label: 'Last Updated', date: employee?.updatedAt },
                                    ].map((activity, idx) => (_jsxs(Box, { sx: { display: 'flex', mb: 2 }, children: [_jsxs(Box, { sx: { mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx(Box, { sx: { width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' } }), idx < 1 && _jsx(Box, { sx: { width: 2, flex: 1, bgcolor: 'divider', my: 0.5 } })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: activity.label }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: activity.date ? new Date(activity.date).toLocaleString() : '-' })] })] }, idx))) }) })] })] })] }));
};
export default EmployeeDetail;
