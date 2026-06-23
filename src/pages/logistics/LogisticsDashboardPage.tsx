import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Alert,
  Avatar, LinearProgress, Chip, Tooltip, IconButton, List,
  ListItem, ListItemText, ListItemIcon, Divider
} from '@mui/material';
import {
  LocalShipping, DeliveryDining, PendingActions,
  DirectionsCar, Person, LocalGasStation,
  Build, Warning, Speed, CheckCircle
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { apiService } from '../../services/api';
import { MaintenanceRecord, Trip } from '../../types';

const VEHICLE_COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#0288d1'];
const TRIP_COLORS = ['#2e7d32', '#0288d1', '#ed6c02', '#d32f2f'];

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

const LogisticsDashboardPage: React.FC = () => {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['logistics-dashboard'],
    queryFn: () => apiService.getLogisticsDashboard(),
    refetchInterval: 300000,
  });

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load logistics dashboard.
      </Alert>
    );
  }

  const kpiData = [
    {
      title: 'Active Trips',
      value: dashboard?.activeTrips ?? 0,
      icon: <LocalShipping />,
      color: '#2e7d32',
      subtitle: 'In progress',
    },
    {
      title: 'Today Deliveries',
      value: dashboard?.todayDeliveries ?? 0,
      icon: <DeliveryDining />,
      color: '#0288d1',
      subtitle: 'Completed today',
    },
    {
      title: 'Pending Deliveries',
      value: dashboard?.pendingDeliveries ?? 0,
      icon: <PendingActions />,
      color: '#ed6c02',
      subtitle: 'Scheduled',
    },
    {
      title: 'Available Vehicles',
      value: dashboard?.availableVehicles ?? 0,
      icon: <DirectionsCar />,
      color: '#2e7d32',
      subtitle: 'Ready for dispatch',
    },
    {
      title: 'Available Drivers',
      value: dashboard?.availableDrivers ?? 0,
      icon: <Person />,
      color: '#0288d1',
      subtitle: 'On duty',
    },
    {
      title: 'Fuel Cost Today',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(dashboard?.fuelCostToday ?? 0),
      icon: <LocalGasStation />,
      color: '#ed6c02',
      subtitle: 'Total fuel spend',
    },
  ];

  const deliveryPerformance = dashboard?.deliveryPerformance;
  const onTimeRate = deliveryPerformance?.total
    ? ((deliveryPerformance.onTime / deliveryPerformance.total) * 100).toFixed(0)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Logistics Dashboard
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
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Vehicle Status
              </Typography>
              <Box height={250}>
                {isLoading ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboard?.vehicleStatusDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(dashboard?.vehicleStatusDistribution || []).map((_: unknown, index: number) => (
                          <Cell key={index} fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]} />
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

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Trip Status
              </Typography>
              <Box height={250}>
                {isLoading ? (
                  <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboard?.tripStatusDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(dashboard?.tripStatusDistribution || []).map((_: unknown, index: number) => (
                          <Cell key={index} fill={TRIP_COLORS[index % TRIP_COLORS.length]} />
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

        {/* Fuel Consumption Trend */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Fuel Consumption Trend
              </Typography>
              <Box height={250}>
                {isLoading ? (
                  <Skeleton variant="rectangular" width="100%" height={250} />
                ) : (
                  <ResponsiveContainer>
                    <LineChart data={dashboard?.fuelConsumptionTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="cost" name="Cost ($)" stroke="#d32f2f" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="liters" name="Liters" stroke="#0288d1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Trips */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Trips
              </Typography>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)
              ) : (
                <List dense>
                  {(dashboard?.recentTrips || []).map((trip: Trip, idx: number) => (
                    <React.Fragment key={trip.id}>
                      <ListItem
                        secondaryAction={
                          <Chip
                            label={trip.status}
                            size="small"
                            color={trip.status === 'COMPLETED' ? 'success' : trip.status === 'IN_PROGRESS' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocalShipping fontSize="small" color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${trip.tripNumber} - ${trip.vehicleCode}`}
                          secondary={`${trip.driverName} | ${trip.distance}km | $${trip.totalCost?.toFixed(2)}`}
                        />
                      </ListItem>
                      {idx < (dashboard?.recentTrips?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Alerts & Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Maintenance Alerts
              </Typography>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)
              ) : (
                <List dense>
                  {(dashboard?.maintenanceAlerts || []).map((alert: MaintenanceRecord, idx: number) => (
                    <React.Fragment key={alert.id}>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Warning fontSize="small" color={alert.status === 'SCHEDULED' ? 'warning' : 'error'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${alert.vehicleCode} - ${alert.type}`}
                          secondary={`${alert.description} | ${new Date(alert.serviceDate).toLocaleDateString()}`}
                        />
                      </ListItem>
                      {idx < (dashboard?.maintenanceAlerts?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                  {(dashboard?.maintenanceAlerts || []).length === 0 && (
                    <Typography color="text.secondary" align="center" py={2}>
                      No maintenance alerts
                    </Typography>
                  )}
                </List>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Delivery Performance Gauge */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Delivery Performance
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={Number(onTimeRate)}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: 'error.100',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: Number(onTimeRate) >= 90 ? 'success.main' : Number(onTimeRate) >= 70 ? 'warning.main' : 'error.main',
                        borderRadius: 6,
                      }
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700} color={
                  Number(onTimeRate) >= 90 ? 'success.main' : Number(onTimeRate) >= 70 ? 'warning.main' : 'error.main'
                }>
                  {onTimeRate}%
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="success.main">
                  <CheckCircle fontSize="inherit" /> On Time: {deliveryPerformance?.onTime || 0}
                </Typography>
                <Typography variant="caption" color="error.main">
                  Delayed: {deliveryPerformance?.delayed || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LogisticsDashboardPage;
