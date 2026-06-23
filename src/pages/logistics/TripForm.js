import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardContent, Grid, TextField, MenuItem, IconButton, Typography, Paper, Alert } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
const validationSchema = Yup.object({
    type: Yup.string().required(),
    vehicleId: Yup.string().required('Vehicle is required'),
    driverId: Yup.string().required('Driver is required'),
    startDate: Yup.date().required(),
    expectedEndDate: Yup.date().required().min(Yup.ref('startDate'), 'Must be after start'),
    notes: Yup.string(),
});
const TripForm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: availableVehicles } = useQuery({
        queryKey: ['available-vehicles'],
        queryFn: () => apiService.getVehicles({ status: 'ACTIVE', limit: 500 }),
    });
    const { data: availableDrivers } = useQuery({
        queryKey: ['available-drivers'],
        queryFn: () => apiService.getAvailableDrivers(),
    });
    const createMutation = useMutation({
        mutationFn: (data) => apiService.createTrip(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            navigate('/trips');
        },
    });
    const formik = useFormik({
        initialValues: {
            type: 'DELIVERY',
            vehicleId: '',
            driverId: '',
            startDate: new Date(),
            expectedEndDate: null,
            notes: '',
            stops: [{ sequence: 1, type: 'PICKUP', location: '', contactName: '', contactPhone: '', expectedTime: '', notes: '', status: 'PENDING' }],
        },
        validationSchema,
        onSubmit: (values) => {
            createMutation.mutate({
                ...values,
                startDate: values.startDate?.toISOString(),
                expectedEndDate: values.expectedEndDate?.toISOString(),
            });
        },
    });
    const addStop = () => {
        formik.setFieldValue('stops', [
            ...formik.values.stops,
            { sequence: formik.values.stops.length + 1, type: 'DELIVERY', location: '', contactName: '', contactPhone: '', expectedTime: '', notes: '', status: 'PENDING' },
        ]);
    };
    const removeStop = (index) => {
        const newStops = formik.values.stops.filter((_, i) => i !== index);
        newStops.forEach((stop, i) => { stop.sequence = i + 1; });
        formik.setFieldValue('stops', newStops);
    };
    const updateStop = (index, field, value) => {
        const newStops = [...formik.values.stops];
        newStops[index] = { ...newStops[index], [field]: value };
        formik.setFieldValue('stops', newStops);
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, gutterBottom: true, children: "Create Trip" }), _jsx("form", { onSubmit: formik.handleSubmit, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 8 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Trip Details" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Trip Type", name: "type", value: formik.values.type, onChange: formik.handleChange, required: true, children: [_jsx(MenuItem, { value: "DELIVERY", children: "Delivery" }), _jsx(MenuItem, { value: "PICKUP", children: "Pickup" }), _jsx(MenuItem, { value: "TRANSFER", children: "Transfer" }), _jsx(MenuItem, { value: "SERVICE", children: "Service" })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Vehicle", name: "vehicleId", value: formik.values.vehicleId, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.vehicleId && Boolean(formik.errors.vehicleId), helperText: formik.touched.vehicleId && formik.errors.vehicleId, required: true, children: [_jsx(MenuItem, { value: "", children: "Select Vehicle" }), (availableVehicles?.data || []).map((v) => (_jsxs(MenuItem, { value: v.id, children: [v.code, " - ", v.make, " ", v.model] }, v.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(TextField, { fullWidth: true, select: true, size: "small", label: "Driver", name: "driverId", value: formik.values.driverId, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.driverId && Boolean(formik.errors.driverId), helperText: formik.touched.driverId && formik.errors.driverId, required: true, children: [_jsx(MenuItem, { value: "", children: "Select Driver" }), (availableDrivers || []).map((d) => (_jsxs(MenuItem, { value: d.id, children: [d.firstName, " ", d.lastName] }, d.id)))] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Start Date", value: formik.values.startDate, onChange: (v) => formik.setFieldValue('startDate', v), slotProps: { textField: { fullWidth: true, size: 'small', required: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Expected End", value: formik.values.expectedEndDate, onChange: (v) => formik.setFieldValue('expectedEndDate', v), slotProps: { textField: { fullWidth: true, size: 'small', required: true } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", name: "notes", multiline: true, rows: 3, value: formik.values.notes, onChange: formik.handleChange }) })] })] }) }) }), _jsxs(Grid, { size: { xs: 12, md: 4 }, children: [_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "Only active vehicles and available drivers are shown." }), _jsxs(Box, { display: "flex", gap: 2, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/trips'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Creating...' : 'Create Trip' })] })] }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "Stops" }), _jsx(Button, { variant: "outlined", size: "small", startIcon: _jsx(Add, {}), onClick: addStop, children: "Add Stop" })] }), formik.values.stops.map((stop, index) => (_jsxs(Paper, { variant: "outlined", sx: { p: 2, mb: 2, position: 'relative' }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, children: [_jsx(Chip, { label: `#${stop.sequence} ${stop.type}`, size: "small", color: "primary", variant: "outlined" }), formik.values.stops.length > 1 && (_jsx(IconButton, { size: "small", color: "error", onClick: () => removeStop(index), children: _jsx(Delete, { fontSize: "small" }) }))] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Location", value: stop.location, onChange: (e) => updateStop(index, 'location', e.target.value), required: true }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsxs(TextField, { fullWidth: true, size: "small", select: true, label: "Type", value: stop.type, onChange: (e) => updateStop(index, 'type', e.target.value), children: [_jsx(MenuItem, { value: "PICKUP", children: "Pickup" }), _jsx(MenuItem, { value: "DELIVERY", children: "Delivery" })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Expected Time", type: "time", value: stop.expectedTime, onChange: (e) => updateStop(index, 'expectedTime', e.target.value) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Contact Name", value: stop.contactName, onChange: (e) => updateStop(index, 'contactName', e.target.value) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Contact Phone", value: stop.contactPhone, onChange: (e) => updateStop(index, 'contactPhone', e.target.value) }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { fullWidth: true, size: "small", label: "Notes", multiline: true, rows: 2, value: stop.notes, onChange: (e) => updateStop(index, 'notes', e.target.value) }) })] })] }, index)))] }) }) })] }) })] }) }));
};
export default TripForm;
