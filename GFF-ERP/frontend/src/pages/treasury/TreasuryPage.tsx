import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  TrendingDown,
  Receipt,
  Payment,
  Refresh as RefreshIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { treasuryService } from '../../services/treasuryService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import type { CashTransaction, BankTransaction } from '../../types';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];

const KPICard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Box
          sx={{
            backgroundColor: `${color}15`,
            borderRadius: 2,
            p: 1,
            mr: 2,
            display: 'flex',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { color } })}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight="bold" color={color}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const TreasuryPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: cashPosition,
    isLoading: cpLoading,
    error: cpError,
    refetch: refetchCp,
  } = useQuery({
    queryKey: ['cash-position'],
    queryFn: treasuryService.getCashPosition,
  });

  const { data: branchPositions, isLoading: bpLoading } = useQuery({
    queryKey: ['branch-cash-position'],
    queryFn: treasuryService.getBranchCashPosition,
  });

  const { data: cashTransactionsData, isLoading: ctLoading } = useQuery({
    queryKey: ['recent-cash-transactions'],
    queryFn: () => treasuryService.getCashTransactions({ pageSize: 5 }),
  });

  const { data: bankTransactionsData, isLoading: btLoading } = useQuery({
    queryKey: ['recent-bank-transactions'],
    queryFn: () => treasuryService.getBankTransactions({ pageSize: 5 }),
  });

  const cashTransactions: CashTransaction[] = cashTransactionsData?.data ?? [];
  const bankTransactions: BankTransaction[] = bankTransactionsData?.data ?? [];

  const pieData = cashPosition
    ? [
        { name: 'Cash on Hand', value: cashPosition.totalCash },
        { name: 'Bank Balance', value: cashPosition.totalBank },
        { name: 'Receivables', value: cashPosition.totalReceivables },
      ]
    : [];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Treasury Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetchCp()}
          disabled={cpLoading}
        >
          Refresh
        </Button>
      </Box>

      {cpError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load cash position data
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid>
          <KPICard
            title="Total Cash"
            value={formatCurrency(cashPosition?.totalCash ?? 0)}
            icon={<Receipt />}
            color="#4caf50"
            subtitle="Cash on hand"
          />
        </Grid>
        <Grid>
          <KPICard
            title="Total Bank"
            value={formatCurrency(cashPosition?.totalBank ?? 0)}
            icon={<AccountBalance />}
            color="#2196f3"
            subtitle="Bank balances"
          />
        </Grid>
        <Grid>
          <KPICard
            title="Net Position"
            value={formatCurrency(cashPosition?.netPosition ?? 0)}
            icon={<TrendingUp />}
            color="#ff9800"
            subtitle="Cash + Bank"
          />
        </Grid>
        <Grid>
          <KPICard
            title="Receivables"
            value={formatCurrency(cashPosition?.totalReceivables ?? 0)}
            icon={<TrendingUp />}
            color="#4caf50"
          />
        </Grid>
        <Grid>
          <KPICard
            title="Payables"
            value={formatCurrency(cashPosition?.totalPayables ?? 0)}
            icon={<TrendingDown />}
            color="#f44336"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cash vs Bank Breakdown
              </Typography>
              <Box height={300}>
                {cpLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Branch-wise Cash Position
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Branch</TableCell>
                      <TableCell align="right">Cash</TableCell>
                      <TableCell align="right">Bank</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bpLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : (
                      branchPositions?.map((bp) => (
                        <TableRow key={bp.branchId}>
                          <TableCell>{bp.branchName}</TableCell>
                          <TableCell align="right">{formatCurrency(bp.cashAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(bp.bankAmount)}</TableCell>
                          <TableCell align="right" fontWeight="bold">
                            {formatCurrency(bp.cashAmount + bp.bankAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Cash Transactions</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/cashboxes')}
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ctLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : cashTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No recent transactions
                        </TableCell>
                      </TableRow>
                    ) : (
                      cashTransactions.map((tx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell>{formatDate(tx.date)}</TableCell>
                          <TableCell>
                            <Chip
                              label={tx.type}
                              size="small"
                              color={tx.type === 'RECEIPT' ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(tx.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={tx.status}
                              size="small"
                              color={getStatusColor(tx.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Bank Transactions</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/banks')}
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {btLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : bankTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No recent transactions
                        </TableCell>
                      </TableRow>
                    ) : (
                      bankTransactions.map((tx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell>{formatDate(tx.date)}</TableCell>
                          <TableCell>
                            <Chip
                              label={tx.type}
                              size="small"
                              color={tx.type === 'DEPOSIT' ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(tx.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={tx.status}
                              size="small"
                              color={getStatusColor(tx.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TreasuryPage;
