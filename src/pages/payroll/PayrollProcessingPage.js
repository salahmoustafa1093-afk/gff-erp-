import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Typography, Button, Chip, IconButton, TextField, Paper, Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Collapse, Divider, Tooltip, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { PlayArrow, Refresh, Close, Print, Receipt, Undo, ExpandMore, ExpandLess, Save } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
const statusColors = {
    DRAFT: 'default',
    PROCESSING: 'primary',
    COMPLETED: 'success',
    CLOSED: 'info',
};
const DetailRow = ({ label, value, bold, color }) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.5, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: bold ? 700 : 400, color: color, children: value })] }));
const PayrollProcessingPage = () => {
    const { periodId: urlPeriodId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPeriodId, setSelectedPeriodId] = useState(urlPeriodId || '');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [editingRow, setEditingRow] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [confirmDialog, setConfirmDialog] = useState(null);
    const effectivePeriodId = urlPeriodId || selectedPeriodId;
    const { data: period, isLoading: periodLoading } = useQuery({
        queryKey: ['payroll-period', effectivePeriodId],
        queryFn: () => apiService.getPayrollPeriod(effectivePeriodId),
        enabled: !!effectivePeriodId,
    });
    const { data: employeePayrolls, isLoading: payrollsLoading } = useQuery({
        queryKey: ['employee-payrolls', effectivePeriodId],
        queryFn: () => apiService.getEmployeePayrolls(effectivePeriodId),
        enabled: !!effectivePeriodId,
    });
    const { data: periods } = useQuery({
        queryKey: ['payroll-periods'],
        queryFn: () => apiService.getPayrollPeriods(),
        enabled: !urlPeriodId,
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => apiService.updateEmployeePayroll(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
            setEditingRow(null);
        },
    });
    const processMutation = useMutation({
        mutationFn: () => apiService.processPayroll(effectivePeriodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
            queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
            setConfirmDialog(null);
        },
    });
    const recalculateMutation = useMutation({
        mutationFn: () => apiService.recalculatePayroll(effectivePeriodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
        },
    });
    const closeMutation = useMutation({
        mutationFn: () => apiService.closePayroll(effectivePeriodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
            queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
            setConfirmDialog(null);
        },
    });
    const reverseMutation = useMutation({
        mutationFn: () => apiService.reversePayroll(effectivePeriodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
            queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
            setConfirmDialog(null);
        },
    });
    const toggleExpand = (id) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const startEdit = (row) => {
        setEditingRow(row.id);
        setEditValues({
            bonuses: row.bonuses,
            otherDeductions: row.otherDeductions,
            notes: row.notes,
            included: row.included,
        });
    };
    const saveEdit = () => {
        if (!editingRow)
            return;
        updateMutation.mutate({ id: editingRow, data: editValues });
    };
    const summary = React.useMemo(() => {
        const rows = employeePayrolls || [];
        const included = rows.filter((r) => r.included);
        return {
            totalBasic: included.reduce((s, r) => s + r.basicSalary, 0),
            totalAllowances: included.reduce((s, r) => s + r.housingAllowance + r.transportAllowance + r.otherAllowances, 0),
            totalOvertime: included.reduce((s, r) => s + r.overtime, 0),
            totalBonuses: included.reduce((s, r) => s + r.bonuses, 0),
            totalGross: included.reduce((s, r) => s + r.grossSalary, 0),
            totalSocial: included.reduce((s, r) => s + r.socialInsurance, 0),
            totalTax: included.reduce((s, r) => s + r.tax, 0),
            totalLoan: included.reduce((s, r) => s + r.loanDeduction, 0),
            totalDeductions: included.reduce((s, r) => s + r.totalDeductions, 0),
            totalNet: included.reduce((s, r) => s + r.netSalary, 0),
            employeeCount: included.length,
        };
    }, [employeePayrolls]);
    const currency = period?.currency || 'USD';
    const fmt = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    const columns = [
        {
            field: 'expand',
            headerName: '',
            width: 40,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(IconButton, { size: "small", onClick: () => toggleExpand(params.row.id), children: expandedRows.has(params.row.id) ? _jsx(ExpandLess, { fontSize: "small" }) : _jsx(ExpandMore, { fontSize: "small" }) })),
        },
        {
            field: 'included',
            headerName: 'Inc.',
            width: 60,
            type: 'boolean',
            renderCell: (params) => (editingRow === params.row.id ? (_jsx(Chip, { label: editValues.included ? 'Yes' : 'No', color: editValues.included ? 'success' : 'default', size: "small", onClick: () => setEditValues((p) => ({ ...p, included: !p.included })), sx: { cursor: 'pointer' } })) : (_jsx(Chip, { label: params.value ? 'Yes' : 'No', color: params.value ? 'success' : 'default', size: "small", variant: params.value ? 'filled' : 'outlined' }))),
        },
        {
            field: 'employeeName',
            headerName: 'Employee',
            width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: params.row.employeeNumber })] })),
        },
        { field: 'department', headerName: 'Dept', width: 120 },
        {
            field: 'basicSalary',
            headerName: 'Basic',
            width: 110,
            type: 'number',
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'allowances',
            headerName: 'Allow.',
            width: 100,
            type: 'number',
            valueGetter: (_, row) => row.housingAllowance + row.transportAllowance + row.otherAllowances,
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'overtime',
            headerName: 'OT',
            width: 80,
            type: 'number',
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'bonuses',
            headerName: 'Bonus',
            width: 90,
            type: 'number',
            renderCell: (params) => (editingRow === params.row.id ? (_jsx(TextField, { size: "small", type: "number", value: editValues.bonuses || 0, onChange: (e) => setEditValues((p) => ({ ...p, bonuses: parseFloat(e.target.value) || 0 })), sx: { width: 80 } })) : (_jsx(Typography, { variant: "body2", children: fmt(params.value) }))),
        },
        {
            field: 'grossSalary',
            headerName: 'Gross',
            width: 110,
            type: 'number',
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'socialInsurance',
            headerName: 'Social Ins.',
            width: 100,
            type: 'number',
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'tax',
            headerName: 'Tax',
            width: 90,
            type: 'number',
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'totalDeductions',
            headerName: 'Deductions',
            width: 100,
            type: 'number',
            valueFormatter: (value) => fmt(value),
        },
        {
            field: 'netSalary',
            headerName: 'Net',
            width: 110,
            type: 'number',
            valueFormatter: (value) => fmt(value),
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 700, color: "success.main", children: fmt(params.value) })),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(Box, { display: "flex", gap: 0.5, children: editingRow === params.row.id ? (_jsxs(_Fragment, { children: [_jsx(Tooltip, { title: "Save", children: _jsx(IconButton, { size: "small", color: "success", onClick: saveEdit, children: _jsx(Save, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Cancel", children: _jsx(IconButton, { size: "small", onClick: () => setEditingRow(null), children: _jsx(ExpandLess, { fontSize: "small" }) }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => startEdit(params.row), children: _jsx(Refresh, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Payslip", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/payroll/payslip/${effectivePeriodId}/${params.row.employeeId}`), children: _jsx(Receipt, { fontSize: "small" }) }) })] })) })),
        },
    ];
    const renderDetailPanel = (row) => (_jsx(Collapse, { in: expandedRows.has(row.id), children: _jsx(Box, { sx: { p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, md: 4 }, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Earnings Breakdown" }), _jsx(DetailRow, { label: "Basic Salary", value: `${currency} ${fmt(row.basicSalary)}` }), _jsx(DetailRow, { label: "Housing Allowance", value: `${currency} ${fmt(row.housingAllowance)}` }), _jsx(DetailRow, { label: "Transport Allowance", value: `${currency} ${fmt(row.transportAllowance)}` }), _jsx(DetailRow, { label: "Other Allowances", value: `${currency} ${fmt(row.otherAllowances)}` }), _jsx(DetailRow, { label: "Overtime", value: `${currency} ${fmt(row.overtime)}` }), _jsx(DetailRow, { label: "Bonuses", value: `${currency} ${fmt(row.bonuses)}` }), _jsx(Divider, { sx: { my: 1 } }), _jsx(DetailRow, { label: "Gross Salary", value: `${currency} ${fmt(row.grossSalary)}`, bold: true })] }), _jsxs(Grid, { size: { xs: 12, md: 4 }, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Deductions Breakdown" }), _jsx(DetailRow, { label: "Social Insurance", value: `${currency} ${fmt(row.socialInsurance)}` }), _jsx(DetailRow, { label: "Income Tax", value: `${currency} ${fmt(row.tax)}` }), _jsx(DetailRow, { label: "Loan Deduction", value: `${currency} ${fmt(row.loanDeduction)}` }), _jsx(DetailRow, { label: "Other Deductions", value: `${currency} ${fmt(row.otherDeductions)}` }), _jsx(Divider, { sx: { my: 1 } }), _jsx(DetailRow, { label: "Total Deductions", value: `${currency} ${fmt(row.totalDeductions)}`, bold: true, color: "#d32f2f" })] }), _jsxs(Grid, { size: { xs: 12, md: 4 }, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Summary" }), _jsxs(Paper, { sx: { p: 2, bgcolor: 'success.50' }, children: [_jsx(DetailRow, { label: "Gross Earnings", value: `${currency} ${fmt(row.grossSalary)}` }), _jsx(DetailRow, { label: "Total Deductions", value: `${currency} ${fmt(row.totalDeductions)}`, color: "#d32f2f" }), _jsx(Divider, { sx: { my: 1 } }), _jsx(DetailRow, { label: "NET SALARY", value: `${currency} ${fmt(row.netSalary)}`, bold: true, color: "#2e7d32" })] }), row.notes && (_jsx(Box, { mt: 1, children: _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Notes: ", row.notes] }) }))] })] }) }) }));
    if (!urlPeriodId && !selectedPeriodId) {
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Payroll Processing" }), _jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Select a payroll period to process" }), _jsx(DataGrid, { rows: periods || [], columns: [
                        { field: 'name', headerName: 'Period', width: 200 },
                        { field: 'status', headerName: 'Status', width: 120 },
                        {
                            field: 'actions',
                            headerName: 'Actions',
                            width: 120,
                            renderCell: (params) => (_jsx(Button, { size: "small", variant: "outlined", onClick: () => setSelectedPeriodId(params.row.id), children: "Select" })),
                        },
                    ], loading: !periods, autoHeight: true, disableRowSelectionOnClick: true })] }));
    }
    if (periodLoading || !period) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Payroll Processing" }), _jsxs(Typography, { variant: "body1", color: "text.secondary", children: [period.name, " (", new Date(period.startDate).toLocaleDateString(), " - ", new Date(period.endDate).toLocaleDateString(), ")"] })] }), _jsx(Chip, { label: period.status, color: statusColors[period.status] || 'default', variant: "outlined", sx: { fontWeight: 600 } })] }), _jsxs(Box, { display: "flex", gap: 1, mb: 3, flexWrap: "wrap", children: [period.status === 'DRAFT' && (_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(PlayArrow, {}), onClick: () => setConfirmDialog('process'), disabled: processMutation.isPending, children: processMutation.isPending ? 'Processing...' : 'Process Payroll' })), (period.status === 'PROCESSING' || period.status === 'COMPLETED') && (_jsx(Button, { variant: "outlined", startIcon: _jsx(Refresh, {}), onClick: () => recalculateMutation.mutate(), disabled: recalculateMutation.isPending, children: recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate' })), period.status === 'COMPLETED' && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(Close, {}), onClick: () => setConfirmDialog('close'), disabled: closeMutation.isPending, children: "Close Payroll" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(Print, {}), onClick: () => window.print(), children: "Print All Payslips" })] })), (period.status === 'COMPLETED' || period.status === 'CLOSED') && (_jsx(Button, { variant: "outlined", color: "error", startIcon: _jsx(Undo, {}), onClick: () => setConfirmDialog('reverse'), disabled: reverseMutation.isPending, children: "Reverse Payroll" }))] }), _jsx(Paper, { sx: { p: 2, mb: 3, bgcolor: 'grey.50' }, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Basic" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, children: [currency, " ", fmt(summary.totalBasic)] })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Allowances" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, color: "success.main", children: [currency, " ", fmt(summary.totalAllowances)] })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Deductions" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, color: "error.main", children: [currency, " ", fmt(summary.totalDeductions)] })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Net Pay" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, color: "primary.main", children: [currency, " ", fmt(summary.totalNet)] })] })] }) }), _jsx(DataGrid, { rows: employeePayrolls || [], columns: columns, loading: payrollsLoading, pageSizeOptions: [25, 50, 100], initialState: { pagination: { paginationModel: { pageSize: 50 } } }, density: "compact", autoHeight: true, disableRowSelectionOnClick: true, getRowHeight: () => 'auto', sx: { mb: 2 } }), (employeePayrolls || []).map((row) => (_jsx(React.Fragment, { children: renderDetailPanel(row) }, row.id))), _jsxs(Dialog, { open: !!confirmDialog, onClose: () => setConfirmDialog(null), maxWidth: "sm", fullWidth: true, children: [_jsxs(DialogTitle, { children: [confirmDialog === 'process' && 'Process Payroll', confirmDialog === 'close' && 'Close Payroll Period', confirmDialog === 'reverse' && 'Reverse Payroll'] }), _jsx(DialogContent, { children: _jsxs(Alert, { severity: "warning", sx: { mb: 2 }, children: [confirmDialog === 'process' && 'This will calculate salaries for all included employees. Are you sure?', confirmDialog === 'close' && 'Closing will lock this period. No further changes can be made. Are you sure?', confirmDialog === 'reverse' && 'This will reverse all payroll transactions. Are you sure?'] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setConfirmDialog(null), children: "Cancel" }), _jsx(Button, { variant: "contained", color: confirmDialog === 'reverse' ? 'error' : 'primary', onClick: () => {
                                    if (confirmDialog === 'process')
                                        processMutation.mutate();
                                    if (confirmDialog === 'close')
                                        closeMutation.mutate();
                                    if (confirmDialog === 'reverse')
                                        reverseMutation.mutate();
                                }, disabled: processMutation.isPending || closeMutation.isPending || reverseMutation.isPending, children: "Confirm" })] })] })] }));
};
export default PayrollProcessingPage;
