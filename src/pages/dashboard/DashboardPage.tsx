import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { useAppSelector } from '@/app/hooks';
import { apiService } from '@/app/api';
import type { DashboardData, DashboardKPI, RecentOrder, RecentPurchase, LowStockItem, BranchPerformanceItem, ActivityItem } from '@/types';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const COLORS = ['#2E7D32', '#F9A825', '#0288D1', '#ED6C02', '#D32F2F', '#7B1FA2', '#5C6BC0', '#26A69A'];

const ACTIVITY_COLORS: Record<string, string> = {
  order: '#2E7D32',
  purchase: '#0288D1',
  inventory: '#F9A825',
  payment: '#7B1FA2',
  system: '#9E9E9E',
  alert: '#D32F2F',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentBranch = useAppSelector((state) => state.branch.currentBranch);

  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard', currentBranch?.id],
    queryFn: async () => {
      const params = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
      return apiService.get<DashboardData>(`/dashboard${params}`);
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const kpis = useMemo(() => data?.kpis || [], [data]);
  const salesChartData = useMemo(() => {
    if (!data?.salesChart) return [];
    return data.salesChart.labels.map((label, i) => ({
      name: label,
      sales: data.salesChart.datasets[0]?.data[i] || 0,
      ...(data.salesChart.datasets[1] ? { target: data.salesChart.datasets[1].data[i] } : {}),
    }));
  }, [data]);

  const branchPerformanceData = useMemo(() => {
    return data?.branchPerformance || [];
  }, [data]);

  const topProducts = useMemo(() => data?.topProducts || [], [data]);
  const topCustomers = useMemo(() => data?.topCustomers || [], [data]);
  const recentOrders = useMemo(() => data?.recentOrders || [], [data]);
  const recentPurchases = useMemo(() => data?.recentPurchases || [], [data]);
  const lowStockItems = useMemo(() => data?.lowStockAlerts || [], [data]);
  const activityFeed = useMemo(() => data?.activityFeed || [], [data]);

  const kpiCards: Array<{ kpi?: DashboardKPI; icon: typeof TrendingUpIcon; color: string; bgColor: string }> = [
    {
      kpi: kpis[0],
      icon: PointOfSaleIcon,
      color: '#2E7D32',
      bgColor: '#E8F5E9',
    },
    {
      kpi: kpis[1],
      icon: ShoppingCartIcon,
      color: '#F9A825',
      bgColor: '#FFFDE7',
    },
    {
      kpi: kpis[2],
      icon: AccountBalanceWalletIcon,
      color: '#0288D1',
      bgColor: '#E3F2FD',
    },
    {
      kpi: kpis[3],
      icon: AccountBalanceIcon,
      color: '#7B1FA2',
      bgColor: '#F3E5F5',
    },
    {
      kpi: kpis[4],
      icon: InventoryIcon,
      color: '#ED6C02',
      bgColor: '#FFF3E0',
    },
    {
      kpi: kpis[5],
      icon: TrendingUpIcon,
      color: '#26A69A',
      bgColor: '#E0F2F1',
    },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentBranch ? `${currentBranch.name} — ` : ''}
            {formatDate(new Date().toISOString(), 'full')}
          </Typography>
        </Box>
        <Tooltip title="Refresh dashboard">
          <IconButton onClick={() => refetch()} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} lg={4} xl={2} key={i}>
                <StyledCard variant="outlined">
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="50%" height={16} />
                  </CardContent>
                </StyledCard>
              </Grid>
            ))
          : kpiCards.map((item, index) => {
              const IconComponent = item.icon;
              const kpi = item.kpi;
              return (
                <Grid item xs={12} sm={6} lg={4} xl={2} key={index}>
                  <StyledCard
                    variant="outlined"
                    sx={{ cursor: kpi?.link ? 'pointer' : 'default' }}
                    onClick={() => kpi?.link && navigate(kpi.link)}
                  >
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500} noWrap>
                            {kpi?.label || 'Loading...'}
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight={600}
                            sx={{ mt: 0.5, fontSize: '1.5rem' }}
                          >
                            {kpi?.format === 'currency'
                              ? formatCurrency(Number(kpi?.value))
                              : formatNumber(Number(kpi?.value || 0))}
                          </Typography>
                          {kpi?.change !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Chip
                                label={`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`}
                                size="small"
                                color={kpi.changeType === 'increase' ? 'success' : kpi.changeType === 'decrease' ? 'error' : 'default'}
                                sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                              />
                              {kpi.changeLabel && (
                                <Typography variant="caption" color="text.secondary">
                                  {kpi.changeLabel}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            backgroundColor: item.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent sx={{ fontSize: 22, color: item.color }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              );
            })}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} lg={8}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Sales Trend"
              subheader="Monthly sales performance"
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/reports/sales')}>
                  Details
                </Button>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              ) : salesChartData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No sales data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, 'USD', 0)} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E0E0E0' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#2E7D32"
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                      name="Sales"
                    />
                    {salesChartData[0]?.target !== undefined && (
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="#F9A825"
                        strokeWidth={2}
                        fill="none"
                        strokeDasharray="5 5"
                        name="Target"
                      />
                    )}
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Branch Performance */}
        <Grid item xs={12} lg={4}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Branch Performance"
              subheader="Sales by branch"
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              ) : branchPerformanceData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No branch data</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={branchPerformanceData.map((b) => ({
                      name: b.branchName,
                      sales: b.salesTotal,
                      target: b.target,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, 'USD', 0)} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="sales" fill="#2E7D32" radius={[0, 4, 4, 0]} name="Sales" />
                    <Bar dataKey="target" fill="#F9A825" radius={[0, 4, 4, 0]} name="Target" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Tables Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Recent Sales Orders */}
        <Grid item xs={12} lg={6}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Recent Sales Orders"
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/sales/orders')}>
                  View All
                </Button>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent sx={{ pt: 0, pb: '16px !important' }}>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
              ) : recentOrders.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No recent orders</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentOrders.map((order: RecentOrder) => (
                        <TableRow
                          key={order.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/sales/orders/${order.id}`)}
                        >
                          <TableCell fontWeight={500}>{order.orderNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell align="right">{formatCurrency(order.totalAmount)}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Recent Purchase Orders */}
        <Grid item xs={12} lg={6}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Recent Purchase Orders"
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/purchases/orders')}>
                  View All
                </Button>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent sx={{ pt: 0, pb: '16px !important' }}>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
              ) : recentPurchases.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No recent purchases</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>PO #</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPurchases.map((po: RecentPurchase) => (
                        <TableRow
                          key={po.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/purchases/orders/${po.id}`)}
                        >
                          <TableCell fontWeight={500}>{po.poNumber}</TableCell>
                          <TableCell>{po.supplierName}</TableCell>
                          <TableCell align="right">{formatCurrency(po.totalAmount)}</TableCell>
                          <TableCell>
                            <StatusBadge status={po.status} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={2.5}>
        {/* Top Products */}
        <Grid item xs={12} lg={4}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Top Products"
              subheader="Best selling products this month"
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : topProducts.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No product data</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topProducts.slice(0, 5).map((p) => ({
                        name: p.name,
                        value: p.totalRevenue,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {topProducts.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Top Customers */}
        <Grid item xs={12} lg={4}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Top Customers"
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/customers')}>
                  All
                </Button>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1 }} />
                  ))}
                </>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Spent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCustomers.slice(0, 5).map((customer) => (
                        <TableRow
                          key={customer.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last: {formatDate(customer.lastOrderDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{customer.totalOrders}</TableCell>
                          <TableCell align="right">{formatCurrency(customer.totalSpent)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Low Stock Alerts */}
        <Grid item xs={12} lg={4}>
          <StyledCard variant="outlined">
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Low Stock Alerts
                  {lowStockItems.length > 0 && (
                    <Chip
                      label={lowStockItems.length}
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.6875rem' }}
                    />
                  )}
                </Box>
              }
              action={
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/inventory/stock')}>
                  View
                </Button>
              }
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1 }} />
                  ))}
                </>
              ) : lowStockItems.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="success.main" fontWeight={500}>
                    All stock levels are healthy
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Min</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItems.slice(0, 5).map((item: LowStockItem) => (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/inventory/products/${item.id}`)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <WarningIcon fontSize="small" color="error" />
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.productName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.sku}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error" fontWeight={600}>
                              {item.currentStock}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.reorderLevel}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Activity Feed */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <StyledCard variant="outlined">
            <CardHeader
              title="Recent Activity"
              titleTypographyProps={{ variant: 'h6', fontWeight: 600, fontSize: '1rem' }}
            />
            <CardContent>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
                  ))}
                </>
              ) : activityFeed.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No recent activity</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {activityFeed.slice(0, 10).map((activity: ActivityItem) => (
                        <TableRow key={activity.id} hover>
                          <TableCell width={48}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: ACTIVITY_COLORS[activity.type] || '#9E9E9E',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {activity.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" width={120}>
                            <Typography variant="caption" color="text.secondary">
                              {activity.userName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" width={100}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(activity.timestamp, 'relative')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}
