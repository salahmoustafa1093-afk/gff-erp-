import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Skeleton, Alert,
  Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider,
  Chip, IconButton, Tooltip, Paper
} from '@mui/material';
import {
  People, PersonAdd, PersonOff, TrendingUp,
  WorkOutline, AttachMoney, Celebration, Event,
  CheckCircle, PendingActions
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { apiService } from '../../services/api';
import { LeaveRequest } from '../../types';

const COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1', '#9c27b0', '#757575'];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#2e7d32',
  INACTIVE: '#757575',
  TERMINATED: '#d32f2f',
  ON_LEAVE: '#0288d1',
  SUSPENDED: '#ed6c02',
};

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}> = ({ title, value, icon, color, subtitle, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography color="text.secondary" variant="body2" fontWeight={500} gutterBottom>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={80} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700} color={color}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const HRDashboardPage: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['hr-dashboard'],
    queryFn: () => apiService.getHRDashboard(),
    refetchInterval: 300000,
  });

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load dashboard data. Please try again later.
      </Alert>
    );
  }

  const kpiData = [
    {
      title: 'Total Employees',
      value: dashboard?.totalEmployees ?? 0,
      icon: <People />,
      color: '#2e7d32',
      subtitle: `${dashboard?.activeEmployees ?? 0} active`,
    },
    {
      title: 'On Leave',
      value: dashboard?.onLeave ?? 0,
      icon: <PersonOff />,
      color: '#ed6c02',
      subtitle: 'Currently on leave',
    },
    {
      title: 'Attendance Rate',
      value: `${dashboard?.attendanceRate ?? 0}%`,
      icon: <TrendingUp />,
      color: '#0288d1',
      subtitle: 'Today\'s rate',
    },
    {
      title: 'Open Positions',
      value: dashboard?.openPositions ?? 0,
      icon: <WorkOutline />,
      color: '#9c27b0',
      subtitle: 'Active job openings',
    },
    {
      title: 'Payroll This Month',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: dashboard?.currentPayrollPeriod?.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(dashboard?.payrollThisMonth ?? 0),
      icon: <AttachMoney />,
      color: '#2e7d32',
      subtitle: dashboard?.currentPayrollPeriod?.name || 'Current period',
    },
    {
      title: 'Pending Leaves',
      value: dashboard?.pendingLeaveRequests?.length ?? 0,
      icon: <PendingActions />,
      color: '#d32f2f',
      subtitle: 'Awaiting approval',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        HR Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiData.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={kpi.title}>
            <KPICard {...kpi} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Department Distribution
              </Typography>
              <Box height={280}>
                {isLoading ? (
                  <Skeleton variant="circular" width={280} height={280} sx={{ mx: 'auto' }} />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboard?.departmentDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(dashboard?.departmentDistribution || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Gender Distribution
              </Typography>
              <Box height={280}>
                {isLoading ? (
                  <Skeleton variant="circular" width={280} height={280} sx={{ mx: 'auto' }} />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboard?.genderDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(dashboard?.genderDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'MALE' ? '#0288d1' : entry.name === 'FEMALE' ? '#d32f2f' : '#757575'} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Employee Status
              </Typography>
              <Box height={280}>
                {isLoading ? (
                  <Skeleton variant="rectangular" width="100%" height={280} />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={dashboard?.statusDistribution || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {(dashboard?.statusDistribution || []).map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#757575'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Upcoming Events */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Upcoming Birthdays
              </Typography>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : (
                <List dense>
                  {(dashboard?.upcomingBirthdays || []).map((bday, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#e91e6315', color: '#e91e63' }}>
                            <Celebration fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={bday.name}
                          secondary={`${bday.department} \u00b7 ${new Date(bday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        />
                      </ListItem>
                      {idx < (dashboard?.upcomingBirthdays?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                  {(dashboard?.upcomingBirthdays || []).length === 0 && (
                    <Typography color="text.secondary" align="center" py={2}>
                      No upcoming birthdays
                    </Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Anniversaries */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Work Anniversaries
              </Typography>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : (
                <List dense>
                  {(dashboard?.upcomingAnniversaries || []).map((anniv, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#2e7d3215', color: '#2e7d32' }}>
                            <Event fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={anniv.name}
                          secondary={`${anniv.years} years \u00b7 ${new Date(anniv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        />
                      </ListItem>
                      {idx < (dashboard?.upcomingAnniversaries?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                  {(dashboard?.upcomingAnniversaries || []).length === 0 && (
                    <Typography color="text.secondary" align="center" py={2}>
                      No upcoming anniversaries
                    </Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Leave Requests */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Pending Leaves
                </Typography>
                <Chip
                  label={dashboard?.pendingLeaveRequests?.length || 0}
                  color="warning"
                  size="small"
                />
              </Box>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : (
                <List dense>
                  {(dashboard?.pendingLeaveRequests || []).slice(0, 5).map((leave: LeaveRequest) => (
                    <ListItem
                      key={leave.id}
                      secondaryAction={
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => apiService.approveLeave(leave.id, true)}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={leave.employeeName}
                        secondary={`${leave.leaveType} \u00b7 ${leave.days} days \u00b7 ${new Date(leave.startDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                  {(dashboard?.pendingLeaveRequests || []).length === 0 && (
                    <Typography color="text.secondary" align="center" py={2}>
                      No pending requests
                    </Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HRDashboardPage;
