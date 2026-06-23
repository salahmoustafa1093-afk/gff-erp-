import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Receipt as InvoiceIcon,
  ArrowBack as BackIcon,
  CheckCircle as ConfirmIcon,
  LocalShipping as ShipIcon,
  DoneAll as DeliverIcon,
  Cancel as CancelIcon,
  Timeline as TimelineIcon,
  Inventory as InventoryIcon,
  AssignmentReturn as ReturnIcon,
  Person as PersonIcon,
  Store as BranchIcon,
  CalendarToday as DateIcon,
  Note as NoteIcon,
  LocalOffer as OfferIcon,
  PersonOutline as RepIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { SalesOrder, SalesOrderStatus, SalesInvoice, SalesReturn, ActivityLog } from '../types';

const statusSteps: { status: SalesOrderStatus; label: string }[] = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'PENDING', label: 'Pending' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'INVOICED', label: 'Invoiced' },
  { status: 'PAID', label: 'Paid' },
];

const statusConfig: Record<SalesOrderStatus, { color: string; bg: string; label: string }> = {
  DRAFT: { color: '#9e9e9e', bg: '#f5f5f5', label: 'Draft' },
  PENDING: { color: '#ff9800', bg: '#fff3e0', label: 'Pending' },
  CONFIRMED: { color: '#2196f3', bg: '#e3f2fd', label: 'Confirmed' },
  SHIPPED: { color: '#9c27b0', bg: '#f3e5f5', label: 'Shipped' },
  DELIVERED: { color: '#4caf50', bg: '#e8f5e9', label: 'Delivered' },
  INVOICED: { color: '#00bcd4', bg: '#e0f7fa', label: 'Invoiced' },
  PAID: { color: '#2e7d32', bg: '#c8e6c9', label: 'Paid' },
  CANCELLED: { color: '#f44336', bg: '#ffebee', label: 'Cancelled' },
};

const SalesOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [cancelReason, setCancelReason] = useState('');

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['salesOrderDetail', id],
    queryFn: async () => {
      const response = await api.get(`/sales/orders/${id}`);
      return response.data as SalesOrder;
    },
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ action, reason }: { action: string; reason?: string }) => {
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
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
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

  const getActiveStep = (status: SalesOrderStatus): number => {
    if (status === 'CANCELLED') return -1;
    const idx = statusSteps.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  };

  if (isLoading || !order) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const activeStep = getActiveStep(order.status);

  const actionButtons = [
    { label: 'Confirm', action: 'confirm', icon: <ConfirmIcon />, show: ['DRAFT', 'PENDING'].includes(order.status) },
    { label: 'Ship', action: 'ship', icon: <ShipIcon />, show: ['CONFIRMED'].includes(order.status) },
    { label: 'Deliver', action: 'deliver', icon: <DeliverIcon />, show: ['SHIPPED'].includes(order.status) },
    { label: 'Invoice', action: 'invoice', icon: <InvoiceIcon />, show: ['DELIVERED', 'CONFIRMED', 'SHIPPED'].includes(order.status) },
    { label: 'Cancel', action: 'cancel', icon: <CancelIcon />, show: !['CANCELLED', 'PAID'].includes(order.status), danger: true },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/sales/orders')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Sales Order {order.orderNumber}
            </Typography>
            <Chip
              label={statusConfig[order.status]?.label || order.status}
              size="small"
              sx={{
                mt: 0.5,
                backgroundColor: statusConfig[order.status]?.bg,
                color: statusConfig[order.status]?.color,
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actionButtons.filter((btn) => btn.show).map((btn) => (
            <Button
              key={btn.action}
              variant={btn.danger ? 'outlined' : 'contained'}
              color={btn.danger ? 'error' : 'primary'}
              startIcon={btn.icon}
              onClick={() => {
                if (btn.danger) {
                  setConfirmDialog({ open: true, action: btn.action });
                } else {
                  statusMutation.mutate({ action: btn.action });
                }
              }}
            >
              {btn.label}
            </Button>
          ))}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/sales/orders/${id}/edit`)}>
            Edit
          </Button>
        </Box>
      </Box>

      {order.status !== 'CANCELLED' && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {statusSteps.map((step) => (
              <Step key={step.status}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
        <Tab icon={<TimelineIcon />} label="Overview" iconPosition="start" />
        <Tab icon={<InventoryIcon />} label={`Items (${order.items?.length || 0})`} iconPosition="start" />
        <Tab icon={<InvoiceIcon />} label={`Invoices (${order.invoices?.length || 0})`} iconPosition="start" />
        <Tab icon={<ReturnIcon />} label={`Returns (${order.returns?.length || 0})`} iconPosition="start" />
        <Tab icon={<NoteIcon />} label="Activity" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Order Information</Typography>
                <InfoRow icon={<OfferIcon />} label="Order Number" value={order.orderNumber} />
                <InfoRow icon={<DateIcon />} label="Order Date" value={format(parseISO(order.orderDate), 'dd/MM/yyyy')} />
                <InfoRow icon={<DateIcon />} label="Due Date" value={format(parseISO(order.dueDate), 'dd/MM/yyyy')} />
                <InfoRow icon={<BranchIcon />} label="Branch" value={order.branchName} />
                <InfoRow icon={<RepIcon />} label="Sales Rep" value={order.salesRepName} />
                {order.notes && <InfoRow icon={<NoteIcon />} label="Notes" value={order.notes} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
                <InfoRow icon={<PersonIcon />} label="Customer" value={`${order.customerCode} - ${order.customerName}`} />
                <InfoRow icon={<PersonIcon />} label="Customer ID" value={order.customerId} />
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Financial Summary</Typography>
                <SummaryRow label="Subtotal" value={order.subtotal} />
                <SummaryRow label="Discount" value={order.discount} />
                <SummaryRow label="Tax" value={order.tax} />
                <SummaryRow label="Shipping" value={order.shipping} />
                <Divider sx={{ my: 1 }} />
                <SummaryRow label="Total" value={order.total} bold />
                <SummaryRow label="Paid" value={order.paid} />
                <SummaryRow label="Balance" value={order.balance} color={order.balance > 0 ? 'error' : 'success'} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>#</TableCell>
                  <TableCell sx={{ color: 'white' }}>Product</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Quantity</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Unit Price</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Discount</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Tax</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items?.map((item, idx) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{item.productName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.productCode}</Typography>
                    </TableCell>
                    <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell align="right">{item.discountPercent}%</TableCell>
                    <TableCell align="right">{item.taxPercent}%</TableCell>
                    <TableCell align="right" fontWeight="medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Linked Invoices</Typography>
          {order.invoices?.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No invoices linked to this order</Typography>
          )}
          {order.invoices?.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} onClick={() => navigate(`/sales/invoices/${invoice.id}`)} />
          ))}
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Sales Returns</Typography>
          {order.returns?.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No returns for this order</Typography>
          )}
          {order.returns?.map((ret) => (
            <Card key={ret.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/sales/returns/${ret.id}`)}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box>
                  <Typography fontWeight="medium">{ret.returnNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(ret.returnDate), 'dd/MM/yyyy')} | Reason: {ret.reason}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={ret.status} size="small" />
                  <Typography fontWeight="medium">{formatCurrency(ret.total)}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Paper>
      )}

      {activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Activity Log</Typography>
          {order.activities?.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No activity recorded</Typography>
          )}
          <List>
            {order.activities?.map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <TimelineIcon fontSize="small" />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={activity.action}
                  secondary={`${activity.description} — ${activity.userName} at ${format(parseISO(activity.createdAt), 'dd/MM/yyyy HH:mm')}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Hidden print content */}
      <Box sx={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="header">
            <div>
              <h1>SALES ORDER</h1>
              <p><strong>Order #:</strong> {order.orderNumber}</p>
              <p><strong>Date:</strong> {format(parseISO(order.orderDate), 'dd/MM/yyyy')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Status:</strong> {statusConfig[order.status]?.label}</p>
              <p><strong>Branch:</strong> {order.branchName}</p>
            </div>
          </div>
          <div>
            <h3>Customer</h3>
            <p><strong>{order.customerName}</strong> ({order.customerCode})</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.productName} ({item.productCode})</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <p>Subtotal: {formatCurrency(order.subtotal)}</p>
            <p>Discount: {formatCurrency(order.discount)}</p>
            <p>Tax: {formatCurrency(order.tax)}</p>
            <p>Shipping: {formatCurrency(order.shipping)}</p>
            <p className="total-row">TOTAL: {formatCurrency(order.total)}</p>
          </div>
        </div>
      </Box>

      <Dialog open={confirmDialog.open && confirmDialog.action === 'cancel'} onClose={() => setConfirmDialog({ open: false, action: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Are you sure you want to cancel this order? This action cannot be undone.</Typography>
          <TextField
            label="Cancellation Reason"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '' })}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => statusMutation.mutate({ action: 'cancel', reason: cancelReason })}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight="medium">{value}</Typography>
    </Box>
  </Box>
);

const SummaryRow: React.FC<{ label: string; value: number; bold?: boolean; color?: string }> = ({ label, value, bold, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
    <Typography variant={bold ? 'subtitle1' : 'body2'} fontWeight={bold ? 'bold' : 'normal'}>
      {label}
    </Typography>
    <Typography variant={bold ? 'subtitle1' : 'body2'} fontWeight={bold ? 'bold' : 'normal'} color={color}>
      {formatCurrency(value)}
    </Typography>
  </Box>
);

const InvoiceCard: React.FC<{ invoice: SalesInvoice; onClick: () => void }> = ({ invoice, onClick }) => {
  const statusColors: Record<string, string> = {
    DRAFT: '#9e9e9e', SENT: '#2196f3', PAID: '#4caf50', PARTIAL: '#ff9800', OVERDUE: '#f44336', CANCELLED: '#9e9e9e',
  };
  return (
    <Card sx={{ mb: 1, cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={onClick}>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box>
          <Typography fontWeight="medium">{invoice.invoiceNumber}</Typography>
          <Typography variant="caption" color="text.secondary">
            {format(parseISO(invoice.invoiceDate), 'dd/MM/yyyy')} | Due: {format(parseISO(invoice.dueDate), 'dd/MM/yyyy')}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Chip
            label={invoice.status}
            size="small"
            sx={{ backgroundColor: statusColors[invoice.status] + '20', color: statusColors[invoice.status], fontWeight: 600 }}
          />
          <Typography fontWeight="medium">{formatCurrency(invoice.total)}</Typography>
          <Typography variant="caption" color={invoice.balance > 0 ? 'error' : 'success'}>
            Balance: {formatCurrency(invoice.balance)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SalesOrderDetail;
