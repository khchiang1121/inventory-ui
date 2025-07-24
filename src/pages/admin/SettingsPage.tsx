import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { 
  Save, 
  Settings,
  Security,
  Email,
  Backup,
  Info,
  Refresh,
  Storage,
  Memory,
  Computer,
  NetworkCheck,
  Schedule,
  Send,
  Download,
  Upload,
  Delete,
  ExpandMore,
  Warning,
  CheckCircle,
  Error,
  Notifications,
  VpnKey,
  AccessTime,
  CloudSync,
  Timeline,
  Dashboard,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { systemSettings } from '../../services/api/admin';

interface SystemSettingsFormData {
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  max_login_attempts: number;
  session_timeout: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  email_settings: {
    enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    use_tls: boolean;
    from_email: string;
  };
  backup_settings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention_days: number;
    storage_path: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BACKUP_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [showDeleteBackupModal, setShowDeleteBackupModal] = useState(false);

  // Form management
  const { control, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<SystemSettingsFormData>();

  // Queries
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: systemSettings.get,
  });

  const { data: systemInfoData, isLoading: systemInfoLoading } = useQuery({
    queryKey: ['system-info'],
    queryFn: systemSettings.getSystemInfo,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: backupsData, isLoading: backupsLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: systemSettings.getBackups,
    enabled: currentTab === 2,
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: systemSettings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: systemSettings.testEmail,
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setShowTestEmailDialog(false);
      setTestEmailAddress('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send test email');
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: systemSettings.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success('Backup created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create backup');
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: systemSettings.restoreBackup,
    onSuccess: () => {
      toast.success('Backup restoration initiated');
      setShowBackupDialog(false);
      setSelectedBackup(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore backup');
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: systemSettings.deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success('Backup deleted successfully');
      setShowDeleteBackupModal(false);
      setSelectedBackup(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete backup');
    },
  });

  // Initialize form with current settings
  useEffect(() => {
    if (settingsData) {
      reset(settingsData);
    }
  }, [settingsData, reset]);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSaveSettings = (data: SystemSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleTestEmail = () => {
    if (testEmailAddress) {
      testEmailMutation.mutate(testEmailAddress);
    }
  };

  const handleCreateBackup = () => {
    createBackupMutation.mutate();
  };

  const handleRestoreBackup = () => {
    if (selectedBackup) {
      restoreBackupMutation.mutate(selectedBackup.id);
    }
  };

  const handleDeleteBackup = () => {
    if (selectedBackup) {
      deleteBackupMutation.mutate(selectedBackup.id);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const renderSystemInfoTab = () => {
    if (systemInfoLoading) {
      return <LoadingSpinner message="Loading system information..." />;
    }

    if (!systemInfoData) {
      return <Alert severity="error">Failed to load system information</Alert>;
    }

    const diskUsageData = [
      { name: 'Used', value: systemInfoData.disk_usage.used, color: '#FF8042' },
      { name: 'Free', value: systemInfoData.disk_usage.free, color: '#00C49F' },
    ];

    const memoryUsageData = [
      { name: 'Used', value: systemInfoData.memory_usage.used, color: '#8884D8' },
      { name: 'Free', value: systemInfoData.memory_usage.free, color: '#82CA9D' },
    ];

    return (
      <Grid container spacing={3}>
        {/* System Status Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Info sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{systemInfoData.version}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                System Version
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                {systemInfoData.database_status === 'connected' ? (
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                ) : (
                  <Error sx={{ mr: 1, color: 'error.main' }} />
                )}
                <Typography variant="h6" color={systemInfoData.database_status === 'connected' ? 'success.main' : 'error.main'}>
                  {systemInfoData.database_status}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Database Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                {systemInfoData.cache_status === 'connected' ? (
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                ) : (
                  <Error sx={{ mr: 1, color: 'error.main' }} />
                )}
                <Typography variant="h6" color={systemInfoData.cache_status === 'connected' ? 'success.main' : 'error.main'}>
                  {systemInfoData.cache_status}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Cache Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccessTime sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{formatUptime(systemInfoData.uptime)}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                System Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Usage Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Disk Usage
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={systemInfoData.disk_usage.percentage}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {systemInfoData.disk_usage.percentage.toFixed(1)}%
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">
                  Used: {formatBytes(systemInfoData.disk_usage.used)}
                </Typography>
                <Typography variant="caption">
                  Total: {formatBytes(systemInfoData.disk_usage.total)}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={diskUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatBytes(value)}`}
                  >
                    {diskUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatBytes(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={systemInfoData.memory_usage.percentage}
                    sx={{ height: 10, borderRadius: 5 }}
                    color="secondary"
                  />
                </Box>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {systemInfoData.memory_usage.percentage.toFixed(1)}%
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">
                  Used: {formatBytes(systemInfoData.memory_usage.used)}
                </Typography>
                <Typography variant="caption">
                  Total: {formatBytes(systemInfoData.memory_usage.total)}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={memoryUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatBytes(value)}`}
                  >
                    {memoryUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatBytes(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Last Backup Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Last Backup
              </Typography>
              <Typography variant="body1">
                {systemInfoData.last_backup 
                  ? new Date(systemInfoData.last_backup).toLocaleString()
                  : 'No backup found'
                }
              </Typography>
              {!systemInfoData.last_backup && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No recent backups found. Consider creating a backup to protect your data.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderBackupTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Backup Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Backup Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<Backup />}
                  onClick={handleCreateBackup}
                  disabled={createBackupMutation.isPending}
                >
                  {createBackupMutation.isPending ? 'Creating...' : 'Create Backup'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup History
              </Typography>
              {backupsLoading ? (
                <LoadingSpinner message="Loading backups..." />
              ) : backupsData?.backups?.length ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Backup ID</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backupsData.backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>{backup.id}</TableCell>
                          <TableCell>{new Date(backup.created_at).toLocaleString()}</TableCell>
                          <TableCell>{formatBytes(backup.size)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={backup.status}
                              color={
                                backup.status === 'completed' ? 'success' :
                                backup.status === 'failed' ? 'error' : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowBackupDialog(true);
                              }}
                              disabled={backup.status !== 'completed'}
                            >
                              <Upload />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowDeleteBackupModal(true);
                              }}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No backups found</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (settingsLoading) {
    return <LoadingSpinner fullScreen message="Loading settings..." />;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Configure system settings, security policies, and monitor system health.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['system-settings'] });
              queryClient.invalidateQueries({ queryKey: ['system-info'] });
              queryClient.invalidateQueries({ queryKey: ['backups'] });
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit(handleSaveSettings)}
            disabled={!isDirty || updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="General" 
            icon={<Settings />}
            iconPosition="start"
          />
          <Tab 
            label="Security" 
            icon={<Security />}
            iconPosition="start"
          />
          <Tab 
            label="Notifications" 
            icon={<Notifications />}
            iconPosition="start"
          />
          <Tab 
            label="Backup" 
            icon={<Backup />}
            iconPosition="start"
          />
          <Tab 
            label="System Info" 
            icon={<Dashboard />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Site Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="site_name"
                      control={control}
                      rules={{ required: 'Site name is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Site Name"
                          fullWidth
                          error={!!errors.site_name}
                          helperText={errors.site_name?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="site_description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Site Description"
                          fullWidth
                          multiline
                          rows={3}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="maintenance_mode"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Maintenance Mode"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="max_login_attempts"
                      control={control}
                      rules={{ min: 1, max: 10 }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Max Login Attempts"
                          type="number"
                          fullWidth
                          inputProps={{ min: 1, max: 10 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="session_timeout"
                      control={control}
                      rules={{ min: 300, max: 86400 }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Session Timeout (seconds)"
                          type="number"
                          fullWidth
                          inputProps={{ min: 300, max: 86400 }}
                          helperText="Minimum: 5 minutes, Maximum: 24 hours"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password Policy
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="password_policy.min_length"
                      control={control}
                      rules={{ min: 6, max: 20 }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Minimum Length"
                          type="number"
                          fullWidth
                          inputProps={{ min: 6, max: 20 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="password_policy.require_uppercase"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Require Uppercase"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="password_policy.require_lowercase"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Require Lowercase"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="password_policy.require_numbers"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Require Numbers"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="password_policy.require_symbols"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Require Symbols"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {currentTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Email Settings</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Send />}
                    onClick={() => setShowTestEmailDialog(true)}
                    disabled={!watch('email_settings.enabled')}
                  >
                    Test Email
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="email_settings.enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Enable Email Notifications"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="email_settings.smtp_host"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="SMTP Host"
                          fullWidth
                          disabled={!watch('email_settings.enabled')}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email_settings.smtp_port"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="SMTP Port"
                          type="number"
                          fullWidth
                          disabled={!watch('email_settings.enabled')}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email_settings.use_tls"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Use TLS"
                          disabled={!watch('email_settings.enabled')}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="email_settings.from_email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="From Email Address"
                          type="email"
                          fullWidth
                          disabled={!watch('email_settings.enabled')}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Backup Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="backup_settings.enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={field.onChange} />}
                          label="Enable Automatic Backups"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="backup_settings.frequency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth disabled={!watch('backup_settings.enabled')}>
                          <InputLabel>Backup Frequency</InputLabel>
                          <Select {...field} label="Backup Frequency">
                            {BACKUP_FREQUENCIES.map((freq) => (
                              <MenuItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="backup_settings.retention_days"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Retention Days"
                          type="number"
                          fullWidth
                          disabled={!watch('backup_settings.enabled')}
                          inputProps={{ min: 1, max: 365 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="backup_settings.storage_path"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Storage Path"
                          fullWidth
                          disabled={!watch('backup_settings.enabled')}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {currentTab === 3 && renderBackupTab()}

      {currentTab === 4 && renderSystemInfoTab()}

      {/* Test Email Dialog */}
      <Dialog
        open={showTestEmailDialog}
        onClose={() => setShowTestEmailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Test Email Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Test Email Address"
            type="email"
            fullWidth
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestEmailDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTestEmail}
            variant="contained"
            disabled={!testEmailAddress || testEmailMutation.isPending}
          >
            {testEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Restore Dialog */}
      <Dialog
        open={showBackupDialog}
        onClose={() => setShowBackupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will restore the system to the state when the backup was created. 
            All current data will be overwritten. Are you sure you want to continue?
          </Alert>
          {selectedBackup && (
            <Box>
              <Typography variant="body2">
                <strong>Backup ID:</strong> {selectedBackup.id}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {new Date(selectedBackup.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Size:</strong> {formatBytes(selectedBackup.size)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRestoreBackup}
            variant="contained"
            color="warning"
            disabled={restoreBackupMutation.isPending}
          >
            {restoreBackupMutation.isPending ? 'Restoring...' : 'Restore Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Backup Confirmation */}
      <ConfirmationModal
        open={showDeleteBackupModal}
        onClose={() => {
          setShowDeleteBackupModal(false);
          setSelectedBackup(null);
        }}
        onConfirm={handleDeleteBackup}
        title="Delete Backup"
        message={`Are you sure you want to delete backup "${selectedBackup?.id}"? This action cannot be undone.`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteBackupMutation.isPending}
      />
    </Box>
  );
};

export default SettingsPage;