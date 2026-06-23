import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Typography, Card, CardContent, Grid, Button, IconButton, Chip, Skeleton, Alert, Paper, Divider, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { ArrowBack, PlayArrow, CheckCircle, Cancel, LocalShipping, LocationOn, Person, Speed, Avatar } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
const statusColors = {
    SCHEDULED: '#0288d1',
    IN_PROGRESS: '#ed6c02',
    COMPLETED: '#2e7d32',
    CANCELLED: '#d32f2f',
};
const TripDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: trip, isLoading, error } = useQuery({
        queryKey: ['trip', id],
        queryFn: () => apiService.getTrip(id),
        enabled: !!id,
    });
    const startMutation = useMutation({
        mutationFn: () => apiService.startTrip(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
    });
    const completeMutation = useMutation({
        mutationFn: () => apiService.completeTrip(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
    });
    const cancelMutation = useMutation({
        mutationFn: () => apiService.cancelTrip(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
    });
    if (error)
        return _jsx(Alert, { severity: "error", sx: { m: 3 }, children: "Failed to load trip." });
    const InfoRow = ({ label, value }) => (_jsxs(Box, { display: "flex", justifyContent: "space-between", py: 0.75, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: label }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: value || '-' })] }));
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(IconButton, { onClick: () => navigate('/trips'), children: _jsx(ArrowBack, {}) }), _jsx(Typography, { variant: "h4", fontWeight: 700, children: "Trip Detail" })] }), _jsxs(Box, { display: "flex", gap: 1, children: [trip?.status === 'SCHEDULED' && (_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(PlayArrow, {}), onClick: () => startMutation.mutate(), disabled: startMutation.isPending, children: startMutation.isPending ? 'Starting...' : 'Start Trip' })), trip?.status === 'IN_PROGRESS' && (_jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(CheckCircle, {}), onClick: () => completeMutation.mutate(), disabled: completeMutation.isPending, children: completeMutation.isPending ? 'Completing...' : 'Complete Trip' })), (trip?.status === 'SCHEDULED' || trip?.status === 'IN_PROGRESS') && (_jsx(Button, { variant: "outlined", color: "error", startIcon: _jsx(Cancel, {}), onClick: () => cancelMutation.mutate(), disabled: cancelMutation.isPending, children: "Cancel" }))] })] }), _jsxs(Card, { sx: { mb: 3 }, children: [_jsx(CardContent, { children: isLoading ? _jsx(Skeleton, { height: 80 }) : trip ? (_jsx(Grid, { container: true, spacing: 3, alignItems: "center", children: _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Avatar, { sx: { width: 60, height: 60, bgcolor: statusColors[trip.status], fontSize: 28 }, children: _jsx(LocalShipping, {}) }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h5", fontWeight: 700 }), "\">", trip.tripNumber] }), _jsxs(Box, { display: "flex", gap: 1, mt: 0.5, children: [_jsx(Chip, { label: trip.status, size: "small", sx: { bgcolor: `${statusColors[trip.status]}15`, color: statusColors[trip.status], fontWeight: 600 } }), _jsx(Chip, { label: trip.type, size: "small", variant: "outlined" })] })] }) }) })
                            ,
                                _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Box, { display: "flex", flexWrap: "wrap", gap: 3, children: _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Vehicle" }), _jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", trip.vehicleCode] }) }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Driver" }), _jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", trip.driverName] })] })
                                    ,
                                        _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Distance" }), _jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">", trip.distance, " km"] })) :  }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Cost" }), _jsxs(Typography, { variant: "body2", fontWeight: 600, color: "primary.main", children: ["$", trip.totalCost?.toFixed(2)] })] })] })] }));
};
Grid >
;
Grid >
;
null;
CardContent >
;
Card >
    _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 4 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Trip Information" }), isLoading ? _jsx(Skeleton, { height: 200 }) : trip && (_jsxs(_Fragment, { children: [_jsx(InfoRow, { label: "Trip Number", value: trip.tripNumber }), _jsx(InfoRow, { label: "Type", value: trip.type }), _jsx(InfoRow, { label: "Status", value: _jsx(Chip, { label: trip.status, size: "small", sx: { color: statusColors[trip.status], bgcolor: `${statusColors[trip.status]}15` } }) }), _jsx(InfoRow, { label: "Vehicle", value: trip.vehicleCode }), _jsx(InfoRow, { label: "Driver", value: trip.driverName }), _jsx(InfoRow, { label: "Start Date", value: new Date(trip.startDate).toLocaleString() }), _jsx(InfoRow, { label: "Expected End", value: trip.expectedEndDate ? new Date(trip.expectedEndDate).toLocaleString() : '-' }), trip.actualEndDate && _jsx(InfoRow, { label: "Actual End", value: new Date(trip.actualEndDate).toLocaleString() }), _jsx(Divider, { sx: { my: 1 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, gutterBottom: true, children: "Cost Summary" }), _jsx(InfoRow, { label: "Distance", value: `${trip.distance} km` }), _jsx(InfoRow, { label: "Fuel Cost", value: `$${trip.fuelCost?.toFixed(2)}` }), _jsx(InfoRow, { label: "Other Costs", value: `$${trip.otherCosts?.toFixed(2)}` }), _jsx(InfoRow, { label: "Total Cost", value: _jsxs(Typography, { fontWeight: 700, color: "primary.main", children: ["$", trip.totalCost?.toFixed(2)] }) }), trip.notes && _jsx(Alert, { severity: "info", sx: { mt: 1 }, children: trip.notes })] }))] }) }) }), _jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsxs(Card, { children: [_jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Stops" }), isLoading ? _jsx(Skeleton, { height: 200 }) : trip && trip.stops && trip.stops.length > 0 ? (_jsx(Stepper, { orientation: "vertical", children: trip.stops.map((stop) => (_jsx(Step, { active: stop.status === 'PENDING', completed: stop.status === 'COMPLETED', children: _jsxs(StepLabel, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Typography, { variant: "body2", fontWeight: 600 }), "\">Stop #", stop.sequence, " - ", stop.type] }), _jsx(Chip, { label: stop.status, size: "small", color: stop.status === 'COMPLETED' ? 'success' : 'default', variant: "outlined" })] }) }, stop.id)
                                        ,
                                            _jsx(StepContent, { children: _jsxs(Box, { ml: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, children: [_jsx(LocationOn, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "body2", children: stop.location })] }), stop.contactName && (_jsxs(Box, { display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, children: [_jsx(Person, { fontSize: "small", color: "action" }), _jsxs(Typography, { variant: "body2", children: [stop.contactName, " ", stop.contactPhone && `| ${stop.contactPhone}`] })] })), stop.expectedTime && (_jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Expected: ", stop.expectedTime] })), stop.actualTime && (_jsxs(Typography, { variant: "caption", color: "success.main", display: "block", children: ["Arrived: ", new Date(stop.actualTime).toLocaleString()] })), stop.notes && _jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: stop.notes })] }) }))) })) : , ")}"] }), ") : (", _jsx(Typography, { color: "text.secondary", align: "center", py: 3, children: "No stops defined for this trip." }), ")}"] }) }), _jsx(Card, { sx: { mt: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Route Map" }), _jsx(Paper, { sx: { height: 300, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs(Box, { textAlign: "center", children: [_jsx(Speed, { sx: { fontSize: 48, color: 'text.secondary', mb: 1 } }), _jsx(Typography, { color: "text.secondary", children: "Map integration ready" }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Connect with Google Maps or Mapbox API" })] }) })] }) })] });
Grid >
;
Box >
;
;
;
export default TripDetail;
