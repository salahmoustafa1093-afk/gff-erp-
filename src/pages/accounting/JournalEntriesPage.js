import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, FormControl, InputLabel, Select, MenuItem, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Add, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
const JournalEntriesPage = () => {
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['journal-entries', paginationModel.page, paginationModel.pageSize, statusFilter, dateFrom, dateTo],
        queryFn: () => accountingService.getJournalEntries({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            status: statusFilter || undefined,
            dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
            dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
        }),
    });
    const columns = [
        {
            field: 'entryNumber',
            headerName: 'Entry #',
            width: 120,
            renderCell: (params) => (_jsx(Button, { size: "small", onClick: () => navigate(`/accounting/journal-entries/${params.row.id}`), children: params.row.entryNumber })),
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 110,
            renderCell: (params) => formatDate(params.row.date),
        },
        { field: 'reference', headerName: 'Reference', width: 130 },
        { field: 'description', headerName: 'Description', width: 250, flex: 1 },
        {
            field: 'totalDebits',
            headerName: 'Debits',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.totalDebits),
        },
        {
            field: 'totalCredits',
            headerName: 'Credits',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.totalCredits),
        },
        {
            field: 'isBalanced',
            headerName: 'Balanced',
            width: 80,
            renderCell: (params) => (_jsx(Chip, { label: params.row.isBalanced ? 'Yes' : 'No', size: "small", color: params.row.isBalanced ? 'success' : 'error' })),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (_jsx(Chip, { label: params.row.status, size: "small", color: getStatusColor(params.row.status) })),
        },
        { field: 'branchName', headerName: 'Branch', width: 120 },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params) => (_jsx(Button, { size: "small", startIcon: _jsx(Visibility, {}), onClick: () => navigate(`/accounting/journal-entries/${params.row.id}`), children: "View" })),
        },
    ];
    const entries = data?.data ?? [];
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Journal Entries" }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/accounting/journal-entries/new'), children: "Create Entry" })] }), _jsx(Card, { sx: { mb: 2 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", gap: 2, flexWrap: "wrap", children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 140 }, children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => {
                                                setStatusFilter(e.target.value);
                                                setPaginationModel((p) => ({ ...p, page: 0 }));
                                            }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "DRAFT", children: "Draft" }), _jsx(MenuItem, { value: "POSTED", children: "Posted" }), _jsx(MenuItem, { value: "REVERSED", children: "Reversed" })] })] }), _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } })] }) }) }), _jsx(DataGrid, { rows: entries, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [10, 25, 50, 100], rowCount: data?.total ?? 0, paginationMode: "server", loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (row) => row.id })] }) }));
};
export default JournalEntriesPage;
