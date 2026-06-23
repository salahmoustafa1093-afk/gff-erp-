import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Box, Button, TextField, MenuItem, IconButton, Tooltip, Avatar, Chip, Dialog, FormControl, InputLabel, Select, Grid, useTheme, useMediaQuery, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Visibility, AccessTime, Payment, FileDownload, FilterList, Clear } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import EmployeeForm from './EmployeeForm';
const statusColors = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    TERMINATED: 'error',
    ON_LEAVE: 'info',
    SUSPENDED: 'warning',
};
const EmployeesPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [filters, setFilters] = useState({ limit: 25, page: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
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
    const handleFilterChange = useCallback((field, value) => {
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
        }
        catch {
            // error handled by UI
        }
    }, [filters]);
    const handleFormClose = useCallback(() => {
        setFormOpen(false);
        setEditingId(null);
        refetch();
    }, [refetch]);
    const columns = [
        {
            field: 'photoUrl',
            headerName: '',
            width: 60,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Avatar, { src: params.value, alt: params.row.firstName, sx: { width: 36, height: 36 }, children: [params.row.firstName?.[0], params.row.lastName?.[0]] })),
        },
        {
            field: 'employeeNumber',
            headerName: 'Employee #',
            width: 120,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: 600, fontFamily: "monospace", children: params.value })),
        },
        {
            field: 'name',
            headerName: 'Name',
            width: 180,
            valueGetter: (_, row) => `${row.firstName} ${row.lastName}`,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: params.row.email })] })),
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
            renderCell: (params) => (_jsx(Chip, { label: params.value, color: statusColors[params.value] || 'default', size: "small", variant: "outlined" })),
        },
        {
            field: 'hireDate',
            headerName: 'Hire Date',
            width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
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
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View Profile", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/employees/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => { setEditingId(params.row.id); setFormOpen(true); }, children: _jsx(Edit, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Attendance", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/attendance?employeeId=${params.row.id}`), children: _jsx(AccessTime, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Payroll History", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/payroll?employeeId=${params.row.id}`), children: _jsx(Payment, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Employees" }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(FileDownload, {}), onClick: handleExport, size: "small", children: "Export" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => { setEditingId(null); setFormOpen(true); }, children: "Add Employee" })] })] }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(TextField, { fullWidth: true, size: "small", placeholder: "Search by name, number, email...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSearch(), slotProps: {
                                        input: {
                                            endAdornment: (_jsx(IconButton, { size: "small", onClick: handleSearch, children: _jsx(FilterList, { fontSize: "small" }) })),
                                        }
                                    } }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 'auto' }, children: _jsx(Button, { variant: "outlined", size: "small", startIcon: showFilters ? _jsx(Clear, {}) : _jsx(FilterList, {}), onClick: () => setShowFilters(!showFilters), children: showFilters ? 'Hide Filters' : 'Filters' }) })] }), showFilters && (_jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Department" }), _jsxs(Select, { value: filters.department || '', label: "Department", onChange: (e) => handleFilterChange('department', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), (departments || []).map((d) => (_jsx(MenuItem, { value: d, children: d }, d)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status || '', label: "Status", onChange: (e) => handleFilterChange('status', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "ACTIVE", children: "Active" }), _jsx(MenuItem, { value: "INACTIVE", children: "Inactive" }), _jsx(MenuItem, { value: "ON_LEAVE", children: "On Leave" }), _jsx(MenuItem, { value: "TERMINATED", children: "Terminated" }), _jsx(MenuItem, { value: "SUSPENDED", children: "Suspended" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Branch" }), _jsxs(Select, { value: filters.branch || '', label: "Branch", onChange: (e) => handleFilterChange('branch', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), (branches || []).map((b) => (_jsx(MenuItem, { value: b, children: b }, b)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Job Title" }), _jsxs(Select, { value: filters.jobTitle || '', label: "Job Title", onChange: (e) => handleFilterChange('jobTitle', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), (jobTitles || []).map((j) => (_jsx(MenuItem, { value: j, children: j }, j)))] })] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Button, { size: "small", onClick: handleClearFilters, startIcon: _jsx(Clear, {}), children: "Clear All Filters" }) })] }))] }), _jsx(DataGrid, { rows: data?.data || [], columns: columns, loading: isLoading, rowCount: data?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50, 100], initialState: {
                    pagination: {
                        paginationModel: { pageSize: 25, page: (filters.page || 1) - 1 },
                    },
                }, onPaginationModelChange: (model) => {
                    setFilters((prev) => ({
                        ...prev,
                        page: model.page + 1,
                        limit: model.pageSize,
                    }));
                }, disableRowSelectionOnClick: true, density: "compact", sx: {
                    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
                }, onRowClick: (params) => navigate(`/employees/${params.id}`) }), _jsx(Dialog, { open: formOpen, onClose: handleFormClose, maxWidth: "lg", fullWidth: true, fullScreen: isMobile, children: _jsx(EmployeeForm, { employeeId: editingId, onClose: handleFormClose }) })] }));
};
export default EmployeesPage;
