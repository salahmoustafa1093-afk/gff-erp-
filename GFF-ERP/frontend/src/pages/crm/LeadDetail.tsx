import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button,
  IconButton, Chip, Skeleton, Alert, Paper, Divider, List, ListItem,
  ListItemText, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar
} from '@mui/material';
import {
  ArrowBack, Edit, Transform, Phone, Email, Business, Person,
  LocalActivity, Timeline, Schedule, CheckCircle, Add
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService } from '../../services/api';
import { Lead, Activity, ActivityType, LeadStatus } from '../../types';
import ConvertLeadModal from './ConvertLeadModal';

const statusColors: Record<LeadStatus, string> = {
  NEW: '#0288d1',
  CONTACTED: '#ed6c02',
  QUALIFIED: '#2e7d32',
  PROPOSAL: '#9c27b0',
  NEGOTIATION: '#795548',
  WON: '#2e7d32',
  LOST: '#d32f2f',
};

const statusFlow: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];

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

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [convertOpen, setConvertOpen] = useState(searchParams.get('convert') === 'true');
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => apiService.getLead(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: () => apiService.getActivities({ relatedTo: id, limit: 100 }),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiService.updateLeadStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: (data: Partial<Activity>) => apiService.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
      setActivityFormOpen(false);
    },
  });

  const activityFormik = useFormik({
    initialValues: {
      type: 'CALL' as ActivityType,
      subject: '',
      description: '',
      dueDate: null as Date | null,
    },
    validationSchema: Yup.object({
      type: Yup.string().required(),
      subject: Yup.string().required('Subject is required'),
      description: Yup.string(),
      dueDate: Yup.date().required(),
    }),
    onSubmit: (values) => {
      if (!lead) return;
      activityMutation.mutate({
        ...values,
        relatedTo: lead.id,
        relatedToType: 'LEAD',
        relatedToName: `${lead.firstName} ${lead.lastName}`,
        assignedTo: lead.assignedTo,
        dueDate: values.dueDate?.toISOString(),
      });
    },
  });

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>Failed to load lead details.</Alert>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => navigate('/leads')}><ArrowBack /></IconButton>
            <Typography variant="h4" fontWeight={700}>Lead Detail</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/leads/edit/${id}`)} size="small">
              Edit
            </Button>
            {lead && lead.status !== 'WON' && lead.status !== 'LOST' && (
              <Button variant="contained" color="success" startIcon={<Transform />} onClick={() => setConvertOpen(true)}>
                Convert
              </Button>
            )}
          </Box>
        </Box>

        {/* Lead Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {isLoading ? (
              <Skeleton height={80} />
            ) : lead ? (
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: statusColors[lead.status], fontSize: 28 }}>
                      {lead.firstName[0]}{lead.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {lead.firstName} {lead.lastName}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {lead.company}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={lead.status}
                          size="small"
                          sx={{
                            bgcolor: `${statusColors[lead.status]}15`,
                            color: statusColors[lead.status],
                            fontWeight: 600,
                          }}
                        />
                        <Chip label={lead.source} size="small" variant="outlined" />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{lead.email}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">{lead.phone}</Typography>
                    </Box>
                    {lead.estimatedValue > 0 && (
                      <Chip
                        label={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.estimatedValue)}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {lead.expectedCloseDate && (
                      <Chip
                        label={`Close: ${new Date(lead.expectedCloseDate).toLocaleDateString()}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            ) : null}
          </CardContent>
        </Card>

        {/* Status Progress */}
        {!isLoading && lead && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Pipeline Progress
              </Typography>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                {statusFlow.map((s, idx) => {
                  const currentIdx = statusFlow.indexOf(lead.status);
                  const isActive = idx <= currentIdx;
                  const isCurrent = s === lead.status;
                  return (
                    <React.Fragment key={s}>
                      {idx > 0 && <Box sx={{ width: 20, height: 2, bgcolor: isActive ? statusColors[s] : 'grey.300' }} />}
                      <Button
                        size="small"
                        variant={isCurrent ? 'contained' : 'outlined'}
                        sx={{
                          bgcolor: isCurrent ? statusColors[s] : isActive ? `${statusColors[s]}15` : undefined,
                          borderColor: statusColors[s],
                          color: isCurrent ? '#fff' : statusColors[s],
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          py: 0.3,
                          minWidth: 80,
                        }}
                        onClick={() => statusMutation.mutate(s)}
                        disabled={statusMutation.isPending}
                      >
                        {s}
                      </Button>
                    </React.Fragment>
                  );
                })}
                <Box sx={{ width: 20, height: 2, bgcolor: lead.status === 'LOST' ? statusColors.LOST : 'grey.300' }} />
                <Button
                  size="small"
                  variant={lead.status === 'LOST' ? 'contained' : 'outlined'}
                  color="error"
                  sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.3, minWidth: 60 }}
                  onClick={() => statusMutation.mutate('LOST')}
                  disabled={statusMutation.isPending}
                >
                  LOST
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Information" icon={<Business fontSize="small" />} iconPosition="start" />
            <Tab label="Activities" icon={<LocalActivity fontSize="small" />} iconPosition="start" />
            <Tab label="Timeline" icon={<Timeline fontSize="small" />} iconPosition="start" />
          </Tabs>

          <CardContent>
            {/* Info Tab */}
            <TabPanel value={activeTab} index={0}>
              {isLoading ? <Skeleton height={200} /> : lead && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Contact Details</Typography>
                      <InfoRow label="Full Name" value={`${lead.firstName} ${lead.lastName}`} />
                      <InfoRow label="Email" value={lead.email} />
                      <InfoRow label="Phone" value={lead.phone} />
                      <InfoRow label="Company" value={lead.company} />
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Lead Details</Typography>
                      <InfoRow label="Source" value={<Chip label={lead.source} size="small" />} />
                      <InfoRow label="Status" value={<Chip label={lead.status} size="small" sx={{ color: statusColors[lead.status], bgcolor: `${statusColors[lead.status]}15` }} />} />
                      <InfoRow label="Estimated Value" value={lead.estimatedValue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.estimatedValue) : '-'} />
                      <InfoRow label="Expected Close" value={lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : '-'} />
                      <InfoRow label="Assigned To" value={lead.assignedToName} />
                    </Paper>
                  </Grid>
                  {lead.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Notes</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </TabPanel>

            {/* Activities Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Activities</Typography>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setActivityFormOpen(true)}>
                  Add Activity
                </Button>
              </Box>
              <List>
                {(activities?.data || []).length === 0 && (
                  <Typography color="text.secondary" align="center" py={3}>
                    No activities yet
                  </Typography>
                )}
                {(activities?.data || []).map((activity: Activity, idx: number) => (
                  <React.Fragment key={activity.id}>
                    <ListItem
                      secondaryAction={
                        activity.status !== 'COMPLETED' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CheckCircle />}
                            onClick={() => apiService.markActivityComplete(activity.id)}
                          >
                            Complete
                          </Button>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600}>{activity.subject}</Typography>
                            <Chip label={activity.type} size="small" variant="outlined" />
                            <Chip
                              label={activity.status}
                              size="small"
                              color={activity.status === 'COMPLETED' ? 'success' : activity.status === 'OVERDUE' ? 'error' : 'warning'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            {activity.description && <Typography variant="body2">{activity.description}</Typography>}
                            <Typography variant="caption" color="text.secondary">
                              Due: {new Date(activity.dueDate).toLocaleString()} | Assigned: {activity.assignedToName}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {idx < (activities?.data?.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {/* Add Activity Dialog */}
              <Dialog open={activityFormOpen} onClose={() => setActivityFormOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Activity</DialogTitle>
                <form onSubmit={activityFormik.handleSubmit}>
                  <DialogContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          size="small"
                          label="Type"
                          name="type"
                          value={activityFormik.values.type}
                          onChange={activityFormik.handleChange}
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
                          value={activityFormik.values.dueDate}
                          onChange={(v) => activityFormik.setFieldValue('dueDate', v)}
                          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Subject"
                          name="subject"
                          value={activityFormik.values.subject}
                          onChange={activityFormik.handleChange}
                          onBlur={activityFormik.handleBlur}
                          error={activityFormik.touched.subject && Boolean(activityFormik.errors.subject)}
                          helperText={activityFormik.touched.subject && activityFormik.errors.subject}
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
                          value={activityFormik.values.description}
                          onChange={activityFormik.handleChange}
                        />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setActivityFormOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={activityMutation.isPending}>
                      {activityMutation.isPending ? 'Adding...' : 'Add Activity'}
                    </Button>
                  </DialogActions>
                </form>
              </Dialog>
            </TabPanel>

            {/* Timeline Tab */}
            <TabPanel value={activeTab} index={2}>
              {lead && (
                <Box>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
                    </Box>
                    <Box pb={2}>
                      <Typography variant="body2" fontWeight={600}>Lead Created</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(lead.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
                    </Box>
                    <Box pb={2}>
                      <Typography variant="body2" fontWeight={600">Status: {lead.status}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {new Date(lead.updatedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  {(activities?.data || []).map((activity: Activity) => (
                    <Box key={activity.id} sx={{ display: 'flex', mb: 2 }}>
                      <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: activity.status === 'COMPLETED' ? 'success.main' : 'warning.main' }} />
                        <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
                      </Box>
                      <Box pb={2}>
                        <Typography variant="body2" fontWeight={600">{activity.type}: {activity.subject}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(activity.createdAt).toLocaleString()} | {activity.status}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>
          </CardContent>
        </Card>

        {/* Convert Lead Modal */}
        {lead && (
          <ConvertLeadModal
            open={convertOpen}
            onClose={() => setConvertOpen(false)}
            lead={lead}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default LeadDetail;
