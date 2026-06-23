import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Today, Edit, GroupWork, CheckCircle, Cancel, Warning, BeachAccess, Schedule } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const statusConfig = {
    PRESENT: { color: '#2e7d32', icon: _jsx(CheckCircle, { fontSize: "small" }), label: 'Present' },
    ABSENT: { color: '#d32f2f', icon: _jsx(Cancel, { fontSize: "small" }), label: 'Absent' },
    LATE: { color: '#ed6c02', icon: _jsx(Warning, { fontSize: "small" }), label: 'Late' },
    HALF_DAY: { color: '#fbc02d', icon: _jsx(Schedule, { fontSize: "small" }), label: 'Half Day' },
    ON_LEAVE: { color: '#0288d1', icon: _jsx(BeachAccess, { fontSize: "small" }), label: 'On Leave' },
    HOLIDAY: { color: '#9e9e9e', icon: _jsx(Today, { fontSize: "small" }), label: 'Holiday' },
};
const SummaryCard = ({ title, count, total, color, icon }) => (_jsx(Card, { variant: "outlined", sx: { height: '100%' }, children: _jsx(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } }, children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: title }), _jsx(Typography, { variant: "h4", fontWeight: 700, color: color, children: count }), total > 0 && (_jsxs(Typography, { variant: "caption", color: "text.secondary", children: [((count / total) * 100).toFixed(0), "% of total"] }))] }), _jsx(Box, { sx: { color, bgcolor: `${color}15`, borderRadius: 2, p: 1 }, children: icon })] }) }) }));
const AttendancePage = () => {
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [department, setDepartment] = useState('');
    const [branch, setBranch] = useState('');
    const [editRecord, setEditRecord] = useState(null);
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkStatus, setBulkStatus] = useState('PRESENT');
    const [selectedIds, setSelectedIds] = useState([]);
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    const { data: attendance, isLoading } = useQuery({
        queryKey: ['attendance', dateStr, department, branch],
        queryFn: () => apiService.getAttendance({ date: dateStr, department, branch, limit: 500 }),
        enabled: !!dateStr,
    });
    const { data: summary } = useQuery({
        queryKey: ['attendance-summary', dateStr, department, branch],
        queryFn: () => apiService.getAttendanceSummary({ date: dateStr, department, branch }),
        enabled: !!dateStr,
    });
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => apiService.getDepartments(),
    });
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: () => apiService.getBranches(),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => apiService.updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
            setEditRecord(null);
        },
    });
    const bulkMutation = useMutation({
        mutationFn: (data) => apiService.bulkAttendance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
            setBulkMode(false);
            setSelectedIds([]);
        },
    });
    const handleBulkApply = useCallback(() => {
        if (selectedIds.length === 0 || !dateStr)
            return;
        const payload = selectedIds.map((empId) => ({
            employeeIds: [empId],
            date: dateStr,
            status: bulkStatus,
        }));
        bulkMutation.mutate(payload);
    }, [selectedIds, dateStr, bulkStatus, bulkMutation]);
    const columns = [
        {
            field: 'employeeName',
            headerName: 'Employee',
            width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: params.row.employeeNumber })] })),
        },
        { field: 'department', headerName: 'Department', width: 140 },
        {
            field: 'checkIn',
            headerName: 'Check In',
            width: 100,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontFamily: "monospace", children: params.value || '-' })),
        },
        {
            field: 'checkOut',
            headerName: 'Check Out',
            width: 100,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontFamily: "monospace", children: params.value || '-' })),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => {
                const config = statusConfig[params.value] || statusConfig.HOLIDAY;
                return (_jsx(Chip, { icon: config.icon, label: params.value, size: "small", sx: {
                        bgcolor: `${config.color}15`,
                        color: config.color,
                        fontWeight: 600,
                        border: `1px solid ${config.color}30`,
                    }, onClick: () => !bulkMode && setEditRecord(params.row) }));
            },
        },
        {
            field: 'workingHours',
            headerName: 'Hours',
            width: 80,
            type: 'number',
            valueFormatter: (value) => value ? value.toFixed(1) : '-',
        },
        {
            field: 'overtime',
            headerName: 'OT',
            width: 60,
            type: 'number',
            valueFormatter: (value) => value ? value.toFixed(1) : '-',
        },
        { field: 'notes', headerName: 'Notes', flex: 1 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(Tooltip, { title: "Edit Status", children: _jsx(IconButton, { size: "small", onClick: () => setEditRecord(params.row), children: _jsx(Edit, { fontSize: "small" }) }) })),
        },
    ];
    const total = summary?.totalEmployees || 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Attendance Management" }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 6, sm: 4, md: true }, children: _jsx(SummaryCard, { title: "Present", count: summary?.present || 0, total: total, color: "#2e7d32", icon: _jsx(CheckCircle, {}) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: true }, children: _jsx(SummaryCard, { title: "Absent", count: summary?.absent || 0, total: total, color: "#d32f2f", icon: _jsx(Cancel, {}) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: true }, children: _jsx(SummaryCard, { title: "Late", count: summary?.late || 0, total: total, color: "#ed6c02", icon: _jsx(Warning, {}) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: true }, children: _jsx(SummaryCard, { title: "On Leave", count: summary?.onLeave || 0, total: total, color: "#0288d1", icon: _jsx(BeachAccess, {}) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: true }, children: _jsx(SummaryCard, { title: "Total", count: total, total: total, color: "#9c27b0", icon: _jsx(GroupWork, {}) }) })] }), _jsx(Card, { variant: "outlined", sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(DatePicker, { label: "Select Date", value: selectedDate, onChange: setSelectedDate, slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Department" }), _jsxs(Select, { value: department, label: "Department", onChange: (e) => setDepartment(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All Departments" }), (departments || []).map((d) => (_jsx(MenuItem, { value: d, children: d }, d)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Branch" }), _jsxs(Select, { value: branch, label: "Branch", onChange: (e) => setBranch(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All Branches" }), (branches || []).map((b) => (_jsx(MenuItem, { value: b, children: b }, b)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Button, { variant: bulkMode ? 'contained' : 'outlined', color: bulkMode ? 'secondary' : 'primary', startIcon: _jsx(GroupWork, {}), onClick: () => { setBulkMode(!bulkMode); setSelectedIds([]); }, fullWidth: true, children: bulkMode ? 'Cancel Bulk' : 'Bulk Entry' }) })] }), bulkMode && (_jsxs(Box, { mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1, display: "flex", gap: 2, alignItems: "center", children: [_jsxs(Typography, { variant: "body2", children: [selectedIds.length, " selected"] }), _jsxs(FormControl, { size: "small", sx: { minWidth: 150 }, children: [_jsx(InputLabel, { children: "Status" }), _jsx(Select, { value: bulkStatus, label: "Status", onChange: (e) => setBulkStatus(e.target.value), children: Object.keys(statusConfig).map((s) => (_jsx(MenuItem, { value: s, children: s }, s))) })] }), _jsx(Button, { variant: "contained", onClick: handleBulkApply, disabled: selectedIds.length === 0 || bulkMutation.isPending, children: "Apply" })] }))] }) }), _jsx(DataGrid, { rows: attendance?.data || [], columns: columns, loading: isLoading, pageSizeOptions: [25, 50, 100], initialState: { pagination: { paginationModel: { pageSize: 50 } } }, density: "compact", disableRowSelectionOnClick: !bulkMode, checkboxSelection: bulkMode, rowSelectionModel: selectedIds, onRowSelectionModelChange: (ids) => setSelectedIds(ids), sx: { height: 'calc(100vh - 420px)', minHeight: 400 } }), _jsxs(Dialog, { open: !!editRecord, onClose: () => setEditRecord(null), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Edit Attendance" }), _jsx(DialogContent, { children: editRecord && (_jsxs(Grid, { container: true, spacing: 2, sx: { mt: 0.5 }, children: [_jsxs(Grid, { size: { xs: 12 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: editRecord.employeeName }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [editRecord.date, " | ", editRecord.department] })] }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsx(Select, { value: editRecord.status, label: "Status", onChange: (e) => setEditRecord({ ...editRecord, status: e.target.value }), children: Object.keys(statusConfig).map((s) => (_jsx(MenuItem, { value: s, children: s }, s))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Check In", value: editRecord.checkIn || '', onChange: (e) => setEditRecord({ ...editRecord, checkIn: e.target.value }), placeholder: "HH:MM" }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Check Out", value: editRecord.checkOut || '', onChange: (e) => setEditRecord({ ...editRecord, checkOut: e.target.value }), placeholder: "HH:MM" }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Working Hours", type: "number", value: editRecord.workingHours || 0, onChange: (e) => setEditRecord({ ...editRecord, workingHours: parseFloat(e.target.value) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Overtime", type: "number", value: editRecord.overtime || 0, onChange: (e) => setEditRecord({ ...editRecord, overtime: parseFloat(e.target.value) }) }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", multiline: true, rows: 2, value: editRecord.notes || '', onChange: (e) => setEditRecord({ ...editRecord, notes: e.target.value }) }) })] })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditRecord(null), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => editRecord && updateMutation.mutate({
                                        id: editRecord.id,
                                        data: {
                                            status: editRecord.status,
                                            checkIn: editRecord.checkIn,
                                            checkOut: editRecord.checkOut,
                                            workingHours: editRecord.workingHours,
                                            overtime: editRecord.overtime,
                                            notes: editRecord.notes,
                                        },
                                    }), disabled: updateMutation.isPending, children: updateMutation.isPending ? 'Saving...' : 'Save Changes' })] })] })] }) }));
};
export default AttendancePage;
