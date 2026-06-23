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
import {
  Add,
  Edit,
  Visibility,
  ReceiptLong,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bankService } from '../../services/bankService';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
import type { BankAccount } from '../../types';

const BanksPage: React.FC = () => {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['bank-accounts', paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      bankService.getAccounts({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      }),
  });

  const accounts: BankAccount[] = data?.data ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const activeCount = accounts.filter((a) => a.status === 'ACTIVE').length;

  const columns: GridColDef<BankAccount>[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Bank Name', width: 200, flex: 1 },
    { field: 'accountNumber', headerName: 'Account Number', width: 160 },
    { field: 'branchName', headerName: 'Branch', width: 140 },
    {
      field: 'currentBalance',
      headerName: 'Current Balance',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<BankAccount>) =>
        formatCurrency(params.row.currentBalance),
    },
    {
      field: 'openingBalance',
      headerName: 'Opening Balance',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<BankAccount>) =>
        formatCurrency(params.row.openingBalance),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams<BankAccount>) => (
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
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<BankAccount>) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => navigate(`/banks/${params.row.id}`)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/banks/${params.row.id}/edit`)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Transactions">
            <IconButton
              size="small"
              onClick={() => navigate(`/banks/${params.row.id}/transactions`)}
            >
              <ReceiptLong fontSize="small" />
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
          Bank Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/banks/new')}
        >
          Add Bank Account
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ minWidth: 180 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">
              Total Accounts
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {accounts.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">
              Total Balance
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {formatCurrency(totalBalance)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">
              Active Accounts
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main">
              {activeCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load bank accounts
        </Typography>
      )}

      <DataGrid
        rows={accounts}
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

export default BanksPage;
