import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, Paper, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, List, ListItem, ListItemIcon, ListItemText, Avatar, } from '@mui/material';
import { Edit as EditIcon, Receipt as StatementIcon, ArrowBack as BackIcon, Person as PersonIcon, Phone as PhoneIcon, Email as EmailIcon, LocationOn as AddressIcon, CreditCard as CreditIcon, CalendarToday as DateIcon, PersonOutline as RepIcon, Store as BranchIcon, ShoppingCart as OrderIcon, ReceiptLong as InvoiceIcon, AssignmentReturn as ReturnIcon, Payments as PaymentIcon, Timeline as ActivityIcon, Note as NotesIcon, } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const typeLabels = {
    INDIVIDUAL: 'Individual', COMPANY: 'Company', DEALER: 'Dealer', DISTRIBUTOR: 'Distributor',
};
const typeColors = {
    INDIVIDUAL: '#2196f3', COMPANY: '#4caf50', DEALER: '#ff9800', DISTRIBUTOR: '#9c27b0',
};
const CustomerDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState(0);
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customerDetail', id],
        queryFn: async () => {
            const response = await api.get(`/customers/${id}`);
            return response.data;
        },
        enabled: Boolean(id),
    });
    const { data: salesData } = useQuery({
        queryKey: ['customerSales', id],
        queryFn: async () => {
            const response = await api.get(`/sales/orders?customerId=${id}&pageSize=10`);
            return response.data.data;
        },
        enabled: Boolean(id),
    });
    const { data: invoicesData } = useQuery({
        queryKey: ['customerInvoices', id],
        queryFn: async () => {
            const response = await api.get(`/sales/invoices?customerId=${id}&pageSize=10`);
            return response.data.data;
        },
        enabled: Boolean(id),
    });
    const { data: paymentsData } = useQuery({
        queryKey: ['customerPayments', id],
        queryFn: async () => {
            const response = await api.get(`/sales/payments?customerId=${id}&pageSize=10`);
            return response.data.data;
        },
        enabled: Boolean(id),
    });
    const { data: returnsData } = useQuery({
        queryKey: ['customerReturns', id],
        queryFn: async () => {
            const response = await api.get(`/sales/returns?customerId=${id}&pageSize=10`);
            return response.data.data;
        },
        enabled: Boolean(id),
    });
    const { data: activitiesData } = useQuery({
        queryKey: ['customerActivities', id],
        queryFn: async () => {
            const response = await api.get(`/customers/${id}/activities`);
            return response.data;
        },
        enabled: Boolean(id),
    });
    if (isLoading || !customer) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(Typography, { children: "Loading..." }) }));
    }
    const exceedsCredit = customer.balance >= customer.creditLimit && customer.creditLimit > 0;
    const nearCredit = !exceedsCredit && customer.balance > customer.creditLimit * 0.8 && customer.creditLimit > 0;
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/customers'), children: _jsx(BackIcon, {}) }), _jsxs(Box, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: customer.name }), _jsx(Chip, { label: typeLabels[customer.type] || customer.type, size: "small", sx: {
                                                    backgroundColor: (typeColors[customer.type] || '#9e9e9e') + '20',
                                                    color: typeColors[customer.type] || '#9e9e9e',
                                                    fontWeight: 600,
                                                } }), _jsx(Chip, { label: customer.isActive ? 'Active' : 'Inactive', size: "small", color: customer.isActive ? 'success' : 'default' })] }), customer.nameAr && (_jsx(Typography, { variant: "subtitle1", color: "text.secondary", sx: { direction: 'rtl' }, children: customer.nameAr }))] })] }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(StatementIcon, {}), onClick: () => navigate(`/customers/${id}/statement`), children: "Statement" }), _jsx(Button, { variant: "contained", startIcon: _jsx(EditIcon, {}), onClick: () => navigate(`/customers/${id}/edit`), children: "Edit" })] })] }), _jsxs(Grid, { container: true, spacing: 2, sx: { mb: 3 }, children: [_jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Balance" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: exceedsCredit ? 'error' : nearCredit ? 'warning.main' : 'inherit', children: formatCurrency(customer.balance) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Credit Limit" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: formatCurrency(customer.creditLimit) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Available Credit" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "success.main", children: formatCurrency(Math.max(0, customer.creditLimit - customer.balance)) })] }) }) }), _jsx(Grid, { size: { xs: 6, sm: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Discount" }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", children: [customer.discountPercent, "%"] })] }) }) })] }), (exceedsCredit || nearCredit) && (_jsx(Paper, { sx: { p: 2, mb: 2, backgroundColor: exceedsCredit ? '#ffebee' : '#fff8e1', borderLeft: `4px solid ${exceedsCredit ? '#f44336' : '#ff9800'}` }, children: _jsx(Typography, { color: exceedsCredit ? 'error' : 'warning.main', fontWeight: "medium", children: exceedsCredit
                        ? `Credit limit exceeded! Balance (${formatCurrency(customer.balance)}) exceeds limit (${formatCurrency(customer.creditLimit)})`
                        : `Approaching credit limit. Balance: ${formatCurrency(customer.balance)} / Limit: ${formatCurrency(customer.creditLimit)}` }) })), _jsxs(Tabs, { value: activeTab, onChange: (_, val) => setActiveTab(val), sx: { mb: 2 }, children: [_jsx(Tab, { icon: _jsx(PersonIcon, {}), label: "Info", iconPosition: "start" }), _jsx(Tab, { icon: _jsx(OrderIcon, {}), label: `Sales (${salesData?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(InvoiceIcon, {}), label: `Invoices (${invoicesData?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(PaymentIcon, {}), label: `Payments (${paymentsData?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(ReturnIcon, {}), label: `Returns (${returnsData?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(ActivityIcon, {}), label: "Activity", iconPosition: "start" })] }), activeTab === 0 && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Contact Information" }), _jsx(InfoRow, { icon: _jsx(PersonIcon, {}), label: "Code", value: customer.code }), _jsx(InfoRow, { icon: _jsx(PersonIcon, {}), label: "Type", value: typeLabels[customer.type] || customer.type }), _jsx(InfoRow, { icon: _jsx(PhoneIcon, {}), label: "Phone", value: customer.phone || '-' }), _jsx(InfoRow, { icon: _jsx(EmailIcon, {}), label: "Email", value: customer.email || '-' }), _jsx(InfoRow, { icon: _jsx(AddressIcon, {}), label: "Address", value: `${customer.address || ''}, ${customer.city || ''}` }), _jsx(InfoRow, { icon: _jsx(NotesIcon, {}), label: "Notes", value: customer.notes || '-' })] }) }), _jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Financial Details" }), _jsx(InfoRow, { icon: _jsx(CreditIcon, {}), label: "Credit Limit", value: formatCurrency(customer.creditLimit) }), _jsx(InfoRow, { icon: _jsx(DateIcon, {}), label: "Payment Terms", value: `${customer.paymentTerms} days` }), _jsx(InfoRow, { icon: _jsx(RepIcon, {}), label: "Discount %", value: `${customer.discountPercent}%` }), _jsx(InfoRow, { icon: _jsx(RepIcon, {}), label: "Sales Rep", value: customer.salesRepName || '-' }), _jsx(InfoRow, { icon: _jsx(BranchIcon, {}), label: "Tax Number", value: customer.taxNumber || '-' }), _jsx(InfoRow, { icon: _jsx(DateIcon, {}), label: "Customer Since", value: new Date(customer.createdAt).toLocaleDateString() })] }) })] })), activeTab === 1 && (_jsx(SimpleTable, { headers: ['Order #', 'Date', 'Status', 'Total', 'Balance'], rows: (salesData || []).map((o) => [
                    o.orderNumber, format(parseISO(o.orderDate), 'dd/MM/yyyy'), o.status,
                    formatCurrency(o.total), formatCurrency(o.balance),
                ]), onRowClick: (idx) => navigate(`/sales/orders/${salesData?.[idx]?.id}`) })), activeTab === 2 && (_jsx(SimpleTable, { headers: ['Invoice #', 'Date', 'Due Date', 'Status', 'Total', 'Balance'], rows: (invoicesData || []).map((i) => [
                    i.invoiceNumber, format(parseISO(i.invoiceDate), 'dd/MM/yyyy'),
                    format(parseISO(i.dueDate), 'dd/MM/yyyy'), i.status,
                    formatCurrency(i.total), formatCurrency(i.balance),
                ]), onRowClick: (idx) => navigate(`/sales/invoices/${invoicesData?.[idx]?.id}`) })), activeTab === 3 && (_jsx(SimpleTable, { headers: ['Date', 'Amount', 'Method', 'Reference'], rows: (paymentsData || []).map((p) => [
                    format(parseISO(p.paymentDate), 'dd/MM/yyyy'),
                    formatCurrency(p.amount), p.method, p.reference || '-',
                ]) })), activeTab === 4 && (_jsx(SimpleTable, { headers: ['Return #', 'Date', 'Reason', 'Status', 'Total'], rows: (returnsData || []).map((r) => [
                    r.returnNumber, format(parseISO(r.returnDate), 'dd/MM/yyyy'),
                    r.reason, r.status, formatCurrency(r.total),
                ]) })), activeTab === 5 && (_jsx(Paper, { sx: { p: 2 }, children: _jsxs(List, { children: [(activitiesData || []).map((activity) => (_jsxs(ListItem, { divider: true, children: [_jsx(ListItemIcon, { children: _jsx(Avatar, { sx: { bgcolor: 'primary.main', width: 32, height: 32 }, children: _jsx(ActivityIcon, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: activity.action, secondary: `${activity.description} — ${activity.userName} at ${format(parseISO(activity.createdAt), 'dd/MM/yyyy HH:mm')}` })] }, activity.id))), (!activitiesData || activitiesData.length === 0) && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No activity recorded" }))] }) }))] }));
};
const InfoRow = ({ icon, label, value }) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }, children: [_jsx(Box, { sx: { color: 'primary.main', display: 'flex' }, children: icon }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: value })] })] }));
const SimpleTable = ({ headers, rows, onRowClick }) => (_jsx(Paper, { sx: { p: 2 }, children: _jsx(TableContainer, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsx(TableRow, { sx: { backgroundColor: 'primary.main' }, children: headers.map((h, i) => (_jsx(TableCell, { sx: { color: 'white' }, children: h }, i))) }) }), _jsxs(TableBody, { children: [rows.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: headers.length, align: "center", sx: { py: 4 }, children: _jsx(Typography, { color: "text.secondary", children: "No records found" }) }) })), rows.map((row, idx) => (_jsx(TableRow, { hover: true, sx: onRowClick ? { cursor: 'pointer' } : undefined, onClick: () => onRowClick?.(idx), children: row.map((cell, ci) => (_jsx(TableCell, { sx: ci === 0 ? { fontWeight: 'medium', color: 'primary.main' } : undefined, children: cell }, ci))) }, idx)))] })] }) }) }));
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default CustomerDetail;
