import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon, ArrowBack as BackIcon, Warehouse as WarehouseIcon, Person as ManagerIcon,
  LocationOn as AddressIcon, Business as TypeIcon, Inventory as StockIcon, SwapHoriz as TransferIcon,
  TrendingUp as MovementIcon, Category as CategoryIcon, AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { Warehouse, InventoryItem, StockMovement } from '../types';

const warehouseTypes: Record<string, string> = { MAIN: 'Main', RETAIL: 'Retail', RETURN: 'Return', TEMPORARY: 'Temporary' };
const warehouseTypeColors: Record<string, string> = { MAIN: '#4caf50', RETAIL: '#2196f3', RETURN: '#ff9800', TEMPORARY: '#9e9e9e' };

const WarehouseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouseDetail', id],
    queryFn: async () => { const response = await api.get(`/warehouses/${id}`); return response.data as Warehouse; },
    enabled: Boolean(id),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['warehouseInventory', id],
    queryFn: async () => { const response = await api.get(`/inventory?warehouseId=${id}&pageSize=50`); return response.data.data as InventoryItem[]; },
    enabled: Boolean(id),
  });

  const { data: movementsData } = useQuery({
    queryKey: ['warehouseMovements', id],
    queryFn: async () => { const response = await api.get(`/inventory/movements?warehouseId=${id}&pageSize=10`); return response.data.data as StockMovement[]; },
    enabled: Boolean(id),
  });

  if (isLoading || !warehouse) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Typography>Loading...</Typography></Box>;

  const totalSKUs = inventoryData?.length || 0;
  const totalQty = inventoryData?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalValue = inventoryData?.reduce((s, i) => s + i.totalValue, 0) || 0;
  const lowStockItems = inventoryData?.filter((i) => i.quantity > 0 && i.minStock > 0 && i.quantity <= i.minStock).length || 0;
  const outOfStockItems = inventoryData?.filter((i) => i.quantity <= 0).length || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/warehouses')}><BackIcon /></IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">{warehouse.name}</Typography>
              <Chip label={warehouseTypes[warehouse.type] || warehouse.type} size="small"
                sx={{ backgroundColor: (warehouseTypeColors[warehouse.type] || '#9e9e9e') + '20', color: warehouseTypeColors[warehouse.type] || '#9e9e9e', fontWeight: 600 }} />
              <Chip label={warehouse.isActive ? 'Active' : 'Inactive'} size="small" color={warehouse.isActive ? 'success' : 'default'} />
            </Box>
            {warehouse.nameAr && <Typography variant="subtitle1" color="text.secondary" sx={{ direction: 'rtl' }}>{warehouse.nameAr}</Typography>}
          </Box>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/warehouses/${id}/edit`)}>Edit</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">SKUs</Typography>
            <Typography variant="h6" fontWeight="bold">{totalSKUs.toLocaleString()}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Total Qty</Typography>
            <Typography variant="h6" fontWeight="bold">{totalQty.toLocaleString()}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Total Value</Typography>
            <Typography variant="h6" fontWeight="bold">{formatCurrency(totalValue)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Alerts</Typography>
            <Typography variant="h6" fontWeight="bold" color={lowStockItems > 0 || outOfStockItems > 0 ? 'error' : 'success.main'}>
              {lowStockItems + outOfStockItems}
            </Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
        <Tab icon={<StockIcon />} label="Info" iconPosition="start" />
        <Tab icon={<StockIcon />} label={`Inventory (${totalSKUs})`} iconPosition="start" />
        <Tab icon={<MovementIcon />} label="Movements" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Warehouse Information</Typography>
              <InfoRow icon={<WarehouseIcon />} label="Code" value={warehouse.code} />
              <InfoRow icon={<TypeIcon />} label="Type" value={warehouseTypes[warehouse.type] || warehouse.type} />
              <InfoRow icon={<AddressIcon />} label="Address" value={warehouse.address || '-'} />
              <InfoRow icon={<ManagerIcon />} label="Manager" value={warehouse.managerName || '-'} />
              <InfoRow icon={<CategoryIcon />} label="Branch" value={warehouse.branchName || '-'} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Stock Summary</Typography>
              <InfoRow icon={<StockIcon />} label="Total SKUs" value={totalSKUs.toLocaleString()} />
              <InfoRow icon={<StockIcon />} label="Total Quantity" value={totalQty.toLocaleString()} />
              <InfoRow icon={<MoneyIcon />} label="Total Value" value={formatCurrency(totalValue)} />
              {lowStockItems > 0 && (
                <Box sx={{ mt: 1, p: 1, backgroundColor: '#fff8e1', borderRadius: 1 }}>
                  <Typography variant="body2" color="warning.main" fontWeight="medium">{lowStockItems} items below minimum stock level</Typography>
                </Box>
              )}
              {outOfStockItems > 0 && (
                <Box sx={{ mt: 1, p: 1, backgroundColor: '#ffebee', borderRadius: 1 }}>
                  <Typography variant="body2" color="error" fontWeight="medium">{outOfStockItems} items out of stock</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Inventory</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Product</TableCell>
                  <TableCell sx={{ color: 'white' }}>Category</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Qty</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Reserved</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Available</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Min Stock</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Status</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!inventoryData || inventoryData.length === 0) && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No inventory</Typography></TableCell></TableRow>
                )}
                {inventoryData?.map((item) => {
                  const isLow = item.quantity > 0 && item.minStock > 0 && item.quantity <= item.minStock;
                  const isOut = item.quantity <= 0;
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{item.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.productCode}</Typography>
                      </TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell align="right"><Typography fontWeight="bold" color={isOut ? 'error' : isLow ? 'warning.main' : 'inherit'}>{item.quantity}</Typography></TableCell>
                      <TableCell align="right">{item.reserved}</TableCell>
                      <TableCell align="right">{item.available}</TableCell>
                      <TableCell align="right">{item.minStock || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip label={isOut ? 'Out' : isLow ? 'Low' : 'OK'} size="small"
                          sx={{ backgroundColor: isOut ? '#f4433620' : isLow ? '#ff980020' : '#4caf5020', color: isOut ? '#f44336' : isLow ? '#ff9800' : '#4caf50', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.totalValue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Movements</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white' }}>Product</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Qty</TableCell>
                  <TableCell sx={{ color: 'white' }}>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!movementsData || movementsData.length === 0) && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No movements</Typography></TableCell></TableRow>
                )}
                {movementsData?.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{format(parseISO(m.createdAt), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell><Chip label={m.type} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell>{m.productName}</TableCell>
                    <TableCell align="right" fontWeight="bold" color={m.quantity > 0 ? 'success.main' : 'error'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</TableCell>
                    <TableCell>{m.referenceNumber || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value);
}

export default WarehouseDetail;
