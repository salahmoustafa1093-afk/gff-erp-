import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  variant?: ConfirmDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  sx?: SxProps<Theme>;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  variant = 'warning',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  maxWidth = 'sm',
  sx,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = (_: unknown, reason: string) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      if (!isConfirming && !loading) {
        onCancel();
      }
      return;
    }
    onCancel();
  };

  const iconConfig = {
    danger: { icon: DeleteIcon, color: '#D32F2F', bgColor: '#FFEBEE' },
    warning: { icon: WarningIcon, color: '#ED6C02', bgColor: '#FFF3E0' },
    info: { icon: InfoIcon, color: '#0288D1', bgColor: '#E3F2FD' },
  };

  const config = iconConfig[variant];
  const IconComponent = config.icon;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          ...((sx as Record<string, unknown>) || {}),
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent sx={{ color: config.color }} />
        </Box>
        <Typography variant="h6" component="span" fontWeight={600}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          component="div"
          sx={{
            color: 'text.primary',
            mt: 1,
            typography: 'body1',
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={isConfirming || loading}
          variant="outlined"
          color="inherit"
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirming || loading}
          variant="contained"
          color={confirmColor}
          startIcon={
            (isConfirming || loading) ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isConfirming || loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import Typography from '@mui/material/Typography';
