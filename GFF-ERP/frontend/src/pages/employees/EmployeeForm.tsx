import React, { useEffect, useState } from 'react';
import {
  Box, Button, DialogActions, DialogContent, DialogTitle,
  Grid, TextField, MenuItem, Autocomplete, Tabs, Tab,
  Typography, Divider, Paper, IconButton, InputAdornment
} from '@mui/material';
import { Close, Calculate } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { Employee } from '../../types';

interface EmployeeFormProps {
  employeeId: string | null;
  onClose: () => void;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null
);

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required').max(100),
  lastName: Yup.string().required('Last name is required').max(100),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone is required').matches(/^[+]?[\d\s-()]+$/, 'Invalid phone number'),
  nationalId: Yup.string().required('National ID is required'),
  dateOfBirth: Yup.date().required('Date of birth is required').max(new Date(), 'Cannot be in the future'),
  gender: Yup.string().required('Gender is required'),
  maritalStatus: Yup.string().required('Marital status is required'),
  employeeNumber: Yup.string().required('Employee number is required'),
  hireDate: Yup.date().required('Hire date is required'),
  department: Yup.string().required('Department is required'),
  jobTitle: Yup.string().required('Job title is required'),
  employmentType: Yup.string().required('Employment type is required'),
  status: Yup.string().required('Status is required'),
  branch: Yup.string().required('Branch is required'),
  basicSalary: Yup.number().required('Basic salary is required').min(0, 'Must be positive'),
  housingAllowance: Yup.number().min(0),
  transportAllowance: Yup.number().min(0),
  otherAllowances: Yup.number().min(0),
  currency: Yup.string().required('Currency is required'),
  bankName: Yup.string(),
  accountNumber: Yup.string(),
  iban: Yup.string(),
  emergencyContactName: Yup.string(),
  emergencyContactPhone: Yup.string(),
  emergencyContactRelationship: Yup.string(),
  address: Yup.string(),
  city: Yup.string(),
  country: Yup.string(),
});

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employeeId, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [salaryPreview, setSalaryPreview] = useState(false);

  const { data: existingEmployee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeId ? apiService.getEmployee(employeeId) : null,
    enabled: !!employeeId,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.getDepartments(),
  });

  const { data: jobTitles } = useQuery({
    queryKey: ['job-titles'],
    queryFn: () => apiService.getJobTitles(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiService.getBranches(),
  });

  const { data: supervisors } = useQuery({
    queryKey: ['supervisors'],
    queryFn: () => apiService.getSupervisors(),
  });

  const mutation = useMutation({
    mutationFn: (values: Partial<Employee>) =>
      employeeId ? apiService.updateEmployee(employeeId, values) : apiService.createEmployee(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      }
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      dateOfBirth: null as Date | null,
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      employeeNumber: '',
      hireDate: new Date() as Date | null,
      department: '',
      jobTitle: '',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      branch: '',
      supervisorId: '',
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      currency: 'USD',
      bankName: '',
      accountNumber: '',
      iban: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      address: '',
      city: '',
      country: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth?.toISOString(),
        hireDate: values.hireDate?.toISOString(),
      };
      mutation.mutate(payload);
    },
  });

  useEffect(() => {
    if (existingEmployee) {
      formik.setValues({
        firstName: existingEmployee.firstName || '',
        lastName: existingEmployee.lastName || '',
        email: existingEmployee.email || '',
        phone: existingEmployee.phone || '',
        nationalId: existingEmployee.nationalId || '',
        dateOfBirth: existingEmployee.dateOfBirth ? new Date(existingEmployee.dateOfBirth) : null,
        gender: existingEmployee.gender || 'MALE',
        maritalStatus: existingEmployee.maritalStatus || 'SINGLE',
        employeeNumber: existingEmployee.employeeNumber || '',
        hireDate: existingEmployee.hireDate ? new Date(existingEmployee.hireDate) : new Date(),
        department: existingEmployee.department || '',
        jobTitle: existingEmployee.jobTitle || '',
        employmentType: existingEmployee.employmentType || 'FULL_TIME',
        status: existingEmployee.status || 'ACTIVE',
        branch: existingEmployee.branch || '',
        supervisorId: existingEmployee.supervisorId || '',
        basicSalary: existingEmployee.basicSalary || 0,
        housingAllowance: existingEmployee.housingAllowance || 0,
        transportAllowance: existingEmployee.transportAllowance || 0,
        otherAllowances: existingEmployee.otherAllowances || 0,
        currency: existingEmployee.currency || 'USD',
        bankName: existingEmployee.bankName || '',
        accountNumber: existingEmployee.accountNumber || '',
        iban: existingEmployee.iban || '',
        emergencyContactName: existingEmployee.emergencyContactName || '',
        emergencyContactPhone: existingEmployee.emergencyContactPhone || '',
        emergencyContactRelationship: existingEmployee.emergencyContactRelationship || '',
        address: existingEmployee.address || '',
        city: existingEmployee.city || '',
        country: existingEmployee.country || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEmployee]);

  const totalSalary =
    (Number(formik.values.basicSalary) || 0) +
    (Number(formik.values.housingAllowance) || 0) +
    (Number(formik.values.transportAllowance) || 0) +
    (Number(formik.values.otherAllowances) || 0);

  const hasErrors = (fields: string[]) => fields.some((f) => !!formik.errors[f as keyof typeof formik.errors] && formik.touched[f as keyof typeof formik.touched]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {employeeId ? 'Edit Employee' : 'Create New Employee'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Personal Info" sx={{ color: hasErrors(['firstName', 'lastName', 'email', 'phone', 'nationalId', 'dateOfBirth', 'gender', 'maritalStatus']) ? 'error.main' : undefined }} />
            <Tab label="Employment" sx={{ color: hasErrors(['employeeNumber', 'hireDate', 'department', 'jobTitle', 'employmentType', 'status', 'branch']) ? 'error.main' : undefined }} />
            <Tab label="Compensation" />
            <Tab label="Banking" />
            <Tab label="Emergency Contact" />
            <Tab label="Address" />
          </Tabs>

          <Box sx={{ px: 3, py: 1 }}>
            {/* Personal Info */}
            <TabPanel value={activeTab} index={0}>
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
                    onBlur={formik.handleBlur}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="National ID"
                    name="nationalId"
                    value={formik.values.nationalId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.nationalId && Boolean(formik.errors.nationalId)}
                    helperText={formik.touched.nationalId && formik.errors.nationalId}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Date of Birth"
                    value={formik.values.dateOfBirth}
                    onChange={(val) => formik.setFieldValue('dateOfBirth', val)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth),
                        helperText: formik.touched.dateOfBirth && typeof formik.errors.dateOfBirth === 'string' ? formik.errors.dateOfBirth : '',
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Gender"
                    name="gender"
                    value={formik.values.gender}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.gender && Boolean(formik.errors.gender)}
                    helperText={formik.touched.gender && formik.errors.gender}
                  >
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Marital Status"
                    name="maritalStatus"
                    value={formik.values.maritalStatus}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.maritalStatus && Boolean(formik.errors.maritalStatus)}
                    helperText={formik.touched.maritalStatus && formik.errors.maritalStatus}
                  >
                    <MenuItem value="SINGLE">Single</MenuItem>
                    <MenuItem value="MARRIED">Married</MenuItem>
                    <MenuItem value="DIVORCED">Divorced</MenuItem>
                    <MenuItem value="WIDOWED">Widowed</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Employment */}
            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Employee Number"
                    name="employeeNumber"
                    value={formik.values.employeeNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.employeeNumber && Boolean(formik.errors.employeeNumber)}
                    helperText={formik.touched.employeeNumber && formik.errors.employeeNumber}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Hire Date"
                    value={formik.values.hireDate}
                    onChange={(val) => formik.setFieldValue('hireDate', val)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: formik.touched.hireDate && Boolean(formik.errors.hireDate),
                        helperText: formik.touched.hireDate && typeof formik.errors.hireDate === 'string' ? formik.errors.hireDate : '',
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Department"
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.department && Boolean(formik.errors.department)}
                    helperText={formik.touched.department && formik.errors.department}
                  >
                    {(departments || []).map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Job Title"
                    name="jobTitle"
                    value={formik.values.jobTitle}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.jobTitle && Boolean(formik.errors.jobTitle)}
                    helperText={formik.touched.jobTitle && formik.errors.jobTitle}
                  >
                    {(jobTitles || []).map((j) => (
                      <MenuItem key={j} value={j}>{j}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Employment Type"
                    name="employmentType"
                    value={formik.values.employmentType}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="FULL_TIME">Full Time</MenuItem>
                    <MenuItem value="PART_TIME">Part Time</MenuItem>
                    <MenuItem value="CONTRACT">Contract</MenuItem>
                    <MenuItem value="INTERN">Intern</MenuItem>
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
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                    <MenuItem value="SUSPENDED">Suspended</MenuItem>
                    <MenuItem value="TERMINATED">Terminated</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Branch"
                    name="branch"
                    value={formik.values.branch}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.branch && Boolean(formik.errors.branch)}
                    helperText={formik.touched.branch && formik.errors.branch}
                  >
                    {(branches || []).map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={supervisors || []}
                    getOptionLabel={(opt) => opt.name}
                    value={(supervisors || []).find((s) => s.id === formik.values.supervisorId) || null}
                    onChange={(_, val) => formik.setFieldValue('supervisorId', val?.id || '')}
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Supervisor" fullWidth />
                    )}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Compensation */}
            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Currency"
                    name="currency"
                    value={formik.values.currency}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="AED">AED</MenuItem>
                    <MenuItem value="SAR">SAR</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Basic Salary"
                    name="basicSalary"
                    type="number"
                    value={formik.values.basicSalary}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.basicSalary && Boolean(formik.errors.basicSalary)}
                    helperText={formik.touched.basicSalary && formik.errors.basicSalary}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">{formik.values.currency}</InputAdornment>,
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Housing Allowance"
                    name="housingAllowance"
                    type="number"
                    value={formik.values.housingAllowance}
                    onChange={formik.handleChange}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">{formik.values.currency}</InputAdornment>,
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Transport Allowance"
                    name="transportAllowance"
                    type="number"
                    value={formik.values.transportAllowance}
                    onChange={formik.handleChange}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">{formik.values.currency}</InputAdornment>,
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Other Allowances"
                    name="otherAllowances"
                    type="number"
                    value={formik.values.otherAllowances}
                    onChange={formik.handleChange}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">{formik.values.currency}</InputAdornment>,
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Calculate />}
                    onClick={() => setSalaryPreview(!salaryPreview)}
                  >
                    {salaryPreview ? 'Hide' : 'Show'} Salary Preview
                  </Button>
                </Grid>
                {salaryPreview && (
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>Salary Breakdown</Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">Basic Salary:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2" fontWeight={600}>{Number(formik.values.basicSalary).toLocaleString()}</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">Housing:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">{Number(formik.values.housingAllowance).toLocaleString()}</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">Transport:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">{Number(formik.values.transportAllowance).toLocaleString()}</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">Other:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">{Number(formik.values.otherAllowances).toLocaleString()}</Typography></Grid>
                        <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="subtitle2">Total Package:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="subtitle2" color="primary">{totalSalary.toLocaleString()} {formik.values.currency}</Typography></Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            {/* Banking */}
            <TabPanel value={activeTab} index={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Name"
                    name="bankName"
                    value={formik.values.bankName}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Account Number"
                    name="accountNumber"
                    value={formik.values.accountNumber}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="IBAN"
                    name="iban"
                    value={formik.values.iban}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Emergency Contact */}
            <TabPanel value={activeTab} index={4}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Contact Name"
                    name="emergencyContactName"
                    value={formik.values.emergencyContactName}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Contact Phone"
                    name="emergencyContactPhone"
                    value={formik.values.emergencyContactPhone}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Relationship"
                    name="emergencyContactRelationship"
                    value={formik.values.emergencyContactRelationship}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Address */}
            <TabPanel value={activeTab} index={5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Address"
                    name="address"
                    multiline
                    rows={3}
                    value={formik.values.address}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="City"
                    name="city"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Country"
                    name="country"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : employeeId ? 'Update Employee' : 'Create Employee'}
          </Button>
        </DialogActions>
      </form>
    </LocalizationProvider>
  );
};

export default EmployeeForm;
