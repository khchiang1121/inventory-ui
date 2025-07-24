import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Warning, Error, Info, CheckCircle } from '@mui/icons-material';

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info' | 'success';
  loading?: boolean;
  destructive?: boolean;
  details?: string[];
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const typeConfig = {
  warning: {
    icon: Warning,
    color: '#ff9800' as const,
    severity: 'warning' as const,
  },
  error: {
    icon: Error,
    color: '#f44336' as const,
    severity: 'error' as const,
  },
  info: {
    icon: Info,
    color: '#2196f3' as const,
    severity: 'info' as const,
  },
  success: {
    icon: CheckCircle,
    color: '#4caf50' as const,
    severity: 'success' as const,
  },
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
  destructive = false,
  details = [],
  maxWidth = 'sm',
}) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <IconComponent 
            sx={{ 
              color: config.color,
              fontSize: 28,
            }} 
          />
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {message}
        </DialogContentText>
        
        {details.length > 0 && (
          <Alert severity={config.severity} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This action will affect:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {details.map((detail, index) => (
                <li key={index}>
                  <Typography variant="body2">{detail}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}
        
        {destructive && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          autoFocus
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal; 