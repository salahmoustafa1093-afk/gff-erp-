import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Step, StepLabel, Stepper, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemIcon, ListItemText, Avatar, } from '@mui/material';
import { Edit as EditIcon, Print as PrintIcon, Receipt as InvoiceIcon, ArrowBack as BackIcon, CheckCircle as ConfirmIcon, LocalShipping as ShipIcon, DoneAll as DeliverIcon, Cancel as CancelIcon, Timeline as TimelineIcon, Inventory as InventoryIcon, AssignmentReturn as ReturnIcon, Person as PersonIcon, Store as BranchIcon, CalendarToday as DateIcon, Note as NoteIcon, LocalOffer as OfferIcon, PersonOutline as RepIcon, } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const statusSteps = [
    { status: 'DRAFT', label: 'Draft' },
    { status: 'PENDING', label: 'Pending' },
    { status: 'CONFIRMED', label: 'Confirmed' },
    { status: 'SHIPPED', label: 'Shipped' },
    { status: 'DELIVERED', label: 'Delivered' },
    { status: 'INVOICED', label: 'Invoiced' },
    { status: 'PAID', label: 'Paid' },
];
const statusConfig = {
    DRAFT: { color: '#9e9e9e', bg: '#f5f5f5', label: 'Draft' },
    PENDING: { color: '#ff9800', bg: '#fff3e0', label: 'Pending' },
    CONFIRMED: { color: '#2196f3', bg: '#e3f2fd', label: 'Confirmed' },
    SHIPPED: { color: '#9c27b0', bg: '#f3e5f5', label: 'Shipped' },
    DELIVERED: { color: '#4caf50', bg: '#e8f5e9', label: 'Delivered' },
    INVOICED: { color: '#00bcd4', bg: '#e0f7fa', label: 'Invoiced' },
    PAID: { color: '#2e7d32', bg: '#c8e6c9', label: 'Paid' },
    CANCELLED: { color: '#f44336', bg: '#ffebee', label: 'Cancelled' },
};
const SalesOrderDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const printRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '' });
    const [cancelReason, setCancelReason] = useState('');
    const { data: order, isLoading, refetch } = useQuery({
        queryKey: ['salesOrderDetail', id],
        queryFn: async () => {
            const response = await api.get(`/sales/orders/${id}`);
            return response.data;
        },
        enabled: Boolean(id),
    });
    const statusMutation = useMutation({
        mutationFn: async ({ action, reason }) => {
            const response = await api.post(`/sales/orders/${id}/${action}`, { reason });
            return response.data;
        },
        onSuccess: () => {
            setConfirmDialog({ open: false, action: '' });
            setCancelReason('');
            refetch();
        },
    });
    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (!printContent)
            return;
        const w = window.open('', '_blank');
        if (!w)
            return;
        w.document.write(`
      <html>
        <head><title>Order ${order?.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4caf50; color: white; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { font-size: 18px; font-weight: bold; color: #2e7d32; }
          @media print { .no-print { display: none; } }
        </style></head>
        <body>${printContent}</body>
      </html>
    `);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 500);
    };
    const getActiveStep = (status) => {
        if (status === 'CANCELLED')
            return -1;
        const idx = statusSteps.findIndex((s) => s.status === status);
        return idx >= 0 ? idx : 0;
    };
    if (isLoading || !order) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(Typography, { children: "Loading..." }) }));
    }
    const activeStep = getActiveStep(order.status);
    const actionButtons = [
        { label: 'Confirm', action: 'confirm', icon: _jsx(ConfirmIcon, {}), show: ['DRAFT', 'PENDING'].includes(order.status) },
        { label: 'Ship', action: 'ship', icon: _jsx(ShipIcon, {}), show: ['CONFIRMED'].includes(order.status) },
        { label: 'Deliver', action: 'deliver', icon: _jsx(DeliverIcon, {}), show: ['SHIPPED'].includes(order.status) },
        { label: 'Invoice', action: 'invoice', icon: _jsx(InvoiceIcon, {}), show: ['DELIVERED', 'CONFIRMED', 'SHIPPED'].includes(order.status) },
        { label: 'Cancel', action: 'cancel', icon: _jsx(CancelIcon, {}), show: !['CANCELLED', 'PAID'].includes(order.status), danger: true },
    ];
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/sales/orders'), children: _jsx(BackIcon, {}) }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: ["Sales Order ", order.orderNumber] }), _jsx(Chip, { label: statusConfig[order.status]?.label || order.status, size: "small", sx: {
                                            mt: 0.5,
                                            backgroundColor: statusConfig[order.status]?.bg,
                                            color: statusConfig[order.status]?.color,
                                            fontWeight: 600,
                                        } })] })] }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [actionButtons.filter((btn) => btn.show).map((btn) => (_jsx(Button, { variant: btn.danger ? 'outlined' : 'contained', color: btn.danger ? 'error' : 'primary', startIcon: btn.icon, onClick: () => {
                                    if (btn.danger) {
                                        setConfirmDialog({ open: true, action: btn.action });
                                    }
                                    else {
                                        statusMutation.mutate({ action: btn.action });
                                    }
                                }, children: btn.label }, btn.action))), _jsx(Button, { variant: "outlined", startIcon: _jsx(PrintIcon, {}), onClick: handlePrint, children: "Print" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(EditIcon, {}), onClick: () => navigate(`/sales/orders/${id}/edit`), children: "Edit" })] })] }), order.status !== 'CANCELLED' && (_jsx(Paper, { sx: { p: 2, mb: 3 }, children: _jsx(Stepper, { activeStep: activeStep, alternativeLabel: true, children: statusSteps.map((step) => (_jsx(Step, { children: _jsx(StepLabel, { children: step.label }) }, step.status))) }) })), _jsxs(Tabs, { value: activeTab, onChange: (_, val) => setActiveTab(val), sx: { mb: 2 }, children: [_jsx(Tab, { icon: _jsx(TimelineIcon, {}), label: "Overview", iconPosition: "start" }), _jsx(Tab, { icon: _jsx(InventoryIcon, {}), label: `Items (${order.items?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(InvoiceIcon, {}), label: `Invoices (${order.invoices?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(ReturnIcon, {}), label: `Returns (${order.returns?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(NoteIcon, {}), label: "Activity", iconPosition: "start" })] }), activeTab === 0 && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Order Information" }), _jsx(InfoRow, { icon: _jsx(OfferIcon, {}), label: "Order Number", value: order.orderNumber }), _jsx(InfoRow, { icon: _jsx(DateIcon, {}), label: "Order Date", value: format(parseISO(order.orderDate), 'dd/MM/yyyy') }), _jsx(InfoRow, { icon: _jsx(DateIcon, {}), label: "Due Date", value: format(parseISO(order.dueDate), 'dd/MM/yyyy') }), _jsx(InfoRow, { icon: _jsx(BranchIcon, {}), label: "Branch", value: order.branchName }), _jsx(InfoRow, { icon: _jsx(RepIcon, {}), label: "Sales Rep", value: order.salesRepName }), order.notes && _jsx(InfoRow, { icon: _jsx(NoteIcon, {}), label: "Notes", value: order.notes })] }) }) }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Customer Information" }), _jsx(InfoRow, { icon: _jsx(PersonIcon, {}), label: "Customer", value: `${order.customerCode} - ${order.customerName}` }), _jsx(InfoRow, { icon: _jsx(PersonIcon, {}), label: "Customer ID", value: order.customerId })] }) }), _jsx(Card, { sx: { mt: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Financial Summary" }), _jsx(SummaryRow, { label: "Subtotal", value: order.subtotal }), _jsx(SummaryRow, { label: "Discount", value: order.discount }), _jsx(SummaryRow, { label: "Tax", value: order.tax }), _jsx(SummaryRow, { label: "Shipping", value: order.shipping }), _jsx(Divider, { sx: { my: 1 } }), _jsx(SummaryRow, { label: "Total", value: order.total, bold: true }), _jsx(SummaryRow, { label: "Paid", value: order.paid }), _jsx(SummaryRow, { label: "Balance", value: order.balance, color: order.balance > 0 ? 'error' : 'success' })] }) })] })] })), activeTab === 1 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Order Items" }), _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: 'primary.main' }, children: [_jsx(TableCell, { sx: { color: 'white' }, children: "#" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Product" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Quantity" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Unit Price" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Discount" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Tax" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Total" })] }) }), _jsx(TableBody, { children: order.items?.map((item, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: idx + 1 }), _jsxs(TableCell, { children: [_jsx(Typography, { fontWeight: "medium", children: item.productName }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: item.productCode })] }), _jsx(TableCell, { align: "right", children: item.quantity.toLocaleString() }), _jsx(TableCell, { align: "right", children: formatCurrency(item.unitPrice) }), _jsxs(TableCell, { align: "right", children: [item.discountPercent, "%"] }), _jsxs(TableCell, { align: "right", children: [item.taxPercent, "%"] }), _jsx(TableCell, { align: "right", fontWeight: "medium", children: formatCurrency(item.total) })] }, item.id))) })] }) })] })), activeTab === 2 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Linked Invoices" }), order.invoices?.length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No invoices linked to this order" })), order.invoices?.map((invoice) => (_jsx(InvoiceCard, { invoice: invoice, onClick: () => navigate(`/sales/invoices/${invoice.id}`) }, invoice.id)))] })), activeTab === 3 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Sales Returns" }), order.returns?.length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No returns for this order" })), order.returns?.map((ret) => (_jsx(Card, { sx: { mb: 1, cursor: 'pointer' }, onClick: () => navigate(`/sales/returns/${ret.id}`), children: _jsxs(CardContent, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsxs(Box, { children: [_jsx(Typography, { fontWeight: "medium", children: ret.returnNumber }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [format(parseISO(ret.returnDate), 'dd/MM/yyyy'), " | Reason: ", ret.reason] })] }), _jsxs(Box, { sx: { textAlign: 'right' }, children: [_jsx(Chip, { label: ret.status, size: "small" }), _jsx(Typography, { fontWeight: "medium", children: formatCurrency(ret.total) })] })] }) }, ret.id)))] })), activeTab === 4 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Activity Log" }), order.activities?.length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No activity recorded" })), _jsx(List, { children: order.activities?.map((activity) => (_jsxs(ListItem, { divider: true, children: [_jsx(ListItemIcon, { children: _jsx(Avatar, { sx: { bgcolor: 'primary.main', width: 32, height: 32 }, children: _jsx(TimelineIcon, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: activity.action, secondary: `${activity.description} — ${activity.userName} at ${format(parseISO(activity.createdAt), 'dd/MM/yyyy HH:mm')}` })] }, activity.id))) })] })), _jsx(Box, { sx: { display: 'none' }, children: _jsxs("div", { ref: printRef, children: [_jsxs("div", { className: "header", children: [_jsxs("div", { children: [_jsx("h1", { children: "SALES ORDER" }), _jsxs("p", { children: [_jsx("strong", { children: "Order #:" }), " ", order.orderNumber] }), _jsxs("p", { children: [_jsx("strong", { children: "Date:" }), " ", format(parseISO(order.orderDate), 'dd/MM/yyyy')] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", statusConfig[order.status]?.label] }), _jsxs("p", { children: [_jsx("strong", { children: "Branch:" }), " ", order.branchName] })] })] }), _jsxs("div", { children: [_jsx("h3", { children: "Customer" }), _jsxs("p", { children: [_jsx("strong", { children: order.customerName }), " (", order.customerCode, ")"] })] }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "Product" }), _jsx("th", { children: "Qty" }), _jsx("th", { children: "Unit Price" }), _jsx("th", { children: "Total" })] }) }), _jsx("tbody", { children: order.items?.map((item, idx) => (_jsxs("tr", { children: [_jsx("td", { children: idx + 1 }), _jsxs("td", { children: [item.productName, " (", item.productCode, ")"] }), _jsx("td", { children: item.quantity }), _jsx("td", { children: formatCurrency(item.unitPrice) }), _jsx("td", { children: formatCurrency(item.total) })] }, item.id))) })] }), _jsxs("div", { className: "totals", children: [_jsxs("p", { children: ["Subtotal: ", formatCurrency(order.subtotal)] }), _jsxs("p", { children: ["Discount: ", formatCurrency(order.discount)] }), _jsxs("p", { children: ["Tax: ", formatCurrency(order.tax)] }), _jsxs("p", { children: ["Shipping: ", formatCurrency(order.shipping)] }), _jsxs("p", { className: "total-row", children: ["TOTAL: ", formatCurrency(order.total)] })] })] }) }), _jsxs(Dialog, { open: confirmDialog.open && confirmDialog.action === 'cancel', onClose: () => setConfirmDialog({ open: false, action: '' }), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Cancel Order" }), _jsxs(DialogContent, { children: [_jsx(Typography, { sx: { mb: 2 }, children: "Are you sure you want to cancel this order? This action cannot be undone." }), _jsx(TextField, { label: "Cancellation Reason", fullWidth: true, multiline: true, rows: 3, value: cancelReason, onChange: (e) => setCancelReason(e.target.value) })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setConfirmDialog({ open: false, action: '' }), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => statusMutation.mutate({ action: 'cancel', reason: cancelReason }), children: "Confirm Cancel" })] })] })] }));
};
const InfoRow = ({ icon, label, value }) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }, children: [_jsx(Box, { sx: { color: 'primary.main', display: 'flex' }, children: icon }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: value })] })] }));
const SummaryRow = ({ label, value, bold, color }) => (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 0.75 }, children: [_jsx(Typography, { variant: bold ? 'subtitle1' : 'body2', fontWeight: bold ? 'bold' : 'normal', children: label }), _jsx(Typography, { variant: bold ? 'subtitle1' : 'body2', fontWeight: bold ? 'bold' : 'normal', color: color, children: formatCurrency(value) })] }));
const InvoiceCard = ({ invoice, onClick }) => {
    const statusColors = {
        DRAFT: '#9e9e9e', SENT: '#2196f3', PAID: '#4caf50', PARTIAL: '#ff9800', OVERDUE: '#f44336', CANCELLED: '#9e9e9e',
    };
    return (_jsx(Card, { sx: { mb: 1, cursor: 'pointer', '&:hover': { boxShadow: 2 } }, onClick: onClick, children: _jsxs(CardContent, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsxs(Box, { children: [_jsx(Typography, { fontWeight: "medium", children: invoice.invoiceNumber }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [format(parseISO(invoice.invoiceDate), 'dd/MM/yyyy'), " | Due: ", format(parseISO(invoice.dueDate), 'dd/MM/yyyy')] })] }), _jsxs(Box, { sx: { textAlign: 'right' }, children: [_jsx(Chip, { label: invoice.status, size: "small", sx: { backgroundColor: statusColors[invoice.status] + '20', color: statusColors[invoice.status], fontWeight: 600 } }), _jsx(Typography, { fontWeight: "medium", children: formatCurrency(invoice.total) }), _jsxs(Typography, { variant: "caption", color: invoice.balance > 0 ? 'error' : 'success', children: ["Balance: ", formatCurrency(invoice.balance)] })] })] }) }));
};
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default SalesOrderDetail;
