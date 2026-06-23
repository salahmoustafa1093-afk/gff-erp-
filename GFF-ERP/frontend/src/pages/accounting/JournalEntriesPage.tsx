import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Add, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import type { JournalEntry, EntryStatus } from '../../types';

const JournalEntriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [statusFilter, setStatusFilter] = useState<EntryStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['journal-entries', paginationModel.page, paginationModel.pageSize, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      accountingService.getJournalEntries({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        status: (statusFilter as EntryStatus) || undefined,
        dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
        dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
      }),
  });

  const columns: GridColDef<JournalEntry>[] = [
    {
      field: 'entryNumber',
      headerName: 'Entry #',
      width: 120,
      renderCell: (params: GridRenderCellParams<JournalEntry>) => (
        <Button
          size="small"
          onClick={() => navigate(`/accounting/journal-entries/${params.row.id}`)}
        >
          {params.row.entryNumber}
        </Button>
      ),
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 110,
      renderCell: (params: GridRenderCellParams<JournalEntry>) => formatDate(params.row.date),
    },
    { field: 'reference', headerName: 'Reference', width: 130 },
    { field: 'description', headerName: 'Description', width: 250, flex: 1 },
    {
      field: 'totalDebits',
      headerName: 'Debits',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<JournalEntry>) => formatCurrency(params.row.totalDebits),
    },
    {
      field: 'totalCredits',
      headerName: 'Credits',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<JournalEntry>) => formatCurrency(params.row.totalCredits),
    },
    {
      field: 'isBalanced',
      headerName: 'Balanced',
      width: 80,
      renderCell: (params: GridRenderCellParams<JournalEntry>) => (
        <Chip
          label={params.row.isBalanced ? 'Yes' : 'No'}
          size="small"
          color={params.row.isBalanced ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams<JournalEntry>) => (
        <Chip label={params.row.status} size="small" color={getStatusColor(params.row.status)} />
      ),
    },
    { field: 'branchName', headerName: 'Branch', width: 120 },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams<JournalEntry>) => (
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => navigate(`/accounting/journal-entries/${params.row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const entries: JournalEntry[] = data?.data ?? [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Journal Entries
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/accounting/journal-entries/new')}
          >
            Create Entry
          </Button>
        </Box>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value as EntryStatus | '');
                    setPaginationModel((p) => ({ ...p, page: 0 }));
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="POSTED">Posted</MenuItem>
                  <MenuItem value="REVERSED">Reversed</MenuItem>
                </Select>
              </FormControl>
              <DatePicker
                label="From"
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
              />
              <DatePicker
                label="To"
                value={dateTo}
                onChange={setDateTo}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }}
              />
            </Box>
          </CardContent>
        </Card>

        <DataGrid
          rows={entries}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          rowCount={data?.total ?? 0}
          paginationMode="server"
          loading={isLoading}
          disableRowSelectionOnClick
          density="compact"
          autoHeight
          getRowId={(row) => row.id}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default JournalEntriesPage;
