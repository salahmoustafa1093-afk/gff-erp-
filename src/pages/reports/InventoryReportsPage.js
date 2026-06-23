import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, Chip, } from '@mui/material';
import { DataGrid, } from '@mui/x-data-grid';
import { Download, Assessment } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
const reportTypes = ['Valuation', 'Aging', 'Stock Levels', 'Movement Summary'];
const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#795548'];
const InventoryReportsPage = () => {
    const [tab, setTab] = useState(0);
    const [warehouseId, setWarehouseId] = useState('');
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });
    const columns = [
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
            renderCell: (params) => formatCurrency(params.row.unitCost),
        },
        {
            field: 'totalValue',
            headerName: 'Total Value',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => formatCurrency(params.row.totalValue),
        },
        {
            field: 'daysInStock',
            headerName: 'Days in Stock',
            width: 110,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (_jsx(Chip, { label: params.row.daysInStock, size: "small", color: params.row.daysInStock > 90 ? 'warning' : 'success' })),
        },
    ];
    const pieData = [
        { name: 'Raw Materials', value: 350000 },
        { name: 'Finished Goods', value: 520000 },
        { name: 'Packaging', value: 85000 },
        { name: 'Spare Parts', value: 120000 },
    ];
    const totalValue = pieData.reduce((s, d) => s + d.value, 0);
    return (_jsxs(Box, { p: 3, children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", mb: 3, children: [_jsx(Assessment, { sx: { mr: 1, verticalAlign: 'middle' } }), "Inventory Reports"] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 180 }, children: [_jsx(InputLabel, { children: "Warehouse" }), _jsxs(Select, { value: warehouseId, label: "Warehouse", onChange: (e) => setWarehouseId(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All Warehouses" }), _jsx(MenuItem, { value: "main", children: "Main Warehouse" }), _jsx(MenuItem, { value: "cold", children: "Cold Storage" }), _jsx(MenuItem, { value: "feed", children: "Feed Storage" })] })] }), _jsx(Box, { flex: 1 }), _jsx(Button, { size: "small", startIcon: _jsx(Download, {}), variant: "outlined", children: "Export" })] }) }) }), _jsxs(Box, { display: "flex", gap: 2, mb: 3, children: [_jsx(Card, { sx: { minWidth: 160 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Total Value" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", color: "primary.main", children: formatCurrency(totalValue) })] }) }), _jsx(Card, { sx: { minWidth: 160 }, children: _jsxs(CardContent, { sx: { py: 1, '&:last-child': { pb: 1 } }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "SKUs" }), _jsx(Typography, { variant: "h6", fontWeight: "bold", children: "1,245" })] }) })] }), _jsx(Tabs, { value: tab, onChange: (_, v) => setTab(v), sx: { mb: 2 }, children: reportTypes.map((t) => (_jsx(Tab, { label: t }, t))) }), tab === 0 && (_jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Inventory Valuation by Category" }), _jsx(Box, { height: 300, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", outerRadius: 100, dataKey: "value", label: (entry) => `${entry.name}: ${((entry.value / totalValue) * 100).toFixed(1)}%`, children: pieData.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value) }), _jsx(Legend, {})] }) }) })] }) })), _jsx(Card, { children: _jsx(CardContent, { children: _jsx(DataGrid, { rows: [], columns: columns, paginationModel: paginationModel, onPaginationModelChange: setPaginationModel, pageSizeOptions: [10, 25, 50, 100], loading: false, disableRowSelectionOnClick: true, density: "compact", autoHeight: true, getRowId: (_, index) => index }) }) })] }));
};
export default InventoryReportsPage;
