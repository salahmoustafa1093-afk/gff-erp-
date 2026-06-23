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
  CircularProgress,
} from '@mui/material';
import { Search, Download, Print } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, printWindow } from '../../utils/formatters';
import type { CashFlowItem } from '../../types';

const CashFlowSection: React.FC<{
  title: string;
  items: CashFlowItem[];
  subtotal: number;
}> = ({ title, items, subtotal }) => (
  <Box mb={3}>
    <Box sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, mb: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    <TableContainer>
      <Table size="small">
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ pl: 4 }}>{item.description}</TableCell>
              <TableCell align="right" width={150}>
                {formatCurrency(item.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Box
      display="flex"
      justifyContent="space-between"
      sx={{ borderTop: '2px solid #e0e0e0', mt: 1, pt: 1 }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ pl: 4 }}>
        Net {title}
      </Typography>
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        color={subtotal >= 0 ? 'success.main' : 'error.main'}
      >
        {formatCurrency(subtotal)}
      </Typography>
    </Box>
  </Box>
);

const CashFlowPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cash-flow', dateFrom, dateTo],
    queryFn: () =>
      accountingService.getCashFlow({
        dateFrom: dateFrom!.toISOString().split('T')[0],
        dateTo: dateTo!.toISOString().split('T')[0],
      }),
    enabled: submitted && !!dateFrom && !!dateTo,
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Cash Flow Statement
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Date From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Date To"
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => setSubmitted(true)}
                  disabled={!dateFrom || !dateTo}
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
            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
              <Button size="small" startIcon={<Download />} variant="outlined">
                Export CSV
              </Button>
              <Button size="small" startIcon={<Print />} onClick={() => printWindow('cash-flow-print')} variant="outlined">
                Print
              </Button>
            </Box>

            <div id="cash-flow-print">
              <Card>
                <CardContent>
                  <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
                    Cash Flow Statement
                  </Typography>
                  <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                    {formatDate(dateFrom!)} to {formatDate(dateTo!)}
                  </Typography>

                  <CashFlowSection
                    title="Cash Flow from Operating Activities"
                    items={data.operating.items}
                    subtotal={data.operating.subtotal}
                  />

                  <CashFlowSection
                    title="Cash Flow from Investing Activities"
                    items={data.investing.items}
                    subtotal={data.investing.subtotal}
                  />

                  <CashFlowSection
                    title="Cash Flow from Financing Activities"
                    items={data.financing.items}
                    subtotal={data.financing.subtotal}
                  />

                  <Box
                    sx={{
                      backgroundColor: '#e3f2fd',
                      p: 2,
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Net Change in Cash
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={data.netChange >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(data.netChange)}
                    </Typography>
                  </Box>

                  <Box sx={{ borderTop: '2px solid #000', pt: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1">Opening Cash Balance</Typography>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {formatCurrency(data.openingBalance)}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      sx={{ backgroundColor: '#2e7d32', color: 'white', p: 2, borderRadius: 1 }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Closing Cash Balance
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(data.closingBalance)}
                      </Typography>
                    </Box>
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

export default CashFlowPage;
