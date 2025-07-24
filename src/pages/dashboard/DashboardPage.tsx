import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Computer,
  Storage,
  Cloud,
  Group,
  TrendingUp,
  Warning,
  CheckCircle,
  Add,
  Refresh,
  MoreVert,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { CHART_COLORS, STATUS_COLORS } from '../../constants';
import { format } from 'date-fns';

// Mock data - in a real app, this would come from API calls
const mockDashboardStats = {
  total_servers: 156,
  active_servers: 142,
  total_vms: 324,
  running_vms: 301,
  total_clusters: 12,
  active_clusters: 11,
  total_tenants: 8,
  active_tenants: 7,
  total_storage_gb: 15360,
  used_storage_gb: 9216,
  total_memory_gb: 2048,
  used_memory_gb: 1536,
  total_cpu_cores: 512,
  used_cpu_cores: 384,
  pending_maintenance: 5,
  critical_alerts: 2,
};

const mockResourceUtilization = [
  { timestamp: '00:00', cpu: 45, memory: 62, storage: 68, network: 32 },
  { timestamp: '04:00', cpu: 38, memory: 58, storage: 69, network: 28 },
  { timestamp: '08:00', cpu: 72, memory: 78, storage: 70, network: 65 },
  { timestamp: '12:00', cpu: 85, memory: 82, storage: 71, network: 78 },
  { timestamp: '16:00', cpu: 92, memory: 88, storage: 72, network: 85 },
  { timestamp: '20:00', cpu: 68, memory: 75, storage: 73, network: 58 },
];

const mockTenantUsage = [
  { name: 'Production', value: 35, color: CHART_COLORS[0] },
  { name: 'Development', value: 25, color: CHART_COLORS[1] },
  { name: 'Testing', value: 20, color: CHART_COLORS[2] },
  { name: 'Staging', value: 15, color: CHART_COLORS[3] },
  { name: 'Others', value: 5, color: CHART_COLORS[4] },
];

const mockRecentActivity = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Created VM',
    resource: 'web-server-01',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    status: 'success',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Updated Cluster',
    resource: 'k8s-prod-cluster',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    status: 'success',
  },
  {
    id: 3,
    user: 'System',
    action: 'Maintenance Started',
    resource: 'rack-01',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    status: 'warning',
  },
  {
    id: 4,
    user: 'Mike Johnson',
    action: 'Deleted VM',
    resource: 'test-vm-03',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    status: 'error',
  },
  {
    id: 5,
    user: 'Alice Wilson',
    action: 'Added Server',
    resource: 'blade-server-15',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    status: 'success',
  },
];

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { getUserDisplayName } = useAuth();
  const [stats, setStats] = useState(mockDashboardStats);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle sx={{ color: STATUS_COLORS.success, fontSize: 16 }} />;
      case 'warning':
        return <Warning sx={{ color: STATUS_COLORS.warning, fontSize: 16 }} />;
      case 'error':
        return <Warning sx={{ color: STATUS_COLORS.error, fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, progress }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              {progress}% utilized
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {getUserDisplayName()}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's what's happening with your infrastructure today.
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Quick Actions
          </Button>
        </Box>
      </Box>

      {/* Stats Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Physical Servers"
            value={stats.active_servers}
            subtitle={`${stats.total_servers} total`}
            icon={<Storage />}
            color={theme.palette.primary.main}
            progress={Math.round((stats.active_servers / stats.total_servers) * 100)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Virtual Machines"
            value={stats.running_vms}
            subtitle={`${stats.total_vms} total`}
            icon={<Computer />}
            color={theme.palette.success.main}
            progress={Math.round((stats.running_vms / stats.total_vms) * 100)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="K8s Clusters"
            value={stats.active_clusters}
            subtitle={`${stats.total_clusters} total`}
            icon={<Cloud />}
            color={theme.palette.info.main}
            progress={Math.round((stats.active_clusters / stats.total_clusters) * 100)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tenants"
            value={stats.active_tenants}
            subtitle={`${stats.total_tenants} total`}
            icon={<Group />}
            color={theme.palette.warning.main}
            progress={Math.round((stats.active_tenants / stats.total_tenants) * 100)}
          />
        </Grid>
      </Grid>

      {/* Resource Utilization Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Resource Utilization (24h)</Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockResourceUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    name="Memory %"
                  />
                  <Line
                    type="monotone"
                    dataKey="storage"
                    stroke={CHART_COLORS[2]}
                    strokeWidth={2}
                    name="Storage %"
                  />
                  <Line
                    type="monotone"
                    dataKey="network"
                    stroke={CHART_COLORS[3]}
                    strokeWidth={2}
                    name="Network %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Usage by Tenant
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockTenantUsage}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value}%)`}
                  >
                    {mockTenantUsage.map((entry, index) => (
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

      {/* Recent Activity and Alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockRecentActivity.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.user}</TableCell>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {activity.resource}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={activity.timestamp.toLocaleString()}>
                            <Typography variant="body2" color="textSecondary">
                              {format(activity.timestamp, 'HH:mm')}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {getStatusIcon(activity.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Alerts
              </Typography>
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Warning sx={{ color: STATUS_COLORS.error, mr: 1 }} />
                    <Typography variant="body2">Critical Alerts</Typography>
                  </Box>
                  <Chip
                    label={stats.critical_alerts}
                    color="error"
                    size="small"
                  />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Warning sx={{ color: STATUS_COLORS.warning, mr: 1 }} />
                    <Typography variant="body2">Pending Maintenance</Typography>
                  </Box>
                  <Chip
                    label={stats.pending_maintenance}
                    color="warning"
                    size="small"
                  />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUp sx={{ color: STATUS_COLORS.success, mr: 1 }} />
                    <Typography variant="body2">System Health</Typography>
                  </Box>
                  <Chip
                    label="Good"
                    color="success"
                    size="small"
                  />
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => {}}
                >
                  View All Alerts
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;