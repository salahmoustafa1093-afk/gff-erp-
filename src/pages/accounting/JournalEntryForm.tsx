import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Alert,
  Autocomplete,
  TextField as MuiTextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Add, Delete, Balance, Save, ArrowBack, CheckCircle } from '@mui/icons-material';
import { Formik, Form, Field, FieldArray, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../../services/accountingService';
import { settingsService } from '../../services/settingsService';
import { formatCurrency } from '../../utils/formatters';
import type { ChartOfAccount, JournalEntryLine, CostCenter } from '../../types';

interface JournalEntryFormValues {
  date: Date;
  reference: string;
  description: string;
  branchId: string;
  postImmediately: boolean;
  lines: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    description: string;
    costCenterId: string;
  }>;
}

const entrySchema = Yup.object().shape({
  date: Yup.date().required('Date is required'),
  reference: Yup.string().required('Reference is required'),
  description: Yup.string().required('Description is required'),
  branchId: Yup.string().required('Branch is required'),
  lines: Yup.array()
    .min(2, 'At least 2 lines are required')
    .of(
      Yup.object().shape({
        accountId: Yup.string().required('Account is required'),
        debit: Yup.string(),
        credit: Yup.string(),
        description: Yup.string(),
      })
    )
    .test('balanced', 'Total debits must equal total credits', (lines) => {
      if (!lines) return false;
      const totalDebits = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
      const totalCredits = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
      return totalDebits === totalCredits && totalDebits > 0;
    })
    .test('no-both-sides', 'A line cannot have both debit and credit', (lines) => {
      if (!lines) return true;
      return lines.every((l) => !(Number(l.debit) > 0 && Number(l.credit) > 0));
    }),
});

const LineTotals: React.FC = () => {
  const { values } = useFormikContext<JournalEntryFormValues>();
  const totalDebits = values.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = values.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebits === totalCredits && totalDebits > 0;

  return (
    <Box display="flex" alignItems="center" gap={3} mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
      <Typography>
        <strong>Total Debits:</strong>{' '}
        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{formatCurrency(totalDebits)}</span>
      </Typography>
      <Typography>
        <strong>Total Credits:</strong>{' '}
        <span style={{ color: '#f44336', fontWeight: 'bold' }}>{formatCurrency(totalCredits)}</span>
      </Typography>
      <Box flex={1} />
      {isBalanced ? (
        <Box display="flex" alignItems="center" gap={0.5} color="success.main">
          <CheckCircle fontSize="small" />
          <Typography fontWeight="bold">Balanced</Typography>
        </Box>
      ) : (
        <Typography color="error.main" fontWeight="bold">
          {totalDebits !== totalCredits ? 'Unbalanced' : 'Zero Entry'}
        </Typography>
      )}
    </Box>
  );
};

const emptyLine = {
  accountId: '',
  accountCode: '',
  accountName: '',
  debit: '',
  credit: '',
  description: '',
  costCenterId: '',
};

const JournalEntryForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');

  const { data: accountsData } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingService.getAccounts(),
  });

  const { data: nextRef } = useQuery({
    queryKey: ['next-journal-reference'],
    queryFn: () => accountingService.getNextReference(),
    enabled: !isEdit,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => settingsService.getBranches(),
  });

  const { data: costCentersData } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: () => settingsService.getCostCenters(),
  });

  const accounts: ChartOfAccount[] = accountsData?.data ?? [];
  const branches = branchesData?.data ?? [];
  const costCenters: CostCenter[] = costCentersData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: {
      date: string;
      reference: string;
      description: string;
      branchId: string;
      postImmediately: boolean;
      lines: Partial<JournalEntryLine>[];
    }) => accountingService.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      navigate('/accounting/journal-entries');
    },
  });

  const initialValues: JournalEntryFormValues = {
    date: new Date(),
    reference: nextRef?.reference ?? '',
    description: '',
    branchId: '',
    postImmediately: false,
    lines: [{ ...emptyLine }, { ...emptyLine }],
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3} maxWidth={1100} mx="auto">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounting/journal-entries')} variant="outlined" size="small">
              Back
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Create Journal Entry
            </Typography>
          </Box>
        </Box>

        {createMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to create journal entry. Please check all fields and ensure the entry is balanced.
          </Alert>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={entrySchema}
          enableReinitialize
          onSubmit={(values) => {
            const lines = values.lines
              .filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))
              .map((l) => ({
                accountId: l.accountId,
                debit: Number(l.debit) || 0,
                credit: Number(l.credit) || 0,
                description: l.description || undefined,
                costCenterId: l.costCenterId || undefined,
              }));

            createMutation.mutate({
              date: values.date.toISOString().split('T')[0],
              reference: values.reference,
              description: values.description,
              branchId: values.branchId,
              postImmediately: values.postImmediately,
              lines,
            });
          }}
        >
          {({ values, setFieldValue, isSubmitting, errors }) => (
            <Form>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Entry Header</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <DatePicker
                        label="Date"
                        value={values.date}
                        onChange={(val) => setFieldValue('date', val)}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Field component={TextField} name="reference" label="Reference" fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <MuiTextField
                          select
                          label="Branch"
                          value={values.branchId}
                          onChange={(e) => setFieldValue('branchId', e.target.value)}
                          SelectProps={{ native: true }}
                          error={Boolean(errors.branchId)}
                          helperText={errors.branchId}
                        >
                          <option value="">Select branch</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </MuiTextField>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={TextField}
                        name="description"
                        label="Description"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Entry Lines</Typography>
                    <Button
                      size="small"
                      startIcon={<Balance />}
                      onClick={() => {
                        const totalDebits = values.lines.reduce(
                          (sum, l) => sum + (Number(l.debit) || 0),
                          0
                        );
                        const totalCredits = values.lines.reduce(
                          (sum, l) => sum + (Number(l.credit) || 0),
                          0
                        );
                        const diff = totalDebits - totalCredits;
                        if (diff !== 0) {
                          const lastLine = values.lines[values.lines.length - 1];
                          if (!lastLine.accountId) {
                            setFieldValue(`lines.${values.lines.length - 1}.debit`, diff < 0 ? String(Math.abs(diff)) : '0');
                            setFieldValue(`lines.${values.lines.length - 1}.credit`, diff > 0 ? String(Math.abs(diff)) : '0');
                          } else {
                            setFieldValue('lines', [
                              ...values.lines,
                              {
                                ...emptyLine,
                                debit: diff < 0 ? String(Math.abs(diff)) : '0',
                                credit: diff > 0 ? String(Math.abs(diff)) : '0',
                              },
                            ]);
                          }
                        }
                      }}
                      variant="outlined"
                    >
                      Auto Balance
                    </Button>
                  </Box>

                  <FieldArray name="lines">
                    {({ push, remove }) => (
                      <>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell width="5%">#</TableCell>
                                <TableCell width="30%">Account</TableCell>
                                <TableCell width="12%">Debit</TableCell>
                                <TableCell width="12%">Credit</TableCell>
                                <TableCell width="20%">Description</TableCell>
                                <TableCell width="15%">Cost Center</TableCell>
                                <TableCell width="6%">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {values.lines.map((line, index) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <Autocomplete
                                      options={accounts}
                                      getOptionLabel={(option) =>
                                        `${option.code} - ${option.name}`
                                      }
                                      value={
                                        accounts.find((a) => a.id === line.accountId) ?? null
                                      }
                                      onChange={(_, val) => {
                                        setFieldValue(`lines.${index}.accountId`, val?.id ?? '');
                                        setFieldValue(
                                          `lines.${index}.accountCode`,
                                          val?.code ?? ''
                                        );
                                        setFieldValue(
                                          `lines.${index}.accountName`,
                                          val?.name ?? ''
                                        );
                                      }}
                                      renderInput={(params) => (
                                        <MuiTextField
                                          {...params}
                                          placeholder="Select account"
                                          size="small"
                                          error={Boolean(
                                            (errors.lines as Array<{ accountId?: string }> | undefined)?.[index]
                                              ?.accountId
                                          )}
                                        />
                                      )}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <MuiTextField
                                      type="number"
                                      size="small"
                                      value={line.debit}
                                      onChange={(e) => {
                                        setFieldValue(`lines.${index}.debit`, e.target.value);
                                        if (Number(e.target.value) > 0) {
                                          setFieldValue(`lines.${index}.credit`, '');
                                        }
                                      }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      fullWidth
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <MuiTextField
                                      type="number"
                                      size="small"
                                      value={line.credit}
                                      onChange={(e) => {
                                        setFieldValue(`lines.${index}.credit`, e.target.value);
                                        if (Number(e.target.value) > 0) {
                                          setFieldValue(`lines.${index}.debit`, '');
                                        }
                                      }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      fullWidth
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <MuiTextField
                                      size="small"
                                      value={line.description}
                                      onChange={(e) =>
                                        setFieldValue(`lines.${index}.description`, e.target.value)
                                      }
                                      placeholder="Line description"
                                      fullWidth
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <MuiTextField
                                      select
                                      size="small"
                                      value={line.costCenterId}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `lines.${index}.costCenterId`,
                                          e.target.value
                                        )
                                      }
                                      SelectProps={{ native: true }}
                                      fullWidth
                                    >
                                      <option value="">None</option>
                                      {costCenters.map((cc) => (
                                        <option key={cc.id} value={cc.id}>
                                          {cc.name}
                                        </option>
                                      ))}
                                    </MuiTextField>
                                  </TableCell>
                                  <TableCell>
                                    {values.lines.length > 2 && (
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => remove(index)}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Button
                          startIcon={<Add />}
                          onClick={() => push({ ...emptyLine })}
                          sx={{ mt: 1 }}
                          size="small"
                        >
                          Add Line
                        </Button>
                      </>
                    )}
                  </FieldArray>

                  <Divider sx={{ my: 2 }} />

                  <LineTotals />

                  {typeof errors.lines === 'string' && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {errors.lines}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.postImmediately}
                        onChange={(e) => setFieldValue('postImmediately', e.target.checked)}
                      />
                    }
                    label="Post immediately (skip draft status)"
                  />
                </CardContent>
              </Card>

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={() => navigate('/accounting/journal-entries')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={createMutation.isPending || isSubmitting}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Journal Entry'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </LocalizationProvider>
  );
};

export default JournalEntryForm;
