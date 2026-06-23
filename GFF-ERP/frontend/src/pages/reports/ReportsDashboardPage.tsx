import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  Inventory,
  AccountBalance,
  Factory,
  Egg,
  People,
  LocalShipping,
  Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const reportCategories = [
  {
    title: 'Sales Reports',
    icon: <ShoppingCart />,
    color: '#4caf50',
    path: '/reports/sales',
    reports: ['Daily Sales', 'Monthly Summary', 'By Product', 'By Customer', 'By Sales Rep'],
  },
  {
    title: 'Purchase Reports',
    icon: <ShoppingCart />,
    color: '#ff9800',
    path: '/reports/purchases',
    reports: ['Purchase Orders', 'Supplier Analysis', 'Price Trends'],
  },
  {
    title: 'Inventory Reports',
    icon: <Inventory />,
    color: '#2196f3',
    path: '/reports/inventory',
    reports: ['Stock Valuation', 'Aging', 'Stock Levels', 'Movement Summary'],
  },
  {
    title: 'Financial Reports',
    icon: <AccountBalance />,
    color: '#9c27b0',
    path: '/reports/financial',
    reports: ['Trial Balance', 'Balance Sheet', 'Income Statement', 'Cash Flow'],
  },
  {
    title: 'Production Reports',
    icon: <Factory />,
    color: '#795548',
    path: '/reports/production',
    reports: ['Production Orders', 'Efficiency', 'Cost Analysis'],
  },
  {
    title: 'Poultry Reports',
    icon: <Egg />,
    color: '#607d8b',
    path: '/reports/poultry',
    reports: ['Flock Performance', 'Mortality', 'Feed Consumption'],
  },
  {
    title: 'HR Reports',
    icon: <People />,
    color: '#e91e63',
    path: '/reports/hr',
    reports: ['Attendance', 'Payroll', 'Leave Summary'],
  },
  {
    title: 'Logistics Reports',
    icon: <LocalShipping />,
    color: '#00bcd4',
    path: '/reports/logistics',
    reports: ['Delivery Performance', 'Fleet Utilization', 'Route Analysis'],
  },
];

const recentReports = [
  { name: 'Monthly Sales Report - June 2024', date: '2024-07-01', type: 'Sales' },
  { name: 'Q2 Balance Sheet', date: '2024-07-02', type: 'Financial' },
  { name: 'Inventory Valuation', date: '2024-07-03', type: 'Inventory' },
  { name: 'Cash Flow - June 2024', date: '2024-07-03', type: 'Financial' },
];

const ReportsDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Reports Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <Grid container spacing={2}>
            {reportCategories.map((cat) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.title}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={() => navigate(cat.path)}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Box
                        sx={{
                          backgroundColor: `${cat.color}15`,
                          borderRadius: 2,
                          p: 1,
                          display: 'flex',
                        }}
                      >
                        {React.cloneElement(cat.icon as React.ReactElement, {
                          sx: { color: cat.color },
                        })}
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {cat.title}
                      </Typography>
                    </Box>
                    <List dense disablePadding>
                      {cat.reports.map((report) => (
                        <ListItem key={report} disablePadding sx={{ py: 0.25 }}>
                          <ListItemText
                            primary={report}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              <List dense>
                {recentReports.map((report, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                    <ListItemButton onClick={() => {}}>
                      <ListItemText
                        primary={report.name}
                        secondary={report.date}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Chip
                        label={report.type}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Saved Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No saved reports yet. Generate and save custom report templates for quick access.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsDashboardPage;
