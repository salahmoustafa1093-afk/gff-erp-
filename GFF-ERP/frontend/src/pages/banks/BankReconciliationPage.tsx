import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  LinkOff,
  PlayArrow,
  DoneAll,
  CompareArrows,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { bankService } from '../../services/bankService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { BankReconciliation, BankReconciliationItem, BankAccount } from '../../types';

const BankReconciliationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [statementDate, setStatementDate] = useState<Date | null>(new Date());
  const [statementBalance, setStatementBalance] = useState('');
  const [selectedReconId, setSelectedReconId] = useState<string | null>(null);

  const { data: account } = useQuery<BankAccount>({
    queryKey: ['bank-account', id],
    queryFn: () => bankService.getAccountById(id!),
    enabled: !!id,
  });

  const { data: reconciliations, isLoading: reconLoading } = useQuery({
    queryKey: ['reconciliations', id],
    queryFn: () => bankService.getReconciliations(id!),
    enabled: !!id,
  });

  const { data: activeReconciliation } = useQuery<BankReconciliation>({
    queryKey: ['reconciliation-detail', selectedReconId],
    queryFn: () => bankService.getReconciliationById(selectedReconId!),
    enabled: !!selectedReconId,
  });

  const startMutation = useMutation({
    mutationFn: () =>
      bankService.createReconciliation(
        id!,
        statementDate!.toISOString().split('T')[0],
        Number(statementBalance)
      ),
    onSuccess: (data) => {
      setStartDialogOpen(false);
      setSelectedReconId(data.id);
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
  });

  const matchMutation = useMutation({
    mutationFn: ({ bankTxId, sysTxId }: { bankTxId: string; sysTxId: string }) =>
      bankService.matchTransaction(selectedReconId!, bankTxId, sysTxId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-detail'] });
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: (itemId: string) => bankService.unmatchTransaction(selectedReconId!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-detail'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => bankService.completeReconciliation(selectedReconId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-detail'] });
    },
  });

  const reconList = reconciliations?.data ?? [];
  const currentRecon = activeReconciliation ?? reconList.find((r) => r.status === 'IN_PROGRESS');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate(`/banks/${id}/transactions`)} variant="outlined" size="small">
              Back
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Bank Reconciliation
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => setStartDialogOpen(true)}
          >
            Start New Reconciliation
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">Bank Account</Typography>
                <Typography variant="h6">{account?.name}</Typography>
                <Typography variant="body2">{account?.accountNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">System Balance</Typography>
                <Typography variant="h6" color="primary">{formatCurrency(account?.currentBalance ?? 0)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">Reconciliation Status</Typography>
                {currentRecon ? (
                  <Chip
                    label={currentRecon.status}
                    color={currentRecon.status === 'COMPLETED' ? 'success' : 'warning'}
                    size="small"
                  />
                ) : (
                  <Chip label="Not Started" color="default" size="small" />
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {currentRecon && (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CompareArrows sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Reconciliation Summary
                </Typography>
                <Grid container spacing={3} mt={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Statement Balance</Typography>
                    <Typography variant="h6">{formatCurrency(currentRecon.statementBalance)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">System Balance</Typography>
                    <Typography variant="h6">{formatCurrency(currentRecon.systemBalance)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Adjusted Balance</Typography>
                    <Typography variant="h6" color={currentRecon.difference === 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(currentRecon.adjustedBalance)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Difference</Typography>
                    <Typography variant="h6" color={currentRecon.difference === 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(currentRecon.difference)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }} display="flex" alignItems="flex-end" justifyContent="flex-end" gap={2}>
                    {currentRecon.status !== 'COMPLETED' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<DoneAll />}
                        onClick={() => completeMutation.mutate()}
                        disabled={completeMutation.isPending || currentRecon.difference !== 0}
                      >
                        {completeMutation.isPending ? 'Completing...' : 'Complete Reconciliation'}
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="h6" gutterBottom>Reconciliation Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Status</TableCell>
                    <TableCell>Bank Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Bank Amount</TableCell>
                    <TableCell align="right">System Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeReconciliation === undefined ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell>
                    </TableRow>
                  ) : activeReconciliation.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No items to reconcile</TableCell>
                    </TableRow>
                  ) : (
                    activeReconciliation.items.map((item: BankReconciliationItem) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          backgroundColor:
                            item.status === 'MATCHED'
                              ? '#e8f5e9'
                              : item.status === 'UNMATCHED_BANK'
                                ? '#fff3e0'
                                : item.status === 'UNMATCHED_SYSTEM'
                                  ? '#fce4ec'
                                  : 'inherit',
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={item.status.replace('_', ' ')}
                            size="small"
                            color={
                              item.status === 'MATCHED'
                                ? 'success'
                                : item.status === 'PARTIAL'
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{formatDate(item.bankDate)}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.reference}</TableCell>
                        <TableCell align="right">{formatCurrency(item.bankAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.systemAmount)}</TableCell>
                        <TableCell>
                          {item.status === 'MATCHED' ? (
                            <Tooltip title="Unmatch">
                              <IconButton
                                size="small"
                                onClick={() => unmatchMutation.mutate(item.id)}
                                disabled={unmatchMutation.isPending}
                              >
                                <LinkOff fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Match">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  matchMutation.mutate({
                                    bankTxId: item.bankTransactionId,
                                    sysTxId: item.systemTransactionId,
                                  })
                                }
                                disabled={matchMutation.isPending}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Outstanding Bank Items</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Items on bank statement not in system
                    </Typography>
                    <Box mt={1}>
                      {currentRecon.outstandingBankItems.length === 0 ? (
                        <Typography variant="body2" color="success.main">None</Typography>
                      ) : (
                        currentRecon.outstandingBankItems.map((item: BankReconciliationItem) => (
                          <Box key={item.id} display="flex" justifyContent="space-between" py={0.5}>
                            <Typography variant="body2">{item.description}</Typography>
                            <Typography variant="body2">{formatCurrency(item.bankAmount)}</Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Outstanding System Items</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Items in system not on bank statement
                    </Typography>
                    <Box mt={1}>
                      {currentRecon.outstandingSystemItems.length === 0 ? (
                        <Typography variant="body2" color="success.main">None</Typography>
                      ) : (
                        currentRecon.outstandingSystemItems.map((item: BankReconciliationItem) => (
                          <Box key={item.id} display="flex" justifyContent="space-between" py={0.5}>
                            <Typography variant="body2">{item.description}</Typography>
                            <Typography variant="body2">{formatCurrency(item.systemAmount)}</Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Start New Reconciliation</DialogTitle>
          <DialogContent>
            {startMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>Failed to start reconciliation</Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <DatePicker
                  label="Statement Date"
                  value={statementDate}
                  onChange={setStatementDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Statement Balance"
                  type="number"
                  fullWidth
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || !statementDate || !statementBalance}
            >
              {startMutation.isPending ? 'Starting...' : 'Start'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BankReconciliationPage;
