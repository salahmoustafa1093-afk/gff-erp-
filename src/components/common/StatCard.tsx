import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/material/styles';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: OverridableComponent<SvgIconTypeMap>;
  iconColor?: string;
  iconBgColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  loading?: boolean;
  onClick?: () => void;
  navigateTo?: string;
  sx?: SxProps<Theme>;
  testId?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  iconColor = '#2E7D32',
  iconBgColor = '#E8F5E9',
  trend,
  trendValue,
  trendLabel,
  loading = false,
  onClick,
  navigateTo,
  sx,
  testId,
}: StatCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (navigateTo) {
      navigate(navigateTo);
    }
  };

  const isClickable = Boolean(onClick || navigateTo);

  const trendConfig = {
    up: { icon: TrendingUpIcon, color: '#2E7D32', label: 'Increase' },
    down: { icon: TrendingDownIcon, color: '#D32F2F', label: 'Decrease' },
    neutral: { icon: TrendingFlatIcon, color: '#9E9E9E', label: 'No change' },
  };

  const TrendIcon = trend ? trendConfig[trend].icon : null;

  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          minHeight: 140,
          ...((sx as Record<string, unknown>) || {}),
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="circular" width={48} height={48} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tooltip title={isClickable ? `Click to view ${title} details` : ''} arrow>
      <Card
        variant="outlined"
        data-testid={testId}
        onClick={isClickable ? handleClick : undefined}
        sx={{
          height: '100%',
          minHeight: 140,
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'all 0.25s ease-in-out',
          '&:hover': isClickable
            ? {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.shadows[4],
              }
            : undefined,
          ...((sx as Record<string, unknown>) || {}),
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                noWrap
                gutterBottom
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                component="div"
                fontWeight={600}
                color="text.primary"
                sx={{
                  fontSize: '1.75rem',
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                {value}
              </Typography>

              {/* Trend Indicator */}
              {trend && TrendIcon && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendIcon
                    sx={{
                      fontSize: 16,
                      color: trendConfig[trend].color,
                    }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ color: trendConfig[trend].color }}
                  >
                    {trendValue}
                  </Typography>
                  {trendLabel && (
                    <Typography variant="caption" color="text.secondary">
                      {trendLabel}
                    </Typography>
                  )}
                </Box>
              )}

              {subtitle && !trend && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                backgroundColor: iconBgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ml: 1.5,
              }}
            >
              <IconComponent sx={{ fontSize: 24, color: iconColor }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
}