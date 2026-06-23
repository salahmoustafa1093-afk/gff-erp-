import React, { useState } from 'react';
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
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  ArrowBack as BackIcon,
  CheckCircle as ConfirmIcon,
  Inventory as ReceiveIcon,
  Cancel as CancelIcon,
  Timeline as TimelineIcon,
  Receipt as InvoiceIcon,
  Person as SupplierIcon,
  Store as BranchIcon,
  CalendarToday as DateIcon,
  Note as NotesIcon,
  LocalShipping as ShipIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { PurchaseOrder, PurchaseOrderStatus, GRN, PurchaseInvoice, ActivityLog } from '../types';

const statusConfig: Record<PurchaseOrderStatus, { color: string; bg: string; label: string }> = {
  DRAFT: { color: '#9e9e9e', bg: '#f5f5f5', label: 'Draft' },
  PENDING: { color: '#ff9800', bg: '#fff3e0', label: 'Pending' },
  CONFIRMED: { color: '#2196f3', bg: '#e3f2fd', label: 'Confirmed' },
  PARTIAL: { color: '#9c27b0', bg: '#f3e5f5', label: 'Partial' },
  RECEIVED: { color: '#4caf50', bg: '#e8f5e9', label: 'Received' },
  CANCELLED: { color: '#f44336', bg: '#ffebee', label: 'Cancelled' },
};

const PurchaseOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [grnDialog, setGrnDialog] = useState(false);
  const [receiveNotes, setReceiveNotes] = useState('');

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['purchaseOrderDetail', id],
    queryFn: async () => {
      const response = await api.get(`/purchases/orders/${id}`);
      return response.data as PurchaseOrder;
    },
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
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
    if (!order) return;
    statusMutation.mutate({ action: 'receive', notes: receiveNotes });
  };

  if (isLoading || !order) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const totalOrdered = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalReceived = order.items?.reduce((sum, item) => sum + item.receivedQty, 0) || 0;
  const receiptProgress = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

  const actionButtons = [
    { label: 'Confirm', action: 'confirm', icon: <ConfirmIcon />, show: ['DRAFT', 'PENDING'].includes(order.status) },
    { label: 'Receive', action: 'receive', icon: <ReceiveIcon />, show: ['CONFIRMED', 'PARTIAL'].includes(order.status), dialog: true },
    { label: 'Cancel', action: 'cancel', icon: <CancelIcon />, show: order.status !== 'CANCELLED' && order.status !== 'RECEIVED', danger: true },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/purchases/orders')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Purchase Order {order.orderNumber}
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
                if (btn.dialog) {
                  setGrnDialog(true);
                } else if (btn.danger) {
                  setConfirmDialog({ open: true, action: btn.action });
                } else {
                  statusMutation.mutate({ action: btn.action });
                }
              }}
            >
              {btn.label}
            </Button>
          ))}
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/purchases/orders/${id}/edit`)}>
            Edit
          </Button>
        </Box>
      </Box>

      {['CONFIRMED', 'PARTIAL'].includes(order.status) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">Receipt Progress</Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {totalReceived.toLocaleString()} / {totalOrdered.toLocaleString()} ({receiptProgress.toFixed(0)}%)
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={receiptProgress} sx={{ height: 8, borderRadius: 4 }} />
        </Paper>
      )}

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
        <Tab icon={<TimelineIcon />} label="Overview" iconPosition="start" />
        <Tab icon={<ReceiveIcon />} label="Items" iconPosition="start" />
        <Tab icon={<InvoiceIcon />} label={`GRNs (${order.grns?.length || 0})`} iconPosition="start" />
        <Tab icon={<InvoiceIcon />} label={`Invoices (${order.invoices?.length || 0})`} iconPosition="start" />
        <Tab icon={<NotesIcon />} label="Activity" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Order Information</Typography>
                <InfoRow icon={<SupplierIcon />} label="Order Number" value={order.orderNumber} />
                <InfoRow icon={<DateIcon />} label="Order Date" value={format(parseISO(order.orderDate), 'dd/MM/yyyy')} />
                <InfoRow icon={<DateIcon />} label="Expected Date" value={order.expectedDate ? format(parseISO(order.expectedDate), 'dd/MM/yyyy') : '-'} />
                <InfoRow icon={<BranchIcon />} label="Branch" value={order.branchName} />
                {order.notes && <InfoRow icon={<NotesIcon />} label="Notes" value={order.notes} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Supplier Information</Typography>
                <InfoRow icon={<SupplierIcon />} label="Supplier" value={`${order.supplierCode} - ${order.supplierName}`} />
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
                  <TableCell sx={{ color: 'white' }} align="right">Ordered</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Received</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Unit Price</TableCell>
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
                    <TableCell align="right">
                      <Typography color={item.receivedQty >= item.quantity ? 'success.main' : 'warning.main'} fontWeight="medium">
                        {item.receivedQty.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Goods Receipt Notes (GRN)</Typography>
          {order.grns?.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No GRNs recorded</Typography>
          )}
          {order.grns?.map((grn) => (
            <Card key={grn.id} sx={{ mb: 1 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box>
                  <Typography fontWeight="medium">{grn.grnNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(grn.grnDate), 'dd/MM/yyyy')} | {grn.items?.length} items
                  </Typography>
                </Box>
                <Chip
                  label={grn.status}
                  size="small"
                  color={grn.status === 'POSTED' ? 'success' : 'default'}
                />
              </CardContent>
            </Card>
          ))}
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Linked Invoices</Typography>
          {order.invoices?.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No invoices linked</Typography>
          )}
          {order.invoices?.map((invoice) => (
            <Card key={invoice.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/purchases/invoices/${invoice.id}`)}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box>
                  <Typography fontWeight="medium">{invoice.invoiceNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(invoice.invoiceDate), 'dd/MM/yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography fontWeight="medium">{formatCurrency(invoice.total)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balance: {formatCurrency(invoice.balance)}
                  </Typography>
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

      <Dialog open={grnDialog} onClose={() => setGrnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Receive Items</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Receive all remaining items for this order? You can edit individual quantities after.
          </Typography>
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrnDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReceive} disabled={statusMutation.isPending}>
            {statusMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open && confirmDialog.action === 'cancel'} onClose={() => setConfirmDialog({ open: false, action: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Purchase Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel this purchase order? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '' })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => statusMutation.mutate({ action: 'cancel' })}>
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
    <Typography variant={bold ? 'subtitle1' : 'body2'} fontWeight={bold ? 'bold' : 'normal'}>{label}</Typography>
    <Typography variant={bold ? 'subtitle1' : 'body2'} fontWeight={bold ? 'bold' : 'normal'} color={color}>
      {formatCurrency(value)}
    </Typography>
  </Box>
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default PurchaseOrderDetail;
