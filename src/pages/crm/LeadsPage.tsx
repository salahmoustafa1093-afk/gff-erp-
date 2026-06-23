import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton, Tooltip, Chip,
  Card, CardContent, Avatar, Badge, useTheme, useMediaQuery, FormControl,
  InputLabel, Select, Grid, Dialog
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Visibility, Edit, Transform, Phone, ViewKanban, ViewList,
  FilterList, Clear, PersonAdd, LocalActivity
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Lead, LeadStatus, LeadSource } from '../../types';
import LeadForm from './LeadForm';

const statusColors: Record<LeadStatus, string> = {
  NEW: '#0288d1',
  CONTACTED: '#ed6c02',
  QUALIFIED: '#2e7d32',
  PROPOSAL: '#9c27b0',
  NEGOTIATION: '#795548',
  WON: '#2e7d32',
  LOST: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

const PIPELINE_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filters, setFilters] = useState({ search: '', source: '', status: '', assignedTo: '', page: 1, limit: 25 });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => apiService.getLeads(filters),
  });

  const handleFilterChange = useCallback((field: string, value: string) => {
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

  const listColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Lead',
      width: 200,
      valueGetter: (_, row: Lead) => `${row.firstName} ${row.lastName}`,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.company}</Typography>
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'source',
      headerName: 'Source',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: `${statusColors[params.value as LeadStatus]}15`,
            color: statusColors[params.value as LeadStatus],
            fontWeight: 600,
            border: `1px solid ${statusColors[params.value as LeadStatus]}40`,
          }}
        />
      ),
    },
    {
      field: 'estimatedValue',
      headerName: 'Value',
      width: 110,
      type: 'number',
      valueFormatter: (value: number) =>
        value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '-',
    },
    { field: 'assignedToName', headerName: 'Assigned To', width: 130 },
    {
      field: 'expectedCloseDate',
      headerName: 'Close Date',
      width: 120,
      valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/leads/${params.row.id}`)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditingId(params.row.id); setFormOpen(true); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status !== 'WON' && params.row.status !== 'LOST' && (
            <Tooltip title="Convert">
              <IconButton size="small" color="success" onClick={() => navigate(`/leads/${params.row.id}?convert=true`)}>
                <Transform fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const kanbanLeads = (status: LeadStatus) =>
    (data?.data || []).filter((l: Lead) => l.status === status);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Leads</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={viewMode === 'list' ? <ViewKanban /> : <ViewList />}
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
          >
            {viewMode === 'list' ? 'Kanban' : 'List'}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingId(null); setFormOpen(true); }}>
            Add Lead
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select value={filters.source} label="Source" onChange={(e) => handleFilterChange('source', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="WEB">Web</MenuItem>
                  <MenuItem value="REFERRAL">Referral</MenuItem>
                  <MenuItem value="CALL">Call</MenuItem>
                  <MenuItem value="SOCIAL">Social</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="EXHIBITION">Exhibition</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={(e) => handleFilterChange('status', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {Object.keys(statusLabels).map((s) => (
                    <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned</InputLabel>
                <Select value={filters.assignedTo} label="Assigned" onChange={(e) => handleFilterChange('assignedTo', e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Button size="small" onClick={handleClear} startIcon={<Clear />}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <DataGrid
          rows={data?.data || []}
          columns={listColumns}
          loading={isLoading}
          rowCount={data?.total || 0}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          onPaginationModelChange={(model) => setFilters((p) => ({ ...p, page: model.page + 1, limit: model.pageSize }))}
          disableRowSelectionOnClick
          density="compact"
        />
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            minHeight: 'calc(100vh - 300px)',
          }}
        >
          {PIPELINE_STATUSES.map((status) => (
            <Box
              key={status}
              sx={{
                minWidth: 280,
                maxWidth: 320,
                flex: 1,
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
                px={1}
              >
                <Typography variant="subtitle2" fontWeight={700} color={statusColors[status]}>
                  {statusLabels[status]}
                </Typography>
                <Chip label={kanbanLeads(status).length} size="small" sx={{ bgcolor: `${statusColors[status]}15`, color: statusColors[status], fontWeight: 600 }} />
              </Box>
              <Box
                sx={{
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  p: 1,
                  minHeight: 400,
                }}
              >
                {kanbanLeads(status).map((lead: Lead) => (
                  <Card
                    key={lead.id}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      borderLeft: 3,
                      borderColor: statusColors[status],
                      '&:hover': { boxShadow: 2 },
                    }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {lead.firstName} {lead.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {lead.company}
                      </Typography>
                      {lead.estimatedValue > 0 && (
                        <Typography variant="caption" color="success.main" fontWeight={600} display="block">
                          ${lead.estimatedValue.toLocaleString()}
                        </Typography>
                      )}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {lead.assignedToName}
                        </Typography>
                        {lead.expectedCloseDate && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(lead.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth fullScreen={isMobile}>
        <LeadForm leadId={editingId} onClose={handleFormClose} />
      </Dialog>
    </Box>
  );
};

export default LeadsPage;
