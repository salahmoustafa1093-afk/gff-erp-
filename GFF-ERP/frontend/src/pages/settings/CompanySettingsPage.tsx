import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save, CloudUpload, Business } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import type { CompanySettings } from '../../types';

const companySchema = Yup.object().shape({
  name: Yup.string().required('Company name is required').max(100),
  taxNumber: Yup.string().required('Tax number is required'),
  commercialRegister: Yup.string(),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  country: Yup.string().required('Country is required'),
  phone: Yup.string().required('Phone is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  website: Yup.string().url('Invalid URL'),
  defaultCurrency: Yup.string().required('Currency is required'),
  fiscalYearStart: Yup.string().required('Fiscal year start is required'),
  fiscalYearEnd: Yup.string().required('Fiscal year end is required'),
});

const CompanySettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => settingsService.getCompanySettings(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings>) => settingsService.updateCompanySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      setLogoPreview(data.logoUrl);
    },
  });

  const initialValues: Partial<CompanySettings> = {
    name: '',
    taxNumber: '',
    commercialRegister: '',
    address: '',
    city: '',
    country: 'Egypt',
    phone: '',
    email: '',
    website: '',
    defaultCurrency: 'EGP',
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Typography variant="h4" fontWeight="bold" mb={3}>
        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
        Company Settings
      </Typography>

      <Card>
        <CardContent>
          {updateMutation.isSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Company settings saved successfully
            </Alert>
          )}
          {updateMutation.isError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to save settings
            </Alert>
          )}

          <Formik
            initialValues={settings ?? initialValues}
            validationSchema={companySchema}
            enableReinitialize
            onSubmit={(values) => {
              updateMutation.mutate(values);
            }}
          >
            {({ isSubmitting, values }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" alignItems="center" gap={3} mb={2}>
                      <Avatar
                        src={logoPreview ?? values.logoUrl}
                        sx={{ width: 80, height: 80 }}
                        variant="rounded"
                      >
                        {(values.name ?? 'C').charAt(0)}
                      </Avatar>
                      <Box>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoPreview(URL.createObjectURL(file));
                              uploadMutation.mutate(file);
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<CloudUpload />}
                          onClick={() => fileInputRef.current?.click()}
                          size="small"
                          disabled={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={FormikTextField}
                      name="name"
                      label="Company Name"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={FormikTextField}
                      name="taxNumber"
                      label="Tax Number"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field
                      component={FormikTextField}
                      name="address"
                      label="Address"
                      fullWidth
                      multiline
                      rows={2}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field component={FormikTextField} name="city" label="City" fullWidth required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field component={FormikTextField} name="country" label="Country" fullWidth required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field component={FormikTextField} name="phone" label="Phone" fullWidth required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field component={FormikTextField} name="email" label="Email" fullWidth required />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field component={FormikTextField} name="website" label="Website" fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Default Currency</InputLabel>
                      <Field
                        component={Select}
                        name="defaultCurrency"
                        label="Default Currency"
                      >
                        <MenuItem value="EGP">EGP - Egyptian Pound</MenuItem>
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                        <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={FormikTextField}
                      name="fiscalYearStart"
                      label="Fiscal Year Start (MM-DD)"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={FormikTextField}
                      name="fiscalYearEnd"
                      label="Fiscal Year End (MM-DD)"
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={isSubmitting || updateMutation.isPending}
                    size="large"
                  >
                    {updateMutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanySettingsPage;
