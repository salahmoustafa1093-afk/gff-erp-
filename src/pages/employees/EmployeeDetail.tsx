import React, { useState } from 'react';
import {
  Box, Typography, Avatar, Grid, Card, CardContent, Chip,
  Tabs, Tab, Button, IconButton, Divider, List, ListItem,
  ListItemText, Skeleton, Alert, Paper, Tooltip, Badge
} from '@mui/material';
import {
  Edit, Print, Block, ArrowBack, CalendarMonth,
  AttachMoney, LocalAtm, BeachAccess, FolderOpen,
  Timeline, Email, Phone, LocationOn, Business, Person
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { apiService } from '../../services/api';
import { Employee, LeaveBalance, AttendanceRecord, LeaveRequest, EmployeePayroll } from '../../types';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  TERMINATED: 'error',
  ON_LEAVE: 'info',
  SUSPENDED: 'warning',
};

const attendanceStatusColors: Record<string, string> = {
  PRESENT: '#2e7d32',
  ABSENT: '#d32f2f',
  LATE: '#ed6c02',
  HALF_DAY: '#fbc02d',
  ON_LEAVE: '#0288d1',
  HOLIDAY: '#9e9e9e',
};

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" py={0.75}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
  </Box>
);

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => apiService.getEmployee(id!),
    enabled: !!id,
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ['leave-balance', id],
    queryFn: () => apiService.getLeaveBalance(id!),
    enabled: !!id && activeTab === 3,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: () => apiService.getEmployeeMonthlyAttendance(id!, new Date().getMonth() + 1, new Date().getFullYear()),
    enabled: !!id && activeTab === 1,
  });

  const { data: leaveRequests } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: () => apiService.getLeaveRequests({ employeeId: id, limit: 100 }),
    enabled: !!id && activeTab === 3,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => apiService.updateEmployee(id!, { status: 'INACTIVE' as const }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee', id] }),
  });

  const leaveMutation = useMutation({
    mutationFn: (data: unknown) => apiService.createLeaveRequest(data as Partial<LeaveRequest>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-leaves', id] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance', id] });
      setLeaveFormOpen(false);
    },
  });

  const handlePrint = () => window.print();

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load employee details. <Button onClick={() => navigate('/employees')}>Go Back</Button>
      </Alert>
    );
  }

  const attendanceSummary = (attendanceData || []).reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(attendanceSummary).map(([name, value]) => ({ name, value }));

  const leaveFormik = useFormik({
    initialValues: {
      leaveType: 'ANNUAL',
      startDate: null as Date | null,
      endDate: null as Date | null,
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

  const attendanceColumns: GridColDef[] = [
    { field: 'date', headerName: 'Date', width: 120, valueFormatter: (v: string) => new Date(v).toLocaleDateString() },
    { field: 'checkIn', headerName: 'Check In', width: 100 },
    { field: 'checkOut', headerName: 'Check Out', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: attendanceStatusColors[params.value as string] + '20', color: attendanceStatusColors[params.value as string], fontWeight: 600 }}
        />
      ),
    },
    { field: 'workingHours', headerName: 'Hours', width: 80, type: 'number' },
    { field: 'overtime', headerName: 'OT', width: 60, type: 'number' },
    { field: 'notes', headerName: 'Notes', flex: 1 },
  ];

  const leaveColumns: GridColDef[] = [
    { field: 'leaveType', headerName: 'Type', width: 120 },
    { field: 'startDate', headerName: 'From', width: 120, valueFormatter: (v: string) => new Date(v).toLocaleDateString() },
    { field: 'endDate', headerName: 'To', width: 120, valueFormatter: (v: string) => new Date(v).toLocaleDateString() },
    { field: 'days', headerName: 'Days', width: 70, type: 'number' },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'APPROVED' ? 'success' : params.value === 'REJECTED' ? 'error' : 'warning'}
          size="small"
          variant="outlined"
        />
      ),
    },
    { field: 'reason', headerName: 'Reason', flex: 1 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/employees')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            Employee Profile
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} size="small">
            Print
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Block />}
            onClick={() => deactivateMutation.mutate()}
            disabled={deactivateMutation.isPending}
            size="small"
          >
            Deactivate
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/employees/edit/${id}`)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, sm: 'auto' }}>
              {isLoading ? (
                <Skeleton variant="circular" width={120} height={120} />
              ) : (
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Chip
                      label={employee?.status}
                      color={statusColors[employee?.status || ''] || 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  }
                >
                  <Avatar
                    src={employee?.photoUrl}
                    sx={{ width: 120, height: 120, fontSize: 48, bgcolor: 'primary.main' }}
                  >
                    {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                  </Avatar>
                </Badge>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: true }}>
              {isLoading ? (
                <>
                  <Skeleton width={300} height={40} />
                  <Skeleton width={200} height={24} />
                  <Skeleton width={250} height={20} />
                </>
              ) : (
                <>
                  <Typography variant="h4" fontWeight={700}>
                    {employee?.firstName} {employee?.lastName}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" fontWeight={400}>
                    {employee?.jobTitle}
                  </Typography>
                  <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                    <Chip icon={<Business fontSize="small" />} label={employee?.department} size="small" variant="outlined" />
                    <Chip icon={<Email fontSize="small" />} label={employee?.email} size="small" variant="outlined" />
                    <Chip icon={<Phone fontSize="small" />} label={employee?.phone} size="small" variant="outlined" />
                    <Chip icon={<LocationOn fontSize="small" />} label={employee?.branch} size="small" variant="outlined" />
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<Person fontSize="small" />} iconPosition="start" />
          <Tab label="Attendance" icon={<CalendarMonth fontSize="small" />} iconPosition="start" />
          <Tab label="Payroll" icon={<AttachMoney fontSize="small" />} iconPosition="start" />
          <Tab label="Leaves" icon={<BeachAccess fontSize="small" />} iconPosition="start" />
          <Tab label="Documents" icon={<FolderOpen fontSize="small" />} iconPosition="start" />
          <Tab label="Activity" icon={<Timeline fontSize="small" />} iconPosition="start" />
        </Tabs>

        <CardContent>
          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Basic Information</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <InfoRow label="Employee Number" value={employee?.employeeNumber} />
                  <InfoRow label="Full Name" value={`${employee?.firstName || ''} ${employee?.lastName || ''}`} />
                  <InfoRow label="Email" value={employee?.email} />
                  <InfoRow label="Phone" value={employee?.phone} />
                  <InfoRow label="National ID" value={employee?.nationalId} />
                  <InfoRow label="Date of Birth" value={employee?.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '-'} />
                  <InfoRow label="Gender" value={employee?.gender} />
                  <InfoRow label="Marital Status" value={employee?.maritalStatus} />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Employment Details</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <InfoRow label="Department" value={employee?.department} />
                  <InfoRow label="Job Title" value={employee?.jobTitle} />
                  <InfoRow label="Employment Type" value={employee?.employmentType} />
                  <InfoRow label="Hire Date" value={employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'} />
                  <InfoRow label="Branch" value={employee?.branch} />
                  <InfoRow label="Supervisor" value={employee?.supervisorName || '-'} />
                  <InfoRow label="Status" value={<Chip label={employee?.status} color={statusColors[employee?.status || ''] || 'default'} size="small" />} />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Salary Summary</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <InfoRow label="Basic Salary" value={`${employee?.currency} ${(employee?.basicSalary || 0).toLocaleString()}`} />
                  <InfoRow label="Housing Allowance" value={`${employee?.currency} ${(employee?.housingAllowance || 0).toLocaleString()}`} />
                  <InfoRow label="Transport Allowance" value={`${employee?.currency} ${(employee?.transportAllowance || 0).toLocaleString()}`} />
                  <InfoRow label="Other Allowances" value={`${employee?.currency} ${(employee?.otherAllowances || 0).toLocaleString()}`} />
                  <Divider sx={{ my: 1 }} />
                  <InfoRow
                    label="Total Package"
                    value={
                      <Typography fontWeight={700} color="primary">
                        {employee?.currency} {((employee?.basicSalary || 0) + (employee?.housingAllowance || 0) + (employee?.transportAllowance || 0) + (employee?.otherAllowances || 0)).toLocaleString()}
                      </Typography>
                    }
                  />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Contact Information</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <InfoRow label="Address" value={employee?.address} />
                  <InfoRow label="City" value={employee?.city} />
                  <InfoRow label="Country" value={employee?.country} />
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Emergency Contact</Typography>
                  <InfoRow label="Name" value={employee?.emergencyContactName} />
                  <InfoRow label="Phone" value={employee?.emergencyContactPhone} />
                  <InfoRow label="Relationship" value={employee?.emergencyContactRelationship} />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Attendance Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <DataGrid
                  rows={attendanceData || []}
                  columns={attendanceColumns}
                  loading={!attendanceData}
                  pageSizeOptions={[25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  density="compact"
                  autoHeight
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Summary</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box height={200}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={attendanceStatusColors[entry.name] || '#757575'} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
                {Object.entries(attendanceSummary).map(([status, count]) => (
                  <Box key={status} display="flex" justifyContent="space-between" py={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box width={12} height={12} borderRadius="50%" bgcolor={attendanceStatusColors[status]} />
                      <Typography variant="body2">{status}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{count} days</Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Payroll Tab */}
          <TabPanel value={activeTab} index={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Payroll history is linked to payroll periods. View detailed payslips from the Payroll module.
            </Alert>
            <Button
              variant="contained"
              startIcon={<LocalAtm />}
              onClick={() => navigate(`/payroll?employeeId=${id}`)}
              sx={{ mb: 2 }}
            >
              View Payroll History
            </Button>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                Detailed payroll information available in the Payroll module
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Current Salary: {employee?.currency} {((employee?.basicSalary || 0) + (employee?.housingAllowance || 0) + (employee?.transportAllowance || 0)).toLocaleString()}
              </Typography>
            </Paper>
          </TabPanel>

          {/* Leaves Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Leave Balance</Typography>
              <Button variant="contained" startIcon={<BeachAccess />} onClick={() => setLeaveFormOpen(true)}>
                Request Leave
              </Button>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {(leaveBalance || []).map((lb) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={lb.leaveType}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="caption" color="text.secondary">{lb.leaveType}</Typography>
                      <Typography variant="h5" fontWeight={700} color="primary">{lb.remainingDays}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        of {lb.totalDays} remaining
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" fontWeight={600} gutterBottom>Leave History</Typography>
            <DataGrid
              rows={leaveRequests?.data || []}
              columns={leaveColumns}
              loading={!leaveRequests}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              density="compact"
              autoHeight
            />

            {/* Leave Request Dialog */}
            <Dialog open={leaveFormOpen} onClose={() => setLeaveFormOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Request Leave</DialogTitle>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <form onSubmit={leaveFormik.handleSubmit}>
                  <DialogContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          select
                          size="small"
                          label="Leave Type"
                          name="leaveType"
                          value={leaveFormik.values.leaveType}
                          onChange={leaveFormik.handleChange}
                          error={leaveFormik.touched.leaveType && Boolean(leaveFormik.errors.leaveType)}
                        >
                          <MenuItem value="ANNUAL">Annual Leave</MenuItem>
                          <MenuItem value="SICK">Sick Leave</MenuItem>
                          <MenuItem value="UNPAID">Unpaid Leave</MenuItem>
                          <MenuItem value="EMERGENCY">Emergency Leave</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                          label="Start Date"
                          value={leaveFormik.values.startDate}
                          onChange={(v) => leaveFormik.setFieldValue('startDate', v)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              error: leaveFormik.touched.startDate && Boolean(leaveFormik.errors.startDate),
                              helperText: leaveFormik.touched.startDate && typeof leaveFormik.errors.startDate === 'string' ? leaveFormik.errors.startDate : '',
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                          label="End Date"
                          value={leaveFormik.values.endDate}
                          onChange={(v) => leaveFormik.setFieldValue('endDate', v)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              error: leaveFormik.touched.endDate && Boolean(leaveFormik.errors.endDate),
                              helperText: leaveFormik.touched.endDate && typeof leaveFormik.errors.endDate === 'string' ? leaveFormik.errors.endDate : '',
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                          label="Reason"
                          name="reason"
                          value={leaveFormik.values.reason}
                          onChange={leaveFormik.handleChange}
                          error={leaveFormik.touched.reason && Boolean(leaveFormik.errors.reason)}
                          helperText={leaveFormik.touched.reason && leaveFormik.errors.reason}
                        />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setLeaveFormOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={leaveMutation.isPending}>
                      {leaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </DialogActions>
                </form>
              </LocalizationProvider>
            </Dialog>
          </TabPanel>

          {/* Documents Tab */}
          <TabPanel value={activeTab} index={4}>
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Document Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload and manage employee documents (contracts, IDs, certifications)
              </Typography>
              <Button variant="outlined" component="label">
                Upload Document
                <input type="file" hidden />
              </Button>
              <List sx={{ mt: 3, textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
                {['Employment Contract', 'National ID Copy', 'Academic Certificates', 'Work Visa'].map((doc) => (
                  <ListItem key={doc} divider>
                    <ListItemText primary={doc} secondary="Not uploaded" />
                    <Button size="small" variant="outlined">Upload</Button>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={activeTab} index={5}>
            <Timeline>
              {[
                { label: 'Profile Created', date: employee?.createdAt },
                { label: 'Last Updated', date: employee?.updatedAt },
              ].map((activity, idx) => (
                <Box key={idx} sx={{ display: 'flex', mb: 2 }}>
                  <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                    {idx < 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{activity.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.date ? new Date(activity.date).toLocaleString() : '-'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Timeline>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeDetail;
