import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Warehouse as WarehouseIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";

interface EggStockItem {
  warehouseId: string;
  warehouseName: string;
  warehouseType: string;
  largeQty: number;
  mediumQty: number;
  smallQty: number;
  brokenQty: number;
  totalQty: number;
  lastUpdated: string;
  lowStockAlert: boolean;
  minStockLevel: number;
}

interface TransferRecord {
  id: string;
  date: string;
  fromWarehouse: string;
  toWarehouse: string;
  largeQty: number;
  mediumQty: number;
  smallQty: number;
  totalQty: number;
  transferredBy: string;
  status: string;
}

interface InventoryData {
  stock: EggStockItem[];
  transfers: TransferRecord[];
  grandTotal: {
    largeQty: number;
    mediumQty: number;
    smallQty: number;
    brokenQty: number;
    totalQty: number;
  };
}

const fetchInventory = async (): Promise<InventoryData> => {
  const response = await apiService.get<InventoryData>("/eggs/inventory");
  return response.data;
};

const EggInventoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery<InventoryData>({
    queryKey: ["egg-inventory"],
    queryFn: fetchInventory,
    refetchInterval: 120000,
  });

  const grandTotal = data?.grandTotal;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Egg Inventory</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" size="small" startIcon={<ArrowForwardIcon />} onClick={() => navigate("/eggs/transfer")}>Transfer</Button>
          <IconButton onClick={() => refetch()} disabled={isLoading}><RefreshIcon /></IconButton>
        </Box>
      </Box>

      {error && <Paper sx={{ p: 2, mb: 2 }}><Typography color="error">Failed to load inventory.</Typography></Paper>}

      {/* Grand Total Cards */}
      {grandTotal && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Total Eggs</Typography><Typography variant="h5" fontWeight="bold">{grandTotal.totalQty.toLocaleString()}</Typography></Paper></Grid>
          <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.success.light + "20" }}><Typography variant="caption" color="text.secondary">Large</Typography><Typography variant="h5" fontWeight="bold" color="success.main">{grandTotal.largeQty.toLocaleString()}</Typography></Paper></Grid>
          <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.info.light + "20" }}><Typography variant="caption" color="text.secondary">Medium</Typography><Typography variant="h5" fontWeight="bold" color="info.main">{grandTotal.mediumQty.toLocaleString()}</Typography></Paper></Grid>
          <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.warning.light + "20" }}><Typography variant="caption" color="text.secondary">Small</Typography><Typography variant="h5" fontWeight="bold" color="warning.main">{grandTotal.smallQty.toLocaleString()}</Typography></Paper></Grid>
          <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center", bgcolor: theme.palette.error.light + "20" }}><Typography variant="caption" color="text.secondary">Broken</Typography><Typography variant="h5" fontWeight="bold" color="error">{grandTotal.brokenQty.toLocaleString()}</Typography></Paper></Grid>
          <Grid item xs={6} sm={4} md={2}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Warehouses</Typography><Typography variant="h5" fontWeight="bold">{data?.stock.length || 0}</Typography></Paper></Grid>
        </Grid>
      )}

      {/* Warehouse Stock */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Stock by Warehouse</Typography>
          {isLoading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Large</TableCell>
                    <TableCell align="right">Medium</TableCell>
                    <TableCell align="right">Small</TableCell>
                    <TableCell align="right">Broken</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.stock || []).map((item: EggStockItem) => (
                    <TableRow key={item.warehouseId} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <WarehouseIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{item.warehouseName}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.warehouseType}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main", fontWeight: 600 }}>{item.largeQty.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: "info.main", fontWeight: 500 }}>{item.mediumQty.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: "warning.main", fontWeight: 500 }}>{item.smallQty.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>{item.brokenQty.toLocaleString()}</TableCell>
                      <TableCell align="right" fontWeight="bold">{item.totalQty.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        {item.lowStockAlert ? (
                          <Chip icon={<WarningIcon />} label="Low Stock" color="warning" size="small" />
                        ) : (
                          <Chip label="OK" color="success" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!data?.stock || data.stock.length === 0) && (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No inventory data.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Recent Transfers</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                  <TableCell>Date</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell align="right">Large</TableCell>
                  <TableCell align="right">Medium</TableCell>
                  <TableCell align="right">Small</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.transfers || []).map((tr: TransferRecord) => (
                  <TableRow key={tr.id} hover>
                    <TableCell>{new Date(tr.date).toLocaleDateString()}</TableCell>
                    <TableCell fontWeight={500}>{tr.fromWarehouse}</TableCell>
                    <TableCell fontWeight={500}>{tr.toWarehouse}</TableCell>
                    <TableCell align="right" sx={{ color: "success.main" }}>{tr.largeQty.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: "info.main" }}>{tr.mediumQty.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: "warning.main" }}>{tr.smallQty.toLocaleString()}</TableCell>
                    <TableCell align="right" fontWeight="bold">{tr.totalQty.toLocaleString()}</TableCell>
                    <TableCell align="center"><Chip label={tr.status} color={tr.status === "COMPLETED" ? "success" : "warning"} size="small" /></TableCell>
                    <TableCell>{tr.transferredBy}</TableCell>
                  </TableRow>
                ))}
                {(!data?.transfers || data.transfers.length === 0) && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No transfer history.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EggInventoryPage;
