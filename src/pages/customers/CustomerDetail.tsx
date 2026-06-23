import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Receipt as StatementIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as AddressIcon,
  Business as TypeIcon,
  CreditCard as CreditIcon,
  CalendarToday as DateIcon,
  PersonOutline as RepIcon,
  Store as BranchIcon,
  ShoppingCart as OrderIcon,
  ReceiptLong as InvoiceIcon,
  AssignmentReturn as ReturnIcon,
  Payments as PaymentIcon,
  Timeline as ActivityIcon,
  Note as NotesIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { Customer, SalesOrder, SalesInvoice, SalesReturn, Payment, ActivityLog } from '../types';

const typeLabels: Record<string, string> = {
  INDIVIDUAL: 'Individual', COMPANY: 'Company', DEALER: 'Dealer', DISTRIBUTOR: 'Distributor',
};

const typeColors: Record<string, string> = {
  INDIVIDUAL: '#2196f3', COMPANY: '#4caf50', DEALER: '#ff9800', DISTRIBUTOR: '#9c27b0',
};

const CustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customerDetail', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data as Customer;
    },
    enabled: Boolean(id),
  });

  const { data: salesData } = useQuery({
    queryKey: ['customerSales', id],
    queryFn: async () => {
      const response = await api.get(`/sales/orders?customerId=${id}&pageSize=10`);
      return response.data.data as SalesOrder[];
    },
    enabled: Boolean(id),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['customerInvoices', id],
    queryFn: async () => {
      const response = await api.get(`/sales/invoices?customerId=${id}&pageSize=10`);
      return response.data.data as SalesInvoice[];
    },
    enabled: Boolean(id),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['customerPayments', id],
    queryFn: async () => {
      const response = await api.get(`/sales/payments?customerId=${id}&pageSize=10`);
      return response.data.data as Payment[];
    },
    enabled: Boolean(id),
  });

  const { data: returnsData } = useQuery({
    queryKey: ['customerReturns', id],
    queryFn: async () => {
      const response = await api.get(`/sales/returns?customerId=${id}&pageSize=10`);
      return response.data.data as SalesReturn[];
    },
    enabled: Boolean(id),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['customerActivities', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}/activities`);
      return response.data as ActivityLog[];
    },
    enabled: Boolean(id),
  });

  if (isLoading || !customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const exceedsCredit = customer.balance >= customer.creditLimit && customer.creditLimit > 0;
  const nearCredit = !exceedsCredit && customer.balance > customer.creditLimit * 0.8 && customer.creditLimit > 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/customers')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {customer.name}
              </Typography>
              <Chip
                label={typeLabels[customer.type] || customer.type}
                size="small"
                sx={{
                  backgroundColor: (typeColors[customer.type] || '#9e9e9e') + '20',
                  color: typeColors[customer.type] || '#9e9e9e',
                  fontWeight: 600,
                }}
              />
              <Chip label={customer.isActive ? 'Active' : 'Inactive'} size="small" color={customer.isActive ? 'success' : 'default'} />
            </Box>
            {customer.nameAr && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ direction: 'rtl' }}>
                {customer.nameAr}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<StatementIcon />} onClick={() => navigate(`/customers/${id}/statement`)}>
            Statement
          </Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/customers/${id}/edit`)}>
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Balance</Typography>
              <Typography variant="h6" fontWeight="bold" color={exceedsCredit ? 'error' : nearCredit ? 'warning.main' : 'inherit'}>
                {formatCurrency(customer.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Credit Limit</Typography>
              <Typography variant="h6" fontWeight="bold">{formatCurrency(customer.creditLimit)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Available Credit</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(Math.max(0, customer.creditLimit - customer.balance))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Discount</Typography>
              <Typography variant="h6" fontWeight="bold">{customer.discountPercent}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {(exceedsCredit || nearCredit) && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: exceedsCredit ? '#ffebee' : '#fff8e1', borderLeft: `4px solid ${exceedsCredit ? '#f44336' : '#ff9800'}` }}>
          <Typography color={exceedsCredit ? 'error' : 'warning.main'} fontWeight="medium">
            {exceedsCredit
              ? `Credit limit exceeded! Balance (${formatCurrency(customer.balance)}) exceeds limit (${formatCurrency(customer.creditLimit)})`
              : `Approaching credit limit. Balance: ${formatCurrency(customer.balance)} / Limit: ${formatCurrency(customer.creditLimit)}`}
          </Typography>
        </Paper>
      )}

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
        <Tab icon={<PersonIcon />} label="Info" iconPosition="start" />
        <Tab icon={<OrderIcon />} label={`Sales (${salesData?.length || 0})`} iconPosition="start" />
        <Tab icon={<InvoiceIcon />} label={`Invoices (${invoicesData?.length || 0})`} iconPosition="start" />
        <Tab icon={<PaymentIcon />} label={`Payments (${paymentsData?.length || 0})`} iconPosition="start" />
        <Tab icon={<ReturnIcon />} label={`Returns (${returnsData?.length || 0})`} iconPosition="start" />
        <Tab icon={<ActivityIcon />} label="Activity" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
              <InfoRow icon={<PersonIcon />} label="Code" value={customer.code} />
              <InfoRow icon={<PersonIcon />} label="Type" value={typeLabels[customer.type] || customer.type} />
              <InfoRow icon={<PhoneIcon />} label="Phone" value={customer.phone || '-'} />
              <InfoRow icon={<EmailIcon />} label="Email" value={customer.email || '-'} />
              <InfoRow icon={<AddressIcon />} label="Address" value={`${customer.address || ''}, ${customer.city || ''}`} />
              <InfoRow icon={<NotesIcon />} label="Notes" value={customer.notes || '-'} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Financial Details</Typography>
              <InfoRow icon={<CreditIcon />} label="Credit Limit" value={formatCurrency(customer.creditLimit)} />
              <InfoRow icon={<DateIcon />} label="Payment Terms" value={`${customer.paymentTerms} days`} />
              <InfoRow icon={<RepIcon />} label="Discount %" value={`${customer.discountPercent}%`} />
              <InfoRow icon={<RepIcon />} label="Sales Rep" value={customer.salesRepName || '-'} />
              <InfoRow icon={<BranchIcon />} label="Tax Number" value={customer.taxNumber || '-'} />
              <InfoRow icon={<DateIcon />} label="Customer Since" value={new Date(customer.createdAt).toLocaleDateString()} />
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <SimpleTable
          headers={['Order #', 'Date', 'Status', 'Total', 'Balance']}
          rows={(salesData || []).map((o) => [
            o.orderNumber, format(parseISO(o.orderDate), 'dd/MM/yyyy'), o.status,
            formatCurrency(o.total), formatCurrency(o.balance),
          ])}
          onRowClick={(idx) => navigate(`/sales/orders/${salesData?.[idx]?.id}`)}
        />
      )}

      {activeTab === 2 && (
        <SimpleTable
          headers={['Invoice #', 'Date', 'Due Date', 'Status', 'Total', 'Balance']}
          rows={(invoicesData || []).map((i) => [
            i.invoiceNumber, format(parseISO(i.invoiceDate), 'dd/MM/yyyy'),
            format(parseISO(i.dueDate), 'dd/MM/yyyy'), i.status,
            formatCurrency(i.total), formatCurrency(i.balance),
          ])}
          onRowClick={(idx) => navigate(`/sales/invoices/${invoicesData?.[idx]?.id}`)}
        />
      )}

      {activeTab === 3 && (
        <SimpleTable
          headers={['Date', 'Amount', 'Method', 'Reference']}
          rows={(paymentsData || []).map((p) => [
            format(parseISO(p.paymentDate), 'dd/MM/yyyy'),
            formatCurrency(p.amount), p.method, p.reference || '-',
          ])}
        />
      )}

      {activeTab === 4 && (
        <SimpleTable
          headers={['Return #', 'Date', 'Reason', 'Status', 'Total']}
          rows={(returnsData || []).map((r) => [
            r.returnNumber, format(parseISO(r.returnDate), 'dd/MM/yyyy'),
            r.reason, r.status, formatCurrency(r.total),
          ])}
        />
      )}

      {activeTab === 5 && (
        <Paper sx={{ p: 2 }}>
          <List>
            {(activitiesData || []).map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <ActivityIcon fontSize="small" />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={activity.action}
                  secondary={`${activity.description} — ${activity.userName} at ${format(parseISO(activity.createdAt), 'dd/MM/yyyy HH:mm')}`}
                />
              </ListItem>
            ))}
            {(!activitiesData || activitiesData.length === 0) && (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No activity recorded</Typography>
            )}
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
            {headers.map((h, i) => (
              <TableCell key={i} sx={{ color: 'white' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">No records found</Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, idx) => (
            <TableRow
              key={idx}
              hover
              sx={onRowClick ? { cursor: 'pointer' } : undefined}
              onClick={() => onRowClick?.(idx)}
            >
              {row.map((cell, ci) => (
                <TableCell key={ci} sx={ci === 0 ? { fontWeight: 'medium', color: 'primary.main' } : undefined}>
                  {cell}
                </TableCell>
              ))}
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

export default CustomerDetail;
