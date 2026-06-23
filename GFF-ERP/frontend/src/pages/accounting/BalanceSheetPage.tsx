import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Download,
  Print,
  ExpandMore,
  ExpandLess,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, printWindow } from '../../utils/formatters';
import type { BalanceSheetItem } from '../../types';

const BalanceSheetSection: React.FC<{
  title: string;
  items: BalanceSheetItem[];
  subtotal: number;
  defaultExpanded?: boolean;
}> = ({ title, items, subtotal, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Box mb={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(subtotal)}</Typography>
          <IconButton size="small">{expanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ pl: 4 }}>{item.accountName}</TableCell>
                  <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Box>
  );
};

const BalanceSheetPage: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState<Date | null>(new Date());
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: () =>
      accountingService.getBalanceSheet({
        asOfDate: asOfDate!.toISOString().split('T')[0],
      }),
    enabled: submitted && !!asOfDate,
  });

  const handlePrint = () => printWindow('balance-sheet-print');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Balance Sheet
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="As of Date"
                  value={asOfDate}
                  onChange={setAsOfDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => setSubmitted(true)}
                  disabled={!asOfDate}
                  fullWidth
                >
                  Generate Report
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {submitted && isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {submitted && !isLoading && data && (
          <>
            {data.isBalanced ? (
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                Balance Sheet is balanced: Assets = Liabilities + Equity
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Balance Sheet is NOT balanced! Difference:{' '}
                {formatCurrency(Math.abs(data.totalAssets - data.totalLiabilities - data.totalEquity))}
              </Alert>
            )}

            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <Button size="small" startIcon={<Download />} variant="outlined">
                Export CSV
              </Button>
              <Button size="small" startIcon={<Print />} onClick={handlePrint} variant="outlined">
                Print
              </Button>
            </Box>

            <div id="balance-sheet-print">
              <Card>
                <CardContent>
                  <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
                    Balance Sheet
                  </Typography>
                  <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                    As of {formatDate(asOfDate!)}
                  </Typography>

                  <BalanceSheetSection
                    title="ASSETS"
                    items={data.assets.items}
                    subtotal={data.assets.subtotal}
                  />

                  <BalanceSheetSection
                    title="LIABILITIES"
                    items={data.liabilities.items}
                    subtotal={data.liabilities.subtotal}
                  />

                  <BalanceSheetSection
                    title="EQUITY"
                    items={data.equity.items}
                    subtotal={data.equity.subtotal}
                  />

                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      backgroundColor: '#e8f5e9',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Total Assets
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatCurrency(data.totalAssets)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      backgroundColor: '#fce4ec',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Total Liabilities + Equity
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(data.totalLiabilities + data.totalEquity)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default BalanceSheetPage;
