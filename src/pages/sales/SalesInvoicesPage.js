import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, Menu, MenuItem, Paper, TextField, Typography, useTheme, } from '@mui/material';
import { Visibility as ViewIcon, Print as PrintIcon, Payment as PaymentIcon, MoreVert as MoreIcon, Search as SearchIcon, Refresh as RefreshIcon, FileDownload as ExportIcon, Warning as WarningIcon, } from '@mui/icons-material';
import { DataGrid, } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isAfter } from 'date-fns';
import api from '../../app/api';
const statusConfig = {
    DRAFT: { color: '#9e9e9e', label: 'Draft' },
    SENT: { color: '#2196f3', label: 'Sent' },
    PAID: { color: '#4caf50', label: 'Paid' },
    PARTIAL: { color: '#ff9800', label: 'Partial' },
    OVERDUE: { color: '#f44336', label: 'Overdue' },
    CANCELLED: { color: '#9e9e9e', label: 'Cancelled' },
};
const paymentMethods = ['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'ONLINE'];
const SalesInvoicesPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = useState([{ field: 'invoiceDate', sort: 'desc' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date(), method: 'CASH', reference: '', notes: '' });
    const fetchInvoices = useCallback(async () => {
        const params = new URLSearchParams();
        params.append('page', String(paginationModel.page + 1));
        params.append('pageSize', String(paginationModel.pageSize));
        if (sortModel.length > 0) {
            params.append('sortField', sortModel[0].field);
            params.append('sortDir', sortModel[0].sort || 'desc');
        }
        if (searchQuery)
            params.append('search', searchQuery);
        if (statusFilter)
            params.append('status', statusFilter);
        if (fromDate)
            params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
        if (toDate)
            params.append('toDate', format(toDate, 'yyyy-MM-dd'));
        const response = await api.get(`/sales/invoices?${params.toString()}`);
        return response.data;
    }, [paginationModel, sortModel, searchQuery, statusFilter, fromDate, toDate]);
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['salesInvoices', paginationModel, sortModel, searchQuery, statusFilter, fromDate, toDate],
        queryFn: fetchInvoices,
    });
    const paymentMutation = useMutation({
        mutationFn: async ({ invoiceId, data }) => {
            const response = await api.post(`/sales/invoices/${invoiceId}/payments`, {
                amount: Number(data.amount),
                paymentDate: format(data.paymentDate, 'yyyy-MM-dd'),
                method: data.method,
                reference: data.reference,
                notes: data.notes,
            });
            return response.data;
        },
        onSuccess: () => {
            setPaymentDialog(false);
            setPaymentForm({ amount: '', paymentDate: new Date(), method: 'CASH', reference: '', notes: '' });
            refetch();
        },
    });
    const handleExport = async () => {
        const params = new URLSearchParams();
        if (searchQuery)
            params.append('search', searchQuery);
        if (statusFilter)
            params.append('status', statusFilter);
        const response = await api.get(`/sales/invoices/export?${params.toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales-invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const handleActionClick = (event, invoice) => {
        setActionAnchorEl(event.currentTarget);
        setSelectedInvoice(invoice);
    };
    const openPaymentDialog = () => {
        if (selectedInvoice) {
            setPaymentForm({
                amount: String(selectedInvoice.balance),
                paymentDate: new Date(),
                method: 'CASH',
                reference: '',
                notes: '',
            });
        }
        setPaymentDialog(true);
        setActionAnchorEl(null);
    };
    const columns = [
        {
            field: 'invoiceNumber',
            headerName: 'Invoice #',
            width: 130,
            renderCell: (params) => (_jsx(Typography, { variant: "body2", fontWeight: "medium", color: "primary", sx: { cursor: 'pointer' }, children: params.value })),
        },
        { field: 'customerName', headerName: 'Customer', width: 180 },
        {
            field: 'invoiceDate',
            headerName: 'Invoice Date',
            width: 120,
            valueFormatter: (value) => format(parseISO(value), 'dd/MM/yyyy'),
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 120,
            valueFormatter: (value) => format(parseISO(value), 'dd/MM/yyyy'),
            renderCell: (params) => {
                const row = params.row;
                const isOverdue = row.status !== 'PAID' && row.status !== 'CANCELLED' && isAfter(new Date(), parseISO(row.dueDate));
                return (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 0.5 }, children: [_jsx(Typography, { variant: "body2", color: isOverdue ? 'error' : 'inherit', fontWeight: isOverdue ? 'bold' : 'normal', children: format(parseISO(params.value), 'dd/MM/yyyy') }), isOverdue && _jsx(WarningIcon, { fontSize: "small", color: "error" })] }));
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (_jsx(Chip, { label: statusConfig[params.value]?.label || params.value, size: "small", sx: {
                    backgroundColor: statusConfig[params.value]?.color + '20',
                    color: statusConfig[params.value]?.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                } })),
        },
        {
            field: 'total',
            headerName: 'Total',
            width: 120,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'paid',
            headerName: 'Paid',
            width: 120,
            type: 'number',
            valueFormatter: (value) => formatCurrency(value),
        },
        {
            field: 'balance',
            headerName: 'Balance',
            width: 120,
            type: 'number',
            renderCell: (params) => (_jsx(Typography, { variant: "body2", color: params.value > 0 ? 'error' : 'success', fontWeight: "medium", children: formatCurrency(params.value) })),
        },
        { field: 'branchName', headerName: 'Branch', width: 120 },
        {
            field: 'actions',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); handleActionClick(e, params.row); }, children: _jsx(MoreIcon, { fontSize: "small" }) })),
        },
    ];
    const invoices = data?.data || [];
    const totalRows = data?.total || 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Sales Invoices" }), _jsx(Box, { sx: { display: 'flex', gap: 1 }, children: _jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export" }) })] }), _jsxs(Paper, { sx: { p: 2, mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }, children: [_jsx(TextField, { placeholder: "Search invoice # or customer...", size: "small", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { minWidth: 260 }, slotProps: {
                                        input: {
                                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { fontSize: "small" }) })),
                                        },
                                    } }), _jsxs(TextField, { select: true, size: "small", label: "Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), sx: { minWidth: 140 }, children: [_jsx(MenuItem, { value: "", children: "All Status" }), Object.entries(statusConfig).map(([key, { label }]) => (_jsx(MenuItem, { value: key, children: label }, key)))] }), _jsx(DatePicker, { label: "From", value: fromDate, onChange: setFromDate, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(DatePicker, { label: "To", value: toDate, onChange: setToDate, slotProps: { textField: { size: 'small', sx: { minWidth: 140 } } } }), _jsx(IconButton, { onClick: () => refetch(), size: "small", children: _jsx(RefreshIcon, {}) })] }), _jsx(DataGrid, { rows: invoices, columns: columns, rowCount: totalRows, loading: isLoading, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, onSortModelChange: setSortModel, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", disableRowSelectionOnClick: true, onRowClick: (params) => navigate(`/sales/invoices/${params.id}`), sx: {
                                '& .MuiDataGrid-row': {
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: theme.palette.action.hover },
                                },
                            } })] }), _jsxs(Menu, { anchorEl: actionAnchorEl, open: Boolean(actionAnchorEl), onClose: () => setActionAnchorEl(null), anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' }, children: [_jsxs(MenuItem, { onClick: () => { selectedInvoice && navigate(`/sales/invoices/${selectedInvoice.id}`); setActionAnchorEl(null); }, children: [_jsx(ViewIcon, { fontSize: "small", sx: { mr: 1 } }), " View"] }), _jsxs(MenuItem, { onClick: () => { selectedInvoice && window.open(`/sales/invoices/${selectedInvoice.id}/print`, '_blank'); setActionAnchorEl(null); }, children: [_jsx(PrintIcon, { fontSize: "small", sx: { mr: 1 } }), " Print"] }), selectedInvoice && selectedInvoice.balance > 0 && selectedInvoice.status !== 'CANCELLED' && (_jsxs(MenuItem, { onClick: openPaymentDialog, children: [_jsx(PaymentIcon, { fontSize: "small", sx: { mr: 1 } }), " Record Payment"] }))] }), _jsxs(Dialog, { open: paymentDialog, onClose: () => setPaymentDialog(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Record Payment" }), _jsxs(DialogContent, { children: [selectedInvoice && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Invoice: ", selectedInvoice.invoiceNumber] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Customer: ", selectedInvoice.customerName] }), _jsxs(Typography, { variant: "body1", fontWeight: "bold", color: "primary", children: ["Balance Due: ", formatCurrency(selectedInvoice.balance)] })] })), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { label: "Amount *", type: "number", fullWidth: true, size: "small", value: paymentForm.amount, onChange: (e) => setPaymentForm({ ...paymentForm, amount: e.target.value }), inputProps: { min: 0.01, step: 0.01 } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Payment Date *", value: paymentForm.paymentDate, onChange: (val) => val && setPaymentForm({ ...paymentForm, paymentDate: val }), slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { select: true, label: "Payment Method *", fullWidth: true, size: "small", value: paymentForm.method, onChange: (e) => setPaymentForm({ ...paymentForm, method: e.target.value }), children: paymentMethods.map((m) => (_jsx(MenuItem, { value: m, children: m.replace('_', ' ') }, m))) }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(TextField, { label: "Reference #", fullWidth: true, size: "small", value: paymentForm.reference, onChange: (e) => setPaymentForm({ ...paymentForm, reference: e.target.value }) }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(TextField, { label: "Notes", fullWidth: true, size: "small", multiline: true, rows: 2, value: paymentForm.notes, onChange: (e) => setPaymentForm({ ...paymentForm, notes: e.target.value }) }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setPaymentDialog(false), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => selectedInvoice && paymentMutation.mutate({ invoiceId: selectedInvoice.id, data: paymentForm }), disabled: !paymentForm.amount || Number(paymentForm.amount) <= 0 || paymentMutation.isPending, children: paymentMutation.isPending ? 'Saving...' : 'Record Payment' })] })] })] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default SalesInvoicesPage;
