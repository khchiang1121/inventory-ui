import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: number | 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit';
  thickness?: number;
  variant?: 'determinate' | 'indeterminate';
  value?: number;
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  thickness = 3.6,
  variant = 'indeterminate',
  value,
  message,
  fullScreen = false,
  overlay = false,
}) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 24;
      case 'large': return 56;
      default: return 40;
    }
  };

  const spinner = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress
        size={getSize()}
        color={color}
        thickness={thickness}
        variant={variant}
        value={value}
      />
      {message && (
        <Typography variant="body2" color="textSecondary" textAlign="center">
          {message}
        </Typography>
      )}
      {variant === 'determinate' && value !== undefined && (
        <Typography variant="caption" color="textSecondary">
          {Math.round(value)}%
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={9999}
      >
        {spinner}
      </Box>
    );
  }

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={1}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

interface LinearLoadingProps {
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit';
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  value?: number;
  valueBuffer?: number;
  message?: string;
  sx?: object;
}

export const LinearLoading: React.FC<LinearLoadingProps> = ({
  color = 'primary',
  variant = 'indeterminate',
  value,
  valueBuffer,
  message,
  sx,
}) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <LinearProgress
        color={color}
        variant={variant}
        value={value}
        valueBuffer={valueBuffer}
      />
      {message && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: number | string;
  height?: number | string;
  count?: number;
  animation?: 'pulse' | 'wave' | false;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse',
}) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ mb: variant === 'text' ? 1 : 0 }}
        />
      ))}
    </Box>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
}) => {
  return (
    <Card>
      <CardContent>
        {showHeader && (
          <Box mb={2}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`header-${colIndex}`}
                variant="text"
                width={`${Math.random() * 40 + 60}%`}
                height={24}
                sx={{ mb: 1, display: 'inline-block', mr: 2 }}
              />
            ))}
          </Box>
        )}
        
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box key={`row-${rowIndex}`} mb={1}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width={`${Math.random() * 50 + 30}%`}
                height={20}
                sx={{ display: 'inline-block', mr: 2 }}
              />
            ))}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

interface CardSkeletonProps {
  count?: number;
  showHeader?: boolean;
  showContent?: boolean;
  showActions?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  showHeader = true,
  showContent = true,
  showActions = true,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            {showHeader && (
              <Box mb={2}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
            )}
            
            {showContent && (
              <Box mb={2}>
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="90%" height={20} />
              </Box>
            )}
            
            {showActions && (
              <Box display="flex" gap={1}>
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default LoadingSpinner; 