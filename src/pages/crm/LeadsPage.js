import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Tooltip, Chip, Card, CardContent, useTheme, useMediaQuery, FormControl, InputLabel, Select, Grid, Dialog } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, Edit, Transform, ViewKanban, ViewList, Clear } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import LeadForm from './LeadForm';
const statusColors = {
    NEW: '#0288d1',
    CONTACTED: '#ed6c02',
    QUALIFIED: '#2e7d32',
    PROPOSAL: '#9c27b0',
    NEGOTIATION: '#795548',
    WON: '#2e7d32',
    LOST: '#d32f2f',
};
const statusLabels = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation',
    WON: 'Won',
    LOST: 'Lost',
};
const PIPELINE_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
const LeadsPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [viewMode, setViewMode] = useState('list');
    const [filters, setFilters] = useState({ search: '', source: '', status: '', assignedTo: '', page: 1, limit: 25 });
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['leads', filters],
        queryFn: () => apiService.getLeads(filters),
    });
    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
    }, []);
    const handleClear = useCallback(() => {
        setFilters({ search: '', source: '', status: '', assignedTo: '', page: 1, limit: 25 });
    }, []);
    const handleFormClose = useCallback(() => {
        setFormOpen(false);
        setEditingId(null);
        refetch();
    }, [refetch]);
    const listColumns = [
        {
            field: 'name',
            headerName: 'Lead',
            width: 200,
            valueGetter: (_, row) => `${row.firstName} ${row.lastName}`,
            renderCell: (params) => (_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: params.value }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: params.row.company })] })),
        },
        { field: 'email', headerName: 'Email', width: 180 },
        { field: 'phone', headerName: 'Phone', width: 130 },
        {
            field: 'source',
            headerName: 'Source',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", variant: "outlined" })),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (_jsx(Chip, { label: params.value, size: "small", sx: {
                    bgcolor: `${statusColors[params.value]}15`,
                    color: statusColors[params.value],
                    fontWeight: 600,
                    border: `1px solid ${statusColors[params.value]}40`,
                } })),
        },
        {
            field: 'estimatedValue',
            headerName: 'Value',
            width: 110,
            type: 'number',
            valueFormatter: (value) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '-',
        },
        { field: 'assignedToName', headerName: 'Assigned To', width: 130 },
        {
            field: 'expectedCloseDate',
            headerName: 'Close Date',
            width: 120,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/leads/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => { setEditingId(params.row.id); setFormOpen(true); }, children: _jsx(Edit, { fontSize: "small" }) }) }), params.row.status !== 'WON' && params.row.status !== 'LOST' && (_jsx(Tooltip, { title: "Convert", children: _jsx(IconButton, { size: "small", color: "success", onClick: () => navigate(`/leads/${params.row.id}?convert=true`), children: _jsx(Transform, { fontSize: "small" }) }) }))] })),
        },
    ];
    const kanbanLeads = (status) => (data?.data || []).filter((l) => l.status === status);
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: 700, children: "Leads" }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "outlined", size: "small", startIcon: viewMode === 'list' ? _jsx(ViewKanban, {}) : _jsx(ViewList, {}), onClick: () => setViewMode(viewMode === 'list' ? 'kanban' : 'list'), children: viewMode === 'list' ? 'Kanban' : 'List' }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => { setEditingId(null); setFormOpen(true); }, children: "Add Lead" })] })] }), _jsx(Card, { variant: "outlined", sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 6, md: 3 }, children: _jsx(TextField, { fullWidth: true, size: "small", placeholder: "Search leads...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value) }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 2 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Source" }), _jsxs(Select, { value: filters.source, label: "Source", onChange: (e) => handleFilterChange('source', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "WEB", children: "Web" }), _jsx(MenuItem, { value: "REFERRAL", children: "Referral" }), _jsx(MenuItem, { value: "CALL", children: "Call" }), _jsx(MenuItem, { value: "SOCIAL", children: "Social" }), _jsx(MenuItem, { value: "EMAIL", children: "Email" }), _jsx(MenuItem, { value: "EXHIBITION", children: "Exhibition" }), _jsx(MenuItem, { value: "OTHER", children: "Other" })] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 2 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: filters.status, label: "Status", onChange: (e) => handleFilterChange('status', e.target.value), children: [_jsx(MenuItem, { value: "", children: "All" }), Object.keys(statusLabels).map((s) => (_jsx(MenuItem, { value: s, children: statusLabels[s] }, s)))] })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 2 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Assigned" }), _jsx(Select, { value: filters.assignedTo, label: "Assigned", onChange: (e) => handleFilterChange('assignedTo', e.target.value), children: _jsx(MenuItem, { value: "", children: "All" }) })] }) }), _jsx(Grid, { size: { xs: 6, sm: 3, md: 3 }, children: _jsx(Button, { size: "small", onClick: handleClear, startIcon: _jsx(Clear, {}), children: "Clear Filters" }) })] }) }) }), viewMode === 'list' && (_jsx(DataGrid, { rows: data?.data || [], columns: listColumns, loading: isLoading, rowCount: data?.total || 0, paginationMode: "server", pageSizeOptions: [10, 25, 50, 100], initialState: { pagination: { paginationModel: { pageSize: 25 } } }, onPaginationModelChange: (model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize })), disableRowSelectionOnClick: true, density: "compact" })), viewMode === 'kanban' && (_jsx(Box, { sx: {
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 2,
                    minHeight: 'calc(100vh - 300px)',
                }, children: PIPELINE_STATUSES.map((status) => (_jsxs(Box, { sx: {
                        minWidth: 280,
                        maxWidth: 320,
                        flex: 1,
                    }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 700, color: statusColors[status], children: statusLabels[status] }), _jsx(Chip, { label: kanbanLeads(status).length, size: "small", sx: { bgcolor: `${statusColors[status]}15`, color: statusColors[status], fontWeight: 600 } })] }), _jsx(Box, { sx: {
                                bgcolor: 'grey.50',
                                borderRadius: 2,
                                p: 1,
                                minHeight: 400,
                            }, children: kanbanLeads(status).map((lead) => (_jsx(Card, { sx: {
                                    mb: 1,
                                    cursor: 'pointer',
                                    borderLeft: 3,
                                    borderColor: statusColors[status],
                                    '&:hover': { boxShadow: 2 },
                                }, onClick: () => navigate(`/leads/${lead.id}`), children: _jsxs(CardContent, { sx: { p: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsxs(Typography, { variant: "body2", fontWeight: 600, noWrap: true, children: [lead.firstName, " ", lead.lastName] }), _jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", noWrap: true, children: lead.company }), lead.estimatedValue > 0 && (_jsxs(Typography, { variant: "caption", color: "success.main", fontWeight: 600, display: "block", children: ["$", lead.estimatedValue.toLocaleString()] })), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: lead.assignedToName }), lead.expectedCloseDate && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: new Date(lead.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }))] })] }) }, lead.id))) })] }, status))) })), _jsx(Dialog, { open: formOpen, onClose: handleFormClose, maxWidth: "md", fullWidth: true, fullScreen: isMobile, children: _jsx(LeadForm, { leadId: editingId, onClose: handleFormClose }) })] }));
};
export default LeadsPage;
