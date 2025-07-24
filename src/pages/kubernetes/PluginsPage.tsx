import React, { useState, useMemo } from 'react';
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
  LinearProgress,
  IconButton,
  Menu,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Link,
  CircularProgress,
} from '@mui/material';
import { 
  Add, 
  Extension,
  Delete,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  Security,
  NetworkCheck,
  TrendingUp,
  Storage as StorageIcon,
  Cloud,
  Visibility,
  Edit,
  MoreVert,
  CloudDownload,
  CloudUpload,
  Update,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  GetApp,
  Upgrade,
  BugReport,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  k8sClusterPlugins,
  k8sClusters,
} from '../../services/api/kubernetes';
import type { K8sClusterPlugin, K8sCluster, TableColumn } from '../../types';

interface PluginFormData {
  name: string;
  description?: string;
  version: string;
  plugin_type: 'networking' | 'storage' | 'monitoring' | 'security' | 'ingress' | 'other';
  repository_url?: string;
  configuration_schema: Record<string, any>;
  supported_k8s_versions: string[];
}

interface PluginConfigData {
  [key: string]: any;
}

const PluginsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<K8sClusterPlugin[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<K8sClusterPlugin | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<K8sClusterPlugin | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<K8sClusterPlugin | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installingPlugin, setInstallingPlugin] = useState<K8sClusterPlugin | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuringPlugin, setConfiguringPlugin] = useState<K8sClusterPlugin | null>(null);
  
  // Action menu
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState<K8sClusterPlugin | null>(null);

  // Form management
  const pluginForm = useForm<PluginFormData>({
    defaultValues: {
      name: '',
      description: '',
      version: '',
      plugin_type: 'other',
      repository_url: '',
      configuration_schema: {},
      supported_k8s_versions: [],
    },
  });

  const configForm = useForm<PluginConfigData>({
    defaultValues: {},
  });

  // Queries
  const { data: pluginsData, isLoading: pluginsLoading, error: pluginsError } = useQuery({
    queryKey: ['k8sClusterPlugins', { page, pageSize, sortBy, sortOrder, search: searchValue, type: filterType, status: filterStatus }],
    queryFn: () => k8sClusterPlugins.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue,
      ...(filterType !== 'all' && { plugin_type: filterType }),
      ...(filterStatus !== 'all' && { status: filterStatus }),
    }),
  });

  const { data: clustersData } = useQuery({
    queryKey: ['k8sClusters'],
    queryFn: () => k8sClusters.list({ page_size: 1000 }),
  });

  // Plugin status query for selected plugin
  const { data: pluginStatusData, isLoading: pluginStatusLoading } = useQuery({
    queryKey: ['pluginStatus', detailsItem?.id],
    queryFn: () => detailsItem ? k8sClusterPlugins.getStatus(detailsItem.id) : null,
    enabled: !!detailsItem,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: k8sClusterPlugins.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugin created successfully');
      setShowCreateModal(false);
      pluginForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create plugin');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<K8sClusterPlugin> }) =>
      k8sClusterPlugins.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugin updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      pluginForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update plugin');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: k8sClusterPlugins.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugin deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete plugin');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => k8sClusterPlugins.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugins deleted successfully');
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete plugins');
    },
  });

  const installMutation = useMutation({
    mutationFn: k8sClusterPlugins.install,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugin installation started');
      setShowInstallModal(false);
      setInstallingPlugin(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to install plugin');
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: k8sClusterPlugins.uninstall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugin uninstallation started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to uninstall plugin');
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: string }) =>
      k8sClusterPlugins.upgrade(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] });
      toast.success('Plugin upgrade started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upgrade plugin');
    },
  });

  // Table columns
  const pluginsColumns: TableColumn[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      format: (value: string, row: K8sClusterPlugin) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getPluginIcon(row?.plugin_type)}
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {value || '-'}
            </Typography>
            {row?.description && (
              <Typography variant="caption" color="textSecondary">
                {row.description.length > 50 ? `${row.description.substring(0, 50)}...` : row.description}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'plugin_type',
      label: 'Type',
      format: (value: string) => (
        <Chip 
          label={value ? value.replace('_', ' ').toUpperCase() : 'Unknown'} 
          size="small" 
          color={getPluginTypeColor(value || 'other')} 
          variant="outlined" 
        />
      ),
    },
    {
      id: 'version',
      label: 'Version',
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value: string) => <StatusBadge status={value || 'unknown'} />,
    },
    {
      id: 'supported_k8s_versions',
      label: 'K8s Versions',
      format: (value: string[]) => {
        if (!value || !Array.isArray(value)) {
          return <Typography variant="body2" color="textSecondary">-</Typography>;
        }
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {value.slice(0, 2).map((version) => (
              <Chip key={version || 'unknown'} label={version || 'unknown'} size="small" variant="outlined" />
            ))}
            {value.length > 2 && (
              <Chip label={`+${value.length - 2}`} size="small" variant="outlined" />
            )}
          </Box>
        );
      },
    },
    {
      id: 'created_at',
      label: 'Created',
      format: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString();
        } catch (error) {
          return '-';
        }
      },
    },
  ];

  // Helper functions
  const getPluginIcon = (type: string) => {
    if (!type) {
      return <Extension color="primary" />;
    }
    
    switch (type) {
      case 'networking':
        return <NetworkCheck color="primary" />;
      case 'storage':
        return <StorageIcon color="primary" />;
      case 'monitoring':
        return <TrendingUp color="primary" />;
      case 'security':
        return <Security color="primary" />;
      case 'ingress':
        return <Cloud color="primary" />;
      default:
        return <Extension color="primary" />;
    }
  };

  const getPluginTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    if (!type) {
      return 'secondary';
    }
    
    switch (type) {
      case 'networking':
        return 'primary';
      case 'storage':
        return 'success';
      case 'monitoring':
        return 'info';
      case 'security':
        return 'error';
      case 'ingress':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getHealthIcon = (health: string) => {
    if (!health) {
      return <Warning color="warning" />;
    }
    
    switch (health) {
      case 'healthy':
        return <CheckCircle color="success" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  // Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
    pluginForm.reset();
  };

  const handleEdit = (item: K8sClusterPlugin) => {
    if (!item) return;
    
    setEditingItem(item);
    pluginForm.reset({
      name: item.name || '',
      description: item.description || '',
      version: item.version || '',
      plugin_type: item.plugin_type || 'other',
      repository_url: item.repository_url || '',
      configuration_schema: item.configuration_schema || {},
      supported_k8s_versions: item.supported_k8s_versions || [],
    });
    setShowEditModal(true);
  };

  const handleDelete = (item: K8sClusterPlugin) => {
    if (!item) return;
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (item: K8sClusterPlugin) => {
    if (!item) return;
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleInstall = (item: K8sClusterPlugin) => {
    if (!item) return;
    setInstallingPlugin(item);
    setShowInstallModal(true);
  };

  const handleUninstall = (item: K8sClusterPlugin) => {
    if (!item?.id) return;
    uninstallMutation.mutate(item.id);
  };

  const handleUpgrade = (item: K8sClusterPlugin, version: string) => {
    if (!item?.id || !version) return;
    upgradeMutation.mutate({ id: item.id, version });
  };

  const handleConfigure = (item: K8sClusterPlugin) => {
    if (!item) return;
    setConfiguringPlugin(item);
    setShowConfigModal(true);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, item: K8sClusterPlugin) => {
    if (!item) return;
    setActionAnchor(event.currentTarget);
    setSelectedItemForAction(item);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedItemForAction(null);
  };

  const onCreateSubmit = (data: PluginFormData) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: PluginFormData) => {
    if (editingItem?.id) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const onInstallSubmit = () => {
    if (installingPlugin?.id) {
      installMutation.mutate(installingPlugin.id);
    }
  };

  // Filter plugins data
  const filteredPlugins = useMemo(() => {
    let filtered = pluginsData?.results || [];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(plugin => plugin?.plugin_type === filterType);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(plugin => plugin?.status === filterStatus);
    }
    
    return filtered;
  }, [pluginsData, filterType, filterStatus]);

  // Statistics
  const pluginStats = useMemo(() => {
    const plugins = pluginsData?.results || [];
    return {
      total: plugins.length,
      installed: plugins.filter(p => p?.status === 'installed').length,
      available: plugins.filter(p => p?.status === 'available').length,
      deprecated: plugins.filter(p => p?.status === 'deprecated').length,
      networking: plugins.filter(p => p?.plugin_type === 'networking').length,
      storage: plugins.filter(p => p?.plugin_type === 'storage').length,
      monitoring: plugins.filter(p => p?.plugin_type === 'monitoring').length,
      security: plugins.filter(p => p?.plugin_type === 'security').length,
    };
  }, [pluginsData]);

  if (pluginsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading plugins: {pluginsError.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Kubernetes Plugins
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage Kubernetes cluster plugins and extensions for enhanced functionality.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['k8sClusterPlugins'] })}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Plugin
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Extension color="primary" />
                <Box>
                  <Typography variant="h4">{pluginStats.total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Plugins
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h4">{pluginStats.installed}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Installed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CloudDownload color="info" />
                <Box>
                  <Typography variant="h4">{pluginStats.available}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Warning color="warning" />
                <Box>
                  <Typography variant="h4">{pluginStats.deprecated}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Deprecated
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter by Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="networking">Networking</MenuItem>
                <MenuItem value="storage">Storage</MenuItem>
                <MenuItem value="monitoring">Monitoring</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="ingress">Ingress</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="installed">Installed</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <DataGrid
        columns={pluginsColumns}
        data={filteredPlugins}
        loading={pluginsLoading}
        totalCount={pluginsData?.count || 0}
        page={page}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchValue={searchValue}
        selectedItems={selectedItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={(field, order) => {
          if (field && order) {
            setSortBy(field);
            setSortOrder(order);
          }
        }}
        onSearchChange={setSearchValue}
        onSelectionChange={setSelectedItems}
        onRowClick={handleViewDetails}
        bulkActions={[
          {
            id: 'delete',
            label: 'Delete Selected',
            icon: Delete,
            onClick: (selected) => {
              const ids = selected.map((item: K8sClusterPlugin) => item?.id).filter(Boolean);
              if (ids.length > 0) {
                bulkDeleteMutation.mutate(ids);
              }
            },
            color: 'error',
          },
        ]}
        rowActions={[
          {
            id: 'view',
            label: 'View Details',
            icon: Visibility,
            onClick: handleViewDetails,
          },
          {
            id: 'install',
            label: 'Install',
            icon: CloudDownload,
            onClick: handleInstall,
            disabled: (row: K8sClusterPlugin) => row?.status === 'installed',
          },
          {
            id: 'uninstall',
            label: 'Uninstall',
            icon: CloudUpload,
            onClick: handleUninstall,
            disabled: (row: K8sClusterPlugin) => row?.status !== 'installed',
            color: 'warning',
          },
          {
            id: 'configure',
            label: 'Configure',
            icon: Settings,
            onClick: handleConfigure,
            disabled: (row: K8sClusterPlugin) => row?.status !== 'installed',
          },
          {
            id: 'edit',
            label: 'Edit',
            icon: Edit,
            onClick: handleEdit,
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: Delete,
            onClick: handleDelete,
            color: 'error',
          },
        ]}
        enableSearch
        enableSelection
        emptyStateMessage="No plugins found"
      />

      {/* Create/Edit Plugin Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingItem(null);
          pluginForm.reset();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showCreateModal ? 'Add New Plugin' : 'Edit Plugin'}
        </DialogTitle>
        <form onSubmit={pluginForm.handleSubmit(showCreateModal ? onCreateSubmit : onUpdateSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={pluginForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Plugin Name"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="plugin_type"
                  control={pluginForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Plugin Type</InputLabel>
                      <Select {...field} label="Plugin Type">
                        <MenuItem value="networking">Networking</MenuItem>
                        <MenuItem value="storage">Storage</MenuItem>
                        <MenuItem value="monitoring">Monitoring</MenuItem>
                        <MenuItem value="security">Security</MenuItem>
                        <MenuItem value="ingress">Ingress</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="version"
                  control={pluginForm.control}
                  rules={{ required: 'Version is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Version"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="e.g., 1.0.0"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="repository_url"
                  control={pluginForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Repository URL"
                      fullWidth
                      placeholder="https://github.com/example/plugin"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={pluginForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="supported_k8s_versions"
                  control={pluginForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Supported K8s Versions"
                      fullWidth
                      placeholder="1.25,1.26,1.27"
                      helperText="Comma-separated list of supported Kubernetes versions"
                      onChange={(e) => {
                        const value = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                        field.onChange(value);
                      }}
                      value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setEditingItem(null);
                pluginForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <LoadingSpinner size={20} />
              ) : (
                showCreateModal ? 'Add Plugin' : 'Update Plugin'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Plugin Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsItem(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {detailsItem && getPluginIcon(detailsItem.plugin_type || 'other')}
            {detailsItem?.name} Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Type:
                        </Typography>
                        <Chip 
                          label={detailsItem.plugin_type ? detailsItem.plugin_type.replace('_', ' ').toUpperCase() : 'Unknown'} 
                          size="small" 
                          color={getPluginTypeColor(detailsItem.plugin_type)}
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Version:
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {detailsItem.version || '-'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Status:
                        </Typography>
                        <StatusBadge status={detailsItem.status || 'unknown'} />
                      </Box>
                      {pluginStatusData && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Health:
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getHealthIcon(pluginStatusData.health)}
                            <Typography variant="body2">
                              {pluginStatusData.health || 'Unknown'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {detailsItem.repository_url && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Repository:
                          </Typography>
                          <Link 
                            href={detailsItem.repository_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            variant="body2"
                          >
                            View Repository
                          </Link>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Supported Kubernetes Versions
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {detailsItem.supported_k8s_versions && Array.isArray(detailsItem.supported_k8s_versions) ? (
                        detailsItem.supported_k8s_versions.map((version) => (
                          <Chip key={version} label={version} size="small" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">No supported versions specified</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {detailsItem.description && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {detailsItem.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {detailsItem.configuration_schema && Object.keys(detailsItem.configuration_schema).length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Configuration Schema
                      </Typography>
                      <Box 
                        component="pre" 
                        sx={{ 
                          backgroundColor: 'grey.100', 
                          p: 2, 
                          borderRadius: 1, 
                          overflow: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }}
                      >
                        {JSON.stringify(detailsItem.configuration_schema || {}, null, 2)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          {detailsItem && detailsItem.status === 'available' && (
            <Button
              variant="contained"
              startIcon={<CloudDownload />}
              onClick={() => {
                handleInstall(detailsItem);
                setShowDetailsModal(false);
              }}
            >
              Install
            </Button>
          )}
          {detailsItem && detailsItem.status === 'installed' && (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => {
                handleConfigure(detailsItem);
                setShowDetailsModal(false);
              }}
            >
              Configure
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Install Confirmation Modal */}
      <ConfirmationModal
        open={showInstallModal}
        title="Install Plugin"
        message={`Are you sure you want to install the plugin "${installingPlugin?.name}"? This will deploy the plugin to your cluster.`}
        onConfirm={onInstallSubmit}
        onCancel={() => {
          setShowInstallModal(false);
          setInstallingPlugin(null);
        }}
        loading={installMutation.isPending}
        severity="info"
        confirmText="Install"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        title="Delete Plugin"
        message={`Are you sure you want to delete the plugin "${deletingItem?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deletingItem) {
            deleteMutation.mutate(deletingItem.id);
          }
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingItem(null);
        }}
        loading={deleteMutation.isPending}
        severity="error"
      />

      {/* Configuration Modal */}
      <Dialog
        open={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setConfiguringPlugin(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure Plugin: {configuringPlugin?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Configure plugin settings and parameters.
          </Typography>
          {configuringPlugin && (
            <Box mt={2}>
              <Alert severity="info">
                Plugin configuration interface would be dynamically generated based on the plugin's configuration schema.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigModal(false)}>Cancel</Button>
          <Button variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => {
          if (selectedItemForAction) {
            handleViewDetails(selectedItemForAction);
          }
          handleActionClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedItemForAction?.status === 'available' && (
          <MenuItem onClick={() => {
            if (selectedItemForAction) {
              handleInstall(selectedItemForAction);
            }
            handleActionClose();
          }}>
            <CloudDownload sx={{ mr: 1 }} />
            Install
          </MenuItem>
        )}
        {selectedItemForAction?.status === 'installed' && (
          <>
            <MenuItem onClick={() => {
              if (selectedItemForAction) {
                handleUninstall(selectedItemForAction);
              }
              handleActionClose();
            }}>
              <CloudUpload sx={{ mr: 1 }} />
              Uninstall
            </MenuItem>
            <MenuItem onClick={() => {
              if (selectedItemForAction) {
                handleConfigure(selectedItemForAction);
              }
              handleActionClose();
            }}>
              <Settings sx={{ mr: 1 }} />
              Configure
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => {
          if (selectedItemForAction) {
            handleEdit(selectedItemForAction);
          }
          handleActionClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedItemForAction) {
              handleDelete(selectedItemForAction);
            }
            handleActionClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PluginsPage;