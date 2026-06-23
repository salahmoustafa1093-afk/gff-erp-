import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon,
  TrendingUp as InIcon, TrendingDown as OutIcon, SwapHoriz as TransferIcon, Settings as AdjustIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridPaginationModel, GridSortModel,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { StockMovement, MovementType, ListResponse } from '../types';

const typeConfig: Record<MovementType, { color: string; label: string; icon: React.ReactNode }> = {
  IN: { color: '#4caf50', label: 'Stock In', icon: <InIcon /> },
  OUT: { color: '#f44336', label: 'Stock Out', icon: <OutIcon /> },
  TRANSFER_IN: { color: '#2196f3', label: 'Transfer In', icon: <TransferIcon /> },
  TRANSFER_OUT: { color: '#ff9800', label: 'Transfer Out', icon: <TransferIcon /> },
  ADJUSTMENT: { color: '#9c27b0', label: 'Adjustment', icon: <AdjustIcon /> },
  SALE: { color: '#00bcd4', label: 'Sale', icon: <OutIcon /> },
  PURCHASE: { color: '#4caf50', label: 'Purchase', icon: <InIcon /> },
  RETURN: { color: '#ff9800', label: 'Return', icon: <InIcon /> },
  OPENING: { color: '#9e9e9e', label: 'Opening', icon: <InIcon /> },
};

const InventoryMovementsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'createdAt', sort: 'desc' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const fetchMovements = useCallback(async (): Promise<ListResponse<StockMovement>> => {
    const params = new URLSearchParams();
    params.append('page', String(paginationModel.page + 1));
    params.append('pageSize', String(paginationModel.pageSize));
    if (sortModel.length > 0) { params.append('sortField', sortModel[0].field); params.append('sortDir', sortModel[0].sort || 'desc'); }
    if (searchQuery) params.append('search', searchQuery);
    if (typeFilter) params.append('type', typeFilter);
    if (warehouseFilter) params.append('warehouseId', warehouseFilter);
    if (fromDate) params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
    if (toDate) params.append('toDate', format(toDate, 'yyyy-MM-dd'));
    const response = await api.get(`/inventory/movements?${params.toString()}`);
    return response.data;
  }, [paginationModel, sortModel, searchQuery, typeFilter, warehouseFilter, fromDate, toDate]);

  const { data, isLoading, refetch } = useQuery<ListResponse<StockMovement>>({
    queryKey: ['stockMovements', paginationModel, sortModel, searchQuery, typeFilter, warehouseFilter, fromDate, toDate],
    queryFn: fetchMovements,
  });

  const { data: warehousesData } = useQuery({
    queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data as { id: string; name: string }[]; },
    queryKey: ['warehousesForMovements'],
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (typeFilter) params.append('type', typeFilter);
    const response = await api.get(`/inventory/movements/export?${params.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a'); link.href = url;
    link.setAttribute('download', `stock-movements-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const columns: GridColDef[] = [
    {
      field: 'type', headerName: 'Type', width: 130,
      renderCell: (params) => (
        <Chip
          icon={typeConfig[params.value as MovementType]?.icon}
          label={typeConfig[params.value as MovementType]?.label || params.value}
          size="small"
          sx={{ backgroundColor: (typeConfig[params.value as MovementType]?.color || '#9e9e9e') + '20', color: typeConfig[params.value as MovementType]?.color || '#9e9e9e', fontWeight: 600, fontSize: '0.7rem' }}
        />
      ),
    },
    { field: 'productCode', headerName: 'Code', width: 100 },
    { field: 'productName', headerName: 'Product', width: 200 },
    {
      field: 'quantity', headerName: 'Quantity', width: 100, type: 'number',
      renderCell: (params) => {
        const color = (params.value as number) > 0 ? 'success.main' : (params.value as number) < 0 ? 'error.main' : 'text.secondary';
        return <Typography variant="body2" fontWeight="bold" color={color}>{params.value as number > 0 ? '+' : ''}{(params.value as number).toLocaleString()}</Typography>;
      },
    },
    { field: 'warehouseName', headerName: 'Warehouse', width: 130 },
    {
      field: 'unitCost', headerName: 'Unit Cost', width: 110, type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'totalCost', headerName: 'Total Cost', width: 120, type: 'number',
      valueFormatter: (value: number) => formatCurrency(value),
    },
    { field: 'referenceNumber', headerName: 'Reference', width: 130 },
    { field: 'notes', headerName: 'Notes', width: 180 },
    { field: 'createdBy', headerName: 'User', width: 120 },
    {
      field: 'createdAt', headerName: 'Date', width: 140,
      valueFormatter: (value: string) => format(parseISO(value), 'dd/MM/yy HH:mm'),
    },
  ];

  const movements = data?.data || [];
  const totalRows = data?.total || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Stock Movements</Typography>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport}>Export</Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField placeholder="Search product or reference..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 260 }}
              slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }} />
            <TextField select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(typeConfig).map(([key, { label }]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
            </TextField>
            <TextField select size="small" label="Warehouse" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">All Warehouses</MenuItem>
              {warehousesData?.map((w) => (<MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>))}
            </TextField>
            <DatePicker label="From" value={fromDate} onChange={setFromDate} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
            <DatePicker label="To" value={toDate} onChange={setToDate} slotProps={{ textField: { size: 'small', sx: { minWidth: 140 } } }} />
            <IconButton onClick={() => refetch()} size="small"><RefreshIcon /></IconButton>
          </Box>

          <DataGrid rows={movements} columns={columns} rowCount={totalRows} loading={isLoading}
            paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
            onSortModelChange={setSortModel} pageSizeOptions={[10, 25, 50, 100]}
            paginationMode="server" sortingMode="server" disableRowSelectionOnClick
            sx={{ '& .MuiDataGrid-row:hover': { backgroundColor: theme.palette.action.hover } }} />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default InventoryMovementsPage;
