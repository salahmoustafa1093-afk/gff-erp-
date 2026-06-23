import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import InboxIcon from '@mui/icons-material/Inbox';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export type EmptyStateVariant = 'default' | 'search' | 'folder' | 'error';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: OverridableComponent<SvgIconTypeMap>;
  variant?: EmptyStateVariant;
  actionLabel?: string;
  action?: () => void;
  secondaryActionLabel?: string;
  secondaryAction?: () => void;
  minHeight?: string | number;
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: typeof InboxIcon; color: string }
> = {
  default: { icon: InboxIcon, color: '#9E9E9E' },
  search: { icon: SearchIcon, color: '#0288D1' },
  folder: { icon: FolderOpenIcon, color: '#F9A825' },
  error: { icon: ErrorOutlineIcon, color: '#D32F2F' },
};

export default function EmptyState({
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  icon,
  variant = 'default',
  actionLabel,
  action,
  secondaryActionLabel,
  secondaryAction,
  minHeight = '300px',
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight,
          py: 6,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: `${config.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <IconComponent
            sx={{
              fontSize: 40,
              color: config.color,
              opacity: 0.8,
            }}
          />
        </Box>

        <Typography
          variant="h6"
          fontWeight={600}
          color="text.primary"
          gutterBottom
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, mb: 3 }}
        >
          {description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {action && actionLabel && (
            <Button
              variant="contained"
              size="small"
              onClick={action}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryAction && secondaryActionLabel && (
            <Button
              variant="outlined"
              size="small"
              onClick={secondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Fade>
  );
}