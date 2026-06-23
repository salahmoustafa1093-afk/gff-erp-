import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import StorefrontIcon from '@mui/icons-material/Storefront';

import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTheme, setLanguage } from '@/app/slices/appSlice';
import { useBranch } from '@/hooks/useBranch';
import type { ThemeMode, Language, NotificationPreferences } from '@/app/slices/appSlice';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ py: 3 }}>{children}</Box>;
}

const companyValidationSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  legalName: Yup.string(),
  taxId: Yup.string(),
  registrationNumber: Yup.string(),
  address: Yup.string(),
  city: Yup.string(),
  country: Yup.string(),
  phone: Yup.string(),
  email: Yup.string().email('Invalid email'),
  website: Yup.string().url('Invalid URL'),
});

const profileValidationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
});

const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const dispatch = useAppDispatch();
  const { user, updateProfile, changePassword, isLoading: authLoading } = useAuth();
  const { currentBranch, branchList, switchBranch } = useBranch();
  const appTheme = useAppSelector((state) => state.app.theme);
  const appLanguage = useAppSelector((state) => state.app.language);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Company Settings Form
  const companyForm = useFormik<{
    companyName: string;
    legalName: string;
    taxId: string;
    registrationNumber: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    website: string;
  }>({
    initialValues: {
      companyName: 'Golden Farms Foods',
      legalName: 'Golden Farms Foods Ltd.',
      taxId: '',
      registrationNumber: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: '',
    },
    validationSchema: companyValidationSchema,
    onSubmit: async (_values) => {
      // Company settings update - will be implemented when API is ready
    },
  });

  // Profile Form
  const profileForm = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    validationSchema: profileValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateProfile(values);
    },
  });

  // Password Form
  const passwordForm = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      passwordForm.resetForm();
    },
  });

  const tabs = [
    { label: 'Company', icon: <BusinessIcon fontSize="small" /> },
    { label: 'Profile', icon: <PersonIcon fontSize="small" /> },
    { label: 'Password', icon: <LockIcon fontSize="small" /> },
    { label: 'Notifications', icon: <NotificationsIcon fontSize="small" /> },
    { label: 'Appearance', icon: <PaletteIcon fontSize="small" /> },
    { label: 'Branch', icon: <StorefrontIcon fontSize="small" /> },
  ];

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage your application preferences" />

      <Card variant="outlined">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          {tabs.map((tab, i) => (
            <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" />
          ))}
        </Tabs>

        <CardContent sx={{ px: { xs: 2, md: 4 }, py: 0 }}>
          {/* Company Settings */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Company Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Update your company details and business information.
            </Typography>
            <form onSubmit={companyForm.handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={companyForm.values.companyName}
                    onChange={companyForm.handleChange}
                    onBlur={companyForm.handleBlur}
                    error={companyForm.touched.companyName && Boolean(companyForm.errors.companyName)}
                    helperText={companyForm.touched.companyName && companyForm.errors.companyName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Legal Name"
                    name="legalName"
                    value={companyForm.values.legalName}
                    onChange={companyForm.handleChange}
                    onBlur={companyForm.handleBlur}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Tax ID" name="taxId" value={companyForm.values.taxId} onChange={companyForm.handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Registration Number" name="registrationNumber" value={companyForm.values.registrationNumber} onChange={companyForm.handleChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" name="address" multiline rows={2} value={companyForm.values.address} onChange={companyForm.handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="City" name="city" value={companyForm.values.city} onChange={companyForm.handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Country" name="country" value={companyForm.values.country} onChange={companyForm.handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Phone" name="phone" value={companyForm.values.phone} onChange={companyForm.handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={companyForm.values.email}
                    onChange={companyForm.handleChange}
                    onBlur={companyForm.handleBlur}
                    error={companyForm.touched.email && Boolean(companyForm.errors.email)}
                    helperText={companyForm.touched.email && companyForm.errors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={companyForm.values.website}
                    onChange={companyForm.handleChange}
                    onBlur={companyForm.handleBlur}
                    error={companyForm.touched.website && Boolean(companyForm.errors.website)}
                    helperText={companyForm.touched.website && companyForm.errors.website}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!companyForm.dirty || companyForm.isSubmitting}
                >
                  Save Changes
                </Button>
              </Box>
            </form>
          </TabPanel>

          {/* User Profile */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              User Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your personal information and contact details.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  mr: 2.5,
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Role: {user?.role}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={profileForm.handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profileForm.values.firstName}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.firstName && Boolean(profileForm.errors.firstName)}
                    helperText={profileForm.touched.firstName && profileForm.errors.firstName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profileForm.values.lastName}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.lastName && Boolean(profileForm.errors.lastName)}
                    helperText={profileForm.touched.lastName && profileForm.errors.lastName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileForm.values.email}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.email && Boolean(profileForm.errors.email)}
                    helperText={profileForm.touched.email && profileForm.errors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profileForm.values.phone}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={authLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={!profileForm.dirty || profileForm.isSubmitting || authLoading}
                >
                  Save Profile
                </Button>
              </Box>
            </form>
          </TabPanel>

          {/* Change Password */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Update your password to keep your account secure.
            </Typography>
            <form onSubmit={passwordForm.handleSubmit}>
              <Grid container spacing={2.5} maxWidth={600}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.values.currentPassword}
                    onChange={passwordForm.handleChange}
                    onBlur={passwordForm.handleBlur}
                    error={passwordForm.touched.currentPassword && Boolean(passwordForm.errors.currentPassword)}
                    helperText={passwordForm.touched.currentPassword && passwordForm.errors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordForm.values.newPassword}
                    onChange={passwordForm.handleChange}
                    onBlur={passwordForm.handleBlur}
                    error={passwordForm.touched.newPassword && Boolean(passwordForm.errors.newPassword)}
                    helperText={passwordForm.touched.newPassword && passwordForm.errors.newPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.values.confirmPassword}
                    onChange={passwordForm.handleChange}
                    onBlur={passwordForm.handleBlur}
                    error={passwordForm.touched.confirmPassword && Boolean(passwordForm.errors.confirmPassword)}
                    helperText={passwordForm.touched.confirmPassword && passwordForm.errors.confirmPassword}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={authLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={!passwordForm.dirty || passwordForm.isSubmitting || authLoading}
                >
                  Update Password
                </Button>
              </Box>
            </form>
          </TabPanel>

          {/* Notification Preferences */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose which notifications you want to receive.
            </Typography>
            <NotificationSettingsTab />
          </TabPanel>

          {/* Appearance / Theme */}
          <TabPanel value={activeTab} index={4}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize the look and feel of the application.
            </Typography>
            <Grid container spacing={3} maxWidth={600}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={appTheme}
                    onChange={(e) => dispatch(setTheme(e.target.value as ThemeMode))}
                    label="Theme"
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={appLanguage}
                    onChange={(e) => dispatch(setLanguage(e.target.value as Language))}
                    label="Language"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Branch Settings */}
          <TabPanel value={activeTab} index={5}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Branch Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your branch preferences and settings.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Current Branch</InputLabel>
              <Select
                value={currentBranch?.id || ''}
                onChange={(e) => switchBranch(e.target.value)}
                label="Current Branch"
              >
                {branchList.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name} {branch.isMain ? '(Main)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentBranch && (
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Branch Code
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {currentBranch.code}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Status
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {currentBranch.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                    </Grid>
                    {currentBranch.address && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Address
                        </Typography>
                        <Typography variant="body2">
                          {currentBranch.address}
                          {currentBranch.city && `, ${currentBranch.city}`}
                        </Typography>
                      </Grid>
                    )}
                    {currentBranch.currency && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Currency
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {currentBranch.currency}
                        </Typography>
                      </Grid>
                    )}
                    {currentBranch.timezone && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Timezone
                        </Typography>
                        <Typography variant="body2">
                          {currentBranch.timezone}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}

// ============================================
// Notification Settings Sub-component
// ============================================

function NotificationSettingsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email: true,
    push: true,
    sms: false,
    orderAlerts: true,
    stockAlerts: true,
    paymentAlerts: true,
    systemAlerts: true,
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const items: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
    { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
    { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' },
    { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via text message' },
    { key: 'orderAlerts', label: 'Order Alerts', description: 'New orders, order status changes' },
    { key: 'stockAlerts', label: 'Stock Alerts', description: 'Low stock, stock movements' },
    { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Payments received, overdue invoices' },
    { key: 'systemAlerts', label: 'System Alerts', description: 'System updates, maintenance notices' },
  ];

  return (
    <Box>
      {items.map((item) => (
        <Box
          key={item.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {item.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.description}
            </Typography>
          </Box>
          <Switch
            checked={prefs[item.key]}
            onChange={() => handleToggle(item.key)}
          />
        </Box>
      ))}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<SaveIcon />}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  );
}