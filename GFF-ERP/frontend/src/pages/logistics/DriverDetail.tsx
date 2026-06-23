import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button,
  IconButton, Chip, Skeleton, Alert, Paper, Divider, Rating,
  Avatar, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  ArrowBack, Edit, LocalShipping, Build, Event,
  Phone, Email, CalendarMonth, Star, Verified, IconButton
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { apiService } from '../../services/api';
import { DriverStatus, Trip } from '../../types';

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: '#2e7d32',
  ON_TRIP: '#0288d1',
  OFF_DUTY: '#757575',
  SUSPENDED: '#d32f2f',
};

interface TabPanelProps { children: React.ReactNode; value: number; index: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" py={0.75}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
  </Box>
);

const DriverDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => apiService.getDriver(id!),
    enabled: !!id,
  });

  if (error) return <Alert severity="error" sx={{ m: 3 }}>Failed to load driver details.</Alert>;

  const performanceData = [
    { metric: 'Safety', score: 90 },
    { metric: 'Punctuality', score: 85 },
    { metric: 'Fuel Efficiency', score: 78 },
    { metric: 'Customer Service', score: 92 },
    { metric: 'Vehicle Care', score: 88 },
    { metric: 'Compliance', score: 95 },
  ];

  const tripColumns: GridColDef[] = [
    { field: 'tripNumber', headerName: 'Trip #', width: 120 },
    { field: 'vehicleCode', headerName: 'Vehicle', width: 120 },
    { field: 'type', headerName: 'Type', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'default'} variant="outlined" />
      ),
    },
    { field: 'startDate', headerName: 'Date', width: 120, valueFormatter: (v: string) => new Date(v).toLocaleDateString() },
    { field: 'distance', headerName: 'Distance', width: 100, type: 'number' },
    { field: 'totalCost', headerName: 'Cost', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
  ];

  const mockTrips: Trip[] = driver ? [
    { id: '1', tripNumber: 'TRP-001', vehicleId: 'v1', vehicleCode: 'VH-A001', vehicleName: 'Toyota Hilux', driverId: driver.id, driverName: `${driver.firstName} ${driver.lastName}`, type: 'DELIVERY', status: 'COMPLETED', startDate: new Date().toISOString(), expectedEndDate: new Date().toISOString(), distance: 120, fuelCost: 35, otherCosts: 10, totalCost: 85, notes: '', stops: [], createdAt: '' },
    { id: '2', tripNumber: 'TRP-015', vehicleId: 'v2', vehicleCode: 'VH-B003', vehicleName: 'Ford Transit', driverId: driver.id, driverName: `${driver.firstName} ${driver.lastName}`, type: 'PICKUP', status: 'COMPLETED', startDate: new Date().toISOString(), expectedEndDate: new Date().toISOString(), distance: 85, fuelCost: 22, otherCosts: 5, totalCost: 55, notes: '', stops: [], createdAt: '' },
  ] : [];

  const availabilityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const availabilityMap: Record<string, string> = { 'Mon': 'AVAILABLE', 'Tue': 'AVAILABLE', 'Wed': 'ON_TRIP', 'Thu': 'AVAILABLE', 'Fri': 'AVAILABLE', 'Sat': 'OFF_DUTY', 'Sun': 'OFF_DUTY' };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/drivers')}><ArrowBack /></IconButton>
          <Typography variant="h4" fontWeight={700}>Driver Profile</Typography>
        </Box>
        <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/drivers/edit/${id}`)}>Edit</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {isLoading ? <Skeleton height={80} /> : driver ? (
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: statusColors[driver.status], fontSize: 28 }}>
                    {driver.firstName[0]}{driver.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{driver.firstName} {driver.lastName}</Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Chip label={driver.status} size="small" sx={{ bgcolor: `${statusColors[driver.status]}15`, color: statusColors[driver.status], fontWeight: 600 }} />
                      <Rating value={driver.rating || 0} readOnly size="small" precision={0.5} />
                      <Typography variant="body2" color="text.secondary">({driver.yearsExperience} yrs exp)</Typography>
                    </Box>
                    <Box display="flex" gap={1} mt={0.5}>
                      {driver.certifications?.map((cert, i) => (
                        <Chip key={i} label={cert} size="small" variant="outlined" icon={<Verified fontSize="small" />} />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" flexWrap="wrap" gap={3}>
                  <Box><Phone fontSize="small" color="action" /><Typography variant="body2" fontWeight={600">{driver.phone}</Typography></Box>
                  <Box><Email fontSize="small" color="action" /><Typography variant="body2">{driver.email}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Branch</Typography><Typography variant="body2" fontWeight={600">{driver.branch}</Typography></Box>
                </Box>
              </Grid>
            </Grid>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Information" icon={<Phone fontSize="small" />} iconPosition="start" />
          <Tab label="Trips" icon={<LocalShipping fontSize="small" />} iconPosition="start" />
          <Tab label="Performance" icon={<Star fontSize="small" />} iconPosition="start" />
          <Tab label="Schedule" icon={<Event fontSize="small" />} iconPosition="start" />
        </Tabs>

        <CardContent>
          <TabPanel value={activeTab} index={0}>
            {isLoading ? <Skeleton height={200} /> : driver && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>License Information</Typography>
                    <InfoRow label="License Number" value={driver.licenseNumber} />
                    <InfoRow label="License Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : '-'} />
                    <InfoRow label="License Class" value={driver.licenseClass} />
                    <InfoRow label="Years Experience" value={driver.yearsExperience} />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Contact</Typography>
                    <InfoRow label="Phone" value={driver.phone} />
                    <InfoRow label="Email" value={driver.email} />
                    <InfoRow label="Date of Birth" value={driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : '-'} />
                    <InfoRow label="Hire Date" value={driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : '-'} />
                    <InfoRow label="Branch" value={driver.branch} />
                  </Paper>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <DataGrid rows={mockTrips} columns={tripColumns} pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} density="compact" autoHeight disableRowSelectionOnClick />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Performance Radar</Typography>
                <Box height={350}>
                  <ResponsiveContainer>
                    <RadarChart data={performanceData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Score" dataKey="score" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Metrics</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {performanceData.map((item) => (
                    <Box key={item.metric} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                      <Typography variant="body2">{item.metric}</Typography>
                      <Chip label={`${item.score}/100`} size="small" color={item.score >= 90 ? 'success' : item.score >= 75 ? 'primary' : 'warning'} />
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Weekly Availability</Typography>
            <Grid container spacing={2}>
              {availabilityDays.map((day) => (
                <Grid size={{ xs: 6, sm: 4, md: true }} key={day}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 1, bgcolor: availabilityMap[day] === 'AVAILABLE' ? 'success.50' : availabilityMap[day] === 'ON_TRIP' ? 'info.50' : 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight={600">{day}</Typography>
                    <Chip label={availabilityMap[day]} size="small" sx={{ mt: 0.5, fontSize: '0.65rem' }} color={availabilityMap[day] === 'AVAILABLE' ? 'success' : availabilityMap[day] === 'ON_TRIP' ? 'primary' : 'default'} variant="outlined" />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DriverDetail;
