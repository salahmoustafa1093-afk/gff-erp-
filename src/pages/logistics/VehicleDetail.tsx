import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button,
  IconButton, Chip, Skeleton, Alert, Paper, Divider, Avatar
} from '@mui/material';
import {
  ArrowBack, Edit, Build, LocalGasStation, LocalShipping, Speed, Today
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { apiService } from '../../services/api';
import { VehicleStatus } from '../../types';

const statusColors: Record<VehicleStatus, string> = {
  ACTIVE: '#2e7d32',
  MAINTENANCE: '#ed6c02',
  RETIRED: '#d32f2f',
  IN_USE: '#0288d1',
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

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => apiService.getVehicle(id!),
    enabled: !!id,
  });

  const { data: fuelEfficiency } = useQuery({
    queryKey: ['fuel-efficiency', id],
    queryFn: () => apiService.getFuelEfficiency(id!),
    enabled: !!id && activeTab === 2,
  });

  const tripColumns: GridColDef[] = [
    { field: 'tripNumber', headerName: 'Trip #', width: 120 },
    { field: 'driverName', headerName: 'Driver', width: 140 },
    { field: 'type', headerName: 'Type', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'default'} variant="outlined" />
      ),
    },
    {
      field: 'startDate',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    { field: 'distance', headerName: 'Distance (km)', width: 110, type: 'number' },
    { field: 'fuelCost', headerName: 'Fuel Cost', width: 90, type: 'number', valueFormatter: (v: number) => v ? `$${v.toFixed(2)}` : '-' },
    { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
  ];

  const fuelColumns: GridColDef[] = [
    { field: 'date', headerName: 'Date', width: 120, valueFormatter: (value: string) => new Date(value).toLocaleDateString() },
    { field: 'odometer', headerName: 'Odometer', width: 100, type: 'number' },
    { field: 'fuelAmount', headerName: 'Amount (L)', width: 110, type: 'number' },
    { field: 'fuelPrice', headerName: 'Price/L', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    { field: 'totalCost', headerName: 'Total', width: 90, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    { field: 'station', headerName: 'Station', width: 140 },
  ];

  const maintenanceColumns: GridColDef[] = [
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'cost', headerName: 'Cost', width: 100, type: 'number', valueFormatter: (v: number) => `$${v?.toFixed(2)}` },
    { field: 'serviceDate', headerName: 'Date', width: 120, valueFormatter: (value: string) => new Date(value).toLocaleDateString() },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'COMPLETED' ? 'success' : params.value === 'IN_PROGRESS' ? 'primary' : 'warning'} variant="outlined" />
      ),
    },
    { field: 'serviceProvider', headerName: 'Provider', width: 140 },
  ];

  const mockTrips = vehicle ? [
    { id: '1', tripNumber: 'TRP-001', driverName: 'John Doe', type: 'DELIVERY', status: 'COMPLETED', startDate: new Date().toISOString(), distance: 150, fuelCost: 45, totalCost: 120 },
    { id: '2', tripNumber: 'TRP-002', driverName: 'Jane Smith', type: 'PICKUP', status: 'COMPLETED', startDate: new Date().toISOString(), distance: 80, fuelCost: 25, totalCost: 80 },
  ] : [];

  const mockFuelLogs = vehicle ? [
    { id: '1', date: new Date().toISOString(), odometer: 45200, fuelAmount: 45, fuelPrice: 1.2, totalCost: 54, station: 'Shell Station 1' },
    { id: '2', date: new Date().toISOString(), odometer: 45000, fuelAmount: 38, fuelPrice: 1.15, totalCost: 43.7, station: 'Total Station' },
  ] : [];

  const mockMaintenance = vehicle ? [
    { id: '1', type: 'OIL_CHANGE', description: 'Regular oil change and filter replacement', cost: 85, serviceDate: new Date().toISOString(), status: 'COMPLETED', serviceProvider: 'Auto Service Center' },
    { id: '2', type: 'INSPECTION', description: 'Annual safety inspection', cost: 40, serviceDate: new Date().toISOString(), status: 'COMPLETED', serviceProvider: 'City Inspection Station' },
  ] : [];

  const costData = [
    { category: 'Fuel', amount: 2500 },
    { category: 'Maintenance', amount: 850 },
    { category: 'Insurance', amount: 1200 },
    { category: 'Other', amount: 300 },
  ];

  if (error) return <Alert severity="error" sx={{ m: 3 }}>Failed to load vehicle details.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/vehicles')}><ArrowBack /></IconButton>
          <Typography variant="h4" fontWeight={700}>Vehicle Details</Typography>
        </Box>
        <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/vehicles/edit/${id}`)}>
          Edit
        </Button>
      </Box>

      {/* Vehicle Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {isLoading ? <Skeleton height={80} /> : vehicle ? (
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: statusColors[vehicle.status], fontSize: 28 }}>
                    <LocalShipping />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{vehicle.code}</Typography>
                    <Typography variant="body1" color="text.secondary">{vehicle.make} {vehicle.model} ({vehicle.year})</Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      <Chip label={vehicle.status} size="small" sx={{ bgcolor: `${statusColors[vehicle.status]}15`, color: statusColors[vehicle.status], fontWeight: 600 }} />
                      <Chip label={vehicle.type} size="small" variant="outlined" />
                      <Chip label={vehicle.fuelType} size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" flexWrap="wrap" gap={3}>
                  <Box><Typography variant="caption" color="text.secondary">License Plate</Typography><Typography variant="body2" fontWeight={600}>{vehicle.licensePlate}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Mileage</Typography><Typography variant="body2" fontWeight={600}>{vehicle.currentMileage?.toLocaleString()} km</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Branch</Typography><Typography variant="body2" fontWeight={600}>{vehicle.branch}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Capacity</Typography><Typography variant="body2" fontWeight={600}>{vehicle.capacity} kg</Typography></Box>
                </Box>
              </Grid>
            </Grid>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" icon={<Speed fontSize="small" />} iconPosition="start" />
          <Tab label="Trips" icon={<LocalShipping fontSize="small" />} iconPosition="start" />
          <Tab label="Fuel Logs" icon={<LocalGasStation fontSize="small" />} iconPosition="start" />
          <Tab label="Maintenance" icon={<Build fontSize="small" />} iconPosition="start" />
          <Tab label="Cost Analysis" icon={<Today fontSize="small" />} iconPosition="start" />
        </Tabs>

        <CardContent>
          {/* Overview */}
          <TabPanel value={activeTab} index={0}>
            {isLoading ? <Skeleton height={200} /> : vehicle && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Vehicle Information</Typography>
                    <InfoRow label="Code" value={vehicle.code} />
                    <InfoRow label="Type" value={vehicle.type} />
                    <InfoRow label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
                    <InfoRow label="Year" value={vehicle.year} />
                    <InfoRow label="License Plate" value={vehicle.licensePlate} />
                    <InfoRow label="Chassis Number" value={vehicle.chassisNumber} />
                    <InfoRow label="Engine Number" value={vehicle.engineNumber} />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Specifications</Typography>
                    <InfoRow label="Capacity" value={`${vehicle.capacity} kg`} />
                    <InfoRow label="Fuel Type" value={vehicle.fuelType} />
                    <InfoRow label="Fuel Capacity" value={`${vehicle.fuelCapacity} L`} />
                    <InfoRow label="Current Mileage" value={`${vehicle.currentMileage?.toLocaleString()} km`} />
                    <InfoRow label="Purchase Date" value={vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : '-'} />
                    <InfoRow label="Purchase Cost" value={vehicle.purchaseCost ? `$${vehicle.purchaseCost.toLocaleString()}` : '-'} />
                    <InfoRow label="Branch" value={vehicle.branch} />
                  </Paper>
                </Grid>
                {fuelEfficiency && (
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 4 }} textAlign="center">
                          <Typography variant="caption" color="text.secondary">Avg. Fuel Consumption</Typography>
                          <Typography variant="h5" fontWeight={700} color="primary.main">{fuelEfficiency.avgConsumption.toFixed(1)} L/100km</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }} textAlign="center">
                          <Typography variant="caption" color="text.secondary">Total Fuel Cost</Typography>
                          <Typography variant="h5" fontWeight={700} color="error.main">${fuelEfficiency.totalCost.toLocaleString()}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }} textAlign="center">
                          <Typography variant="caption" color="text.secondary">Total Distance</Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main">{fuelEfficiency.totalDistance.toLocaleString()} km</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </TabPanel>

          {/* Trips */}
          <TabPanel value={activeTab} index={1}>
            <DataGrid rows={mockTrips} columns={tripColumns} pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} density="compact" autoHeight disableRowSelectionOnClick />
          </TabPanel>

          {/* Fuel Logs */}
          <TabPanel value={activeTab} index={2}>
            <DataGrid rows={mockFuelLogs} columns={fuelColumns} pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} density="compact" autoHeight disableRowSelectionOnClick />
          </TabPanel>

          {/* Maintenance */}
          <TabPanel value={activeTab} index={3}>
            <DataGrid rows={mockMaintenance} columns={maintenanceColumns} pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} density="compact" autoHeight disableRowSelectionOnClick />
          </TabPanel>

          {/* Cost Analysis */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Cost Breakdown</Typography>
                <Box height={300}>
                  <ResponsiveContainer>
                    <BarChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => `$${value}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#2e7d32" radius={[4, 4, 0, 0]} name="Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Summary</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {costData.map((item) => (
                    <Box key={item.category} display="flex" justifyContent="space-between" py={1}>
                      <Typography variant="body2">{item.category}</Typography>
                      <Typography variant="body2" fontWeight={600}>${item.amount.toLocaleString()}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">${costData.reduce((s, i) => s + i.amount, 0).toLocaleString()}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VehicleDetail;
