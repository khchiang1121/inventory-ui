import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  useTheme,
  Chip,
  Grid,
} from '@mui/material';
import { Computer, Storage, NetworkCheck } from '@mui/icons-material';
import type { Baremetal } from '../../types';

interface RackVisualizationProps {
  rackName: string;
  heightUnits: number;
  servers: Baremetal[];
  powerCapacity?: number;
  powerUsage?: number;
  loading?: boolean;
  onServerClick?: (server: Baremetal) => void;
}

interface RackUnit {
  unit: number;
  server?: Baremetal;
  occupied: boolean;
}

export const RackVisualization: React.FC<RackVisualizationProps> = ({
  rackName,
  heightUnits,
  servers,
  powerCapacity = 0,
  powerUsage = 0,
  loading = false,
  onServerClick,
}) => {
  const theme = useTheme();

  // Create rack units array
  const rackUnits: RackUnit[] = Array.from({ length: heightUnits }, (_, index) => {
    const unitNumber = heightUnits - index; // Rack units are numbered from top to bottom
    const server = servers.find(s => parseInt(s.position?.toString() || '0') === unitNumber);
    
    return {
      unit: unitNumber,
      server,
      occupied: !!server,
    };
  });

  const getUnitColor = (unit: RackUnit) => {
    if (!unit.occupied) {
      return theme.palette.grey[200];
    }
    
    switch (unit.server?.status) {
      case 'active':
        return theme.palette.success.light;
      case 'inactive':
        return theme.palette.grey[400];
      case 'maintenance':
        return theme.palette.warning.light;
      case 'failed':
        return theme.palette.error.light;
      default:
        return theme.palette.info.light;
    }
  };

  const getServerIcon = (server?: Baremetal) => {
    if (!server) return null;
    
    // For bare metal servers, we'll use a default server icon
    // In the future, this could be based on server specifications or purpose
    return <Storage fontSize="small" />;
  };

  const powerUtilization = powerCapacity > 0 ? (powerUsage / powerCapacity) * 100 : 0;
  const usedUnits = servers.length;
  const spaceUtilization = (usedUnits / heightUnits) * 100;

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          {rackName}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="textSecondary">
                Space:
              </Typography>
              <Chip
                label={`${usedUnits}/${heightUnits}U`}
                size="small"
                color={spaceUtilization > 90 ? 'error' : spaceUtilization > 75 ? 'warning' : 'success'}
              />
            </Box>
          </Grid>
          <Grid item xs={6}>
            {powerCapacity > 0 && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="textSecondary">
                  Power:
                </Typography>
                <Chip
                  label={`${powerUsage.toFixed(1)}/${powerCapacity}kW`}
                  size="small"
                  color={powerUtilization > 90 ? 'error' : powerUtilization > 75 ? 'warning' : 'success'}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Rack Visualization */}
      <Box 
        sx={{ 
          border: `2px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 1,
          backgroundColor: theme.palette.grey[50],
          minHeight: 400,
          maxHeight: 600,
          overflow: 'auto',
        }}
      >
        {rackUnits.map((unit) => (
          <Tooltip
            key={unit.unit}
            title={
              unit.server ? (
                <Box>
                  <Typography variant="subtitle2">{unit.server.name}</Typography>
                  <Typography variant="caption" display="block">
                    Position: {unit.unit}U
                  </Typography>
                  <Typography variant="caption" display="block">
                    Status: {unit.server.status}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Model: {unit.server.model_name || 'Unknown'}
                  </Typography>
                </Box>
              ) : (
                `Unit ${unit.unit} - Available`
              )
            }
            placement="right"
          >
            <Box
              sx={{
                height: 24,
                mb: 0.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5,
                backgroundColor: getUnitColor(unit),
                display: 'flex',
                alignItems: 'center',
                px: 1,
                cursor: unit.server && onServerClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': {
                  ...(unit.server && onServerClick && {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(2px)',
                  }),
                },
              }}
              onClick={() => unit.server && onServerClick?.(unit.server)}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  minWidth: 20,
                  textAlign: 'center',
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                }}
              >
                {unit.unit}
              </Typography>
              
              {unit.server && (
                <Box 
                  display="flex" 
                  alignItems="center" 
                  sx={{ 
                    ml: 1,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {getServerIcon(unit.server)}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      ml: 0.5,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {unit.server.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Legend */}
      <Box mt={2}>
        <Typography variant="caption" color="textSecondary" gutterBottom display="block">
          Status Legend:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.success.light,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5,
              }} 
            />
            <Typography variant="caption">Active</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.grey[400],
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5,
              }} 
            />
            <Typography variant="caption">Inactive</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.warning.light,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5,
              }} 
            />
            <Typography variant="caption">Maintenance</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.error.light,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5,
              }} 
            />
            <Typography variant="caption">Failed</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.grey[200],
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.5,
              }} 
            />
            <Typography variant="caption">Available</Typography>
          </Box>
        </Box>
      </Box>

      {/* Utilization Summary */}
      <Box mt={2} p={2} sx={{ backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              Space Utilization
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {spaceUtilization.toFixed(1)}%
            </Typography>
          </Grid>
          {powerCapacity > 0 && (
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Power Utilization
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {powerUtilization.toFixed(1)}%
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default RackVisualization; 