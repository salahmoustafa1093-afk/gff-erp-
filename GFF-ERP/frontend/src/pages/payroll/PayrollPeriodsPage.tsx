import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Alert, Tooltip
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Visibility, PlayArrow, Close, Delete, Warning, CheckCircle, Schedule
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiService } from '../../services/api';
import { PayrollPeriod, PayrollPeriodStatus } from '../../types';

const statusConfig: Record<PayrollPeriodStatus, { color: string; icon: React.ReactNode; label: string }> = {
  DRAFT: { color: '#757575', icon: <Schedule fontSize="small" />, label: 'Draft' },
  PROCESSING: { color: '#ed6c02', icon: <PlayArrow fontSize="small" />, label: 'Processing' },
  COMPLETED: { color: '#2e7d32', icon: <CheckCircle fontSize="small" />, label: 'Completed' },
  CLOSED: { color: '#0288d1', icon: <Close fontSize="small" />, label: 'Closed' },
};

const periodSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date().required('End date is required').min(Yup.ref('startDate'), 'Must be after start date'),
});

const PayrollPeriodsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: periods, isLoading, error } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => apiService.getPayrollPeriods(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PayrollPeriod>) => apiService.createPayrollPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      setCreateOpen(false);
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => apiService.processPayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      setProcessingId(null);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => apiService.closePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePayrollPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      startDate: null as Date | null,
      endDate: null as Date | null,
    },
    validationSchema: periodSchema,
    onSubmit: (values) => {
      createMutation.mutate({
        name: values.name,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      });
    },
  });

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Period Name', width: 200, renderCell: (params: GridRenderCellParams) => (
      <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
    )},
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const config = statusConfig[params.value as PayrollPeriodStatus];
        return (
          <Chip
            icon={config.icon}
            label={config.label}
            size="small"
            sx={{
              bgcolor: `${config.color}15`,
              color: config.color,
              fontWeight: 600,
              border: `1px solid ${config.color}40`,
            }}
          />
        );
      },
    },
    { field: 'employeeCount', headerName: 'Employees', width: 100, type: 'number', align: 'center' },
    {
      field: 'totalNetSalary',
      headerName: 'Total Net Salary',
      width: 160,
      valueFormatter: (value: number, row: PayrollPeriod) =>
        value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency || 'USD' }).format(value) : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const period = params.row as PayrollPeriod;
        return (
          <Box display="flex" gap={0.5}>
            <Tooltip title="View / Process">
              <IconButton size="small" onClick={() => navigate(`/payroll/${period.id}`)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            {period.status === 'DRAFT' && (
              <Tooltip title="Process Payroll">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => { setProcessingId(period.id); processMutation.mutate(period.id); }}
                  disabled={processMutation.isPending && processingId === period.id}
                >
                  <PlayArrow fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {period.status === 'COMPLETED' && (
              <Tooltip title="Close Period">
                <IconButton size="small" color="success" onClick={() => closeMutation.mutate(period.id)}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {period.status === 'DRAFT' && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => deleteMutation.mutate(period.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load payroll periods. Please try again.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Payroll Periods
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Create Period
          </Button>
        </Box>

        <DataGrid
          rows={periods || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          density="compact"
          autoHeight
          disableRowSelectionOnClick
        />

        {/* Create Dialog */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Payroll Period</DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Period Name"
                    name="name"
                    placeholder="e.g., January 2024"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Start Date"
                    value={formik.values.startDate}
                    onChange={(v) => formik.setFieldValue('startDate', v)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: formik.touched.startDate && Boolean(formik.errors.startDate),
                        helperText: formik.touched.startDate && typeof formik.errors.startDate === 'string' ? formik.errors.startDate : '',
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="End Date"
                    value={formik.values.endDate}
                    onChange={(v) => formik.setFieldValue('endDate', v)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: formik.touched.endDate && Boolean(formik.errors.endDate),
                        helperText: formik.touched.endDate && typeof formik.errors.endDate === 'string' ? formik.errors.endDate : '',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Period'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default PayrollPeriodsPage;
