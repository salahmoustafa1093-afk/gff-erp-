import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemIcon, ListItemText, Avatar, LinearProgress, } from '@mui/material';
import { Edit as EditIcon, ArrowBack as BackIcon, CheckCircle as ConfirmIcon, Inventory as ReceiveIcon, Cancel as CancelIcon, Timeline as TimelineIcon, Receipt as InvoiceIcon, Person as SupplierIcon, Store as BranchIcon, CalendarToday as DateIcon, Note as NotesIcon, } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
const statusConfig = {
    DRAFT: { color: '#9e9e9e', bg: '#f5f5f5', label: 'Draft' },
    PENDING: { color: '#ff9800', bg: '#fff3e0', label: 'Pending' },
    CONFIRMED: { color: '#2196f3', bg: '#e3f2fd', label: 'Confirmed' },
    PARTIAL: { color: '#9c27b0', bg: '#f3e5f5', label: 'Partial' },
    RECEIVED: { color: '#4caf50', bg: '#e8f5e9', label: 'Received' },
    CANCELLED: { color: '#f44336', bg: '#ffebee', label: 'Cancelled' },
};
const PurchaseOrderDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState(0);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '' });
    const [grnDialog, setGrnDialog] = useState(false);
    const [receiveNotes, setReceiveNotes] = useState('');
    const { data: order, isLoading, refetch } = useQuery({
        queryKey: ['purchaseOrderDetail', id],
        queryFn: async () => {
            const response = await api.get(`/purchases/orders/${id}`);
            return response.data;
        },
        enabled: Boolean(id),
    });
    const statusMutation = useMutation({
        mutationFn: async ({ action, notes }) => {
            const response = await api.post(`/purchases/orders/${id}/${action}`, { notes });
            return response.data;
        },
        onSuccess: () => {
            setConfirmDialog({ open: false, action: '' });
            setGrnDialog(false);
            setReceiveNotes('');
            refetch();
        },
    });
    const handleReceive = () => {
        if (!order)
            return;
        statusMutation.mutate({ action: 'receive', notes: receiveNotes });
    };
    if (isLoading || !order) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(Typography, { children: "Loading..." }) }));
    }
    const totalOrdered = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalReceived = order.items?.reduce((sum, item) => sum + item.receivedQty, 0) || 0;
    const receiptProgress = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
    const actionButtons = [
        { label: 'Confirm', action: 'confirm', icon: _jsx(ConfirmIcon, {}), show: ['DRAFT', 'PENDING'].includes(order.status) },
        { label: 'Receive', action: 'receive', icon: _jsx(ReceiveIcon, {}), show: ['CONFIRMED', 'PARTIAL'].includes(order.status), dialog: true },
        { label: 'Cancel', action: 'cancel', icon: _jsx(CancelIcon, {}), show: order.status !== 'CANCELLED' && order.status !== 'RECEIVED', danger: true },
    ];
    return (_jsxs(Box, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsx(IconButton, { onClick: () => navigate('/purchases/orders'), children: _jsx(BackIcon, {}) }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", color: "primary", children: ["Purchase Order ", order.orderNumber] }), _jsx(Chip, { label: statusConfig[order.status]?.label || order.status, size: "small", sx: {
                                            mt: 0.5,
                                            backgroundColor: statusConfig[order.status]?.bg,
                                            color: statusConfig[order.status]?.color,
                                            fontWeight: 600,
                                        } })] })] }), _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [actionButtons.filter((btn) => btn.show).map((btn) => (_jsx(Button, { variant: btn.danger ? 'outlined' : 'contained', color: btn.danger ? 'error' : 'primary', startIcon: btn.icon, onClick: () => {
                                    if (btn.dialog) {
                                        setGrnDialog(true);
                                    }
                                    else if (btn.danger) {
                                        setConfirmDialog({ open: true, action: btn.action });
                                    }
                                    else {
                                        statusMutation.mutate({ action: btn.action });
                                    }
                                }, children: btn.label }, btn.action))), _jsx(Button, { variant: "outlined", startIcon: _jsx(EditIcon, {}), onClick: () => navigate(`/purchases/orders/${id}/edit`), children: "Edit" })] })] }), ['CONFIRMED', 'PARTIAL'].includes(order.status) && (_jsxs(Paper, { sx: { p: 2, mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "subtitle2", children: "Receipt Progress" }), _jsxs(Typography, { variant: "subtitle2", fontWeight: "bold", children: [totalReceived.toLocaleString(), " / ", totalOrdered.toLocaleString(), " (", receiptProgress.toFixed(0), "%)"] })] }), _jsx(LinearProgress, { variant: "determinate", value: receiptProgress, sx: { height: 8, borderRadius: 4 } })] })), _jsxs(Tabs, { value: activeTab, onChange: (_, val) => setActiveTab(val), sx: { mb: 2 }, children: [_jsx(Tab, { icon: _jsx(TimelineIcon, {}), label: "Overview", iconPosition: "start" }), _jsx(Tab, { icon: _jsx(ReceiveIcon, {}), label: "Items", iconPosition: "start" }), _jsx(Tab, { icon: _jsx(InvoiceIcon, {}), label: `GRNs (${order.grns?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(InvoiceIcon, {}), label: `Invoices (${order.invoices?.length || 0})`, iconPosition: "start" }), _jsx(Tab, { icon: _jsx(NotesIcon, {}), label: "Activity", iconPosition: "start" })] }), activeTab === 0 && (_jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { size: { xs: 12, md: 6 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Order Information" }), _jsx(InfoRow, { icon: _jsx(SupplierIcon, {}), label: "Order Number", value: order.orderNumber }), _jsx(InfoRow, { icon: _jsx(DateIcon, {}), label: "Order Date", value: format(parseISO(order.orderDate), 'dd/MM/yyyy') }), _jsx(InfoRow, { icon: _jsx(DateIcon, {}), label: "Expected Date", value: order.expectedDate ? format(parseISO(order.expectedDate), 'dd/MM/yyyy') : '-' }), _jsx(InfoRow, { icon: _jsx(BranchIcon, {}), label: "Branch", value: order.branchName }), order.notes && _jsx(InfoRow, { icon: _jsx(NotesIcon, {}), label: "Notes", value: order.notes })] }) }) }), _jsxs(Grid, { size: { xs: 12, md: 6 }, children: [_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Supplier Information" }), _jsx(InfoRow, { icon: _jsx(SupplierIcon, {}), label: "Supplier", value: `${order.supplierCode} - ${order.supplierName}` })] }) }), _jsx(Card, { sx: { mt: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Financial Summary" }), _jsx(SummaryRow, { label: "Subtotal", value: order.subtotal }), _jsx(SummaryRow, { label: "Discount", value: order.discount }), _jsx(SummaryRow, { label: "Tax", value: order.tax }), _jsx(SummaryRow, { label: "Shipping", value: order.shipping }), _jsx(Divider, { sx: { my: 1 } }), _jsx(SummaryRow, { label: "Total", value: order.total, bold: true }), _jsx(SummaryRow, { label: "Paid", value: order.paid }), _jsx(SummaryRow, { label: "Balance", value: order.balance, color: order.balance > 0 ? 'error' : 'success' })] }) })] })] })), activeTab === 1 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Order Items" }), _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: 'primary.main' }, children: [_jsx(TableCell, { sx: { color: 'white' }, children: "#" }), _jsx(TableCell, { sx: { color: 'white' }, children: "Product" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Ordered" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Received" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Unit Price" }), _jsx(TableCell, { sx: { color: 'white' }, align: "right", children: "Total" })] }) }), _jsx(TableBody, { children: order.items?.map((item, idx) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: idx + 1 }), _jsxs(TableCell, { children: [_jsx(Typography, { fontWeight: "medium", children: item.productName }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: item.productCode })] }), _jsx(TableCell, { align: "right", children: item.quantity.toLocaleString() }), _jsx(TableCell, { align: "right", children: _jsx(Typography, { color: item.receivedQty >= item.quantity ? 'success.main' : 'warning.main', fontWeight: "medium", children: item.receivedQty.toLocaleString() }) }), _jsx(TableCell, { align: "right", children: formatCurrency(item.unitPrice) }), _jsx(TableCell, { align: "right", fontWeight: "medium", children: formatCurrency(item.total) })] }, item.id))) })] }) })] })), activeTab === 2 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Goods Receipt Notes (GRN)" }), order.grns?.length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No GRNs recorded" })), order.grns?.map((grn) => (_jsx(Card, { sx: { mb: 1 }, children: _jsxs(CardContent, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsxs(Box, { children: [_jsx(Typography, { fontWeight: "medium", children: grn.grnNumber }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [format(parseISO(grn.grnDate), 'dd/MM/yyyy'), " | ", grn.items?.length, " items"] })] }), _jsx(Chip, { label: grn.status, size: "small", color: grn.status === 'POSTED' ? 'success' : 'default' })] }) }, grn.id)))] })), activeTab === 3 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Linked Invoices" }), order.invoices?.length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No invoices linked" })), order.invoices?.map((invoice) => (_jsx(Card, { sx: { mb: 1, cursor: 'pointer' }, onClick: () => navigate(`/purchases/invoices/${invoice.id}`), children: _jsxs(CardContent, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }, children: [_jsxs(Box, { children: [_jsx(Typography, { fontWeight: "medium", children: invoice.invoiceNumber }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: format(parseISO(invoice.invoiceDate), 'dd/MM/yyyy') })] }), _jsxs(Box, { sx: { textAlign: 'right' }, children: [_jsx(Typography, { fontWeight: "medium", children: formatCurrency(invoice.total) }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Balance: ", formatCurrency(invoice.balance)] })] })] }) }, invoice.id)))] })), activeTab === 4 && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2 }, children: "Activity Log" }), order.activities?.length === 0 && (_jsx(Typography, { color: "text.secondary", align: "center", sx: { py: 4 }, children: "No activity recorded" })), _jsx(List, { children: order.activities?.map((activity) => (_jsxs(ListItem, { divider: true, children: [_jsx(ListItemIcon, { children: _jsx(Avatar, { sx: { bgcolor: 'primary.main', width: 32, height: 32 }, children: _jsx(TimelineIcon, { fontSize: "small" }) }) }), _jsx(ListItemText, { primary: activity.action, secondary: `${activity.description} — ${activity.userName} at ${format(parseISO(activity.createdAt), 'dd/MM/yyyy HH:mm')}` })] }, activity.id))) })] })), _jsxs(Dialog, { open: grnDialog, onClose: () => setGrnDialog(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Receive Items" }), _jsxs(DialogContent, { children: [_jsx(Typography, { sx: { mb: 2 }, children: "Receive all remaining items for this order? You can edit individual quantities after." }), _jsx(TextField, { label: "Notes", fullWidth: true, multiline: true, rows: 3, value: receiveNotes, onChange: (e) => setReceiveNotes(e.target.value) })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setGrnDialog(false), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: handleReceive, disabled: statusMutation.isPending, children: statusMutation.isPending ? 'Processing...' : 'Confirm Receipt' })] })] }), _jsxs(Dialog, { open: confirmDialog.open && confirmDialog.action === 'cancel', onClose: () => setConfirmDialog({ open: false, action: '' }), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Cancel Purchase Order" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to cancel this purchase order? This action cannot be undone." }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setConfirmDialog({ open: false, action: '' }), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => statusMutation.mutate({ action: 'cancel' }), children: "Confirm Cancel" })] })] })] }));
};
const InfoRow = ({ icon, label, value }) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }, children: [_jsx(Box, { sx: { color: 'primary.main', display: 'flex' }, children: icon }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: label }), _jsx(Typography, { variant: "body2", fontWeight: "medium", children: value })] })] }));
const SummaryRow = ({ label, value, bold, color }) => (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 0.75 }, children: [_jsx(Typography, { variant: bold ? 'subtitle1' : 'body2', fontWeight: bold ? 'bold' : 'normal', children: label }), _jsx(Typography, { variant: bold ? 'subtitle1' : 'body2', fontWeight: bold ? 'bold' : 'normal', color: color, children: formatCurrency(value) })] }));
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}
export default PurchaseOrderDetail;
