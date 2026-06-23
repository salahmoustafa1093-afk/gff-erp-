import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  addButtonLabel?: string;
  exportButtonLabel?: string;
  hideAddButton?: boolean;
  hideExportButton?: boolean;
  hidePrintButton?: boolean;
  hideRefreshButton?: boolean;
  additionalActions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  onBack,
  onAdd,
  onExport,
  onPrint,
  onRefresh,
  addButtonLabel = 'Add New',
  exportButtonLabel = 'Export',
  hideAddButton = false,
  hideExportButton = false,
  hidePrintButton = false,
  hideRefreshButton = false,
  additionalActions,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} separator="›" aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Link>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast || !crumb.path ? (
              <Typography key={index} color="text.primary" fontWeight={500}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                sx={{ cursor: 'pointer' }}
                onClick={() => crumb.path && navigate(crumb.path)}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* Left side - Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {onBack && (
            <Tooltip title="Go back">
              <IconButton onClick={onBack} size="small" sx={{ mr: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600} gutterBottom={false}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right side - Actions */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {!hideRefreshButton && onRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} size="small" color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}

          {!hidePrintButton && onPrint && (
            <Tooltip title="Print">
              <IconButton onClick={onPrint} size="small" color="primary">
                <PrintIcon />
              </IconButton>
            </Tooltip>
          )}

          {!hideExportButton && onExport && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={onExport}
              size="small"
            >
              {exportButtonLabel}
            </Button>
          )}

          {!hideAddButton && onAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAdd}
              size="small"
            >
              {addButtonLabel}
            </Button>
          )}

          {additionalActions}
        </Stack>
      </Box>
    </Box>
  );
}
