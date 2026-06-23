import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon, TrendingUp as InIcon, TrendingDown as OutIcon, SwapHoriz as TransferIcon, Settings as AdjustIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const typeConfig = {
    IN: { color: '#4caf50', label: 'Stock In', icon: _jsx(InIcon, {}) },
    OUT: { color: '#f44336', label: 'Stock Out', icon: _jsx(OutIcon, {}) },
    TRANSFER_IN: { color: '#2196f3', label: 'Transfer In', icon: _jsx(TransferIcon, {}) },
    TRANSFER_OUT: { color: '#ff9800', label: 'Transfer Out', icon: _jsx(TransferIcon, {}) },
    ADJUSTMENT: { color: '#9c27b0', label: 'Adjustment', icon: _jsx(AdjustIcon, {}) },
    SALE: { color: '#00bcd4', label: 'Sale', icon: _jsx(OutIcon, {}) },
    PURCHASE: { color: '#4caf50', label: 'Purchase', icon: _jsx(InIcon, {}) },
    RETURN: { color: '#ff9800', label: 'Return', icon: _jsx(InIcon, {}) },
    OPENING: { color: '#9e9e9e', label: 'Opening', icon: _jsx(InIcon, {}) },
};
const InventoryMovementsPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'createdAt', sort: 'desc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const fetchMovements = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'desc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (typeFilter)
            params.append('type', typeFilter);
        if (warehouseFilter)
            params.append('warehouseId', warehouseFilter);
        if (fromDate)
            params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
        if (toDate)
            params.append('toDate', format(toDate, 'yyyy-MM-dd'));
        const response = await api.get(`/inventory/movements?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, typeFilter, warehouseFilter, fromDate, toDate]);
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['stockMovements', paginationModel, sortModel, searchQuery, typeFilter, warehouseFilter, fromDate, toDate],
        queryFn: fetchMovements,
    });
    const { data: warehousesData } = useQuery({
        queryFn: async () => { const response = await api.get('/warehouses?active=true'); return response.data.data; },
        queryKey: ['warehousesForMovements'],
    });
    const handleExport = async () => {
        const params = new URLSearchParams();
        if (searchQuery)
            params.append('search', searchQuery);
        if (typeFilter)
            params.append('type', typeFilter);
        const response = await api.get(`/inventory/movements/export?${params.toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `stock-movements-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const columns = [
        {
            field: 'type', headerName: 'Type', width: 130,
            renderCell: (params) => (_jsx(Chip, { icon: typeConfig[params.value]?.icon, label: typeConfig[params.value]?.label || params.value, size: "small", sx: { backgroundColor: (typeConfig[params.value]?.color || '#9e9e9e') + '20', color: typeConfig[params.value]?.color || '#9e9e9e', fontWeight: 600, fontSize: '0.7rem' } })),
        },
        { field: 'productCode', headerName: 'Code', width: 100 },
        { field: 'productName', headerName: 'Product', width: 200 },
        {
            field: 'quantity', headerName: 'Quantity', width: 100, type: 'number',
            renderCell: (params) => {
                const color = params.value > 0 ? 'success.main' : params.value < 0 ? 'error.main' : 'text.secondary';
                return _jsxs(Typography, { variant: "body2", fontWeight: "bold", color: color, children: [params.value > 0 ? '+' : '', params.value.toLocaleString()] });
            },
        },
        { field: 'warehouseName', headerName: 'Warehouse', width: 130 },
        {
            field: 'unitCost', headerName: 'Unit Cost', width: 110, type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'totalCost', headerName: 'Total Cost', width: 120, type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        { field: 'referenceNumber', headerName: 'Reference', width: 130 },
        { field: 'notes', headerName: 'Notes', width: 180 },
        { field: 'createdBy', headerName: 'User', width: 120 },
        {
            field: 'createdAt', headerName: 'Date', width: 140,
            valueFormatter: (value) => format(parseISO(value), 'dd/MM/yy HH:mm'),
        },
    ];
    const movements = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Stock Movements" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export" })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search product or reference...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: { input: { startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })) } } }), _jsxs(TextField, { select: true, size: "small", label: "Type", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), sx: { minWidth: 140 }, children: [_jsx(MenuItem, { value: "", children: "All Types" }), Object.entries(typeConfig).map(([key, { label }]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsxs(TextField, { select: true, size: "small", label: "Warehouse", value: warehouseFilter, onChange: (e) => setWarehouseFilter(e.target.value), sx: { minWidth: 150 }, children: [_jsx(MenuItem, { value: "", children: "All Warehouses" }), warehousesData?.map((w) => (_jsx(MenuItem, { value: w.id, children: w.name }, w.id)))] }), _jsx(DatePicker, { label: "From", value: fromDate, onChange: setFromDate, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(DatePicker, { label: "To", value: toDate, onChange: setToDate, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: movements, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, sx: { '& .MuiDataGrid-row:hover': { backgroundColor: theme.palette.action.hover } } })] })] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default InventoryMovementsPage;
