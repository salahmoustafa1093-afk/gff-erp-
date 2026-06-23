import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon, ArrowBack as BackIcon, Inventory as StockIcon,
  TrendingUp as SalesIcon, ShoppingCart as PurchaseIcon, MoveDown as MovementIcon,
  Info as InfoIcon, Category as CategoryIcon, Straighten as UnitIcon, AttachMoney as PriceIcon,
  Scale as WeightIcon, Barcode as BarcodeIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../../app/api';
import { Product, StockMovement, InventoryItem } from '../types';

const productTypeLabels: Record<string, string> = { GOODS: 'Goods', SERVICE: 'Service', RAW_MATERIAL: 'Raw Material', FINISHED: 'Finished', FEED: 'Feed' };
const productTypeColors: Record<string, string> = { GOODS: '#2196f3', SERVICE: '#9e9e9e', RAW_MATERIAL: '#ff9800', FINISHED: '#4caf50', FEED: '#8bc34a' };

const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['productDetail', id],
    queryFn: async () => { const response = await api.get(`/products/${id}`); return response.data as Product; },
    enabled: Boolean(id),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['productInventory', id],
    queryFn: async () => { const response = await api.get(`/inventory?productId=${id}&pageSize=50`); return response.data.data as InventoryItem[]; },
    enabled: Boolean(id),
  });

  const { data: movementsData } = useQuery({
    queryKey: ['productMovements', id],
    queryFn: async () => { const response = await api.get(`/inventory/movements?productId=${id}&pageSize=10`); return response.data.data as StockMovement[]; },
    enabled: Boolean(id),
  });

  if (isLoading || !product) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Typography>Loading...</Typography></Box>;

  const totalQty = inventoryData?.reduce((s, i) => s + i.quantity, 0) || 0;
  const isLowStock = product.minStock > 0 && totalQty > 0 && totalQty <= product.minStock;
  const isOutOfStock = totalQty <= 0;
  const stockPercent = product.maxStock > 0 ? Math.min(100, (totalQty / product.maxStock) * 100) : (totalQty > 0 ? 50 : 0);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/products')}><BackIcon /></IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">{product.name}</Typography>
              <Chip label={productTypeLabels[product.type] || product.type} size="small"
                sx={{ backgroundColor: (productTypeColors[product.type] || '#9e9e9e') + '20', color: productTypeColors[product.type] || '#9e9e9e', fontWeight: 600 }} />
              <Chip label={product.isActive ? 'Active' : 'Inactive'} size="small" color={product.isActive ? 'success' : 'default'} />
            </Box>
            {product.nameAr && <Typography variant="subtitle1" color="text.secondary" sx={{ direction: 'rtl' }}>{product.nameAr}</Typography>}
          </Box>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/products/${id}/edit`)}>Edit</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Current Stock</Typography>
            <Typography variant="h6" fontWeight="bold" color={isOutOfStock ? 'error' : isLowStock ? 'warning.main' : 'success.main'}>
              {totalQty.toLocaleString()}
            </Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Cost Price</Typography>
            <Typography variant="h6" fontWeight="bold">{formatCurrency(product.costPrice)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Sale Price</Typography>
            <Typography variant="h6" fontWeight="bold">{formatCurrency(product.salePrice)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card><CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Margin</Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {product.salePrice > 0 ? ((1 - product.costPrice / product.salePrice) * 100).toFixed(1) : 0}%
            </Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {product.minStock > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">Stock Level vs Max ({product.minStock} min / {product.maxStock} max)</Typography>
            <Typography variant="subtitle2" fontWeight="bold">{totalQty} / {product.maxStock}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={stockPercent}
            sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50' } }} />
        </Paper>
      )}

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2 }}>
        <Tab icon={<InfoIcon />} label="Overview" iconPosition="start" />
        <Tab icon={<StockIcon />} label={`Stock (${inventoryData?.length || 0})`} iconPosition="start" />
        <Tab icon={<MovementIcon />} label="Movements" iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Product Information</Typography>
              <InfoRow icon={<BarcodeIcon />} label="Code" value={product.code} />
              <InfoRow icon={<BarcodeIcon />} label="Barcode" value={product.barcode || '-'} />
              <InfoRow icon={<CategoryIcon />} label="Category" value={product.categoryName || '-'} />
              <InfoRow icon={<CategoryIcon />} label="Brand" value={product.brandName || '-'} />
              <InfoRow icon={<UnitIcon />} label="Unit" value={product.unitName || '-'} />
              <InfoRow icon={<WeightIcon />} label="Weight" value={product.weight ? `${product.weight} kg` : '-'} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Pricing</Typography>
              <InfoRow icon={<PriceIcon />} label="Cost Price" value={formatCurrency(product.costPrice)} />
              <InfoRow icon={<PriceIcon />} label="Sale Price" value={formatCurrency(product.salePrice)} />
              <InfoRow icon={<PriceIcon />} label="Minimum Price" value={formatCurrency(product.minPrice)} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Inventory Settings</Typography>
              <InfoRow icon={<StockIcon />} label="Min Stock" value={product.minStock?.toString() || '0'} />
              <InfoRow icon={<StockIcon />} label="Max Stock" value={product.maxStock?.toString() || '0'} />
              <InfoRow icon={<StockIcon />} label="Reorder Point" value={product.reorderPoint?.toString() || '0'} />
              <InfoRow icon={<StockIcon />} label="Reorder Qty" value={product.reorderQty?.toString() || '0'} />
              {product.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Nutritional Info</Typography>
                  {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                    <InfoRow key={key} icon={<WeightIcon />} label={key} value={String(value)} />
                  ))}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Stock by Warehouse</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Warehouse</TableCell>
                  <TableCell sx={{ color: 'white' }}>Branch</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Quantity</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Reserved</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Available</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Unit Cost</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Total Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!inventoryData || inventoryData.length === 0) && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No stock records</Typography></TableCell></TableRow>
                )}
                {inventoryData?.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell fontWeight="medium">{item.warehouseName}</TableCell>
                    <TableCell>{item.branchName}</TableCell>
                    <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.reserved.toLocaleString()}</TableCell>
                    <TableCell align="right" fontWeight="medium">{item.available.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.totalValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Stock Movements</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white' }}>Qty</TableCell>
                  <TableCell sx={{ color: 'white' }}>Warehouse</TableCell>
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
                    <TableCell align="right" fontWeight="bold" color={m.quantity > 0 ? 'success.main' : 'error'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</TableCell>
                    <TableCell>{m.warehouseName}</TableCell>
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

export default ProductDetail;
