import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Button, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileDownload, Assessment } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const REPORT_TYPES = [
    { value: 'DEPARTMENT_SUMMARY', label: 'Department Summary' },
    { value: 'SALARY_DISTRIBUTION', label: 'Salary Distribution' },
    { value: 'DEDUCTION_ANALYSIS', label: 'Deduction Analysis' },
    { value: 'EMPLOYEE_COMPARISON', label: 'Employee Comparison' },
];
const COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#9c27b0', '#757575', '#fbc02d', '#795548'];
const PayrollReportsPage = () => {
    const [reportType, setReportType] = useState('DEPARTMENT_SUMMARY');
    const [periodId, setPeriodId] = useState('');
    const [department, setDepartment] = useState('');
    const [generated, setGenerated] = useState(false);
    const { data: periods } = useQuery({
        queryKey: ['payroll-periods'],
        queryFn: () => apiService.getPayrollPeriods(),
    });
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => apiService.getDepartments(),
    });
    const { data: payrollData, isLoading } = useQuery({
        queryKey: ['payroll-report-data', periodId, department, generated],
        queryFn: () => apiService.getEmployeePayrolls(periodId),
        enabled: !!periodId && generated,
    });
    const filteredData = React.useMemo(() => {
        const data = (payrollData || []).filter((r) => r.included);
        if (department)
            return data.filter((r) => r.department === department);
        return data;
    }, [payrollData, department]);
    const handleGenerate = useCallback(() => setGenerated(true), []);
    const handleExport = useCallback(() => {
        const headers = ['Employee', 'Department', 'Basic Salary', 'Allowances', 'Overtime', 'Bonuses', 'Gross', 'Social Ins.', 'Tax', 'Loan', 'Other Ded.', 'Total Ded.', 'Net Salary'];
        const csv = [
            headers.join(','),
            ...filteredData.map((row) => [
                row.employeeName, row.department, row.basicSalary,
                row.housingAllowance + row.transportAllowance + row.otherAllowances,
                row.overtime, row.bonuses, row.grossSalary,
                row.socialInsurance, row.tax, row.loanDeduction,
                row.otherDeductions, row.totalDeductions, row.netSalary,
            ].join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payroll-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }, [filteredData, reportType]);
    const reportStats = React.useMemo(() => {
        const data = filteredData;
        const totalEmployees = data.length;
        const totalBasic = data.reduce((s, r) => s + r.basicSalary, 0);
        const totalAllowances = data.reduce((s, r) => s + r.housingAllowance + r.transportAllowance + r.otherAllowances, 0);
        const totalOvertime = data.reduce((s, r) => s + r.overtime, 0);
        const totalBonuses = data.reduce((s, r) => s + r.bonuses, 0);
        const totalGross = data.reduce((s, r) => s + r.grossSalary, 0);
        const totalDeductions = data.reduce((s, r) => s + r.totalDeductions, 0);
        const totalNet = data.reduce((s, r) => s + r.netSalary, 0);
        const deptSummary = data.reduce((acc, r) => {
            if (!acc[r.department]) {
                acc[r.department] = { department: r.department, employeeCount: 0, totalBasic: 0, totalNet: 0, totalGross: 0, totalDeductions: 0 };
            }
            acc[r.department].employeeCount += 1;
            acc[r.department].totalBasic += r.basicSalary;
            acc[r.department].totalNet += r.netSalary;
            acc[r.department].totalGross += r.grossSalary;
            acc[r.department].totalDeductions += r.totalDeductions;
            return acc;
        }, {});
        const salaryRanges = [
            { name: '0-1K', value: data.filter((r) => r.netSalary < 1000).length },
            { name: '1K-2K', value: data.filter((r) => r.netSalary >= 1000 && r.netSalary < 2000).length },
            { name: '2K-3K', value: data.filter((r) => r.netSalary >= 2000 && r.netSalary < 3000).length },
            { name: '3K-5K', value: data.filter((r) => r.netSalary >= 3000 && r.netSalary < 5000).length },
            { name: '5K+', value: data.filter((r) => r.netSalary >= 5000).length },
        ];
        const deductionBreakdown = [
            { name: 'Social Insurance', value: data.reduce((s, r) => s + r.socialInsurance, 0) },
            { name: 'Income Tax', value: data.reduce((s, r) => s + r.tax, 0) },
            { name: 'Loan Deduction', value: data.reduce((s, r) => s + r.loanDeduction, 0) },
            { name: 'Other', value: data.reduce((s, r) => s + r.otherDeductions, 0) },
        ];
        return {
            totalEmployees, totalBasic, totalAllowances, totalOvertime, totalBonuses,
            totalGross, totalDeductions, totalNet,
            deptSummary: Object.values(deptSummary),
            salaryRanges,
            deductionBreakdown,
        };
    }, [filteredData]);
    const columns = [
        { field: 'employeeName', headerName: 'Employee', width: 180 },
        { field: 'department', headerName: 'Department', width: 140 },
        { field: 'basicSalary', headerName: 'Basic', width: 100, type: 'number', valueFormatter: (v) => v?.toLocaleString() },
        { field: 'grossSalary', headerName: 'Gross', width: 100, type: 'number', valueFormatter: (v) => v?.toLocaleString() },
        { field: 'totalDeductions', headerName: 'Deductions', width: 100, type: 'number', valueFormatter: (v) => v?.toLocaleString() },
        {
            field: 'netSalary',
            headerName: 'Net',
            width: 110,
            type: 'number',
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 700, color: "success.main", children: params.value?.toLocaleString() })),
        },
    ];
    const fmt = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    return (_jsxs(LocalizationProvider, { dateAdapter: AdapterDateFns, children: [_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Payroll Reports" }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Report Type" }), _jsx(Select, { value: reportType, label: "Report Type", onChange: (e) => { setReportType(e.target.value); setGenerated(false); }, children: REPORT_TYPES.map((t) => (_jsx(MenuItem, { value: t.value, children: t.label }, t.value))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Payroll Period" }), _jsxs(Select, { value: periodId, label: "Payroll Period", onChange: (e) => { setPeriodId(e.target.value); setGenerated(false); }, children: [_jsx(MenuItem, { value: "", children: "Select Period" }), (periods || []).map((p) => (_jsx(MenuItem, { value: p.id, children: p.name }, p.id)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Department" }), _jsxs(Select, { value: department, label: "Department", onChange: (e) => { setDepartment(e.target.value); setGenerated(false); }, children: [_jsx(MenuItem, { value: "", children: "All" }), (departments || []).map((d) => (_jsx(MenuItem, { value: d, children: d }, d)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Button, { variant: "contained", fullWidth: true, startIcon: _jsx(Assessment, {}), onClick: handleGenerate, children: "Generate" }) })] }) }) }), !generated && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Select a payroll period and click Generate to view the report." })), generated && (_jsxs(_Fragment, { children: [_jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 6, sm: 4, md: 2 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Employees" }), _jsx(Typography, { variant: "h5", fontWeight: 700, children: reportStats.totalEmployees })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: 2 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Gross" }), _jsx(Typography, { variant: "h5", fontWeight: 700, color: "success.main", children: fmt(reportStats.totalGross) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: 2 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Deductions" }), _jsx(Typography, { variant: "h5", fontWeight: 700, color: "error.main", children: fmt(reportStats.totalDeductions) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: 2 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Net" }), _jsx(Typography, { variant: "h5", fontWeight: 700, color: "primary.main", children: fmt(reportStats.totalNet) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 4, md: 2 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total OT" }), _jsx(Typography, { variant: "h5", fontWeight: 700 }), "\">", fmt(reportStats.totalOvertime)] }) }) })] }), _jsx(Grid, { size: { xs: 6, sm: 4, md: 2 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Bonuses" }), _jsx(Typography, { variant: "h5", fontWeight: 700 }), "\">", fmt(reportStats.totalBonuses)] }) }) })] })), "Grid>"] }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [reportType === 'DEPARTMENT_SUMMARY' && (_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Department Net Pay" }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: reportStats.deptSummary, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "department", type: "category", width: 100 }), _jsx(RechartsTooltip, { formatter: (value) => fmt(value) }), _jsx(Bar, { dataKey: "totalNet", fill: "#2e7d32", radius: [0, 4, 4, 0] })] }) }) })] }) }) })), reportType === 'SALARY_DISTRIBUTION' && (_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Net Salary Distribution" }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: reportStats.salaryRanges, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Bar, { dataKey: "value", fill: "#0288d1", radius: [4, 4, 0, 0] })] }) }) })] }) }) })), reportType === 'DEDUCTION_ANALYSIS' && (_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Deduction Breakdown" }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: reportStats.deductionBreakdown, cx: "50%", cy: "50%", outerRadius: 100, dataKey: "value", nameKey: "name", label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, children: reportStats.deductionBreakdown.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, index))) }), _jsx(RechartsTooltip, { formatter: (value) => fmt(value) }), _jsx(Legend, {})] }) }) })] }) }) })), _jsx(Grid, { size: { xs: 12, md: reportType === 'EMPLOYEE_COMPARISON' ? 12 : 6 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Details" }), _jsx(Box, { display: "flex", justifyContent: "flex-end", mb: 2, children: _jsx(Button, { variant: "outlined", size: "small", startIcon: _jsx(FileDownload, {}), onClick: handleExport, children: "Export CSV" }) }), _jsx(DataGrid, { rows: filteredData, columns: columns, loading: isLoading, pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true })] }) }) })] })] }));
};
Box >
;
LocalizationProvider >
;
;
;
export default PayrollReportsPage;
