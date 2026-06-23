import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Paper,
  Chip, Grid, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, FormControl, InputLabel, Select, MenuItem,
  TextField
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Today, EventNote
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, subMonths, addMonths } from 'date-fns';
import { apiService } from '../../services/api';
import { AttendanceRecord, AttendanceStatus } from '../../types';

const statusColors: Record<AttendanceStatus, string> = {
  PRESENT: '#2e7d32',
  ABSENT: '#d32f2f',
  LATE: '#ed6c02',
  HALF_DAY: '#fbc02d',
  ON_LEAVE: '#0288d1',
  HOLIDAY: '#9e9e9e',
};

const statusLabels: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AttendanceCalendar: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  const month = currentMonth.getMonth() + 1;
  const year = currentMonth.getFullYear();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['employee-monthly-attendance', selectedEmployee, month, year],
    queryFn: () => apiService.getEmployeeMonthlyAttendance(selectedEmployee, month, year),
    enabled: !!selectedEmployee,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceRecord> }) =>
      apiService.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-monthly-attendance'] });
      setEditRecord(null);
    },
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    (attendanceData || []).forEach((rec) => {
      map.set(rec.date, rec);
    });
    return map;
  }, [attendanceData]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, ON_LEAVE: 0, HOLIDAY: 0, workingHours: 0 };
    (attendanceData || []).forEach((rec) => {
      counts[rec.status] = (counts[rec.status] || 0) + 1;
      counts.workingHours += rec.workingHours || 0;
    });
    return counts;
  }, [attendanceData]);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Attendance Calendar
        </Typography>

        {/* Employee Selector */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Employee ID"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  placeholder="Enter employee ID to view calendar"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Select an employee to view their monthly attendance calendar
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Calendar Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={goToPrevMonth}><ChevronLeft /></IconButton>
            <Typography variant="h5" fontWeight={600} minWidth={200} textAlign="center">
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={goToNextMonth}><ChevronRight /></IconButton>
          </Box>
          <Button variant="outlined" size="small" startIcon={<Today />} onClick={goToToday}>
            Today
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Calendar Grid */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Paper variant="outlined">
              {/* Weekday headers */}
              <Grid container>
                {WEEKDAYS.map((day) => (
                  <Grid size={{ xs: true }} key={day} sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Calendar days */}
              <Grid container>
                {/* Empty cells for days before the first of month */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <Grid size={{ xs: true }} key={`empty-${i}`} sx={{ minHeight: 100, border: '1px solid', borderColor: 'divider', p: 0.5 }} />
                ))}

                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const record = attendanceMap.get(dateStr);
                  const dayIsToday = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <Grid
                      size={{ xs: true }}
                      key={dateStr}
                      onClick={() => record && setEditRecord(record)}
                      sx={{
                        minHeight: 100,
                        border: '1px solid',
                        borderColor: dayIsToday ? 'primary.main' : 'divider',
                        borderWidth: dayIsToday ? 2 : 1,
                        p: 0.5,
                        cursor: record ? 'pointer' : 'default',
                        bgcolor: dayIsToday ? 'primary.50' : 'background.paper',
                        opacity: isCurrentMonth ? 1 : 0.5,
                        '&:hover': record ? { bgcolor: 'action.hover' } : undefined,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={dayIsToday ? 700 : 400}
                        color={dayIsToday ? 'primary.main' : 'text.primary'}
                      >
                        {format(day, 'd')}
                      </Typography>
                      {record && (
                        <Tooltip title={`${statusLabels[record.status]} - ${record.workingHours}h`}>
                          <Chip
                            label={record.status}
                            size="small"
                            sx={{
                              mt: 0.5,
                              width: '100%',
                              height: 22,
                              fontSize: '0.65rem',
                              bgcolor: `${statusColors[record.status]}15`,
                              color: statusColors[record.status],
                              fontWeight: 600,
                              border: `1px solid ${statusColors[record.status]}40`,
                            }}
                          />
                        </Tooltip>
                      )}
                      {record?.checkIn && (
                        <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                          {record.checkIn} - {record.checkOut || '?'}
                        </Typography>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>

          {/* Summary Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Monthly Summary
                </Typography>

                {isLoading ? (
                  <Typography color="text.secondary">Select an employee to see summary</Typography>
                ) : (
                  <>
                    <Box mb={2}>
                      {Object.entries(statusColors).map(([status, color]) => (
                        <Box key={status} display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box width={12} height={12} borderRadius="50%" bgcolor={color} />
                            <Typography variant="body2">{statusLabels[status]}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600}>
                            {summary[status] || 0} days
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Working Hours
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary">
                        {summary.workingHours.toFixed(1)}h
                      </Typography>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Attendance Rate
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        {attendanceData?.length
                          ? ((((summary.PRESENT || 0) + (summary.LATE || 0)) / attendanceData.length) * 100).toFixed(0)
                          : 0}%
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit Dialog */}
        <Dialog open={!!editRecord} onClose={() => setEditRecord(null)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <EventNote />
              Edit Attendance - {editRecord?.date}
            </Box>
          </DialogTitle>
          <DialogContent>
            {editRecord && (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1">{editRecord.employeeName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editRecord.status}
                      label="Status"
                      onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as AttendanceStatus })}
                    >
                      {Object.keys(statusLabels).map((s) => (
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
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check Out"
                    value={editRecord.checkOut || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, checkOut: e.target.value })}
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
                  notes: editRecord.notes,
                },
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceCalendar;
