import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, Grid, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { ArrowBack, Receipt, Payment, Print, FilterList, Today, } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { cashboxService } from '../../services/cashboxService';
import { formatCurrency, formatDate, getStatusColor, printWindow } from '../../utils/formatters';
const transactionSchema = Yup.object().shape({
    type: Yup.string().oneOf(['RECEIPT', 'PAYMENT']).required(),
    amount: Yup.number().positive().required(),
    date: Yup.date().required(),
    description: Yup.string().required(),
    reference: Yup.string(),
    category: Yup.string().required(),
});
const receiptCategories = [
    'Sales Collection',
    'Customer Payment',
    'Bank Withdrawal',
    'Inter-cashbox Transfer',
    'Refund',
    'Other Income',
];
const paymentCategories = [
    'Purchase Payment',
    'Supplier Payment',
    'Bank Deposit',
    'Inter-cashbox Transfer',
    'Expense',
    'Payroll',
    'Other',
];
const CashboxDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const printRef = useRef(null);
    const [tab, setTab] = useState(0);
    const [open, setOpen] = useState(false);
    const [txType, setTxType] = useState('RECEIPT');
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [reportDate, setReportDate] = useState(new Date());
    const [showReport, setShowReport] = useState(false);
    const { data: cashbox } = useQuery({
        queryKey: ['cashbox', id],
        queryFn: () => cashboxService.getCashboxById(id),
        enabled: !!id,
    });
    const { data: transactionsData, isLoading } = useQuery({
        queryKey: ['cashbox-transactions', id, paginationModel.page, paginationModel.pageSize, typeFilter, dateFrom, dateTo],
        queryFn: () => cashboxService.getTransactions(id, {
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            type: typeFilter || undefined,
            dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
            dateTo: dateTo ? dateTo.toISOString().split('T')[0] : undefined,
        }),
        enabled: !!id,
    });
    const { data: dailyReport } = useQuery({
        queryKey: ['cashbox-daily-report', id, reportDate],
        queryFn: () => cashboxService.getDailyReport(id, reportDate.toISOString().split('T')[0]),
        enabled: !!id && !!reportDate && showReport,
    });
    const createMutation = useMutation({
        mutationFn: (values) => cashboxService.createTransaction(id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashbox-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['cashbox'] });
            queryClient.invalidateQueries({ queryKey: ['cashbox-daily-report'] });
            setOpen(false);
        },
    });
    const transactions = transactionsData?.data ?? [];
    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            width: 110,
            renderCell: (params) => formatDate(params.row.date),
        },
        { field: 'transactionNumber', headerName: 'Ref #', width: 120 },
        {
            field: 'type',
            headerName: 'Type',
            width: 90,
            renderCell: (params) => (_jsx(Chip, { label: params.row.type, size: "small", color: params.row.type === 'RECEIPT' ? 'success' : 'error' })),
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.amount),
        },
        {
            field: 'runningBalance',
            headerName: 'Balance',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (_jsx(Typography, { fontWeight: "medium", children: formatCurrency(params.row.runningBalance) })),
        },
        { field: 'reference', headerName: 'Reference', width: 120 },
        { field: 'description', headerName: 'Description', width: 200, flex: 1 },
        { field: 'category', headerName: 'Category', width: 130 },
        {
            field: 'status',
            headerName: 'Status',
            width: 90,
            renderCell: (params) => (_jsx(Chip, { label: params.row.status, size: "small", color: getStatusColor(params.row.status) })),
        },
    ];
    const handlePrint = () => {
        if (printRef.current) {
            printWindow('cashbox-report-print');
        }
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Button, { startIcon: _jsx(ArrowBack, {}), onClick: () => navigate('/cashboxes'), variant: "outlined", size: "small", children: "Back" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: cashbox?.name ?? 'Cashbox Detail' })] }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(Receipt, {}), onClick: () => { setTxType('RECEIPT'); setOpen(true); }, children: "Receipt" }), _jsx(Button, { variant: "contained", color: "error", startIcon: _jsx(Payment, {}), onClick: () => { setTxType('PAYMENT'); setOpen(true); }, children: "Payment" })] })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Code" }), _jsx(Typography, { variant: "body1", children: cashbox?.code })] }), _jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Responsible" }), _jsx(Typography, { variant: "body1", children: cashbox?.responsible })] }), _jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Branch" }), _jsx(Typography, { variant: "body1", children: cashbox?.branchName })] }), _jsxs(Grid, { size: { xs: 12, sm: 3 }, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Current Balance" }), _jsx(Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: formatCurrency(cashbox?.currentBalance ?? 0) })] })] }) }) }), _jsxs(Tabs, { value: tab, onChange: (_, v) => setTab(v), sx: { mb: 2 }, children: [_jsx(Tab, { label: "Transaction Register" }), _jsx(Tab, { label: "Daily Cash Report" })] }), tab === 0 && (_jsxs(_Fragment, { children: [_jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mb: 2, children: [_jsx(FilterList, { fontSize: "small", color: "action" }), _jsx(Typography, { variant: "subtitle2", children: "Filters" })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: typeFilter, label: "Type", onChange: (e) => { setTypeFilter(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }, children: [_jsx(MenuItem, { value: "", children: "All" }), _jsx(MenuItem, { value: "RECEIPT", children: "Receipt" }), _jsx(MenuItem, { value: "PAYMENT", children: "Payment" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "From", value: dateFrom, onChange: setDateFrom, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "To", value: dateTo, onChange: setDateTo, slotProps: { textField: { size: 'small', fullWidth: true } } }) })] })] }) }), _jsx(DataGrid, { rows: transactions, columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [10, 25, 50, 100], rowCount: transactionsData?.total ?? 0, paginationMode: "server", loading: isLoading, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (row) => row.id })] })), tab === 1 && (_jsxs(_Fragment, { children: [_jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Report Date", value: reportDate, onChange: setReportDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsxs(Grid, { size: { xs: 12, sm: 8 }, display: "flex", gap: 1, justifyContent: "flex-end", children: [_jsx(Button, { variant: "contained", startIcon: _jsx(Today, {}), onClick: () => setShowReport(true), size: "small", children: "Generate Report" }), showReport && dailyReport && (_jsx(Button, { variant: "outlined", startIcon: _jsx(Print, {}), onClick: handlePrint, size: "small", children: "Print" }))] })] }) }) }), showReport && dailyReport && (_jsx("div", { id: "cashbox-report-print", ref: printRef, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { p: 4 }, children: [_jsxs(Box, { textAlign: "center", mb: 3, children: [_jsx(Typography, { variant: "h5", fontWeight: "bold", children: "Daily Cash Report" }), _jsxs(Typography, { variant: "subtitle1", color: "text.secondary", children: [cashbox?.name, " - ", formatDate(reportDate)] })] }), _jsxs(Grid, { container: true, spacing: 3, mb: 3, children: [_jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Opening Balance" }), _jsx(Typography, { variant: "h6", children: formatCurrency(dailyReport.openingBalance) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Receipts" }), _jsx(Typography, { variant: "h6", color: "success.main", children: formatCurrency(dailyReport.receipts) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Payments" }), _jsx(Typography, { variant: "h6", color: "error.main", children: formatCurrency(dailyReport.payments) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Closing Balance" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(dailyReport.closingBalance) })] }) }) })] }), _jsx(Typography, { variant: "h6", gutterBottom: true, children: "Transactions" }), _jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5' }, children: [_jsx(TableCell, { children: "Time" }), _jsx(TableCell, { children: "Type" }), _jsx(TableCell, { children: "Reference" }), _jsx(TableCell, { children: "Description" }), _jsx(TableCell, { children: "Category" }), _jsx(TableCell, { align: "right", children: "Amount" })] }) }), _jsx(TableBody, { children: dailyReport.transactions.map((tx) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: formatDate(tx.date) }), _jsx(TableCell, { children: _jsx(Chip, { label: tx.type, size: "small", color: tx.type === 'RECEIPT' ? 'success' : 'error' }) }), _jsx(TableCell, { children: tx.reference ?? '-' }), _jsx(TableCell, { children: tx.description }), _jsx(TableCell, { children: tx.category }), _jsx(TableCell, { align: "right", children: formatCurrency(tx.amount) })] }, tx.id))) })] }) })] }) }) }))] })), _jsxs(Dialog, { open: open, onClose: () => setOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: txType === 'RECEIPT' ? (_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Receipt, { color: "success" }), " New Receipt"] })) : (_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Payment, { color: "error" }), " New Payment"] })) }), _jsx(Formik, { initialValues: {
                                type: txType,
                                amount: '',
                                date: new Date(),
                                description: '',
                                reference: '',
                                category: '',
                            }, validationSchema: transactionSchema, onSubmit: (values) => {
                                createMutation.mutate({
                                    ...values,
                                    amount: Number(values.amount),
                                    date: values.date.toISOString().split('T')[0],
                                });
                            }, children: ({ values, setFieldValue }) => (_jsxs(Form, { children: [_jsxs(DialogContent, { children: [createMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create transaction" })), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: FormikTextField, name: "amount", label: "Amount", type: "number", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(DatePicker, { label: "Date", value: values.date, onChange: (val) => setFieldValue('date', val), slotProps: { textField: { fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Category" }), _jsx(Select, { value: values.category, label: "Category", onChange: (e) => setFieldValue('category', e.target.value), children: (txType === 'RECEIPT' ? receiptCategories : paymentCategories).map((cat) => (_jsx(MenuItem, { value: cat, children: cat }, cat))) })] }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "reference", label: "Reference", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: FormikTextField, name: "description", label: "Description", multiline: true, rows: 2, fullWidth: true, required: true }) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: createMutation.isPending, children: createMutation.isPending ? 'Saving...' : 'Save' })] })] })) })] })] }) }));
};
export default CashboxDetail;
