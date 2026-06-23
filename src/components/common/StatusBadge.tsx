import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';

type StatusVariant =
  // Sales
  | 'DRAFT'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELLED'
  | 'PENDING'
  // Purchase
  | 'ORDERED'
  | 'RECEIVED'
  | 'PARTIAL'
  | 'RETURNED'
  // Inventory
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED'
  // General
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED'
  // Payment
  | 'OVERDUE'
  | 'PARTIAL_PAID'
  | 'REFUNDED'
  // Production
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'QUALITY_CHECK'
  // HR
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'ON_LEAVE'
  | 'TERMINATED'
  // Generic
  | 'YES'
  | 'NO'
  | string;

interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'label'> {
  status: StatusVariant;
  label?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const statusColorMap: Record<string, { color: ChipProps['color']; customColor?: string }> = {
  // Sales
  DRAFT: { color: 'default' },
  CONFIRMED: { color: 'info' },
  SHIPPED: { color: 'secondary' },
  DELIVERED: { color: 'success' },
  INVOICED: { color: 'warning' },
  PAID: { color: 'success' },
  CANCELLED: { color: 'error' },
  PENDING: { color: 'warning' },
  // Purchase
  ORDERED: { color: 'info' },
  RECEIVED: { color: 'success' },
  PARTIAL: { color: 'warning' },
  RETURNED: { color: 'error' },
  // Inventory
  IN_STOCK: { color: 'success' },
  LOW_STOCK: { color: 'warning' },
  OUT_OF_STOCK: { color: 'error' },
  DISCONTINUED: { color: 'default' },
  // General
  ACTIVE: { color: 'success' },
  INACTIVE: { color: 'default' },
  SUSPENDED: { color: 'warning' },
  ARCHIVED: { color: 'info' },
  // Payment
  OVERDUE: { color: 'error' },
  PARTIAL_PAID: { color: 'warning' },
  REFUNDED: { color: 'secondary' },
  // Production
  PLANNED: { color: 'info' },
  IN_PROGRESS: { color: 'warning' },
  COMPLETED: { color: 'success' },
  QUALITY_CHECK: { color: 'secondary' },
  // HR
  FULL_TIME: { color: 'success' },
  PART_TIME: { color: 'info' },
  CONTRACT: { color: 'warning' },
  ON_LEAVE: { color: 'secondary' },
  TERMINATED: { color: 'error' },
  // Generic
  YES: { color: 'success' },
  NO: { color: 'error' },
  true: { color: 'success' },
  false: { color: 'default' },
};

const statusLabelMap: Record<string, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  PARTIAL_PAID: 'Partially Paid',
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  ON_LEAVE: 'On Leave',
  IN_PROGRESS: 'In Progress',
  QUALITY_CHECK: 'Quality Check',
};

function formatLabel(status: string): string {
  if (statusLabelMap[status]) {
    return statusLabelMap[status];
  }
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function StatusBadge({
  status,
  label,
  size = 'small',
  variant = 'filled',
  ...chipProps
}: StatusBadgeProps) {
  const statusConfig = statusColorMap[status] || { color: 'default' };
  const displayLabel = label || formatLabel(status);

  return (
    <Chip
      label={displayLabel}
      color={statusConfig.color}
      size={size}
      variant={variant}
      {...chipProps}
      sx={{
        fontWeight: 500,
        textTransform: 'capitalize',
        ...chipProps.sx,
      }}
    />
  );
}

// Status colors for custom usage
export const statusColors: Record<string, string> = {
  DRAFT: '#9E9E9E',
  CONFIRMED: '#0288D1',
  SHIPPED: '#7B1FA2',
  DELIVERED: '#2E7D32',
  INVOICED: '#ED6C02',
  PAID: '#2E7D32',
  CANCELLED: '#D32F2F',
  PENDING: '#ED6C02',
  ACTIVE: '#2E7D32',
  INACTIVE: '#9E9E9E',
  IN_STOCK: '#2E7D32',
  LOW_STOCK: '#ED6C02',
  OUT_OF_STOCK: '#D32F2F',
  ERROR: '#D32F2F',
  SUCCESS: '#2E7D32',
  WARNING: '#ED6C02',
  INFO: '#0288D1',
};

export function getStatusColor(status: string): string {
  return statusColors[status] || '#9E9E9E';
}
