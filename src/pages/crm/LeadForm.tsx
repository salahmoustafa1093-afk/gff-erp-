import React, { useEffect } from 'react';
import {
  Box, Button, DialogActions, DialogContent, DialogTitle,
  Grid, TextField, MenuItem, IconButton, Autocomplete, Typography
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { Lead, LeadSource, LeadStatus } from '../../types';

interface LeadFormProps {
  leadId: string | null;
  onClose: () => void;
}

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required').max(100),
  lastName: Yup.string().required('Last name is required').max(100),
  company: Yup.string().max(200),
  email: Yup.string().email('Invalid email').max(200),
  phone: Yup.string().max(50),
  source: Yup.string().required('Source is required'),
  status: Yup.string().required('Status is required'),
  estimatedValue: Yup.number().min(0),
  expectedCloseDate: Yup.date().nullable(),
  assignedTo: Yup.string(),
  notes: Yup.string().max(2000),
});

const LeadForm: React.FC<LeadFormProps> = ({ leadId, onClose }) => {
  const queryClient = useQueryClient();

  const { data: existingLead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadId ? apiService.getLead(leadId) : null,
    enabled: !!leadId,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getSupervisors(),
  });

  const mutation = useMutation({
    mutationFn: (values: Partial<Lead>) =>
      leadId ? apiService.updateLead(leadId, values) : apiService.createLead(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (leadId) queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      source: 'WEB' as LeadSource,
      status: 'NEW' as LeadStatus,
      estimatedValue: 0,
      expectedCloseDate: null as Date | null,
      assignedTo: '',
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        expectedCloseDate: values.expectedCloseDate?.toISOString(),
      };
      mutation.mutate(payload);
    },
  });

  useEffect(() => {
    if (existingLead) {
      formik.setValues({
        firstName: existingLead.firstName || '',
        lastName: existingLead.lastName || '',
        company: existingLead.company || '',
        email: existingLead.email || '',
        phone: existingLead.phone || '',
        source: existingLead.source || 'WEB',
        status: existingLead.status || 'NEW',
        estimatedValue: existingLead.estimatedValue || 0,
        expectedCloseDate: existingLead.expectedCloseDate ? new Date(existingLead.expectedCloseDate) : null,
        assignedTo: existingLead.assignedTo || '',
        notes: existingLead.notes || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLead]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{leadId ? 'Edit Lead' : 'Create New Lead'}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="First Name"
                name="firstName"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Last Name"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Company"
                name="company"
                value={formik.values.company}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Source"
                name="source"
                value={formik.values.source}
                onChange={formik.handleChange}
                required
              >
                <MenuItem value="WEB">Web</MenuItem>
                <MenuItem value="REFERRAL">Referral</MenuItem>
                <MenuItem value="CALL">Call</MenuItem>
                <MenuItem value="SOCIAL">Social Media</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="EXHIBITION">Exhibition</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                required
              >
                <MenuItem value="NEW">New</MenuItem>
                <MenuItem value="CONTACTED">Contacted</MenuItem>
                <MenuItem value="QUALIFIED">Qualified</MenuItem>
                <MenuItem value="PROPOSAL">Proposal</MenuItem>
                <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
                <MenuItem value="WON">Won</MenuItem>
                <MenuItem value="LOST">Lost</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Estimated Value"
                name="estimatedValue"
                type="number"
                value={formik.values.estimatedValue}
                onChange={formik.handleChange}
                slotProps={{
                  input: { startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography> }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Expected Close Date"
                value={formik.values.expectedCloseDate}
                onChange={(val) => formik.setFieldValue('expectedCloseDate', val)}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={users || []}
                getOptionLabel={(opt) => opt.name}
                value={(users || []).find((u) => u.id === formik.values.assignedTo) || null}
                onChange={(_, val) => formik.setFieldValue('assignedTo', val?.id || '')}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Assigned To" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formik.values.notes}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : leadId ? 'Update Lead' : 'Create Lead'}
          </Button>
        </DialogActions>
      </form>
    </LocalizationProvider>
  );
};

export default LeadForm;
