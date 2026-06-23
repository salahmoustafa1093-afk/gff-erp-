import React, { useState, useCallback } from 'react';
import {
  Box, Button, TextField, MenuItem, IconButton, Tooltip, Avatar,
  Chip, Dialog, FormControl, InputLabel, Select, Grid,
  useTheme, useMediaQuery, Typography
} from '@mui/material';
import {
  DataGrid, GridColDef, GridRenderCellParams, GridRowParams
} from '@mui/x-data-grid';
import {
  Add, Edit, Visibility, AccessTime, Payment,
  FileDownload, FilterList, Clear, CalendarMonth
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Employee, EmployeeFilters, EmployeeStatus } from '../../types';
import { apiService } from '../../services/api';
import EmployeeForm from './EmployeeForm';

const statusColors: Record<EmployeeStatus, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  TERMINATED: 'error',
  ON_LEAVE: 'info',
  SUSPENDED: 'warning',
};

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [filters, setFilters] = useState<EmployeeFilters>({ limit: 25, page: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => apiService.getEmployees(filters),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.getDepartments(),
  });

  const { data: jobTitles } = useQuery({
    queryKey: ['job-titles'],
    queryFn: () => apiService.getJobTitles(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiService.getBranches(),
  });

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchQuery, page: 1 }));
  }, [searchQuery]);

  const handleFilterChange = useCallback((field: keyof EmployeeFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ limit: 25, page: 1 });
    setSearchQuery('');
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const blob = await apiService.exportEmployees(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // error handled by UI
    }
  }, [filters]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    refetch();
  }, [refetch]);

  const columns: GridColDef[] = [
    {
      field: 'photoUrl',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Avatar
          src={params.value}
          alt={params.row.firstName}
          sx={{ width: 36, height: 36 }}
        >
          {params.row.firstName?.[0]}{params.row.lastName?.[0]}
        </Avatar>
      ),
    },
    {
      field: 'employeeNumber',
      headerName: 'Employee #',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
      valueGetter: (_, row: Employee) => `${row.firstName} ${row.lastName}`,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 140,
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 160,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={statusColors[params.value as EmployeeStatus] || 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'hireDate',
      headerName: 'Hire Date',
      width: 120,
      valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'branch',
      headerName: 'Branch',
      width: 120,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              onClick={() => navigate(`/employees/${params.row.id}`)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => { setEditingId(params.row.id); setFormOpen(true); }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Attendance">
            <IconButton
              size="small"
              onClick={() => navigate(`/attendance?employeeId=${params.row.id}`)}
            >
              <AccessTime fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Payroll History">
            <IconButton
              size="small"
              onClick={() => navigate(`/payroll?employeeId=${params.row.id}`)}
            >
              <Payment fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Employees
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
            size="small"
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setEditingId(null); setFormOpen(true); }}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Search & Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, number, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton size="small" onClick={handleSearch}>
                      <FilterList fontSize="small" />
                    </IconButton>
                  ),
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={showFilters ? <Clear /> : <FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </Button>
          </Grid>
        </Grid>

        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department || ''}
                  label="Department"
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {(departments || []).map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                  <MenuItem value="TERMINATED">Terminated</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={filters.branch || ''}
                  label="Branch"
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {(branches || []).map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Job Title</InputLabel>
                <Select
                  value={filters.jobTitle || ''}
                  label="Job Title"
                  onChange={(e) => handleFilterChange('jobTitle', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {(jobTitles || []).map((j) => (
                    <MenuItem key={j} value={j}>{j}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button size="small" onClick={handleClearFilters} startIcon={<Clear />}>
                Clear All Filters
              </Button>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={data?.data || []}
        columns={columns}
        loading={isLoading}
        rowCount={data?.total || 0}
        paginationMode="server"
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: (filters.page || 1) - 1 },
          },
        }}
        onPaginationModelChange={(model) => {
          setFilters((prev) => ({
            ...prev,
            page: model.page + 1,
            limit: model.pageSize,
          }));
        }}
        disableRowSelectionOnClick
        density="compact"
        sx={{
          '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
        }}
        onRowClick={(params: GridRowParams) => navigate(`/employees/${params.id}`)}
      />

      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <EmployeeForm employeeId={editingId} onClose={handleFormClose} />
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
