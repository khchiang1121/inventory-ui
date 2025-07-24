import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Pause, 
  Block, 
  HourglassEmpty,
  Build,
  PowerOff,
  CloudOff,
  Schedule
} from '@mui/icons-material';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'error' 
  | 'warning' 
  | 'maintenance' 
  | 'retired' 
  | 'failed' 
  | 'planning' 
  | 'construction' 
  | 'operational' 
  | 'decommissioned'
  | 'established'
  | 'idle'
  | 'connect'
  | 'up'
  | 'down'
  | 'unknown'
  | 'on'
  | 'off'
  | 'full'
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'sent'
  | 'acknowledged'
  | 'delivered'
  | 'invoiced'
  | 'completed';

interface StatusConfig {
  label: string;
  color: ChipProps['color'];
  icon?: React.ComponentType;
  variant?: ChipProps['variant'];
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  // General statuses
  active: {
    label: 'Active',
    color: 'success',
    icon: CheckCircle,
  },
  inactive: {
    label: 'Inactive',
    color: 'default',
    icon: Pause,
  },
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: HourglassEmpty,
  },
  error: {
    label: 'Error',
    color: 'error',
    icon: Error,
  },
  warning: {
    label: 'Warning',
    color: 'warning',
    icon: Warning,
  },
  maintenance: {
    label: 'Maintenance',
    color: 'warning',
    icon: Build,
  },
  retired: {
    label: 'Retired',
    color: 'default',
    icon: Block,
    variant: 'outlined',
  },
  failed: {
    label: 'Failed',
    color: 'error',
    icon: Error,
  },
  
  // Infrastructure specific
  planning: {
    label: 'Planning',
    color: 'info',
    icon: Schedule,
  },
  construction: {
    label: 'Construction',
    color: 'warning',
    icon: Build,
  },
  operational: {
    label: 'Operational',
    color: 'success',
    icon: CheckCircle,
  },
  decommissioned: {
    label: 'Decommissioned',
    color: 'default',
    icon: CloudOff,
    variant: 'outlined',
  },
  full: {
    label: 'Full',
    color: 'error',
    icon: Block,
  },
  
  // Network specific
  established: {
    label: 'Established',
    color: 'success',
    icon: CheckCircle,
  },
  idle: {
    label: 'Idle',
    color: 'default',
    icon: Pause,
  },
  connect: {
    label: 'Connecting',
    color: 'info',
    icon: HourglassEmpty,
  },
  up: {
    label: 'Up',
    color: 'success',
    icon: CheckCircle,
  },
  down: {
    label: 'Down',
    color: 'error',
    icon: Error,
  },
  unknown: {
    label: 'Unknown',
    color: 'default',
    icon: Warning,
    variant: 'outlined',
  },
  
  // Power specific
  on: {
    label: 'On',
    color: 'success',
    icon: CheckCircle,
  },
  off: {
    label: 'Off',
    color: 'default',
    icon: PowerOff,
  },
  
  // Purchase/Order specific
  draft: {
    label: 'Draft',
    color: 'default',
    icon: Schedule,
    variant: 'outlined',
  },
  submitted: {
    label: 'Submitted',
    color: 'info',
    icon: HourglassEmpty,
  },
  approved: {
    label: 'Approved',
    color: 'success',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
    icon: Block,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'default',
    icon: Block,
    variant: 'outlined',
  },
  sent: {
    label: 'Sent',
    color: 'info',
    icon: CheckCircle,
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'success',
    icon: CheckCircle,
  },
  delivered: {
    label: 'Delivered',
    color: 'success',
    icon: CheckCircle,
  },
  invoiced: {
    label: 'Invoiced',
    color: 'warning',
    icon: Schedule,
  },
  completed: {
    label: 'Completed',
    color: 'success',
    icon: CheckCircle,
  },
};

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  variant?: ChipProps['variant'];
  onClick?: () => void;
  sx?: ChipProps['sx'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'small',
  showIcon = true,
  variant,
  onClick,
  sx,
}) => {
  const config = statusConfigs[status];
  
  if (!config) {
    console.warn(`Unknown status: ${status}`);
    return (
      <Chip
        label={status}
        size={size}
        color="default"
        variant="outlined"
        onClick={onClick}
        sx={sx}
      />
    );
  }

  const IconComponent = config.icon;

  return (
    <Chip
      label={config.label}
      size={size}
      color={config.color}
      variant={variant || config.variant || 'filled'}
      icon={showIcon && IconComponent ? <IconComponent /> : undefined}
      onClick={onClick}
      clickable={!!onClick}
      sx={sx}
    />
  );
};

export default StatusBadge; 