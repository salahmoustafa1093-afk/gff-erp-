import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl,
  InputLabel, Select, MenuItem, Button, Chip, Skeleton, Alert, Paper
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileDownload, Assessment } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { subMonths } from 'date-fns';
import { apiService } from '../../services/api';
import { EmployeePayroll } from '../../types';

type PayrollReportType = 'DEPARTMENT_SUMMARY' | 'SALARY_DISTRIBUTION' | 'DEDUCTION_ANALYSIS' | 'EMPLOYEE_COMPARISON';

const REPORT_TYPES: { value: PayrollReportType; label: string }[] = [
  { value: 'DEPARTMENT_SUMMARY', label: 'Department Summary' },
  { value: 'SALARY_DISTRIBUTION', label: 'Salary Distribution' },
  { value: 'DEDUCTION_ANALYSIS', label: 'Deduction Analysis' },
  { value: 'EMPLOYEE_COMPARISON', label: 'Employee Comparison' },
];

const COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#9c27b0', '#757575', '#fbc02d', '#795548'];

const PayrollReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<PayrollReportType>('DEPARTMENT_SUMMARY');
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
    if (department) return data.filter((r) => r.department === department);
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
    }, {} as Record<string, { department: string; employeeCount: number; totalBasic: number; totalNet: number; totalGross: number; totalDeductions: number }>);

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

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: 'Employee', width: 180 },
    { field: 'department', headerName: 'Department', width: 140 },
    { field: 'basicSalary', headerName: 'Basic', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'grossSalary', headerName: 'Gross', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'totalDeductions', headerName: 'Deductions', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    {
      field: 'netSalary',
      headerName: 'Net',
      width: 110,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="success.main">
          {params.value?.toLocaleString()}
        </Typography>
      ),
    },
  ];

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Payroll Reports
        </Typography>

        {/* Controls */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Report Type</InputLabel>
                  <Select value={reportType} label="Report Type" onChange={(e) => { setReportType(e.target.value as PayrollReportType); setGenerated(false); }}>
                    {REPORT_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payroll Period</InputLabel>
                  <Select value={periodId} label="Payroll Period" onChange={(e) => { setPeriodId(e.target.value); setGenerated(false); }}>
                    <MenuItem value="">Select Period</MenuItem>
                    {(periods || []).map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select value={department} label="Department" onChange={(e) => { setDepartment(e.target.value); setGenerated(false); }}>
                    <MenuItem value="">All</MenuItem>
                    {(departments || []).map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button variant="contained" fullWidth startIcon={<Assessment />} onClick={handleGenerate}>
                  Generate
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!generated && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a payroll period and click Generate to view the report.
          </Alert>
        )}

        {generated && (
          <>
            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Employees</Typography>
                    <Typography variant="h5" fontWeight={700}>{reportStats.totalEmployees}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Gross</Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">{fmt(reportStats.totalGross)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
                    <Typography variant="h5" fontWeight={700} color="error.main">{fmt(reportStats.totalDeductions)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Net</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">{fmt(reportStats.totalNet)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total OT</Typography>
                    <Typography variant="h5" fontWeight={700">{fmt(reportStats.totalOvertime)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Bonuses</Typography>
                    <Typography variant="h5" fontWeight={700">{fmt(reportStats.totalBonuses)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {reportType === 'DEPARTMENT_SUMMARY' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Department Net Pay</Typography>
                      <Box height={300}>
                        <ResponsiveContainer>
                          <BarChart data={reportStats.deptSummary} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="department" type="category" width={100} />
                            <RechartsTooltip formatter={(value: number) => fmt(value)} />
                            <Bar dataKey="totalNet" fill="#2e7d32" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {reportType === 'SALARY_DISTRIBUTION' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Net Salary Distribution</Typography>
                      <Box height={300}>
                        <ResponsiveContainer>
                          <BarChart data={reportStats.salaryRanges}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="#0288d1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {reportType === 'DEDUCTION_ANALYSIS' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Deduction Breakdown</Typography>
                      <Box height={300}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={reportStats.deductionBreakdown}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {reportStats.deductionBreakdown.map((_: unknown, index: number) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: number) => fmt(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: reportType === 'EMPLOYEE_COMPARISON' ? 12 : 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Details</Typography>
                    <Box display="flex" justifyContent="flex-end" mb={2}>
                      <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleExport}>
                        Export CSV
                      </Button>
                    </Box>
                    <DataGrid
                      rows={filteredData}
                      columns={columns}
                      loading={isLoading}
                      pageSizeOptions={[10, 25, 50]}
                      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                      density="compact"
                      autoHeight
                      disableRowSelectionOnClick
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default PayrollReportsPage;
