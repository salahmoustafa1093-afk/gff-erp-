import React from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, TextField, MenuItem, Typography, Alert, Chip
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Lead, Customer } from '../../types';

interface ConvertLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
}

const validationSchema = Yup.object({
  code: Yup.string().required('Customer code is required').max(50),
  creditLimit: Yup.number().min(0),
  taxNumber: Yup.string().max(50),
  customerType: Yup.string().required('Customer type is required'),
});

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ open, onClose, lead }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => apiService.convertLead(lead.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
      // Navigate to customers or show success
    },
  });

  const formik = useFormik({
    initialValues: {
      code: `CUST-${lead.firstName?.substring(0, 3).toUpperCase()}${Date.now().toString(36).substring(0, 4).toUpperCase()}`,
      creditLimit: 0,
      taxNumber: '',
      customerType: 'BUSINESS',
    },
    validationSchema,
    onSubmit: (values) => {
      convertMutation.mutate({
        ...values,
        name: lead.company || `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
      });
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Convert Lead to Customer
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Converting <strong>{lead.firstName} {lead.lastName}</strong> from {lead.company || 'N/A'} to a customer.
            This will mark the lead as <strong>WON</strong>.
          </Alert>

          <Grid container spacing={2}>
            {/* Lead Info Preview */}
            <Grid size={{ xs: 12 }}>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip label={lead.source} size="small" variant="outlined" />
                <Chip label={lead.email} size="small" variant="outlined" />
                <Chip label={lead.phone} size="small" variant="outlined" />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Customer Code"
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Customer Type"
                name="customerType"
                value={formik.values.customerType}
                onChange={formik.handleChange}
                required
              >
                <MenuItem value="BUSINESS">Business</MenuItem>
                <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                <MenuItem value="GOVERNMENT">Government</MenuItem>
                <MenuItem value="NON_PROFIT">Non-Profit</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Credit Limit"
                name="creditLimit"
                type="number"
                value={formik.values.creditLimit}
                onChange={formik.handleChange}
                slotProps={{
                  input: { startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography> }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Tax Number / VAT ID"
                name="taxNumber"
                value={formik.values.taxNumber}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={convertMutation.isPending}
          >
            {convertMutation.isPending ? 'Converting...' : 'Convert to Customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConvertLeadModal;
