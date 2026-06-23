import React, { useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, Button, Skeleton, Alert
} from '@mui/material';
import { Print, Download } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { PayslipData } from '../../types';

interface PayslipViewerProps {
  periodId?: string;
  employeeId?: string;
}

const PayslipViewer: React.FC<PayslipViewerProps> = ({ periodId: propPeriodId, employeeId: propEmployeeId }) => {
  const { periodId: urlPeriodId, employeeId: urlEmployeeId } = useParams<{ periodId: string; employeeId: string }>();
  const printRef = useRef<HTMLDivElement>(null);

  const periodId = propPeriodId || urlPeriodId || '';
  const employeeId = propEmployeeId || urlEmployeeId || '';

  const { data: payslip, isLoading, error } = useQuery({
    queryKey: ['payslip', periodId, employeeId],
    queryFn: () => apiService.getPayslipData(periodId, employeeId),
    enabled: !!periodId && !!employeeId,
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
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
    } catch {
      // Error handling
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load payslip data.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={800} />
      </Box>
    );
  }

  if (!payslip) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
        No payslip data available.
      </Alert>
    );
  }

  const { companyName, companyAddress, periodName, employee, earnings, deductions, grossSalary, totalDeductions, netSalary, yearToDate } = payslip;
  const currency = employee.currency || 'USD';

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <Box sx={{ p: 3 }}>
      {/* Actions */}
      <Box display="flex" justifyContent="flex-end" gap={1} mb={2} className="no-print">
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          Print
        </Button>
        <Button variant="contained" startIcon={<Download />} onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </Box>

      {/* Payslip Content */}
      <Paper
        ref={printRef}
        sx={{
          p: 4,
          maxWidth: 800,
          mx: 'auto',
          '@media print': {
            boxShadow: 'none',
            border: 'none',
            p: 0,
          },
        }}
      >
        {/* Company Header */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {companyName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {companyAddress}
          </Typography>
          <Box mt={1} px={4}>
            <Divider />
          </Box>
          <Typography variant="h5" fontWeight={700} mt={2} color="primary.main">
            PAYSLIP
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            For the period: {periodName}
          </Typography>
        </Box>

        {/* Employee Info */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Employee Name</Typography>
              <Typography variant="body2" fontWeight={600}>
                {employee.firstName} {employee.lastName}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Employee #</Typography>
              <Typography variant="body2" fontWeight={600}>
                {employee.employeeNumber}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Department</Typography>
              <Typography variant="body2" fontWeight={600}>
                {employee.department}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Job Title</Typography>
              <Typography variant="body2" fontWeight={600}>
                {employee.jobTitle}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Earnings & Deductions */}
        <Grid container spacing={3}>
          {/* Earnings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom color="success.main">
              EARNINGS
            </Typography>
            <Paper variant="outlined">
              {earnings.map((item, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  justifyContent="space-between"
                  py={1}
                  px={2}
                  sx={{ borderBottom: idx < earnings.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
                >
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{currency} {fmt(item.amount)}</Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" py={1.5} px={2} bgcolor="success.50">
                <Typography variant="body2" fontWeight={700}>Total Earnings (Gross)</Typography>
                <Typography variant="body2" fontWeight={700}>{currency} {fmt(grossSalary)}</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Deductions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom color="error.main">
              DEDUCTIONS
            </Typography>
            <Paper variant="outlined">
              {deductions.length === 0 ? (
                <Box py={2} px={2}>
                  <Typography variant="body2" color="text.secondary">No deductions</Typography>
                </Box>
              ) : (
                deductions.map((item, idx) => (
                  <Box
                    key={idx}
                    display="flex"
                    justifyContent="space-between"
                    py={1}
                    px={2}
                    sx={{ borderBottom: idx < deductions.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
                  >
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{currency} {fmt(item.amount)}</Typography>
                  </Box>
                ))
              )}
              <Box display="flex" justifyContent="space-between" py={1.5} px={2} bgcolor="error.50">
                <Typography variant="body2" fontWeight={700}>Total Deductions</Typography>
                <Typography variant="body2" fontWeight={700}>{currency} {fmt(totalDeductions)}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Net Salary */}
        <Box mt={3} p={3} bgcolor="primary.main" color="white" borderRadius={2} textAlign="center">
          <Typography variant="h6" fontWeight={700}>NET SALARY</Typography>
          <Typography variant="h3" fontWeight={700} mt={1}>
            {currency} {fmt(netSalary)}
          </Typography>
        </Box>

        {/* Year to Date */}
        <Box mt={3}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Year to Date Summary
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }} textAlign="center">
                <Typography variant="caption" color="text.secondary">Gross Earnings</Typography>
                <Typography variant="h6" fontWeight={700}>{currency} {fmt(yearToDate.grossEarnings)}</Typography>
              </Grid>
              <Grid size={{ xs: 4 }} textAlign="center">
                <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
                <Typography variant="h6" fontWeight={700} color="error.main">{currency} {fmt(yearToDate.totalDeductions)}</Typography>
              </Grid>
              <Grid size={{ xs: 4 }} textAlign="center">
                <Typography variant="caption" color="text.secondary">Net Pay</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">{currency} {fmt(yearToDate.netPay)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Footer */}
        <Box mt={4} textAlign="center">
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary">
            This is a computer-generated payslip and does not require a signature.
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
            {companyName} &copy; {new Date().getFullYear()} - All rights reserved.
          </Typography>
        </Box>
      </Paper>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; margin: 0; background: white; }
        }
      `}</style>
    </Box>
  );
};

export default PayslipViewer;
