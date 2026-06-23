import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Download, Assessment } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';
import type { InventoryReportRow } from '../../types';

const reportTypes = ['Valuation', 'Aging', 'Stock Levels', 'Movement Summary'];
const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#795548'];

const InventoryReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [warehouseId, setWarehouseId] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const columns: GridColDef<InventoryReportRow>[] = [
    { field: 'productCode', headerName: 'Product Code', width: 120 },
    { field: 'productName', headerName: 'Product Name', width: 200, flex: 1 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 130 },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'unitCost',
      headerName: 'Unit Cost',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<InventoryReportRow>) =>
        formatCurrency(params.row.unitCost),
    },
    {
      field: 'totalValue',
      headerName: 'Total Value',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<InventoryReportRow>) =>
        formatCurrency(params.row.totalValue),
    },
    {
      field: 'daysInStock',
      headerName: 'Days in Stock',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<InventoryReportRow>) => (
        <Chip
          label={params.row.daysInStock}
          size="small"
          color={params.row.daysInStock > 90 ? 'warning' : 'success'}
        />
      ),
    },
  ];

  const pieData = [
    { name: 'Raw Materials', value: 350000 },
    { name: 'Finished Goods', value: 520000 },
    { name: 'Packaging', value: 85000 },
    { name: 'Spare Parts', value: 120000 },
  ];

  const totalValue = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Inventory Reports
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Warehouse</InputLabel>
              <Select value={warehouseId} label="Warehouse" onChange={(e) => setWarehouseId(e.target.value)}>
                <MenuItem value="">All Warehouses</MenuItem>
                <MenuItem value="main">Main Warehouse</MenuItem>
                <MenuItem value="cold">Cold Storage</MenuItem>
                <MenuItem value="feed">Feed Storage</MenuItem>
              </Select>
            </FormControl>
            <Box flex={1} />
            <Button size="small" startIcon={<Download />} variant="outlined">
              Export
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ minWidth: 160 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">Total Value</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              {formatCurrency(totalValue)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">SKUs</Typography>
            <Typography variant="h6" fontWeight="bold">1,245</Typography>
          </CardContent>
        </Card>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {reportTypes.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>

      {tab === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Inventory Valuation by Category</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${((entry.value / totalValue) * 100).toFixed(1)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <DataGrid
            rows={[]}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            loading={false}
            disableRowSelectionOnClick
            density="compact"
            autoHeight
            getRowId={(_, index) => index}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryReportsPage;
