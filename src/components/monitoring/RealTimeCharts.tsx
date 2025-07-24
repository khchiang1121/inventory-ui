import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Timeline,
  Speed,
  Memory,
  Storage,
  NetworkCheck,
} from '@mui/icons-material';

import { useServerMonitoring, useRackMonitoring, useVMMonitoring, useClusterMonitoring } from '../../services/websocket';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  trend,
  status = 'info',
  icon,
  loading = false,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'success.main';
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      default: return 'primary.main';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp fontSize="small" color="success" />;
      case 'down': return <TrendingDown fontSize="small" color="error" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h4" component="div" color={getStatusColor()}>
                  {value}
                  {unit && <Typography component="span" variant="h6" color="text.secondary">{unit}</Typography>}
                </Typography>
                {getTrendIcon()}
              </Box>
            )}
          </Box>
          <Box color={getStatusColor()}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface RealTimeLineChartProps {
  title: string;
  data: any[];
  dataKey: string;
  color?: string;
  loading?: boolean;
  height?: number;
  yAxisLabel?: string;
}

const RealTimeLineChart: React.FC<RealTimeLineChartProps> = ({
  title,
  data,
  dataKey,
  color = '#8884d8',
  loading = false,
  height = 300,
  yAxisLabel,
}) => {
  return (
    <Card>
      <CardHeader 
        title={title}
        action={
          loading && <CircularProgress size={20} />
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: any) => [value, dataKey]}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface RealTimeAreaChartProps {
  title: string;
  data: any[];
  areas: { dataKey: string; color: string; name: string }[];
  loading?: boolean;
  height?: number;
  yAxisLabel?: string;
}

const RealTimeAreaChart: React.FC<RealTimeAreaChartProps> = ({
  title,
  data,
  areas,
  loading = false,
  height = 300,
  yAxisLabel,
}) => {
  return (
    <Card>
      <CardHeader 
        title={title}
        action={
          loading && <CircularProgress size={20} />
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Legend />
            {areas.map((area) => (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                stackId="1"
                stroke={area.color}
                fill={area.color}
                fillOpacity={0.6}
                name={area.name}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Server Monitoring Dashboard
export const ServerMonitoringDashboard: React.FC<{ serverId?: string }> = ({ serverId }) => {
  const { metrics, alerts, isConnected } = useServerMonitoring(serverId);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (metrics) {
      const newDataPoint = {
        timestamp: Date.now(),
        cpu: metrics.cpu_usage,
        memory: metrics.memory_usage,
        storage: metrics.storage_usage,
        network_in: metrics.network_in,
        network_out: metrics.network_out,
        temperature: metrics.temperature,
      };

      setHistoricalData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep last 50 data points (approximately 5 minutes of data at 6-second intervals)
        return updated.slice(-50);
      });
    }
  }, [metrics]);

  const connectionStatus = isConnected ? 'success' : 'error';
  const connectionText = isConnected ? 'Connected' : 'Disconnected';

  return (
    <Box>
      {/* Connection Status */}
      <Alert 
        severity={connectionStatus} 
        sx={{ mb: 2 }}
        action={
          <Chip 
            label={connectionText} 
            color={connectionStatus} 
            size="small" 
          />
        }
      >
        Real-time monitoring {connectionText.toLowerCase()}
      </Alert>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPU Usage"
            value={metrics?.cpu_usage || 0}
            unit="%"
            status={metrics?.cpu_usage > 80 ? 'error' : metrics?.cpu_usage > 60 ? 'warning' : 'success'}
            icon={<Speed />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={metrics?.memory_usage || 0}
            unit="%"
            status={metrics?.memory_usage > 85 ? 'error' : metrics?.memory_usage > 70 ? 'warning' : 'success'}
            icon={<Memory />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Storage Usage"
            value={metrics?.storage_usage || 0}
            unit="%"
            status={metrics?.storage_usage > 90 ? 'error' : metrics?.storage_usage > 75 ? 'warning' : 'success'}
            icon={<Storage />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Temperature"
            value={metrics?.temperature || 0}
            unit="°C"
            status={metrics?.temperature > 80 ? 'error' : metrics?.temperature > 70 ? 'warning' : 'success'}
            icon={<Warning />}
            loading={!metrics}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <RealTimeAreaChart
            title="Resource Usage"
            data={historicalData}
            areas={[
              { dataKey: 'cpu', color: '#8884d8', name: 'CPU %' },
              { dataKey: 'memory', color: '#82ca9d', name: 'Memory %' },
              { dataKey: 'storage', color: '#ffc658', name: 'Storage %' },
            ]}
            loading={!isConnected}
            yAxisLabel="Usage %"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <RealTimeLineChart
            title="Network Traffic"
            data={historicalData}
            dataKey="network_in"
            color="#ff7300"
            loading={!isConnected}
            yAxisLabel="MB/s"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <RealTimeLineChart
            title="Temperature"
            data={historicalData}
            dataKey="temperature"
            color="#d73027"
            loading={!isConnected}
            yAxisLabel="°C"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Recent Alerts */}
          <Card>
            <CardHeader title="Recent Alerts" />
            <CardContent>
              {alerts.length === 0 ? (
                <Typography color="text.secondary">No recent alerts</Typography>
              ) : (
                <Box>
                  {alerts.slice(0, 5).map((alert, index) => (
                    <Alert 
                      key={index} 
                      severity={alert.severity} 
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2">
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Rack Monitoring Dashboard
export const RackMonitoringDashboard: React.FC<{ rackId?: string }> = ({ rackId }) => {
  const { utilization, powerMetrics, isConnected } = useRackMonitoring(rackId);
  const [powerHistory, setPowerHistory] = useState<any[]>([]);

  useEffect(() => {
    if (powerMetrics) {
      const newDataPoint = {
        timestamp: Date.now(),
        power_usage: powerMetrics.current_power,
        power_capacity: powerMetrics.max_power,
        efficiency: (powerMetrics.current_power / powerMetrics.max_power) * 100,
      };

      setPowerHistory(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-50);
      });
    }
  }, [powerMetrics]);

  const utilizationData = useMemo(() => {
    if (!utilization) return [];
    
    return [
      { name: 'Used', value: utilization.used_units || 0, color: '#8884d8' },
      { name: 'Available', value: (utilization.total_units || 0) - (utilization.used_units || 0), color: '#82ca9d' },
    ];
  }, [utilization]);

  return (
    <Box>
      <Alert 
        severity={isConnected ? 'success' : 'error'} 
        sx={{ mb: 2 }}
      >
        Rack monitoring {isConnected ? 'connected' : 'disconnected'}
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Space Utilization"
            value={utilization?.utilization_percentage || 0}
            unit="%"
            status={utilization?.utilization_percentage > 90 ? 'error' : utilization?.utilization_percentage > 75 ? 'warning' : 'success'}
            icon={<Storage />}
            loading={!utilization}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Power Usage"
            value={powerMetrics?.current_power || 0}
            unit="W"
            status={powerMetrics?.current_power > powerMetrics?.max_power * 0.9 ? 'error' : powerMetrics?.current_power > powerMetrics?.max_power * 0.75 ? 'warning' : 'success'}
            icon={<Speed />}
            loading={!powerMetrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Used Units"
            value={utilization?.used_units || 0}
            unit={`/${utilization?.total_units || 0}U`}
            status="info"
            icon={<Timeline />}
            loading={!utilization}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Server Count"
            value={utilization?.server_count || 0}
            status="info"
            icon={<CheckCircle />}
            loading={!utilization}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Space Utilization" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}U`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <RealTimeLineChart
            title="Power Consumption"
            data={powerHistory}
            dataKey="power_usage"
            color="#ff7300"
            loading={!isConnected}
            yAxisLabel="Watts"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// VM Monitoring Dashboard
export const VMMonitoringDashboard: React.FC<{ vmId?: string }> = ({ vmId }) => {
  const { metrics, status, isConnected } = useVMMonitoring(vmId);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (metrics) {
      const newDataPoint = {
        timestamp: Date.now(),
        cpu: metrics.cpu_usage,
        memory: metrics.memory_usage,
        network_in: metrics.network_in,
        network_out: metrics.network_out,
        disk_read: metrics.disk_read,
        disk_write: metrics.disk_write,
      };

      setPerformanceData(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-50);
      });
    }
  }, [metrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'error';
      case 'paused': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Box>
      <Alert 
        severity={isConnected ? 'success' : 'error'} 
        sx={{ mb: 2 }}
      >
        VM monitoring {isConnected ? 'connected' : 'disconnected'}
        <Chip 
          label={status} 
          color={getStatusColor(status)} 
          size="small" 
          sx={{ ml: 2 }}
        />
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPU Usage"
            value={metrics?.cpu_usage || 0}
            unit="%"
            status={metrics?.cpu_usage > 80 ? 'error' : metrics?.cpu_usage > 60 ? 'warning' : 'success'}
            icon={<Speed />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={metrics?.memory_usage || 0}
            unit="%"
            status={metrics?.memory_usage > 85 ? 'error' : metrics?.memory_usage > 70 ? 'warning' : 'success'}
            icon={<Memory />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Network IN"
            value={metrics?.network_in || 0}
            unit="MB/s"
            status="info"
            icon={<NetworkCheck />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Network OUT"
            value={metrics?.network_out || 0}
            unit="MB/s"
            status="info"
            icon={<NetworkCheck />}
            loading={!metrics}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <RealTimeAreaChart
            title="CPU & Memory Usage"
            data={performanceData}
            areas={[
              { dataKey: 'cpu', color: '#8884d8', name: 'CPU %' },
              { dataKey: 'memory', color: '#82ca9d', name: 'Memory %' },
            ]}
            loading={!isConnected}
            yAxisLabel="Usage %"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <RealTimeAreaChart
            title="Network Traffic"
            data={performanceData}
            areas={[
              { dataKey: 'network_in', color: '#8884d8', name: 'IN (MB/s)' },
              { dataKey: 'network_out', color: '#82ca9d', name: 'OUT (MB/s)' },
            ]}
            loading={!isConnected}
            yAxisLabel="MB/s"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Kubernetes Cluster Monitoring Dashboard
export const ClusterMonitoringDashboard: React.FC<{ clusterId?: string }> = ({ clusterId }) => {
  const { metrics, nodes, pods, isConnected } = useClusterMonitoring(clusterId);
  const [clusterMetrics, setClusterMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (metrics) {
      const newDataPoint = {
        timestamp: Date.now(),
        cpu_usage: metrics.cpu_usage,
        memory_usage: metrics.memory_usage,
        pod_count: metrics.pod_count,
        node_count: metrics.node_count,
        service_count: metrics.service_count,
      };

      setClusterMetrics(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-50);
      });
    }
  }, [metrics]);

  const nodeStatusData = useMemo(() => {
    if (!nodes.length) return [];
    
    const statusCount = nodes.reduce((acc, node) => {
      acc[node.status] = (acc[node.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'Ready' ? '#82ca9d' : status === 'NotReady' ? '#d73027' : '#ffc658'
    }));
  }, [nodes]);

  return (
    <Box>
      <Alert 
        severity={isConnected ? 'success' : 'error'} 
        sx={{ mb: 2 }}
      >
        Cluster monitoring {isConnected ? 'connected' : 'disconnected'}
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPU Usage"
            value={metrics?.cpu_usage || 0}
            unit="%"
            status={metrics?.cpu_usage > 80 ? 'error' : metrics?.cpu_usage > 60 ? 'warning' : 'success'}
            icon={<Speed />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={metrics?.memory_usage || 0}
            unit="%"
            status={metrics?.memory_usage > 85 ? 'error' : metrics?.memory_usage > 70 ? 'warning' : 'success'}
            icon={<Memory />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Pods"
            value={metrics?.pod_count || 0}
            status="info"
            icon={<CheckCircle />}
            loading={!metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ready Nodes"
            value={nodes.filter(n => n.status === 'Ready').length || 0}
            unit={`/${nodes.length || 0}`}
            status={nodes.filter(n => n.status === 'Ready').length === nodes.length ? 'success' : 'warning'}
            icon={<NetworkCheck />}
            loading={!nodes.length}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <RealTimeAreaChart
            title="Cluster Resource Usage"
            data={clusterMetrics}
            areas={[
              { dataKey: 'cpu_usage', color: '#8884d8', name: 'CPU %' },
              { dataKey: 'memory_usage', color: '#82ca9d', name: 'Memory %' },
            ]}
            loading={!isConnected}
            yAxisLabel="Usage %"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Node Status" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={nodeStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {nodeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 