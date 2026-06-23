import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { Box, Typography, Paper, Grid, Divider, Button, Skeleton, Alert } from '@mui/material';
import { Print, Download } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
const PayslipViewer = ({ periodId: propPeriodId, employeeId: propEmployeeId }) => {
    const { periodId: urlPeriodId, employeeId: urlEmployeeId } = useParams();
    const printRef = useRef(null);
    const periodId = propPeriodId || urlPeriodId || '';
    const employeeId = propEmployeeId || urlEmployeeId || '';
    const { data: payslip, isLoading, error } = useQuery({
        queryKey: ['payslip', periodId, employeeId],
        queryFn: () => apiService.getPayslipData(periodId, employeeId),
        enabled: !!periodId && !!employeeId,
    });
    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent)
            return;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };
    const handleDownloadPDF = async () => {
        try {
            const blob = await apiService.generatePayslip(periodId, employeeId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${payslip?.periodName || periodId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        }
        catch {
            // Error handling
        }
    };
    if (error) {
        return (_jsx(Alert, { severity: "error", sx: { m: 3 }, children: "Failed to load payslip data." }));
    }
    if (isLoading) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(Skeleton, { variant: "rectangular", height: 800 }) }));
    }
    if (!payslip) {
        return (_jsx(Alert, { severity: "info", sx: { m: 3 }, children: "No payslip data available." }));
    }
    const { companyName, companyAddress, periodName, employee, earnings, deductions, grossSalary, totalDeductions, netSalary, yearToDate } = payslip;
    const currency = employee.currency || 'USD';
    const fmt = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, className: "no-print", children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(Print, {}), onClick: handlePrint, children: "Print" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Download, {}), onClick: handleDownloadPDF, children: "Download PDF" })] }), _jsxs(Paper, { ref: printRef, sx: {
                    p: 4,
                    maxWidth: 800,
                    mx: 'auto',
                    '@media print': {
                        boxShadow: 'none',
                        border: 'none',
                        p: 0,
                    },
                }, children: [_jsxs(Box, { textAlign: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: companyName }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: companyAddress }), _jsx(Box, { mt: 1, px: 4, children: _jsx(Divider, {}) }), _jsx(Typography, { variant: "h5", fontWeight: 700, mt: 2, color: "primary.main", children: "PAYSLIP" }), _jsxs(Typography, { variant: "subtitle1", color: "text.secondary", children: ["For the period: ", periodName] })] }), _jsx(Paper, { variant: "outlined", sx: { p: 2, mb: 3, bgcolor: 'grey.50' }, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Employee Name" }), _jsxs(Typography, { variant: "body2", fontWeight: 600, children: [employee.firstName, " ", employee.lastName] })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Employee #" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: employee.employeeNumber })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Department" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: employee.department })] }), _jsxs(Grid, { size: { xs: 6, sm: 3 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Job Title" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: employee.jobTitle })] })] }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, gutterBottom: true, color: "success.main", children: "EARNINGS" }), _jsxs(Paper, { variant: "outlined", children: [earnings.map((item, idx) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 1, px: 2, sx: { borderBottom: idx < earnings.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }, children: [_jsx(Typography, { variant: "body2", children: item.label }), _jsxs(Typography, { variant: "body2", fontWeight: 500, children: [currency, " ", fmt(item.amount)] })] }, idx))), _jsxs(Box, { display: "flex", justifyContent: "space-between", py: 1.5, px: 2, bgcolor: "success.50", children: [_jsx(Typography, { variant: "body2", fontWeight: 700, children: "Total Earnings (Gross)" }), _jsxs(Typography, { variant: "body2", fontWeight: 700, children: [currency, " ", fmt(grossSalary)] })] })] })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, gutterBottom: true, color: "error.main", children: "DEDUCTIONS" }), _jsxs(Paper, { variant: "outlined", children: [deductions.length === 0 ? (_jsx(Box, { py: 2, px: 2, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No deductions" }) })) : (deductions.map((item, idx) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 1, px: 2, sx: { borderBottom: idx < deductions.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }, children: [_jsx(Typography, { variant: "body2", children: item.label }), _jsxs(Typography, { variant: "body2", fontWeight: 500, children: [currency, " ", fmt(item.amount)] })] }, idx)))), _jsxs(Box, { display: "flex", justifyContent: "space-between", py: 1.5, px: 2, bgcolor: "error.50", children: [_jsx(Typography, { variant: "body2", fontWeight: 700, children: "Total Deductions" }), _jsxs(Typography, { variant: "body2", fontWeight: 700, children: [currency, " ", fmt(totalDeductions)] })] })] })] })] }), _jsxs(Box, { mt: 3, p: 3, bgcolor: "primary.main", color: "white", borderRadius: 2, textAlign: "center", children: [_jsx(Typography, { variant: "h6", fontWeight: 700, children: "NET SALARY" }), _jsxs(Typography, { variant: "h3", fontWeight: 700, mt: 1, children: [currency, " ", fmt(netSalary)] })] }), _jsxs(Box, { mt: 3, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, gutterBottom: true, children: "Year to Date Summary" }), _jsx(Paper, { variant: "outlined", sx: { p: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { size: { xs: 4 }, textAlign: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Gross Earnings" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, children: [currency, " ", fmt(yearToDate.grossEarnings)] })] }), _jsxs(Grid, { size: { xs: 4 }, textAlign: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Deductions" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, color: "error.main", children: [currency, " ", fmt(yearToDate.totalDeductions)] })] }), _jsxs(Grid, { size: { xs: 4 }, textAlign: "center", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Net Pay" }), _jsxs(Typography, { variant: "h6", fontWeight: 700, color: "success.main", children: [currency, " ", fmt(yearToDate.netPay)] })] })] }) })] }), _jsxs(Box, { mt: 4, textAlign: "center", children: [_jsx(Divider, { sx: { mb: 2 } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "This is a computer-generated payslip and does not require a signature." }), _jsxs(Typography, { variant: "caption", display: "block", color: "text.secondary", mt: 0.5, children: [companyName, " \u00A9 ", new Date().getFullYear(), " - All rights reserved."] })] })] }), _jsx("style", { children: `
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; margin: 0; background: white; }
        }
      ` })] }));
};
export default PayslipViewer;
