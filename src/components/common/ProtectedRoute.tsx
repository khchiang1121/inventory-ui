import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  resourceType?: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  resourceType,
  fallbackPath = ROUTES.LOGIN,
}) => {
  const { state, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being checked
  if (state.isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check specific permission if required
  if (requiredPermission && !hasPermission(requiredPermission, resourceType)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        p={4}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="textSecondary" textAlign="center">
          You don't have sufficient permissions to access this resource.
        </Typography>
      </Box>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;