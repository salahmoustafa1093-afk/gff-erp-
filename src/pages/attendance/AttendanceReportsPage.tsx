import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl,
  InputLabel, Select, MenuItem, Button, TextField, Chip, Skeleton, Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileDownload, Assessment, FilterList } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { subMonths } from 'date-fns';
import { apiService } from '../../services/api';
import { AttendanceRecord } from '../../types';

type ReportType = 'MONTHLY_SUMMARY' | 'LATE_ARRIVALS' | 'ABSENCES' | 'OVERTIME';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'MONTHLY_SUMMARY', label: 'Monthly Summary' },
  { value: 'LATE_ARRIVALS', label: 'Late Arrivals' },
  { value: 'ABSENCES', label: 'Absences' },
  { value: 'OVERTIME', label: 'Overtime' },
];

const COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#9c27b0', '#757575', '#fbc02d'];

const AttendanceReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('MONTHLY_SUMMARY');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
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
      ...(reportData?.data || []).map((row: AttendanceRecord) =>
        [row.employeeName, row.department, row.date, row.status, row.checkIn, row.checkOut, row.workingHours, row.overtime, row.notes].join(',')
      ),
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
        return records.filter((r: AttendanceRecord) => r.status === 'LATE');
      case 'ABSENCES':
        return records.filter((r: AttendanceRecord) => r.status === 'ABSENT');
      case 'OVERTIME':
        return records.filter((r: AttendanceRecord) => (r.overtime || 0) > 0);
      default:
        return records;
    }
  }, [reportData, reportType]);

  const summaryStats = React.useMemo(() => {
    const records = filteredData;
    const total = records.length;
    const present = records.filter((r: AttendanceRecord) => r.status === 'PRESENT').length;
    const absent = records.filter((r: AttendanceRecord) => r.status === 'ABSENT').length;
    const late = records.filter((r: AttendanceRecord) => r.status === 'LATE').length;
    const onLeave = records.filter((r: AttendanceRecord) => r.status === 'ON_LEAVE').length;
    const halfDay = records.filter((r: AttendanceRecord) => r.status === 'HALF_DAY').length;
    const totalOvertime = records.reduce((sum: number, r: AttendanceRecord) => sum + (r.overtime || 0), 0);
    const totalHours = records.reduce((sum: number, r: AttendanceRecord) => sum + (r.workingHours || 0), 0);

    const deptBreakdown = records.reduce((acc: Record<string, number>, r: AttendanceRecord) => {
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

  const columns: GridColDef[] = [
    {
      field: 'employeeName',
      headerName: 'Employee',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.employeeNumber}</Typography>
        </Box>
      ),
    },
    { field: 'department', headerName: 'Department', width: 140 },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    { field: 'checkIn', headerName: 'Check In', width: 90 },
    { field: 'checkOut', headerName: 'Check Out', width: 90 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'PRESENT' ? 'success' :
            params.value === 'ABSENT' ? 'error' :
            params.value === 'LATE' ? 'warning' :
            params.value === 'ON_LEAVE' ? 'info' : 'default'
          }
          variant="outlined"
        />
      ),
    },
    { field: 'workingHours', headerName: 'Hours', width: 80, type: 'number' },
    { field: 'overtime', headerName: 'OT', width: 60, type: 'number' },
    { field: 'notes', headerName: 'Notes', flex: 1 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Attendance Reports
        </Typography>

        {/* Report Controls */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Report Type</InputLabel>
                  <Select value={reportType} label="Report Type" onChange={(e) => { setReportType(e.target.value as ReportType); setGenerated(false); }}>
                    {REPORT_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(v) => { setStartDate(v); setGenerated(false); }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(v) => { setEndDate(v); setGenerated(false); }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Assessment />}
                  onClick={handleGenerate}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!generated && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select report parameters and click Generate to view the report.
          </Alert>
        )}

        {generated && (
          <>
            {/* Summary Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Records</Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {isLoading ? <Skeleton width={60} sx={{ mx: 'auto' }} /> : summaryStats.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {reportType === 'OVERTIME' ? 'Total OT Hours' : 'Present / On Time'}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {isLoading ? <Skeleton width={60} sx={{ mx: 'auto' }} /> :
                        reportType === 'OVERTIME' ? summaryStats.totalOvertime.toFixed(1) : summaryStats.present}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {reportType === 'OVERTIME' ? 'Total Hours' : 'Absences / Late'}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {isLoading ? <Skeleton width={60} sx={{ mx: 'auto' }} /> :
                        reportType === 'OVERTIME' ? summaryStats.totalHours.toFixed(1) :
                        reportType === 'LATE_ARRIVALS' ? summaryStats.late : summaryStats.absent}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Attendance Rate</Typography>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {isLoading ? <Skeleton width={60} sx={{ mx: 'auto' }} /> :
                        summaryStats.total > 0
                          ? `${(((summaryStats.present + summaryStats.late) / summaryStats.total) * 100).toFixed(0)}%`
                          : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Status Distribution</Typography>
                    <Box height={250}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={summaryStats.statusBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {summaryStats.statusBreakdown.map((_: unknown, index: number) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Department Breakdown</Typography>
                    <Box height={250}>
                      <ResponsiveContainer>
                        <BarChart data={summaryStats.pieData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#2e7d32" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* DataGrid */}
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600">
                    Report Details
                  </Typography>
                  <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleExport}>
                    Export CSV
                  </Button>
                </Box>
                <DataGrid
                  rows={filteredData}
                  columns={columns}
                  loading={isLoading}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  density="compact"
                  autoHeight
                  disableRowSelectionOnClick
                />
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceReportsPage;
