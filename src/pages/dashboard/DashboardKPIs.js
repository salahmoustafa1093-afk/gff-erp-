import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import EggIcon from '@mui/icons-material/Egg';
import { formatCurrency, formatNumber } from '@/utils/formatters';
const iconMap = {
    PointOfSale: PointOfSaleIcon,
    ShoppingCart: ShoppingCartIcon,
    AccountBalanceWallet: AccountBalanceWalletIcon,
    AccountBalance: AccountBalanceIcon,
    Inventory: InventoryIcon,
    Receipt: ReceiptIcon,
    LocalShipping: LocalShippingIcon,
    People: PeopleIcon,
    PrecisionManufacturing: PrecisionManufacturingIcon,
    Egg: EggIcon,
};
const sectionConfig = {
    sales: { title: 'Sales Overview', color: '#2E7D32', bgColor: '#E8F5E9', borderColor: '#A5D6A7' },
    finance: { title: 'Financial Position', color: '#F9A825', bgColor: '#FFFDE7', borderColor: '#FFF176' },
    inventory: { title: 'Inventory Status', color: '#0288D1', bgColor: '#E3F2FD', borderColor: '#81D4FA' },
    operations: { title: 'Operations', color: '#ED6C02', bgColor: '#FFF3E0', borderColor: '#FFB74D' },
    hr: { title: 'Human Resources', color: '#7B1FA2', bgColor: '#F3E5F5', borderColor: '#CE93D8' },
    production: { title: 'Production', color: '#26A69A', bgColor: '#E0F2F1', borderColor: '#80CBC4' },
};
export default function DashboardKPIs({ kpis, isLoading = false }) {
    const navigate = useNavigate();
    const groupedKPIs = useMemo(() => {
        const groups = {};
        kpis.forEach((kpi) => {
            const section = kpi.link?.split('/')[1] || 'general';
            if (!groups[section])
                groups[section] = [];
            groups[section].push(kpi);
        });
        return groups;
    }, [kpis]);
    if (isLoading) {
        return (_jsx(Grid, { container: true, spacing: 2.5, children: Array.from({ length: 6 }).map((_, i) => (_jsx(Grid, { item: true, xs: 12, sm: 6, lg: 4, xl: 2, children: _jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Skeleton, { variant: "text", width: "60%" }), _jsx(Skeleton, { variant: "text", width: "40%", height: 40 }), _jsx(Skeleton, { variant: "text", width: "50%" })] }) }) }, i))) }));
    }
    if (kpis.length === 0) {
        return null;
    }
    return (_jsx(Box, { children: Object.entries(groupedKPIs).map(([section, items]) => {
            const config = sectionConfig[section] || {
                title: section.charAt(0).toUpperCase() + section.slice(1),
                color: '#9E9E9E',
                bgColor: '#F5F5F5',
                borderColor: '#E0E0E0',
            };
            return (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: {
                            mb: 1.5,
                            pl: 1,
                            borderLeft: `3px solid ${config.borderColor}`,
                        }, children: config.title }), _jsx(Grid, { container: true, spacing: 2, children: items.map((kpi, index) => {
                            const IconComponent = iconMap[kpi.icon] || InventoryIcon;
                            const trend = kpi.change !== undefined ? (kpi.change > 0 ? 'up' : kpi.change < 0 ? 'down' : 'neutral') : undefined;
                            return (_jsx(Grid, { item: true, xs: 12, sm: 6, lg: 4, xl: 3, children: _jsx(Card, { variant: "outlined", onClick: () => kpi.link && navigate(kpi.link), sx: {
                                        cursor: kpi.link ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease',
                                        borderLeft: `3px solid ${config.color}`,
                                        '&:hover': kpi.link
                                            ? {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 2,
                                            }
                                            : undefined,
                                    }, children: _jsx(CardContent, { sx: { p: 2, '&:last-child': { pb: 2 } }, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }, children: [_jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", fontWeight: 500, noWrap: true, children: kpi.label }), _jsx(Typography, { variant: "h5", fontWeight: 600, sx: { my: 0.5, fontSize: '1.5rem' }, children: kpi.format === 'currency'
                                                                ? formatCurrency(Number(kpi.value))
                                                                : formatNumber(Number(kpi.value)) }), trend && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 0.5 }, children: [trend === 'up' && _jsx(TrendingUpIcon, { fontSize: "small", sx: { color: '#2E7D32' } }), trend === 'down' && _jsx(TrendingDownIcon, { fontSize: "small", sx: { color: '#D32F2F' } }), trend === 'neutral' && _jsx(TrendingFlatIcon, { fontSize: "small", sx: { color: '#9E9E9E' } }), _jsx(Typography, { variant: "caption", fontWeight: 600, sx: {
                                                                        color: trend === 'up' ? '#2E7D32' : trend === 'down' ? '#D32F2F' : '#9E9E9E',
                                                                    }, children: kpi.change !== undefined && `${kpi.change >= 0 ? '+' : ''}${kpi.change}%` }), kpi.changeLabel && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: kpi.changeLabel }))] }))] }), _jsx(Box, { sx: {
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        backgroundColor: config.bgColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }, children: _jsx(IconComponent, { sx: { fontSize: 20, color: config.color } }) })] }) }) }) }, index));
                        }) })] }, section));
        }) }));
}
