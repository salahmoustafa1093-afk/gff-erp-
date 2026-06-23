import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, List,
  ListItem, ListItemText, Divider
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add, CheckCircle, FilterList, Clear, CalendarMonth, ViewList
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiService } from '../../services/api';
import { Activity, ActivityType, ActivityStatus } from '../../types';

const typeIcons: Record<ActivityType, string> = {
  CALL: '#0288d1',
  MEETING: '#9c27b0',
  EMAIL: '#ed6c02',
  TASK: '#2e7d32',
  NOTE: '#757575',
  REMINDER: '#d32f2f',
};

const ActivitiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ type: '', status: '', assignedTo: '', page: 1, limit: 25 });
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activities', filters],
    queryFn: () => apiService.getActivities(filters),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiService.markActivityComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Activity>) => apiService.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setFormOpen(false);
    },
  });

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || '', page: 1 }));
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: `${typeIcons[params.value as ActivityType]}15`,
            color: typeIcons[params.value as ActivityType],
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      ),
    },
    { field: 'subject', headerName: 'Subject', width: 200, renderCell: (params) => (
      <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
    )},
    { field: 'relatedToName', headerName: 'Related To', width: 160 },
    { field: 'assignedToName', headerName: 'Assigned', width: 130 },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 160,
      valueFormatter: (value: string) => new Date(value).toLocaleString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'COMPLETED' ? 'success' : params.value === 'OVERDUE' ? 'error' : 'warning'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        params.row.status !== 'COMPLETED' && (
          <Tooltip title="Mark Complete">
            <IconButton size="small" color="success" onClick={() => completeMutation.mutate(params.row.id)}>
              <CheckCircle fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      ),
    },
  ];

  const formik = useFormik({
    initialValues: {
      type: 'TASK' as ActivityType,
      subject: '',
      description: '',
      relatedTo: '',
      relatedToType: 'LEAD' as const,
      dueDate: null as Date | null,
    },
    validationSchema: Yup.object({
      type: Yup.string().required(),
      subject: Yup.string().required('Subject is required'),
      dueDate: Yup.date().required('Due date is required'),
    }),
    onSubmit: (values) => {
      createMutation.mutate({
        ...values,
        dueDate: values.dueDate?.toISOString(),
      });
    },
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Activities</Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={viewMode === 'list' ? <CalendarMonth /> : <ViewList />}
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            >
              {viewMode === 'list' ? 'Calendar' : 'List'}
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
              Create Activity
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.type} label="Type" onChange={(e) => handleFilterChange('type', e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="CALL">Call</MenuItem>
                    <MenuItem value="MEETING">Meeting</MenuItem>
                    <MenuItem value="EMAIL">Email</MenuItem>
                    <MenuItem value="TASK">Task</MenuItem>
                    <MenuItem value="NOTE">Note</MenuItem>
                    <MenuItem value="REMINDER">Reminder</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="OVERDUE">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned</InputLabel>
                  <Select value={filters.assignedTo} label="Assigned" onChange={(e) => handleFilterChange('assignedTo', e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Button size="small" onClick={() => setFilters({ type: '', status: '', assignedTo: '', page: 1, limit: 25 })} startIcon={<Clear />}>
                  Clear
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* List View */}
        {viewMode === 'list' && (
          <DataGrid
            rows={data?.data || []}
            columns={columns}
            loading={isLoading}
            rowCount={data?.total || 0}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            onPaginationModelChange={(model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize }))}
            disableRowSelectionOnClick
            density="compact"
            autoHeight
          />
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Activity Calendar</Typography>
              <Grid container spacing={2}>
                {['PENDING', 'OVERDUE', 'COMPLETED'].map((statusGroup) => (
                  <Grid size={{ xs: 12, md: 4 }} key={statusGroup}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom color={
                      statusGroup === 'COMPLETED' ? 'success.main' : statusGroup === 'OVERDUE' ? 'error.main' : 'warning.main'
                    }>
                      {statusGroup} ({(data?.data || []).filter((a: Activity) => a.status === statusGroup).length})
                    </Typography>
                    <List dense>
                      {(data?.data || [])
                        .filter((a: Activity) => a.status === statusGroup)
                        .sort((a: Activity, b: Activity) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((activity: Activity, idx: number, arr: Activity[]) => (
                        <React.Fragment key={activity.id}>
                          <ListItem
                            secondaryAction={
                              activity.status !== 'COMPLETED' && (
                                <IconButton size="small" color="success" onClick={() => completeMutation.mutate(activity.id)}>
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              )
                            }
                          >
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip label={activity.type} size="small" sx={{ bgcolor: `${typeIcons[activity.type]}15`, color: typeIcons[activity.type], fontSize: '0.65rem', height: 18 }} />
                                  <Typography variant="body2" fontWeight={600}>{activity.subject}</Typography>
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(activity.dueDate).toLocaleDateString()} | {activity.relatedToName}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {idx < arr.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Activity</DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="CALL">Call</MenuItem>
                    <MenuItem value="MEETING">Meeting</MenuItem>
                    <MenuItem value="EMAIL">Email</MenuItem>
                    <MenuItem value="TASK">Task</MenuItem>
                    <MenuItem value="NOTE">Note</MenuItem>
                    <MenuItem value="REMINDER">Reminder</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Due Date"
                    value={formik.values.dueDate}
                    onChange={(v) => formik.setFieldValue('dueDate', v)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: formik.touched.dueDate && Boolean(formik.errors.dueDate),
                        helperText: formik.touched.dueDate && typeof formik.errors.dueDate === 'string' ? formik.errors.dueDate : '',
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Subject"
                    name="subject"
                    value={formik.values.subject}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.subject && Boolean(formik.errors.subject)}
                    helperText={formik.touched.subject && formik.errors.subject}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Description"
                    name="description"
                    multiline
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ActivitiesPage;
