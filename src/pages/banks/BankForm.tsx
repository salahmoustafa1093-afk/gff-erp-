import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../../services/bankService';
import type { BankAccount } from '../../types';

const bankSchema = Yup.object().shape({
  code: Yup.string().required('Code is required').max(20, 'Max 20 characters'),
  name: Yup.string().required('Name is required').max(100, 'Max 100 characters'),
  accountNumber: Yup.string().required('Account number is required'),
  iban: Yup.string().max(34, 'Max 34 characters'),
  swiftCode: Yup.string().max(11, 'Max 11 characters'),
  branchName: Yup.string().required('Branch name is required'),
  openingBalance: Yup.number().min(0, 'Cannot be negative').required('Opening balance is required'),
  currency: Yup.string().default('EGP'),
  status: Yup.string().oneOf(['ACTIVE', 'INACTIVE', 'CLOSED']).default('ACTIVE'),
});

const BankForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id && id !== 'new');

  const { data: account, isLoading: loadingAccount } = useQuery({
    queryKey: ['bank-account', id],
    queryFn: () => bankService.getAccountById(id!),
    enabled: isEdit,
  });

  const createMutation = useMutation({
    mutationFn: bankService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      navigate('/banks');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BankAccount>) => bankService.updateAccount(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      navigate('/banks');
    },
  });

  const initialValues: Partial<BankAccount> = {
    code: '',
    name: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    branchName: '',
    openingBalance: 0,
    currency: 'EGP',
    status: 'ACTIVE',
  };

  if (isEdit && loadingAccount) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={800} mx="auto">
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/banks')} variant="outlined" size="small">
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {isEdit ? 'Edit Bank Account' : 'Create Bank Account'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {(createMutation.isError || updateMutation.isError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to {isEdit ? 'update' : 'create'} bank account
            </Alert>
          )}

          <Formik
            initialValues={account ?? initialValues}
            validationSchema={bankSchema}
            enableReinitialize
            onSubmit={(values) => {
              if (isEdit) {
                updateMutation.mutate(values);
              } else {
                createMutation.mutate(values);
              }
            }}
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="code"
                      label="Code"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="name"
                      label="Bank Name"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="accountNumber"
                      label="Account Number"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="branchName"
                      label="Branch Name"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="iban"
                      label="IBAN"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="swiftCode"
                      label="SWIFT Code"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="openingBalance"
                      label="Opening Balance"
                      type="number"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      component={TextField}
                      name="currency"
                      label="Currency"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.status === 'ACTIVE'}
                          onChange={(e) =>
                            setFieldValue('status', e.target.checked ? 'ACTIVE' : 'INACTIVE')
                          }
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button variant="outlined" onClick={() => navigate('/banks')}>
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
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BankForm;
