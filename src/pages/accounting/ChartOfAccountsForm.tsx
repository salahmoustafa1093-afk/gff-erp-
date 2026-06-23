import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Autocomplete,
  TextField as MuiTextField,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../../services/accountingService';
import type { ChartOfAccount, AccountType, AccountSubType, NormalBalance } from '../../types';

const subTypeMap: Record<AccountType, { value: AccountSubType; label: string }[]> = {
  ASSET: [
    { value: 'CURRENT_ASSET', label: 'Current Asset' },
    { value: 'FIXED_ASSET', label: 'Fixed Asset' },
    { value: 'INTANGIBLE_ASSET', label: 'Intangible Asset' },
  ],
  LIABILITY: [
    { value: 'CURRENT_LIABILITY', label: 'Current Liability' },
    { value: 'LONG_TERM_LIABILITY', label: 'Long-term Liability' },
  ],
  EQUITY: [
    { value: 'OWNER_EQUITY', label: 'Owner Equity' },
    { value: 'RETAINED_EARNINGS', label: 'Retained Earnings' },
  ],
  REVENUE: [
    { value: 'OPERATING_REVENUE', label: 'Operating Revenue' },
    { value: 'NON_OPERATING_REVENUE', label: 'Non-operating Revenue' },
  ],
  EXPENSE: [
    { value: 'OPERATING_EXPENSE', label: 'Operating Expense' },
    { value: 'COGS', label: 'Cost of Goods Sold' },
    { value: 'NON_OPERATING_EXPENSE', label: 'Non-operating Expense' },
  ],
};

const accountTypeOptions: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

const normalBalanceMap: Record<AccountType, NormalBalance> = {
  ASSET: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  REVENUE: 'CREDIT',
  EXPENSE: 'DEBIT',
};

const accountSchema = Yup.object().shape({
  code: Yup.string().required('Code is required').max(20),
  name: Yup.string().required('Name is required').max(100),
  type: Yup.string().oneOf(accountTypeOptions).required('Type is required'),
  subType: Yup.string().required('Sub-type is required'),
  parentId: Yup.string().nullable(),
  normalBalance: Yup.string().oneOf(['DEBIT', 'CREDIT']).required(),
  openingBalance: Yup.number().min(0).default(0),
  isActive: Yup.boolean().default(true),
  isSystem: Yup.boolean().default(false),
});

const ChartOfAccountsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id && id !== 'new');

  const { data: account, isLoading: loadingAccount } = useQuery<ChartOfAccount>({
    queryKey: ['chart-of-account', id],
    queryFn: () => accountingService.getAccountById(id!),
    enabled: isEdit,
  });

  const { data: accountsData } = useQuery({
    queryKey: ['chart-of-accounts-all'],
    queryFn: () => accountingService.getAccounts({ includeInactive: true }),
  });

  const createMutation = useMutation({
    mutationFn: accountingService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      navigate('/accounting/chart-of-accounts');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ChartOfAccount>) => accountingService.updateAccount(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      navigate('/accounting/chart-of-accounts');
    },
  });

  const allAccounts: ChartOfAccount[] = accountsData?.data ?? [];

  const parentOptions = allAccounts.filter(
    (a) => (!account || a.id !== account.id) && a.type === (account?.type ?? '')
  );

  const initialValues = {
    code: account?.code ?? '',
    name: account?.name ?? '',
    type: (account?.type ?? 'ASSET') as AccountType,
    subType: (account?.subType ?? 'CURRENT_ASSET') as AccountSubType,
    parentId: account?.parentId ?? '',
    normalBalance: (account?.normalBalance ?? 'DEBIT') as NormalBalance,
    openingBalance: account?.openingBalance ?? 0,
    isActive: account?.isActive ?? true,
    isSystem: account?.isSystem ?? false,
  };

  if (isEdit && loadingAccount) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounting/chart-of-accounts')} variant="outlined" size="small">
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {isEdit ? 'Edit Account' : 'Create Account'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {(createMutation.isError || updateMutation.isError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to {isEdit ? 'update' : 'create'} account
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={accountSchema}
            enableReinitialize
            onSubmit={(values) => {
              const payload = {
                ...values,
                parentId: values.parentId || undefined,
              };
              if (isEdit) {
                updateMutation.mutate(payload);
              } else {
                createMutation.mutate(payload);
              }
            }}
          >
            {({ values, setFieldValue, isSubmitting }) => {
              const availableSubTypes = subTypeMap[values.type] ?? [];
              const autoNormal = normalBalanceMap[values.type];

              return (
                <Form>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={TextField} name="code" label="Account Code" fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field component={TextField} name="name" label="Account Name" fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Account Type</InputLabel>
                        <Select
                          value={values.type}
                          label="Account Type"
                          onChange={(e) => {
                            const newType = e.target.value as AccountType;
                            setFieldValue('type', newType);
                            setFieldValue('subType', subTypeMap[newType][0].value);
                            setFieldValue('normalBalance', normalBalanceMap[newType]);
                            setFieldValue('parentId', '');
                          }}
                        >
                          {accountTypeOptions.map((t) => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Sub-type</InputLabel>
                        <Select
                          value={values.subType}
                          label="Sub-type"
                          onChange={(e) => setFieldValue('subType', e.target.value)}
                        >
                          {availableSubTypes.map((st) => (
                            <MenuItem key={st.value} value={st.value}>{st.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        options={parentOptions}
                        getOptionLabel={(option) => `${option.code} - ${option.name}`}
                        value={parentOptions.find((p) => p.id === values.parentId) ?? null}
                        onChange={(_, val) => setFieldValue('parentId', val?.id ?? '')}
                        renderInput={(params) => (
                          <MuiTextField {...params} label="Parent Account" size="small" fullWidth />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Normal Balance</InputLabel>
                        <Select
                          value={values.normalBalance}
                          label="Normal Balance"
                          onChange={(e) => setFieldValue('normalBalance', e.target.value)}
                        >
                          <MenuItem value="DEBIT">DEBIT</MenuItem>
                          <MenuItem value="CREDIT">CREDIT</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        component={TextField}
                        name="openingBalance"
                        label="Opening Balance"
                        type="number"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} display="flex" alignItems="center" gap={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isActive}
                            onChange={(e) => setFieldValue('isActive', e.target.checked)}
                          />
                        }
                        label="Active"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isSystem}
                            onChange={(e) => setFieldValue('isSystem', e.target.checked)}
                          />
                        }
                        label="System Account"
                      />
                    </Grid>
                    {values.isSystem && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="warning">
                          System accounts cannot be deleted and are used for automated journal entries.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>

                  <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                    <Button variant="outlined" onClick={() => navigate('/accounting/chart-of-accounts')}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <CircularProgress size={20} />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChartOfAccountsForm;
