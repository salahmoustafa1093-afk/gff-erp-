import React, { useState } from 'react';
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
  Alert,
} from '@mui/material';
import { Assessment, Search, Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TrialBalancePage from '../accounting/TrialBalancePage';
import BalanceSheetPage from '../accounting/BalanceSheetPage';
import IncomeStatementPage from '../accounting/IncomeStatementPage';
import CashFlowPage from '../accounting/CashFlowPage';
import GeneralLedgerPage from '../accounting/GeneralLedgerPage';

type ReportType =
  | 'none'
  | 'trial-balance'
  | 'balance-sheet'
  | 'income-statement'
  | 'cash-flow'
  | 'general-ledger';

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'none', label: 'Select a report...' },
  { value: 'trial-balance', label: 'Trial Balance' },
  { value: 'balance-sheet', label: 'Balance Sheet' },
  { value: 'income-statement', label: 'Income Statement' },
  { value: 'cash-flow', label: 'Cash Flow Statement' },
  { value: 'general-ledger', label: 'General Ledger' },
];

const FinancialReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('none');

  const renderReport = () => {
    switch (selectedReport) {
      case 'trial-balance':
        return <TrialBalancePage />;
      case 'balance-sheet':
        return <BalanceSheetPage />;
      case 'income-statement':
        return <IncomeStatementPage />;
      case 'cash-flow':
        return <CashFlowPage />;
      case 'general-ledger':
        return <GeneralLedgerPage />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {selectedReport === 'none' && (
        <Box p={3}>
          <Typography variant="h4" fontWeight="bold" mb={3}>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Financial Reports
          </Typography>

          <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom align="center">
                Select a Financial Report
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Choose from the available financial reports to generate and view.
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedReport}
                  label="Report Type"
                  onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                >
                  {reportOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {reportOptions.filter((o) => o.value !== 'none').map((opt) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={opt.value}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { backgroundColor: '#f5f5f5', borderColor: 'primary.main' },
                      }}
                      onClick={() => setSelectedReport(opt.value)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {opt.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {selectedReport !== 'none' && (
        <>
          <Box p={2} pb={0} display="flex" justifyContent="space-between" alignItems="center">
            <Button variant="outlined" size="small" onClick={() => setSelectedReport('none')}>
              Back to Report Selection
            </Button>
            <Box display="flex" gap={1}>
              <Button size="small" startIcon={<Print />} variant="outlined">
                Print
              </Button>
            </Box>
          </Box>
          {renderReport()}
        </>
      )}
    </Box>
  );
};

export default FinancialReportsPage;
