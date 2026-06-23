import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, IconButton, Tooltip, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Add, Visibility, Edit } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cashboxService } from '../../services/cashboxService';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
const CashboxesPage = () => {
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const { data, isLoading } = useQuery({
        queryKey: ['cashboxes', paginationModel.page, paginationModel.pageSize],
        queryFn: () => cashboxService.getCashboxes({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
        }),
    });
    const cashboxes = data?.data ?? [];
    const totalBalance = cashboxes.reduce((sum, c) => sum + c.currentBalance, 0);
    const columns = [
        { field: 'code', headerName: 'Code', width: 100 },
        { field: 'name', headerName: 'Name', width: 180, flex: 1 },
        {
            field: 'currentBalance',
            headerName: 'Current Balance',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (_jsx(Typography, { fontWeight: "bold", color: "success.main", children: formatCurrency(params.row.currentBalance) })),
        },
        {
            field: 'openingBalance',
            headerName: 'Opening Balance',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.openingBalance),
        },
        { field: 'responsible', headerName: 'Responsible', width: 150 },
        { field: 'branchName', headerName: 'Branch', width: 130 },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: params.row.status, color: getStatusColor(params.row.status), size: "small" })),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (_jsxs(Box, { display: "flex", gap: 0.5, children: [_jsx(Tooltip, { title: "View Details", children: _jsx(IconButton, { size: "small", color: "primary", onClick: () => navigate(`/cashboxes/${params.row.id}`), children: _jsx(Visibility, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", color: "secondary", onClick: () => navigate(`/cashboxes/${params.row.id}/edit`), children: _jsx(Edit, { fontSize: "small" }) }) })] })),
        },
    ];
    return (_jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Cashboxes" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/cashboxes/new'), children: "Add Cashbox" })] }), _jsxs(Box, { display: "flex", gap: 2, mb: 3, children: [_jsx(Card, { sx: { minWidth: 180 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Cashboxes" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "primary", children: cashboxes.length })] }) }), _jsx(Card, { sx: { minWidth: 180 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Cash Balance" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: formatCurrency(totalBalance) })] }) })] }), _jsx(DataGrid, { rows: cashboxes, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [5, 10, 25, 50], rowCount: data?.total ?? 0, paginationMode: "server", loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (row) => row.id })] }));
};
export default CashboxesPage;
