import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save,
  Lock,
  Person,
  History,
  VpnKey,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { formatDateTime } from '../../utils/formatters';
import type { UserProfile, ActivityLogEntry } from '../../types';

const profileSchema = Yup.object().shape({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
});

const passwordSchema = Yup.object().shape({
  oldPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(8, 'Minimum 8 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const UserProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => settingsService.getUserProfile(),
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity-log'],
    queryFn: () => settingsService.getActivityLog({ pageSize: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => settingsService.updateUserProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      settingsService.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  const activityLog: ActivityLogEntry[] = activityData?.data ?? [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={1000} mx="auto">
      <Typography variant="h4" fontWeight="bold" mb={3}>
        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
        User Profile
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              src={profile?.avatarUrl}
              sx={{ width: 80, height: 80, fontSize: 36 }}
            >
              {(profile?.fullName ?? 'U').charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {profile?.fullName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {profile?.username}
              </Typography>
              <Box display="flex" gap={1} mt={0.5}>
                <Chip label={profile?.role} size="small" color="primary" />
                <Chip
                  label={profile?.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  color={profile?.isActive ? 'success' : 'error'}
                />
              </Box>
            </Box>
            <Box flex={1} />
            <Typography variant="body2" color="text.secondary">
              Last login: {formatDateTime(profile?.lastLogin)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<Person fontSize="small" />} label="Profile" />
        <Tab icon={<VpnKey fontSize="small" />} label="Password" />
        <Tab icon={<History fontSize="small" />} label="Activity Log" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            {updateMutation.isSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>Profile updated successfully</Alert>
            )}
            {updateMutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>Failed to update profile</Alert>
            )}

            <Formik
              initialValues={{
                fullName: profile?.fullName ?? '',
                email: profile?.email ?? '',
                phone: profile?.phone ?? '',
              }}
              validationSchema={profileSchema}
              enableReinitialize
              onSubmit={(values) => {
                updateMutation.mutate(values);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={FormikTextField} name="fullName" label="Full Name" fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={FormikTextField} name="email" label="Email" fullWidth required type="email" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={FormikTextField} name="phone" label="Phone" fullWidth />
                    </Grid>
                  </Grid>
                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isSubmitting || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Lock sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Change Password
            </Typography>

            {passwordMutation.isSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>Password changed successfully</Alert>
            )}
            {passwordMutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>Failed to change password</Alert>
            )}

            <Formik
              initialValues={{ oldPassword: '', newPassword: '', confirmPassword: '' }}
              validationSchema={passwordSchema}
              onSubmit={(values, { resetForm }) => {
                passwordMutation.mutate(
                  { oldPassword: values.oldPassword, newPassword: values.newPassword },
                  { onSuccess: () => resetForm() }
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Grid container spacing={2} maxWidth={500}>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={FormikTextField}
                        name="oldPassword"
                        label="Current Password"
                        type="password"
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={FormikTextField}
                        name="newPassword"
                        label="New Password"
                        type="password"
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={FormikTextField}
                        name="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        fullWidth
                        required
                      />
                    </Grid>
                  </Grid>
                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      startIcon={<VpnKey />}
                      disabled={isSubmitting || passwordMutation.isPending}
                    >
                      {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <History sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Activity Log
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No activity recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    activityLog.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell>{formatDateTime(entry.timestamp)}</TableCell>
                        <TableCell>
                          <Chip label={entry.action} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          {entry.entityType} #{entry.entityId}
                        </TableCell>
                        <TableCell>{entry.details}</TableCell>
                        <TableCell>{entry.ipAddress}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserProfilePage;
