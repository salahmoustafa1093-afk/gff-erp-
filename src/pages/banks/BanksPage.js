import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, IconButton, Tooltip, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Add, Edit, Visibility, ReceiptLong, } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bankService } from '../../services/bankService';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
const BanksPage = () => {
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const { data, isLoading, error } = useQuery({
        queryKey: ['bank-accounts', paginationModel.page, paginationModel.pageSize],
        queryFn: () => bankService.getAccounts({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
        }),
    });
    const accounts = data?.data ?? [];
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const activeCount = accounts.filter((a) => a.status === 'ACTIVE').length;
    const columns = [
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
            renderCell: (params) => formatCurrency(params.row.currentBalance),
        },
        {
            field: 'openingBalance',
            headerName: 'Opening Balance',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.openingBalance),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.row.status, color: getStatusColor(params.row.status), size: "small" })),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/banks/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/banks/${params.row.id}/edit`), children: _jsx(Edit, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Transactions", children: _jsx(IconButton, { size: "small", onClick: () => navigate(`/banks/${params.row.id}/transactions`), children: _jsx(ReceiptLong, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Bank Accounts" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/banks/new'), children: "Add Bank Account" })] }), _jsxs(Box, { display: "flex", gap: 2, mb: 3, children: [_jsx(Card, { sx: { minWidth: 180 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Accounts" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "primary", children: accounts.length })] }) }), _jsx(Card, { sx: { minWidth: 180 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Balance" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: formatCurrency(totalBalance) })] }) }), _jsx(Card, { sx: { minWidth: 180 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Active Accounts" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "info.main", children: activeCount })] }) })] }), error && (_jsx(Typography, { color: "error", sx: { mb: 2 }, children: "Failed to load bank accounts" })), _jsx(DataGrid, { rows: accounts, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [5, 10, 25, 50], rowCount: data?.total ?? 0, paginationMode: "server", loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (row) => row.id })] }));
};
export default BanksPage;
