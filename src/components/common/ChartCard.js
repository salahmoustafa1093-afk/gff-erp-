import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
const dateRangeLabels = {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
    all: 'All',
};
export default function ChartCard({ title, subtitle, children, loading = false, dateRange = 'month', onDateRangeChange, onRefresh, onMoreOptions, height = 320, showDateRange = true, dateRangeOptions = ['week', 'month', 'quarter', 'year'], sx, }) {
    const [localRange, setLocalRange] = useState(dateRange);
    const handleRangeChange = (_, newRange) => {
        if (newRange) {
            setLocalRange(newRange);
            onDateRangeChange?.(newRange);
        }
    };
    const headerAction = (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [showDateRange && onDateRangeChange && (_jsx(ToggleButtonGroup, { value: localRange, exclusive: true, onChange: handleRangeChange, size: "small", "aria-label": "date range", children: dateRangeOptions.map((range) => (_jsx(ToggleButton, { value: range, "aria-label": dateRangeLabels[range], sx: {
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        px: 1.5,
                    }, children: dateRangeLabels[range] }, range))) })), onRefresh && (_jsx(Tooltip, { title: "Refresh", children: _jsx(IconButton, { size: "small", onClick: onRefresh, children: _jsx(RefreshIcon, { fontSize: "small" }) }) })), onMoreOptions && (_jsx(Tooltip, { title: "More options", children: _jsx(IconButton, { size: "small", onClick: onMoreOptions, children: _jsx(MoreVertIcon, { fontSize: "small" }) }) }))] }));
    return (_jsxs(Card, { variant: "outlined", sx: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            ...(sx || {}),
        }, children: [_jsx(CardHeader, { title: title, subheader: subtitle, action: headerAction, titleTypographyProps: {
                    variant: 'h6',
                    fontWeight: 600,
                    fontSize: '1rem',
                }, subheaderTypographyProps: {
                    variant: 'body2',
                    color: 'text.secondary',
                    fontSize: '0.8125rem',
                }, sx: {
                    pb: 1,
                    '& .MuiCardHeader-action': {
                        mt: 0,
                        alignSelf: 'center',
                    },
                } }), _jsx(CardContent, { sx: { flex: 1, pt: 0, pb: '16px !important', minHeight: height }, children: loading ? (_jsxs(Box, { sx: {
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 1,
                    }, children: [_jsx(Skeleton, { variant: "text", width: "40%", height: 30 }), _jsx(Skeleton, { variant: "rectangular", height: 200, sx: { borderRadius: 1 } }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 1 }, children: Array.from({ length: 6 }).map((_, i) => (_jsx(Skeleton, { variant: "text", width: 30, height: 20 }, i))) })] })) : (_jsx(Box, { sx: { width: '100%', height: '100%' }, children: children })) })] }));
}
