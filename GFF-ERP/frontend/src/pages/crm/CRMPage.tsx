import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Alert,
  Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Chip
} from '@mui/material';
import {
  People, TrendingUp, AttachMoney, PendingActions,
  CheckCircle, Warning, Star, Schedule
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { apiService } from '../../services/api';
import { Activity } from '../../types';

const COLORS = ['#2e7d32', '#ed6c02', '#0288d1', '#d32f2f', '#9c27b0', '#757575'];
const FUNNEL_COLORS = ['#2e7d32', '#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'];

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

const CRMPage: React.FC = () => {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => apiService.getCRMDashboard(),
    refetchInterval: 300000,
  });

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load CRM dashboard data.
      </Alert>
    );
  }

  const kpiData = [
    {
      title: 'Total Leads',
      value: dashboard?.totalLeads ?? 0,
      icon: <People />,
      color: '#2e7d32',
      subtitle: 'All time leads',
    },
    {
      title: 'New This Month',
      value: dashboard?.newLeadsThisMonth ?? 0,
      icon: <TrendingUp />,
      color: '#ed6c02',
      subtitle: 'New leads added',
    },
    {
      title: 'Conversion Rate',
      value: `${(dashboard?.conversionRate ?? 0).toFixed(1)}%`,
      icon: <CheckCircle />,
      color: '#0288d1',
      subtitle: 'Lead to customer',
    },
    {
      title: 'Won Deals Value',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(dashboard?.wonDealsValue ?? 0),
      icon: <AttachMoney />,
      color: '#2e7d32',
      subtitle: 'Total won deals',
    },
    {
      title: 'Pending Activities',
      value: dashboard?.pendingActivities ?? 0,
      icon: <PendingActions />,
      color: '#d32f2f',
      subtitle: 'Require attention',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        CRM Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiData.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: true }} key={kpi.title}>
            <KPICard {...kpi} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Lead Source Breakdown
              </Typography>
              <Box height={280}>
                {isLoading ? (
                  <Skeleton variant="circular" width={280} height={280} sx={{ mx: 'auto' }} />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboard?.leadSourceBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(dashboard?.leadSourceBreakdown || []).map((_: unknown, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Lead Status Pipeline
              </Typography>
              <Box height={280}>
                {isLoading ? (
                  <Skeleton variant="rectangular" width="100%" height={280} />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={dashboard?.leadStatusDistribution || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {(dashboard?.leadStatusDistribution || []).map((_: unknown, index: number) => (
                          <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Top Sales Reps
              </Typography>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={50} sx={{ mb: 1 }} />
                ))
              ) : (
                <List dense>
                  {(dashboard?.topSalesReps || []).map((rep, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: idx === 0 ? '#ffb300' : idx === 1 ? '#9e9e9e' : idx === 2 ? '#cd7f32' : 'primary.main', width: 36, height: 36 }}>
                            <Star fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={rep.name}
                          secondary={`${rep.deals} deals won \u00b7 ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rep.value)}`}
                        />
                        <Chip label={`#${idx + 1}`} size="small" color={idx === 0 ? 'warning' : 'default'} />
                      </ListItem>
                      {idx < (dashboard?.topSalesReps?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Activities
              </Typography>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : (
                <List dense>
                  {(dashboard?.recentActivities || []).map((activity: Activity, idx: number) => (
                    <React.Fragment key={activity.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 32, height: 32 }}>
                            <Schedule fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.subject}
                          secondary={`${activity.type} \u00b7 ${activity.relatedToName} \u00b7 ${new Date(activity.createdAt).toLocaleDateString()}`}
                        />
                        <Chip
                          label={activity.status}
                          size="small"
                          color={activity.status === 'COMPLETED' ? 'success' : activity.status === 'OVERDUE' ? 'error' : 'warning'}
                          variant="outlined"
                        />
                      </ListItem>
                      {idx < (dashboard?.recentActivities?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Overdue Activities
                </Typography>
                <Chip
                  label={dashboard?.overdueActivities?.length || 0}
                  color="error"
                  size="small"
                />
              </Box>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))
              ) : (
                <List dense>
                  {(dashboard?.overdueActivities || []).slice(0, 5).map((activity: Activity, idx: number) => (
                    <React.Fragment key={activity.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'error.50', color: 'error.main', width: 32, height: 32 }}>
                            <Warning fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.subject}
                          secondary={`${activity.type} \u00b7 ${activity.relatedToName} \u00b7 Due: ${new Date(activity.dueDate).toLocaleDateString()}`}
                        />
                        <Chip label="OVERDUE" size="small" color="error" />
                      </ListItem>
                      {idx < Math.min((dashboard?.overdueActivities?.length || 0), 5) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CRMPage;
