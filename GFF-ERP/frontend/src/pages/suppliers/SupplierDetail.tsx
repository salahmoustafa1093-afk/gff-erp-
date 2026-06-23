import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Rating, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
  List, ListItem, ListItemIcon, ListItemText, Avatar,
} from '@mui/material';
import {
  Edit as EditIcon, Receipt as StatementIcon, ArrowBack as BackIcon,
  Person as SupplierIcon, Phone as PhoneIcon, Email as EmailIcon, LocationOn as AddressIcon,
  Business as TypeIcon, CreditCard as CreditIcon, CalendarToday as DateIcon, Timer as LeadTimeIcon,
  ShoppingCart as OrderIcon, ReceiptLong as InvoiceIcon, AssignmentReturn as ReturnIcon, Timeline as ActivityIcon,
  Note as NotesIcon, Star as StarIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { Supplier, PurchaseOrder, PurchaseInvoice, PurchaseReturn, ActivityLog } from '../types';

const typeLabels: Record<string, string> = { LOCAL: 'Local', IMPORT: 'Import', MANUFACTURER: 'Manufacturer' };
const typeColors: Record<string, string> = { LOCAL: '#2196f3', IMPORT: '#ff9800', MANUFACTURER: '#4caf50' };

const SupplierDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplierDetail', id],
    queryFn: async () => { const response = await api.get(`/suppliers/${id}`); return response.data as Supplier; },
    enabled: Boolean(id),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['supplierOrders', id],
    queryFn: async () => { const response = await api.get(`/purchases/orders?supplierId=${id}&pageSize=10`); return response.data.data as PurchaseOrder[]; },
    enabled: Boolean(id),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['supplierInvoices', id],
    queryFn: async () => { const response = await api.get(`/purchases/invoices?supplierId=${id}&pageSize=10`); return response.data.data as PurchaseInvoice[]; },
    enabled: Boolean(id),
  });

  const { data: returnsData } = useQuery({
    queryKey: ['supplierReturns', id],
    queryFn: async () => { const response = await api.get(`/purchases/returns?supplierId=${id}&pageSize=10`); return response.data.data as PurchaseReturn[]; },
    enabled: Boolean(id),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['supplierActivities', id],
    queryFn: async () => { const response = await api.get(`/suppliers/${id}/activities`); return response.data as ActivityLog[]; },
    enabled: Boolean(id),
  });

  if (isLoading || !supplier) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Typography>Loading...</Typography></Box>;

  const exceedsCredit = supplier.balance >= supplier.creditLimit && supplier.creditLimit > 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/suppliers')}><BackIcon /></IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">{supplier.name}</Typography>
              <Chip label={typeLabels[supplier.type] || supplier.type} size="small"
                sx={{ backgroundColor: (typeColors[supplier.type] || '#9e9e9e') + '20', color: typeColors[supplier.type] || '#9e9e9e', fontWeight: 600 }} />
              <Chip label={supplier.isActive ? 'Active' : 'Inactive'} size="small" color={supplier.isActive ? 'success' : 'default'} />
            </Box>
            {supplier.nameAr && <Typography variant="subtitle1" color="text.secondary" sx={{ direction: 'rtl' }}>{supplier.nameAr}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<StatementIcon />} onClick={() => navigate(`/suppliers/${id}/statement`)}>Statement</Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/suppliers/${id}/edit`)}>Edit</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Balance</Typography>
            <Typography variant="h6" fontWeight="bold" color={exceedsCredit ? 'error' : 'inherit'}>{formatCurrency(supplier.balance)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Credit Limit</Typography>
            <Typography variant="h6" fontWeight="bold">{formatCurrency(supplier.creditLimit)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Rating</Typography>
            <Box><Rating value={supplier.rating} readOnly precision={0.5} /><Typography variant="caption">({supplier.rating}/5)</Typography></Box>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Lead Time</Typography>
            <Typography variant="h6" fontWeight="bold">{supplier.leadTime} days</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {exceedsCredit && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#ffebee', borderLeft: '4px solid #f44336' }}>
          <Typography color="error" fontWeight="medium">Credit limit exceeded! Balance ({formatCurrency(supplier.balance)}) exceeds limit ({formatCurrency(supplier.creditLimit)})</Typography>
        </Paper>
      )}

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
        <Tab icon={<SupplierIcon />} label="Info" iconPosition="start" />
        <Tab icon={<OrderIcon />} label={`POs (${ordersData?.length || 0})`} iconPosition="start" />
        <Tab icon={<InvoiceIcon />} label={`Invoices (${invoicesData?.length || 0})`} iconPosition="start" />
        <Tab icon={<ReturnIcon />} label={`Returns (${returnsData?.length || 0})`} iconPosition="start" />
        <Tab icon={<ActivityIcon />} label="Activity" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
              <InfoRow icon={<SupplierIcon />} label="Code" value={supplier.code} />
              <InfoRow icon={<TypeIcon />} label="Type" value={typeLabels[supplier.type] || supplier.type} />
              <InfoRow icon={<PhoneIcon />} label="Phone" value={supplier.phone || '-'} />
              <InfoRow icon={<EmailIcon />} label="Email" value={supplier.email || '-'} />
              <InfoRow icon={<AddressIcon />} label="Address" value={`${supplier.address || ''}, ${supplier.city || ''}`} />
              <InfoRow icon={<NotesIcon />} label="Notes" value={supplier.notes || '-'} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Supplier Details</Typography>
              <InfoRow icon={<CreditIcon />} label="Credit Limit" value={formatCurrency(supplier.creditLimit)} />
              <InfoRow icon={<DateIcon />} label="Payment Terms" value={`${supplier.paymentTerms} days`} />
              <InfoRow icon={<LeadTimeIcon />} label="Lead Time" value={`${supplier.leadTime} days`} />
              <InfoRow icon={<StarIcon />} label="Rating" value={`${supplier.rating} / 5`} />
              <InfoRow icon={<CreditIcon />} label="Tax Number" value={supplier.taxNumber || '-'} />
              <InfoRow icon={<DateIcon />} label="Supplier Since" value={new Date(supplier.createdAt).toLocaleDateString()} />
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <SimpleTable headers={['PO #', 'Date', 'Status', 'Total', 'Balance']}
          rows={(ordersData || []).map((o) => [o.orderNumber, format(parseISO(o.orderDate), 'dd/MM/yyyy'), o.status, formatCurrency(o.total), formatCurrency(o.balance)])}
          onRowClick={(idx) => navigate(`/purchases/orders/${ordersData?.[idx]?.id}`)} />
      )}

      {activeTab === 2 && (
        <SimpleTable headers={['Invoice #', 'Date', 'Due Date', 'Status', 'Total', 'Balance']}
          rows={(invoicesData || []).map((i) => [i.invoiceNumber, format(parseISO(i.invoiceDate), 'dd/MM/yyyy'), format(parseISO(i.dueDate), 'dd/MM/yyyy'), i.status, formatCurrency(i.total), formatCurrency(i.balance)])}
          onRowClick={(idx) => navigate(`/purchases/invoices/${invoicesData?.[idx]?.id}`)} />
      )}

      {activeTab === 3 && (
        <SimpleTable headers={['Return #', 'Date', 'Reason', 'Status', 'Total']}
          rows={(returnsData || []).map((r) => [r.returnNumber, format(parseISO(r.returnDate), 'dd/MM/yyyy'), r.reason, r.status, formatCurrency(r.total)])} />
      )}

      {activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Activity Log</Typography>
          {(!activitiesData || activitiesData.length === 0) && <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No activity recorded</Typography>}
          <List>
            {(activitiesData || []).map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon><Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><ActivityIcon fontSize="small" /></Avatar></ListItemIcon>
                <ListItemText primary={activity.action} secondary={`${activity.description} — ${activity.userName} at ${format(parseISO(activity.createdAt), 'dd/MM/yyyy HH:mm')}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
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

const SimpleTable: React.FC<{ headers: string[]; rows: string[][]; onRowClick?: (index: number) => void }> = ({ headers, rows, onRowClick }) => (
  <Paper sx={{ p: 2 }}>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.main' }}>
            {headers.map((h, i) => (<TableCell key={i} sx={{ color: 'white' }}>{h}</TableCell>))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && <TableRow><TableCell colSpan={headers.length} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No records found</Typography></TableCell></TableRow>}
          {rows.map((row, idx) => (
            <TableRow key={idx} hover sx={onRowClick ? { cursor: 'pointer' } : undefined} onClick={() => onRowClick?.(idx)}>
              {row.map((cell, ci) => (<TableCell key={ci} sx={ci === 0 ? { fontWeight: 'medium', color: 'primary.main' } : undefined}>{cell}</TableCell>))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default SupplierDetail;
