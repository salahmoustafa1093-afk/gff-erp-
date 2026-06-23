import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Button, Chip, Skeleton, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDownload, Assessment } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { subMonths } from 'date-fns';
import { apiService } from '../../services/api';
const REPORT_TYPES = [
    { value: 'MONTHLY_SUMMARY', label: 'Monthly Summary' },
    { value: 'LATE_ARRIVALS', label: 'Late Arrivals' },
    { value: 'ABSENCES', label: 'Absences' },
    { value: 'OVERTIME', label: 'Overtime' },
];
const COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#9c27b0', '#757575', '#fbc02d'];
const AttendanceReportsPage = () => {
    const [reportType, setReportType] = useState('MONTHLY_SUMMARY');
    const [department, setDepartment] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [generated, setGenerated] = useState(false);
    const startStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endStr = endDate ? endDate.toISOString().split('T')[0] : '';
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => apiService.getDepartments(),
    });
    const { data: reportData, isLoading, refetch } = useQuery({
        queryKey: ['attendance-report', reportType, department, employeeId, startStr, endStr, generated],
        queryFn: () => apiService.getAttendance({
            department,
            employeeId,
            startDate: startStr,
            endDate: endStr,
            limit: 2000,
        }),
        enabled: generated,
    });
    const handleGenerate = useCallback(() => {
        setGenerated(true);
        refetch();
    }, [refetch]);
    const handleExport = useCallback(() => {
        const csv = [
            ['Employee', 'Department', 'Date', 'Status', 'Check In', 'Check Out', 'Hours', 'Overtime', 'Notes'].join(','),
            ...(reportData?.data || []).map((row) => [row.employeeName, row.department, row.date, row.status, row.checkIn, row.checkOut, row.workingHours, row.overtime, row.notes].join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-report-${reportType}-${startStr}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }, [reportData, reportType, startStr]);
    const filteredData = React.useMemo(() => {
        const records = reportData?.data || [];
        switch (reportType) {
            case 'LATE_ARRIVALS':
                return records.filter((r) => r.status === 'LATE');
            case 'ABSENCES':
                return records.filter((r) => r.status === 'ABSENT');
            case 'OVERTIME':
                return records.filter((r) => (r.overtime || 0) > 0);
            default:
                return records;
        }
    }, [reportData, reportType]);
    const summaryStats = React.useMemo(() => {
        const records = filteredData;
        const total = records.length;
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        const onLeave = records.filter((r) => r.status === 'ON_LEAVE').length;
        const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;
        const totalOvertime = records.reduce((sum, r) => sum + (r.overtime || 0), 0);
        const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
        const deptBreakdown = records.reduce((acc, r) => {
            acc[r.department] = (acc[r.department] || 0) + 1;
            return acc;
        }, {});
        const pieData = Object.entries(deptBreakdown).map(([name, value]) => ({ name, value }));
        return {
            total, present, absent, late, onLeave, halfDay, totalOvertime, totalHours,
            pieData,
            statusBreakdown: [
                { name: 'Present', value: present },
                { name: 'Absent', value: absent },
                { name: 'Late', value: late },
                { name: 'On Leave', value: onLeave },
                { name: 'Half Day', value: halfDay },
            ].filter((d) => d.value > 0),
        };
    }, [filteredData]);
    const columns = [
        {
            field: 'employeeName',
            headerName: 'Employee',
            width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: params.row.employeeNumber })] })),
        },
        { field: 'department', headerName: 'Department', width: 140 },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (value) => new Date(value).toLocaleDateString(),
        },
        { field: 'checkIn', headerName: 'Check In', width: 90 },
        { field: 'checkOut', headerName: 'Check Out', width: 90 },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", color: params.value === 'PRESENT' ? 'success' :
                    params.value === 'ABSENT' ? 'error' :
                        params.value === 'LATE' ? 'warning' :
                            params.value === 'ON_LEAVE' ? 'info' : 'default', variant: "outlined" })),
        },
        { field: 'workingHours', headerName: 'Hours', width: 80, type: 'number' },
        { field: 'overtime', headerName: 'OT', width: 60, type: 'number' },
        { field: 'notes', headerName: 'Notes', flex: 1 },
    ];
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Attendance Reports" }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Report Type" }), _jsx(Select, { value: reportType, label: "Report Type", onChange: (e) => { setReportType(e.target.value); setGenerated(false); }, children: REPORT_TYPES.map((t) => (_jsx(MenuItem, { value: t.value, children: t.label }, t.value))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Department" }), _jsxs(Select, { value: department, label: "Department", onChange: (e) => { setDepartment(e.target.value); setGenerated(false); }, children: [_jsx(MenuItem, { value: "", children: "All" }), (departments || []).map((d) => (_jsx(MenuItem, { value: d, children: d }, d)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 2 }, children: _jsx(DatePicker, { label: "Start Date", value: startDate, onChange: (v) => { setStartDate(v); setGenerated(false); }, slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 2 }, children: _jsx(DatePicker, { label: "End Date", value: endDate, onChange: (v) => { setEndDate(v); setGenerated(false); }, slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 2 }, children: _jsx(Button, { variant: "contained", fullWidth: true, startIcon: _jsx(Assessment, {}), onClick: handleGenerate, children: "Generate" }) })] }) }) }), !generated && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Select report parameters and click Generate to view the report." })), generated && (_jsxs(_Fragment, { children: [_jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Records" }), _jsx(Typography, { variant: "h4", fontWeight: 700, children: isLoading ? _jsx(Skeleton, { width: 60, sx: { mx: 'auto' } }) : summaryStats.total })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: reportType === 'OVERTIME' ? 'Total OT Hours' : 'Present / On Time' }), _jsx(Typography, { variant: "h4", fontWeight: 700, color: "success.main", children: isLoading ? _jsx(Skeleton, { width: 60, sx: { mx: 'auto' } }) :
                                                            reportType === 'OVERTIME' ? summaryStats.totalOvertime.toFixed(1) : summaryStats.present })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: reportType === 'OVERTIME' ? 'Total Hours' : 'Absences / Late' }), _jsx(Typography, { variant: "h4", fontWeight: 700, color: "error.main", children: isLoading ? _jsx(Skeleton, { width: 60, sx: { mx: 'auto' } }) :
                                                            reportType === 'OVERTIME' ? summaryStats.totalHours.toFixed(1) :
                                                                reportType === 'LATE_ARRIVALS' ? summaryStats.late : summaryStats.absent })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Attendance Rate" }), _jsx(Typography, { variant: "h4", fontWeight: 700, color: "primary", children: isLoading ? _jsx(Skeleton, { width: 60, sx: { mx: 'auto' } }) :
                                                            summaryStats.total > 0
                                                                ? `${(((summaryStats.present + summaryStats.late) / summaryStats.total) * 100).toFixed(0)}%`
                                                                : '0%' })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Status Distribution" }), _jsx(Box, { height: 250, children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: summaryStats.statusBreakdown, cx: "50%", cy: "50%", outerRadius: 90, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: summaryStats.statusBreakdown.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, index))) }), _jsx(RechartsTooltip, {})] }) }) })] }) }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Department Breakdown" }), _jsx(Box, { height: 250, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: summaryStats.pieData, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category", width: 100 }), _jsx(RechartsTooltip, {}), _jsx(Bar, { dataKey: "value", fill: "#2e7d32", radius: [0, 4, 4, 0] })] }) }) })] }) }) })] }), _jsxs(Card, { variant: "outlined", children: [_jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600 }), "\"> Report Details"] }), _jsx(Button, { variant: "outlined", size: "small", startIcon: _jsx(FileDownload, {}), onClick: handleExport, children: "Export CSV" })] }), _jsx(DataGrid, { rows: filteredData, columns: columns, loading: isLoading, pageSizeOptions: [25, 50, 100], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true })] })] })), "Card>"] }), ")}"] }));
};
LocalizationProvider >
;
;
;
export default AttendanceReportsPage;
