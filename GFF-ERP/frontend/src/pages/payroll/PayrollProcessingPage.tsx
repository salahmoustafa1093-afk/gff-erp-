import React, { useState } from 'react';
import {
  Box, Typography, Button, Chip, IconButton, TextField, Paper,
  Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, Divider, Tooltip, CircularProgress
} from '@mui/material';
import {
  DataGrid, GridColDef, GridRenderCellParams
} from '@mui/x-data-grid';
import {
  PlayArrow, Refresh, Close, Print, Receipt, Undo,
  ExpandMore, ExpandLess, Save, CheckCircle, Warning
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { EmployeePayroll, PayrollPeriod } from '../../types';

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'info'> = {
  DRAFT: 'default',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  CLOSED: 'info',
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  color?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, bold, color }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400} color={color}>
      {value}
    </Typography>
  </Box>
);

const PayrollProcessingPage: React.FC = () => {
  const { periodId: urlPeriodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(urlPeriodId || '');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EmployeePayroll>>({});
  const [confirmDialog, setConfirmDialog] = useState<'process' | 'close' | 'reverse' | null>(null);

  const effectivePeriodId = urlPeriodId || selectedPeriodId;

  const { data: period, isLoading: periodLoading } = useQuery({
    queryKey: ['payroll-period', effectivePeriodId],
    queryFn: () => apiService.getPayrollPeriod(effectivePeriodId),
    enabled: !!effectivePeriodId,
  });

  const { data: employeePayrolls, isLoading: payrollsLoading } = useQuery({
    queryKey: ['employee-payrolls', effectivePeriodId],
    queryFn: () => apiService.getEmployeePayrolls(effectivePeriodId),
    enabled: !!effectivePeriodId,
  });

  const { data: periods } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => apiService.getPayrollPeriods(),
    enabled: !urlPeriodId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeePayroll> }) =>
      apiService.updateEmployeePayroll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
      setEditingRow(null);
    },
  });

  const processMutation = useMutation({
    mutationFn: () => apiService.processPayroll(effectivePeriodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
      setConfirmDialog(null);
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () => apiService.recalculatePayroll(effectivePeriodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => apiService.closePayroll(effectivePeriodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
      setConfirmDialog(null);
    },
  });

  const reverseMutation = useMutation({
    mutationFn: () => apiService.reversePayroll(effectivePeriodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] });
      setConfirmDialog(null);
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startEdit = (row: EmployeePayroll) => {
    setEditingRow(row.id);
    setEditValues({
      bonuses: row.bonuses,
      otherDeductions: row.otherDeductions,
      notes: row.notes,
      included: row.included,
    });
  };

  const saveEdit = () => {
    if (!editingRow) return;
    updateMutation.mutate({ id: editingRow, data: editValues });
  };

  const summary = React.useMemo(() => {
    const rows = employeePayrolls || [];
    const included = rows.filter((r) => r.included);
    return {
      totalBasic: included.reduce((s, r) => s + r.basicSalary, 0),
      totalAllowances: included.reduce((s, r) => s + r.housingAllowance + r.transportAllowance + r.otherAllowances, 0),
      totalOvertime: included.reduce((s, r) => s + r.overtime, 0),
      totalBonuses: included.reduce((s, r) => s + r.bonuses, 0),
      totalGross: included.reduce((s, r) => s + r.grossSalary, 0),
      totalSocial: included.reduce((s, r) => s + r.socialInsurance, 0),
      totalTax: included.reduce((s, r) => s + r.tax, 0),
      totalLoan: included.reduce((s, r) => s + r.loanDeduction, 0),
      totalDeductions: included.reduce((s, r) => s + r.totalDeductions, 0),
      totalNet: included.reduce((s, r) => s + r.netSalary, 0),
      employeeCount: included.length,
    };
  }, [employeePayrolls]);

  const currency = period?.currency || 'USD';

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const columns: GridColDef[] = [
    {
      field: 'expand',
      headerName: '',
      width: 40,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton size="small" onClick={() => toggleExpand(params.row.id)}>
          {expandedRows.has(params.row.id) ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      ),
    },
    {
      field: 'included',
      headerName: 'Inc.',
      width: 60,
      type: 'boolean',
      renderCell: (params: GridRenderCellParams) => (
        editingRow === params.row.id ? (
          <Chip
            label={editValues.included ? 'Yes' : 'No'}
            color={editValues.included ? 'success' : 'default'}
            size="small"
            onClick={() => setEditValues((p) => ({ ...p, included: !p.included }))}
            sx={{ cursor: 'pointer' }}
          />
        ) : (
          <Chip
            label={params.value ? 'Yes' : 'No'}
            color={params.value ? 'success' : 'default'}
            size="small"
            variant={params.value ? 'filled' : 'outlined'}
          />
        )
      ),
    },
    {
      field: 'employeeName',
      headerName: 'Employee',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.employeeNumber}</Typography>
        </Box>
      ),
    },
    { field: 'department', headerName: 'Dept', width: 120 },
    {
      field: 'basicSalary',
      headerName: 'Basic',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'allowances',
      headerName: 'Allow.',
      width: 100,
      type: 'number',
      valueGetter: (_, row: EmployeePayroll) => row.housingAllowance + row.transportAllowance + row.otherAllowances,
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'overtime',
      headerName: 'OT',
      width: 80,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'bonuses',
      headerName: 'Bonus',
      width: 90,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        editingRow === params.row.id ? (
          <TextField
            size="small"
            type="number"
            value={editValues.bonuses || 0}
            onChange={(e) => setEditValues((p) => ({ ...p, bonuses: parseFloat(e.target.value) || 0 }))}
            sx={{ width: 80 }}
          />
        ) : (
          <Typography variant="body2">{fmt(params.value)}</Typography>
        )
      ),
    },
    {
      field: 'grossSalary',
      headerName: 'Gross',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'socialInsurance',
      headerName: 'Social Ins.',
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'tax',
      headerName: 'Tax',
      width: 90,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'totalDeductions',
      headerName: 'Deductions',
      width: 100,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
    },
    {
      field: 'netSalary',
      headerName: 'Net',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) => fmt(value),
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={700} color="success.main">
          {fmt(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={0.5}>
          {editingRow === params.row.id ? (
            <>
              <Tooltip title="Save">
                <IconButton size="small" color="success" onClick={saveEdit}>
                  <Save fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={() => setEditingRow(null)}>
                  <ExpandLess fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => startEdit(params.row)}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Payslip">
                <IconButton size="small" onClick={() => navigate(`/payroll/payslip/${effectivePeriodId}/${params.row.employeeId}`)}>
                  <Receipt fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const renderDetailPanel = (row: EmployeePayroll) => (
    <Collapse in={expandedRows.has(row.id)}>
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" gutterBottom>Earnings Breakdown</Typography>
            <DetailRow label="Basic Salary" value={`${currency} ${fmt(row.basicSalary)}`} />
            <DetailRow label="Housing Allowance" value={`${currency} ${fmt(row.housingAllowance)}`} />
            <DetailRow label="Transport Allowance" value={`${currency} ${fmt(row.transportAllowance)}`} />
            <DetailRow label="Other Allowances" value={`${currency} ${fmt(row.otherAllowances)}`} />
            <DetailRow label="Overtime" value={`${currency} ${fmt(row.overtime)}`} />
            <DetailRow label="Bonuses" value={`${currency} ${fmt(row.bonuses)}`} />
            <Divider sx={{ my: 1 }} />
            <DetailRow label="Gross Salary" value={`${currency} ${fmt(row.grossSalary)}`} bold />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" gutterBottom>Deductions Breakdown</Typography>
            <DetailRow label="Social Insurance" value={`${currency} ${fmt(row.socialInsurance)}`} />
            <DetailRow label="Income Tax" value={`${currency} ${fmt(row.tax)}`} />
            <DetailRow label="Loan Deduction" value={`${currency} ${fmt(row.loanDeduction)}`} />
            <DetailRow label="Other Deductions" value={`${currency} ${fmt(row.otherDeductions)}`} />
            <Divider sx={{ my: 1 }} />
            <DetailRow label="Total Deductions" value={`${currency} ${fmt(row.totalDeductions)}`} bold color="#d32f2f" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" gutterBottom>Summary</Typography>
            <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
              <DetailRow label="Gross Earnings" value={`${currency} ${fmt(row.grossSalary)}`} />
              <DetailRow label="Total Deductions" value={`${currency} ${fmt(row.totalDeductions)}`} color="#d32f2f" />
              <Divider sx={{ my: 1 }} />
              <DetailRow label="NET SALARY" value={`${currency} ${fmt(row.netSalary)}`} bold color="#2e7d32" />
            </Paper>
            {row.notes && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">Notes: {row.notes}</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Collapse>
  );

  if (!urlPeriodId && !selectedPeriodId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Payroll Processing</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>Select a payroll period to process</Alert>
        <DataGrid
          rows={periods || []}
          columns={[
            { field: 'name', headerName: 'Period', width: 200 },
            { field: 'status', headerName: 'Status', width: 120 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 120,
              renderCell: (params) => (
                <Button size="small" variant="outlined" onClick={() => setSelectedPeriodId(params.row.id)}>
                  Select
                </Button>
              ),
            },
          ]}
          loading={!periods}
          autoHeight
          disableRowSelectionOnClick
        />
      </Box>
    );
  }

  if (periodLoading || !period) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Payroll Processing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {period.name} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
          </Typography>
        </Box>
        <Chip
          label={period.status}
          color={statusColors[period.status] || 'default'}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Action Buttons */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        {period.status === 'DRAFT' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={() => setConfirmDialog('process')}
            disabled={processMutation.isPending}
          >
            {processMutation.isPending ? 'Processing...' : 'Process Payroll'}
          </Button>
        )}
        {(period.status === 'PROCESSING' || period.status === 'COMPLETED') && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
          >
            {recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate'}
          </Button>
        )}
        {period.status === 'COMPLETED' && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<Close />}
              onClick={() => setConfirmDialog('close')}
              disabled={closeMutation.isPending}
            >
              Close Payroll
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print All Payslips
            </Button>
          </>
        )}
        {(period.status === 'COMPLETED' || period.status === 'CLOSED') && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Undo />}
            onClick={() => setConfirmDialog('reverse')}
            disabled={reverseMutation.isPending}
          >
            Reverse Payroll
          </Button>
        )}
      </Box>

      {/* Summary Bar */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Total Basic</Typography>
            <Typography variant="h6" fontWeight={700}>{currency} {fmt(summary.totalBasic)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Total Allowances</Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">{currency} {fmt(summary.totalAllowances)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Total Deductions</Typography>
            <Typography variant="h6" fontWeight={700} color="error.main">{currency} {fmt(summary.totalDeductions)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Total Net Pay</Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">{currency} {fmt(summary.totalNet)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Employee Payroll Table */}
      <DataGrid
        rows={employeePayrolls || []}
        columns={columns}
        loading={payrollsLoading}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
        density="compact"
        autoHeight
        disableRowSelectionOnClick
        getRowHeight={() => 'auto'}
        sx={{ mb: 2 }}
      />

      {/* Expandable detail panels rendered below the grid */}
      {(employeePayrolls || []).map((row) => (
        <React.Fragment key={row.id}>
          {renderDetailPanel(row)}
        </React.Fragment>
      ))}

      {/* Confirm Dialogs */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmDialog === 'process' && 'Process Payroll'}
          {confirmDialog === 'close' && 'Close Payroll Period'}
          {confirmDialog === 'reverse' && 'Reverse Payroll'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {confirmDialog === 'process' && 'This will calculate salaries for all included employees. Are you sure?'}
            {confirmDialog === 'close' && 'Closing will lock this period. No further changes can be made. Are you sure?'}
            {confirmDialog === 'reverse' && 'This will reverse all payroll transactions. Are you sure?'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmDialog === 'reverse' ? 'error' : 'primary'}
            onClick={() => {
              if (confirmDialog === 'process') processMutation.mutate();
              if (confirmDialog === 'close') closeMutation.mutate();
              if (confirmDialog === 'reverse') reverseMutation.mutate();
            }}
            disabled={processMutation.isPending || closeMutation.isPending || reverseMutation.isPending}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollProcessingPage;
