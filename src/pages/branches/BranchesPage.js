import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Add as AddIcon, Business as BranchIcon, Search as SearchIcon, Refresh as RefreshIcon, Store as StoreIcon, People as UsersIcon, Warehouse as WarehouseIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import api from '../../app/api';
const BranchesPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'name', sort: 'asc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const fetchBranches = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'asc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (statusFilter)
            params.append('status', statusFilter);
        const response = await api.get(`/branches?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, statusFilter]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['branches', paginationModel, sortModel, searchQuery, statusFilter],
        queryFn: fetchBranches,
    });
    const { data: summaryData } = useQuery({
        queryKey: ['branchesSummary'],
        queryFn: async () => { const response = await api.get('/branches/summary'); return response.data; },
    });
    const summary = summaryData || { total: 0, active: 0, totalWarehouses: 0, totalUsers: 0 };
    const columns = [
        { field: 'code', headerName: 'Code', width: 100 },
        {
            field: 'name', headerName: 'Name', width: 180,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value }), params.row.nameAr && _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { direction: 'rtl', display: 'block' }, children: params.row.nameAr })] })),
        },
        { field: 'city', headerName: 'City', width: 130 },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'email', headerName: 'Email', width: 180 },
        { field: 'managerName', headerName: 'Manager', width: 150 },
        {
            field: 'isActive', headerName: 'Status', width: 100,
            renderCell: (params) => _jsx(Chip, { label: params.value ? 'Active' : 'Inactive', size: "small", color: params.value ? 'success' : 'default', sx: { fontWeight: 600 } }),
        },
        {
            field: 'actions', headerName: '', width: 80, sortable: false, filterable: false,
            renderCell: (params) => (_jsx(Button, { size: "small", variant: "outlined", onClick: (e) => { e.stopPropagation(); navigate(`/branches/${params.row.id}`); }, children: "View" })),
        },
    ];
    const branches = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Branches" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => navigate('/branches/new'), children: "New Branch" })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.primary.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Total Branches" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.total?.toLocaleString() || 0 })] }), _jsx(BranchIcon, { color: "primary", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.success.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Active" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.active?.toLocaleString() || 0 })] }), _jsx(StoreIcon, { color: "success", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.info.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Warehouses" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalWarehouses?.toLocaleString() || 0 })] }), _jsx(WarehouseIcon, { color: "info", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(Card, { sx: { borderLeft: `4px solid ${theme.palette.warning.main}` }, children: _jsx(CardContent, { sx: { py: 1.5, '&:last-child': { pb: 1.5 } }, children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Users" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", children: summary.totalUsers?.toLocaleString() || 0 })] }), _jsx(UsersIcon, { color: "warning", sx: { fontSize: 36, opacity: 0.7 } })] }) }) }) })] }), _jsx(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: branches.slice(0, 6).map((branch) => (_jsx(Grid, { size: { xs: 12, sm: 6, md: 4 }, children: _jsx(Card, { sx: { cursor: 'pointer', '&:hover': { boxShadow: 4 } }, onClick: () => navigate(`/branches/${branch.id}`), children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary", children: branch.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [branch.code, " | ", branch.city] })] }), _jsx(Chip, { label: branch.isActive ? 'Active' : 'Inactive', size: "small", color: branch.isActive ? 'success' : 'default' })] }), _jsxs(Box, { sx: { display: 'flex', gap: 2 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Phone" }), _jsx(Typography, { variant: "body2", children: branch.phone || '-' })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Manager" }), _jsx(Typography, { variant: "body2", children: branch.managerName || '-' })] })] })] }) }) }, branch.id))) }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search name, code, city...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: { input: { startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })) } } }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 120 }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: branches, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/branches/${params.id}`), sx: { '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } } } })] })] }));
};
export default BranchesPage;
