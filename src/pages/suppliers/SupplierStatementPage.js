import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Chip, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Divider, } from '@mui/material';
import { ArrowBack as BackIcon, Print as PrintIcon, FileDownload as ExportIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import api from '../../app/api';
const SupplierStatementPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const printRef = useRef(null);
    const [fromDate, setFromDate] = useState(startOfMonth(new Date()));
    const [toDate, setToDate] = useState(endOfMonth(new Date()));
    const { data: supplier } = useQuery({
        queryKey: ['supplierForStatement', id],
        queryFn: async () => { const response = await api.get(`/suppliers/${id}`); return response.data; },
        enabled: Boolean(id),
    });
    const { data: statement, isLoading, refetch } = useQuery({
        queryKey: ['supplierStatement', id, fromDate, toDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (fromDate)
                params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
            if (toDate)
                params.append('toDate', format(toDate, 'yyyy-MM-dd'));
            const response = await api.get(`/suppliers/${id}/statement?${params.toString()}`);
            return response.data;
        },
        enabled: Boolean(id && fromDate && toDate),
    });
    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (!printContent || !supplier)
            return;
        const w = window.open('', '_blank');
        if (!w)
            return;
        w.document.write(`<html><head><title>Supplier Statement - ${supplier.name}</title>
      <style>body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
      .header { text-align: center; margin-bottom: 20px; } .header h1 { margin: 0; color: #2e7d32; }
      .supplier-info { display: flex; justify-content: space-between; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
      table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
      th { background-color: #4caf50; color: white; } .totals { margin-top: 10px; text-align: right; font-weight: bold; }
      .debit { color: #d32f2f; } .credit { color: #2e7d32; } @media print { body { padding: 0; } }</style></head>
      <body>${printContent}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 500);
    };
    const handleExport = async () => {
        const params = new URLSearchParams();
        if (fromDate)
            params.append('fromDate', format(fromDate, 'yyyy-MM-dd'));
        if (toDate)
            params.append('toDate', format(toDate, 'yyyy-MM-dd'));
        const response = await api.get(`/suppliers/${id}/statement/export?${params.toString()}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `supplier-statement-${supplier?.code}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const rows = statement?.rows || [];
    const openingBalance = statement?.openingBalance || 0;
    const closingBalance = statement?.closingBalance || 0;
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate(`/suppliers/${id}`), children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: "Supplier Statement" })] }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(ExportIcon, {}), onClick: handleExport, children: "Export CSV" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(PrintIcon, {}), onClick: handlePrint, children: "Print" })] })] }), supplier && (_jsx(Paper, { sx: { p: 3, mb: 3 }, children: _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 1 }, children: supplier.name }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: supplier.code }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [supplier.address, supplier.city ? `, ${supplier.city}` : ''] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: supplier.phone })] }), _jsxs(Grid, { size: { xs: 12, md: 6 }, sx: { textAlign: { md: 'right' } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Statement Period" }), _jsxs(Typography, { variant: "body1", fontWeight: "medium", children: [fromDate ? format(fromDate, 'dd/MM/yyyy') : '', " - ", toDate ? format(toDate, 'dd/MM/yyyy') : ''] })] })] }) })), _jsx(Paper, { sx: { p: 2, mb: 3 }, children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "From Date", value: fromDate, onChange: setFromDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "To Date", value: toDate, onChange: setToDate, slotProps: { textField: { size: 'small', fullWidth: true } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Button, { variant: "contained", onClick: () => refetch(), fullWidth: true, children: "Generate Statement" }) })] }) }), _jsxs(Paper, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 2 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Opening Balance" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(openingBalance) })] }), _jsxs(Box, { sx: { textAlign: 'right' }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Closing Balance" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: closingBalance > 0 ? 'error' : 'success', children: formatCurrency(closingBalance) })] })] }), _jsx(Divider, { sx: { mb: 2 } }), _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: 'primary.main' }, children: [_jsx(TableCell, { sx: { color: 'white' }, children: "Date" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Type" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Reference" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Description" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Debit" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Credit" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Balance" })] }) }), _jsxs(TableBody, { children: [rows.length === 0 && !isLoading && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, align: "center", sx: { py: 4 }, children: _jsx(Typography, { color: "text.secondary", children: "No transactions" }) }) })), rows.map((row, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: format(parseISO(row.date), 'dd/MM/yyyy') }), _jsx(TableCell, { children: _jsx(Chip, { label: row.type, size: "small", color: row.type === 'PAYMENT' ? 'success' : 'default' }) }), _jsx(TableCell, { fontWeight: "medium", children: row.reference }), _jsx(TableCell, { children: row.description }), _jsx(TableCell, { align: "right", sx: { color: row.debit > 0 ? 'error.main' : 'inherit' }, children: row.debit > 0 ? formatCurrency(row.debit) : '-' }), _jsx(TableCell, { align: "right", sx: { color: row.credit > 0 ? 'success.main' : 'inherit' }, children: row.credit > 0 ? formatCurrency(row.credit) : '-' }), _jsx(TableCell, { align: "right", fontWeight: "medium", children: formatCurrency(row.balance) })] }, idx)))] })] }) })] }), _jsx(Box, { sx: { display: 'none' }, children: _jsxs("div", { ref: printRef, children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "SUPPLIER STATEMENT" }), _jsxs("p", { children: [fromDate ? format(fromDate, 'dd/MM/yyyy') : '', " - ", toDate ? format(toDate, 'dd/MM/yyyy') : ''] })] }), supplier && (_jsxs("div", { className: "supplier-info", children: [_jsxs("div", { children: [_jsx("p", { children: _jsx("strong", { children: supplier.name }) }), _jsx("p", { children: supplier.code }), _jsxs("p", { children: [supplier.address, supplier.city ? `, ${supplier.city}` : ''] }), _jsx("p", { children: supplier.phone })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("p", { children: ["Opening Balance: ", formatCurrency(openingBalance)] }), _jsxs("p", { children: ["Closing Balance: ", formatCurrency(closingBalance)] })] })] })), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Reference" }), _jsx("th", { children: "Description" }), _jsx("th", { children: "Debit" }), _jsx("th", { children: "Credit" }), _jsx("th", { children: "Balance" })] }) }), _jsx("tbody", { children: rows.map((row, idx) => (_jsxs("tr", { children: [_jsx("td", { children: format(parseISO(row.date), 'dd/MM/yyyy') }), _jsx("td", { children: row.type }), _jsx("td", { children: row.reference }), _jsx("td", { children: row.description }), _jsx("td", { className: "debit", children: row.debit > 0 ? formatCurrency(row.debit) : '' }), _jsx("td", { className: "credit", children: row.credit > 0 ? formatCurrency(row.credit) : '' }), _jsx("td", { children: formatCurrency(row.balance) })] }, idx))) })] }), _jsxs("div", { className: "totals", children: [_jsxs("p", { children: ["Opening Balance: ", formatCurrency(openingBalance)] }), _jsxs("p", { children: ["Closing Balance: ", formatCurrency(closingBalance)] })] })] }) })] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default SupplierStatementPage;
