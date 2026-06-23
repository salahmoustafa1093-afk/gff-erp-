import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Add, Visibility, Edit } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cashboxService } from '../../services/cashboxService';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
import type { Cashbox } from '../../types';

const CashboxesPage: React.FC = () => {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cashboxes', paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      cashboxService.getCashboxes({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      }),
  });

  const cashboxes: Cashbox[] = data?.data ?? [];
  const totalBalance = cashboxes.reduce((sum, c) => sum + c.currentBalance, 0);

  const columns: GridColDef<Cashbox>[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Name', width: 180, flex: 1 },
    {
      field: 'currentBalance',
      headerName: 'Current Balance',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<Cashbox>) => (
        <Typography fontWeight="bold" color="success.main">
          {formatCurrency(params.row.currentBalance)}
        </Typography>
      ),
    },
    {
      field: 'openingBalance',
      headerName: 'Opening Balance',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<Cashbox>) =>
        formatCurrency(params.row.openingBalance),
    },
    { field: 'responsible', headerName: 'Responsible', width: 150 },
    { field: 'branchName', headerName: 'Branch', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams<Cashbox>) => (
        <Chip
          label={params.row.status}
          color={getStatusColor(params.row.status) as 'success' | 'error' | 'warning' | 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Cashbox>) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/cashboxes/${params.row.id}`)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/cashboxes/${params.row.id}/edit`)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Cashboxes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/cashboxes/new')}
        >
          Add Cashbox
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ minWidth: 180 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">
              Total Cashboxes
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {cashboxes.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">
              Total Cash Balance
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {formatCurrency(totalBalance)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <DataGrid
        rows={cashboxes}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 25, 50]}
        rowCount={data?.total ?? 0}
        paginationMode="server"
        loading={isLoading}
        disableRowSelectionOnClick
        density="compact"
        autoHeight
        getRowId={(row) => row.id}
      />
    </Box>
  );
};

export default CashboxesPage;
