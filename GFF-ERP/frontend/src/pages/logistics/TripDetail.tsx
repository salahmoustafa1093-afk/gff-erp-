import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, IconButton,
  Chip, Skeleton, Alert, Paper, Divider, Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import {
  ArrowBack, PlayArrow, CheckCircle, Cancel, LocalShipping,
  LocationOn, Phone, Person, AttachMoney, Speed, Avatar
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { Trip, TripStatus } from '../../types';

const statusColors: Record<TripStatus, string> = {
  SCHEDULED: '#0288d1',
  IN_PROGRESS: '#ed6c02',
  COMPLETED: '#2e7d32',
  CANCELLED: '#d32f2f',
};

const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => apiService.getTrip(id!),
    enabled: !!id,
  });

  const startMutation = useMutation({
    mutationFn: () => apiService.startTrip(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => apiService.completeTrip(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiService.cancelTrip(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
  });

  if (error) return <Alert severity="error" sx={{ m: 3 }}>Failed to load trip.</Alert>;

  const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Box display="flex" justifyContent="space-between" py={0.75}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/trips')}><ArrowBack /></IconButton>
          <Typography variant="h4" fontWeight={700}>Trip Detail</Typography>
        </Box>
        <Box display="flex" gap={1}>
          {trip?.status === 'SCHEDULED' && (
            <Button variant="contained" color="primary" startIcon={<PlayArrow />} onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              {startMutation.isPending ? 'Starting...' : 'Start Trip'}
            </Button>
          )}
          {trip?.status === 'IN_PROGRESS' && (
            <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? 'Completing...' : 'Complete Trip'}
            </Button>
          )}
          {(trip?.status === 'SCHEDULED' || trip?.status === 'IN_PROGRESS') && (
            <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      {/* Trip Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {isLoading ? <Skeleton height={80} /> : trip ? (
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: statusColors[trip.status], fontSize: 28 }}>
                    <LocalShipping />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700">{trip.tripNumber}</Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      <Chip label={trip.status} size="small" sx={{ bgcolor: `${statusColors[trip.status]}15`, color: statusColors[trip.status], fontWeight: 600 }} />
                      <Chip label={trip.type} size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" flexWrap="wrap" gap={3}>
                  <Box><Typography variant="caption" color="text.secondary">Vehicle</Typography><Typography variant="body2" fontWeight={600">{trip.vehicleCode}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Driver</Typography><Typography variant="body2" fontWeight={600">{trip.driverName}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Distance</Typography><Typography variant="body2" fontWeight={600">{trip.distance} km</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Total Cost</Typography><Typography variant="body2" fontWeight={600} color="primary.main">${trip.totalCost?.toFixed(2)}</Typography></Box>
                </Box>
              </Grid>
            </Grid>
          ) : null}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Trip Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Trip Information</Typography>
              {isLoading ? <Skeleton height={200} /> : trip && (
                <>
                  <InfoRow label="Trip Number" value={trip.tripNumber} />
                  <InfoRow label="Type" value={trip.type} />
                  <InfoRow label="Status" value={<Chip label={trip.status} size="small" sx={{ color: statusColors[trip.status], bgcolor: `${statusColors[trip.status]}15` }} />} />
                  <InfoRow label="Vehicle" value={trip.vehicleCode} />
                  <InfoRow label="Driver" value={trip.driverName} />
                  <InfoRow label="Start Date" value={new Date(trip.startDate).toLocaleString()} />
                  <InfoRow label="Expected End" value={trip.expectedEndDate ? new Date(trip.expectedEndDate).toLocaleString() : '-'} />
                  {trip.actualEndDate && <InfoRow label="Actual End" value={new Date(trip.actualEndDate).toLocaleString()} />}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Cost Summary</Typography>
                  <InfoRow label="Distance" value={`${trip.distance} km`} />
                  <InfoRow label="Fuel Cost" value={`$${trip.fuelCost?.toFixed(2)}`} />
                  <InfoRow label="Other Costs" value={`$${trip.otherCosts?.toFixed(2)}`} />
                  <InfoRow label="Total Cost" value={<Typography fontWeight={700} color="primary.main">${trip.totalCost?.toFixed(2)}</Typography>} />
                  {trip.notes && <Alert severity="info" sx={{ mt: 1 }}>{trip.notes}</Alert>}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stops */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Stops</Typography>
              {isLoading ? <Skeleton height={200} /> : trip && trip.stops && trip.stops.length > 0 ? (
                <Stepper orientation="vertical">
                  {trip.stops.map((stop) => (
                    <Step key={stop.id} active={stop.status === 'PENDING'} completed={stop.status === 'COMPLETED'}>
                      <StepLabel>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={600">Stop #{stop.sequence} - {stop.type}</Typography>
                          <Chip label={stop.status} size="small" color={stop.status === 'COMPLETED' ? 'success' : 'default'} variant="outlined" />
                        </Box>
                      </StepLabel>
                      <StepContent>
                        <Box ml={2}>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">{stop.location}</Typography>
                          </Box>
                          {stop.contactName && (
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">{stop.contactName} {stop.contactPhone && `| ${stop.contactPhone}`}</Typography>
                            </Box>
                          )}
                          {stop.expectedTime && (
                            <Typography variant="caption" color="text.secondary">Expected: {stop.expectedTime}</Typography>
                          )}
                          {stop.actualTime && (
                            <Typography variant="caption" color="success.main" display="block">Arrived: {new Date(stop.actualTime).toLocaleString()}</Typography>
                          )}
                          {stop.notes && <Typography variant="caption" color="text.secondary" display="block">{stop.notes}</Typography>}
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              ) : (
                <Typography color="text.secondary" align="center" py={3}>No stops defined for this trip.</Typography>
              )}
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Route Map</Typography>
              <Paper sx={{ height: 300, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box textAlign="center">
                  <Speed sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">Map integration ready</Typography>
                  <Typography variant="caption" color="text.secondary">Connect with Google Maps or Mapbox API</Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TripDetail;
