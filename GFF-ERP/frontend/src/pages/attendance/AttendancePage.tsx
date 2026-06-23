import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Tooltip, FormControl, InputLabel, Select, MenuItem, TextField,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab
} from '@mui/material';
import {
  DataGrid, GridColDef, GridRenderCellParams
} from '@mui/x-data-grid';
import {
  Today, Refresh, FilterList, Edit, GroupWork,
  CheckCircle, Cancel, Warning, BeachAccess, Schedule
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../../types';

const statusConfig: Record<AttendanceStatus, { color: string; icon: React.ReactNode; label: string }> = {
  PRESENT: { color: '#2e7d32', icon: <CheckCircle fontSize="small" />, label: 'Present' },
  ABSENT: { color: '#d32f2f', icon: <Cancel fontSize="small" />, label: 'Absent' },
  LATE: { color: '#ed6c02', icon: <Warning fontSize="small" />, label: 'Late' },
  HALF_DAY: { color: '#fbc02d', icon: <Schedule fontSize="small" />, label: 'Half Day' },
  ON_LEAVE: { color: '#0288d1', icon: <BeachAccess fontSize="small" />, label: 'On Leave' },
  HOLIDAY: { color: '#9e9e9e', icon: <Today fontSize="small" />, label: 'Holiday' },
};

interface SummaryCardProps {
  title: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, count, total, color, icon }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h4" fontWeight={700} color={color}>
            {count}
          </Typography>
          {total > 0 && (
            <Typography variant="caption" color="text.secondary">
              {((count / total) * 100).toFixed(0)}% of total
            </Typography>
          )}
        </Box>
        <Box sx={{ color, bgcolor: `${color}15`, borderRadius: 2, p: 1 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('');
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('PRESENT');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', dateStr, department, branch],
    queryFn: () => apiService.getAttendance({ date: dateStr, department, branch, limit: 500 }),
    enabled: !!dateStr,
  });

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', dateStr, department, branch],
    queryFn: () => apiService.getAttendanceSummary({ date: dateStr, department, branch }),
    enabled: !!dateStr,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.getDepartments(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiService.getBranches(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceRecord> }) =>
      apiService.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      setEditRecord(null);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (data: { employeeIds: string[]; date: string; status: string }[]) =>
      apiService.bulkAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      setBulkMode(false);
      setSelectedIds([]);
    },
  });

  const handleBulkApply = useCallback(() => {
    if (selectedIds.length === 0 || !dateStr) return;
    const payload = selectedIds.map((empId) => ({
      employeeIds: [empId],
      date: dateStr,
      status: bulkStatus,
    }));
    bulkMutation.mutate(payload);
  }, [selectedIds, dateStr, bulkStatus, bulkMutation]);

  const columns: GridColDef[] = [
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
    { field: 'department', headerName: 'Department', width: 140 },
    {
      field: 'checkIn',
      headerName: 'Check In',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'checkOut',
      headerName: 'Check Out',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const config = statusConfig[params.value as AttendanceStatus] || statusConfig.HOLIDAY;
        return (
          <Chip
            icon={config.icon}
            label={params.value}
            size="small"
            sx={{
              bgcolor: `${config.color}15`,
              color: config.color,
              fontWeight: 600,
              border: `1px solid ${config.color}30`,
            }}
            onClick={() => !bulkMode && setEditRecord(params.row)}
          />
        );
      },
    },
    {
      field: 'workingHours',
      headerName: 'Hours',
      width: 80,
      type: 'number',
      valueFormatter: (value: number) => value ? value.toFixed(1) : '-',
    },
    {
      field: 'overtime',
      headerName: 'OT',
      width: 60,
      type: 'number',
      valueFormatter: (value: number) => value ? value.toFixed(1) : '-',
    },
    { field: 'notes', headerName: 'Notes', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Edit Status">
          <IconButton size="small" onClick={() => setEditRecord(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const total = summary?.totalEmployees || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Attendance Management
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: true }}>
            <SummaryCard title="Present" count={summary?.present || 0} total={total} color="#2e7d32" icon={<CheckCircle />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: true }}>
            <SummaryCard title="Absent" count={summary?.absent || 0} total={total} color="#d32f2f" icon={<Cancel />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: true }}>
            <SummaryCard title="Late" count={summary?.late || 0} total={total} color="#ed6c02" icon={<Warning />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: true }}>
            <SummaryCard title="On Leave" count={summary?.onLeave || 0} total={total} color="#0288d1" icon={<BeachAccess />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: true }}>
            <SummaryCard title="Total" count={total} total={total} color="#9c27b0" icon={<GroupWork />} />
          </Grid>
        </Grid>

        {/* Filters */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select value={department} label="Department" onChange={(e) => setDepartment(e.target.value)}>
                    <MenuItem value="">All Departments</MenuItem>
                    {(departments || []).map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Branch</InputLabel>
                  <Select value={branch} label="Branch" onChange={(e) => setBranch(e.target.value)}>
                    <MenuItem value="">All Branches</MenuItem>
                    {(branches || []).map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant={bulkMode ? 'contained' : 'outlined'}
                  color={bulkMode ? 'secondary' : 'primary'}
                  startIcon={<GroupWork />}
                  onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
                  fullWidth
                >
                  {bulkMode ? 'Cancel Bulk' : 'Bulk Entry'}
                </Button>
              </Grid>
            </Grid>

            {bulkMode && (
              <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1} display="flex" gap={2} alignItems="center">
                <Typography variant="body2">{selectedIds.length} selected</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={bulkStatus} label="Status" onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus)}>
                    {Object.keys(statusConfig).map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleBulkApply}
                  disabled={selectedIds.length === 0 || bulkMutation.isPending}
                >
                  Apply
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* DataGrid */}
        <DataGrid
          rows={attendance?.data || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          density="compact"
          disableRowSelectionOnClick={!bulkMode}
          checkboxSelection={bulkMode}
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={(ids) => setSelectedIds(ids as string[])}
          sx={{ height: 'calc(100vh - 420px)', minHeight: 400 }}
        />

        {/* Edit Dialog */}
        <Dialog open={!!editRecord} onClose={() => setEditRecord(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogContent>
            {editRecord && (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {editRecord.employeeName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {editRecord.date} | {editRecord.department}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editRecord.status}
                      label="Status"
                      onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as AttendanceStatus })}
                    >
                      {Object.keys(statusConfig).map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check In"
                    value={editRecord.checkIn || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, checkIn: e.target.value })}
                    placeholder="HH:MM"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check Out"
                    value={editRecord.checkOut || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, checkOut: e.target.value })}
                    placeholder="HH:MM"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Working Hours"
                    type="number"
                    value={editRecord.workingHours || 0}
                    onChange={(e) => setEditRecord({ ...editRecord, workingHours: parseFloat(e.target.value) })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Overtime"
                    type="number"
                    value={editRecord.overtime || 0}
                    onChange={(e) => setEditRecord({ ...editRecord, overtime: parseFloat(e.target.value) })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notes"
                    multiline
                    rows={2}
                    value={editRecord.notes || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => editRecord && updateMutation.mutate({
                id: editRecord.id,
                data: {
                  status: editRecord.status,
                  checkIn: editRecord.checkIn,
                  checkOut: editRecord.checkOut,
                  workingHours: editRecord.workingHours,
                  overtime: editRecord.overtime,
                  notes: editRecord.notes,
                },
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AttendancePage;
