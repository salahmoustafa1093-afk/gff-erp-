import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Box, Typography, Card, CardContent, IconButton, Paper, Chip, Grid, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { ChevronLeft, ChevronRight, Today, EventNote } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, subMonths, addMonths } from 'date-fns';
import { apiService } from '../../services/api';
const statusColors = {
    PRESENT: '#2e7d32',
    ABSENT: '#d32f2f',
    LATE: '#ed6c02',
    HALF_DAY: '#fbc02d',
    ON_LEAVE: '#0288d1',
    HOLIDAY: '#9e9e9e',
};
const statusLabels = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    HALF_DAY: 'Half Day',
    ON_LEAVE: 'On Leave',
    HOLIDAY: 'Holiday',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AttendanceCalendar = () => {
    const queryClient = useQueryClient();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [editRecord, setEditRecord] = useState(null);
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['employee-monthly-attendance', selectedEmployee, month, year],
        queryFn: () => apiService.getEmployeeMonthlyAttendance(selectedEmployee, month, year),
        enabled: !!selectedEmployee,
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => apiService.updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-monthly-attendance'] });
            setEditRecord(null);
        },
    });
    const days = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);
    const firstDayOfWeek = getDay(startOfMonth(currentMonth));
    const attendanceMap = useMemo(() => {
        const map = new Map();
        (attendanceData || []).forEach((rec) => {
            map.set(rec.date, rec);
        });
        return map;
    }, [attendanceData]);
    const summary = useMemo(() => {
        const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, ON_LEAVE: 0, HOLIDAY: 0, workingHours: 0 };
        (attendanceData || []).forEach((rec) => {
            counts[rec.status] = (counts[rec.status] || 0) + 1;
            counts.workingHours += rec.workingHours || 0;
        });
        return counts;
    }, [attendanceData]);
    const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Attendance Calendar" }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Employee ID", value: selectedEmployee, onChange: (e) => setSelectedEmployee(e.target.value), placeholder: "Enter employee ID to view calendar" }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Select an employee to view their monthly attendance calendar" }) })] }) }) }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(IconButton, { onClick: goToPrevMonth, children: _jsx(ChevronLeft, {}) }), _jsx(Typography, { variant: "h5", fontWeight: 600, minWidth: 200, textAlign: "center", children: format(currentMonth, 'MMMM yyyy') }), _jsx(IconButton, { onClick: goToNextMonth, children: _jsx(ChevronRight, {}) })] }), _jsx(Button, { variant: "outlined", size: "small", startIcon: _jsx(Today, {}), onClick: goToToday, children: "Today" })] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 9 }, children: _jsxs(Paper, { variant: "outlined", children: [_jsx(Grid, { container: true, children: WEEKDAYS.map((day) => (_jsx(Grid, { size: { xs: true }, sx: { p: 1, textAlign: 'center', bgcolor: 'grey.50' }, children: _jsx(Typography, { variant: "caption", fontWeight: 600, color: "text.secondary", children: day }) }, day))) }), _jsxs(Grid, { container: true, children: [Array.from({ length: firstDayOfWeek }).map((_, i) => (_jsx(Grid, { size: { xs: true }, sx: { minHeight: 100, border: '1px solid', borderColor: 'divider', p: 0.5 } }, `empty-${i}`))), days.map((day) => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const record = attendanceMap.get(dateStr);
                                                const dayIsToday = isToday(day);
                                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                                return (_jsxs(Grid, { size: { xs: true }, onClick: () => record && setEditRecord(record), sx: {
                                                        minHeight: 100,
                                                        border: '1px solid',
                                                        borderColor: dayIsToday ? 'primary.main' : 'divider',
                                                        borderWidth: dayIsToday ? 2 : 1,
                                                        p: 0.5,
                                                        cursor: record ? 'pointer' : 'default',
                                                        bgcolor: dayIsToday ? 'primary.50' : 'background.paper',
                                                        opacity: isCurrentMonth ? 1 : 0.5,
                                                        '&:hover': record ? { bgcolor: 'action.hover' } : undefined,
                                                    }, children: [_jsx(Typography, { variant: "caption", fontWeight: dayIsToday ? 700 : 400, color: dayIsToday ? 'primary.main' : 'text.primary', children: format(day, 'd') }), record && (_jsx(Tooltip, { title: `${statusLabels[record.status]} - ${record.workingHours}h`, children: _jsx(Chip, { label: record.status, size: "small", sx: {
                                                                    mt: 0.5,
                                                                    width: '100%',
                                                                    height: 22,
                                                                    fontSize: '0.65rem',
                                                                    bgcolor: `${statusColors[record.status]}15`,
                                                                    color: statusColors[record.status],
                                                                    fontWeight: 600,
                                                                    border: `1px solid ${statusColors[record.status]}40`,
                                                                } }) })), record?.checkIn && (_jsxs(Typography, { variant: "caption", display: "block", color: "text.secondary", mt: 0.5, children: [record.checkIn, " - ", record.checkOut || '?'] }))] }, dateStr));
                                            })] })] }) }), _jsx(Grid, { size: { xs: 12, md: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Monthly Summary" }), isLoading ? (_jsx(Typography, { color: "text.secondary", children: "Select an employee to see summary" })) : (_jsxs(_Fragment, { children: [_jsx(Box, { mb: 2, children: Object.entries(statusColors).map(([status, color]) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Box, { width: 12, height: 12, borderRadius: "50%", bgcolor: color }), _jsx(Typography, { variant: "body2", children: statusLabels[status] })] }), _jsxs(Typography, { variant: "body2", fontWeight: 600, children: [summary[status] || 0, " days"] })] }, status))) }), _jsx(Divider, { sx: { my: 1.5 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: "Total Working Hours" }), _jsxs(Typography, { variant: "h5", fontWeight: 700, color: "primary", children: [summary.workingHours.toFixed(1), "h"] })] }), _jsxs(Box, { mt: 2, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: "Attendance Rate" }), _jsxs(Typography, { variant: "h5", fontWeight: 700, color: "success.main", children: [attendanceData?.length
                                                                    ? ((((summary.PRESENT || 0) + (summary.LATE || 0)) / attendanceData.length) * 100).toFixed(0)
                                                                    : 0, "%"] })] })] }))] }) }) })] }), _jsxs(Dialog, { open: !!editRecord, onClose: () => setEditRecord(null), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(EventNote, {}), "Edit Attendance - ", editRecord?.date] }) }), _jsx(DialogContent, { children: editRecord && (_jsxs(Grid, { container: true, spacing: 2, sx: { mt: 0.5 }, children: [_jsx(Grid, { size: { xs: 12 }, children: _jsx(Typography, { variant: "subtitle1", children: editRecord.employeeName }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsx(Select, { value: editRecord.status, label: "Status", onChange: (e) => setEditRecord({ ...editRecord, status: e.target.value }), children: Object.keys(statusLabels).map((s) => (_jsx(MenuItem, { value: s, children: s }, s))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Check In", value: editRecord.checkIn || '', onChange: (e) => setEditRecord({ ...editRecord, checkIn: e.target.value }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Check Out", value: editRecord.checkOut || '', onChange: (e) => setEditRecord({ ...editRecord, checkOut: e.target.value }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Working Hours", type: "number", value: editRecord.workingHours || 0, onChange: (e) => setEditRecord({ ...editRecord, workingHours: parseFloat(e.target.value) }) }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", multiline: true, rows: 2, value: editRecord.notes || '', onChange: (e) => setEditRecord({ ...editRecord, notes: e.target.value }) }) })] })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditRecord(null), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => editRecord && updateMutation.mutate({
                                        id: editRecord.id,
                                        data: {
                                            status: editRecord.status,
                                            checkIn: editRecord.checkIn,
                                            checkOut: editRecord.checkOut,
                                            workingHours: editRecord.workingHours,
                                            notes: editRecord.notes,
                                        },
                                    }), disabled: updateMutation.isPending, children: updateMutation.isPending ? 'Saving...' : 'Save' })] })] })] }) }));
};
export default AttendanceCalendar;
