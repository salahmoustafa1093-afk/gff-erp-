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
import type { SxProps, Theme } from '@mui/material/styles';

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onRefresh?: () => void;
  onMoreOptions?: () => void;
  height?: number | string;
  showDateRange?: boolean;
  dateRangeOptions?: DateRange[];
  sx?: SxProps<Theme>;
}

const dateRangeLabels: Record<DateRange, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  all: 'All',
};

export default function ChartCard({
  title,
  subtitle,
  children,
  loading = false,
  dateRange = 'month',
  onDateRangeChange,
  onRefresh,
  onMoreOptions,
  height = 320,
  showDateRange = true,
  dateRangeOptions = ['week', 'month', 'quarter', 'year'],
  sx,
}: ChartCardProps) {
  const [localRange, setLocalRange] = useState<DateRange>(dateRange);

  const handleRangeChange = (_: React.MouseEvent<HTMLElement>, newRange: DateRange | null) => {
    if (newRange) {
      setLocalRange(newRange);
      onDateRangeChange?.(newRange);
    }
  };

  const headerAction = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showDateRange && onDateRangeChange && (
        <ToggleButtonGroup
          value={localRange}
          exclusive
          onChange={handleRangeChange}
          size="small"
          aria-label="date range"
        >
          {dateRangeOptions.map((range) => (
            <ToggleButton
              key={range}
              value={range}
              aria-label={dateRangeLabels[range]}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
              }}
            >
              {dateRangeLabels[range]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {onMoreOptions && (
        <Tooltip title="More options">
          <IconButton size="small" onClick={onMoreOptions}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...((sx as Record<string, unknown>) || {}),
      }}
    >
      <CardHeader
        title={title}
        subheader={subtitle}
        action={headerAction}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 600,
          fontSize: '1rem',
        }}
        subheaderTypographyProps={{
          variant: 'body2',
          color: 'text.secondary',
          fontSize: '0.8125rem',
        }}
        sx={{
          pb: 1,
          '& .MuiCardHeader-action': {
            mt: 0,
            alignSelf: 'center',
          },
        }}
      />
      <CardContent sx={{ flex: 1, pt: 0, pb: '16px !important', minHeight: height }}>
        {loading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <Skeleton variant="text" width="40%" height={30} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="text" width={30} height={20} />
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%' }}>{children}</Box>
        )}
      </CardContent>
    </Card>
  );
}