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
} from '@mui/material';
import { 
  Add, 
  Computer, 
  Delete,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  CloudQueue,
  Storage as StorageIcon,
  Speed,
  Memory,
  NetworkCheck,
  ExpandMore,
  GetApp,
  Update,
  Security,
  Visibility,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  k8sClusters,
  k8sClusterPlugins,
} from '../../services/api/kubernetes';
import type { K8sCluster, K8sClusterPlugin, TableColumn } from '../../types';

interface ClusterFormData {
  name: string;
  description?: string;
  version: string;
  master_nodes: number;
  worker_nodes: number;
  node_instance_type: string;
  network_plugin: string;
  storage_class: string;
  cluster_type: 'development' | 'staging' | 'production';
  status: 'creating' | 'running' | 'updating' | 'deleting' | 'error';
}

const ClustersPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<K8sCluster[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<K8sCluster | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<K8sCluster | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsCluster, setDetailsCluster] = useState<K8sCluster | null>(null);
  const [clusterActionAnchor, setClusterActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedClusterForAction, setSelectedClusterForAction] = useState<K8sCluster | null>(null);

  // Form management
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClusterFormData>();

  // Queries
  const { data: clustersData, isLoading: clustersLoading } = useQuery({
    queryKey: ['k8s-clusters', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => k8sClusters.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 0,
  });

  const { data: pluginsData, isLoading: pluginsLoading } = useQuery({
    queryKey: ['k8s-cluster-plugins', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => k8sClusterPlugins.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 1,
  });

  const { data: clusterNodes, isLoading: nodesLoading } = useQuery({
    queryKey: ['cluster-nodes', detailsCluster?.id],
    queryFn: () => detailsCluster ? k8sClusters.getNodes(detailsCluster.id) : null,
    enabled: !!detailsCluster && showDetailsModal,
  });

  const { data: clusterPods, isLoading: podsLoading } = useQuery({
    queryKey: ['cluster-pods', detailsCluster?.id],
    queryFn: () => detailsCluster ? k8sClusters.getPods(detailsCluster.id) : null,
    enabled: !!detailsCluster && showDetailsModal,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: k8sClusters.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8s-clusters'] });
      toast.success('Kubernetes cluster created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create cluster');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<K8sCluster> }) =>
      k8sClusters.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8s-clusters'] });
      toast.success('Cluster updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update cluster');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: k8sClusters.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8s-clusters'] });
      toast.success('Cluster deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete cluster');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => k8sClusters.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8s-clusters'] });
      toast.success(`${selectedItems.length} clusters deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete clusters');
    },
  });

  const scaleMutation = useMutation({
    mutationFn: ({ id, deployment, namespace, replicas }: { id: string; deployment: string; namespace: string; replicas: number }) =>
      k8sClusters.scale(id, deployment, namespace, replicas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-pods'] });
      toast.success('Deployment scaled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to scale deployment');
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: string }) =>
      k8sClusters.upgrade(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8s-clusters'] });
      toast.success('Cluster upgrade initiated successfully');
      setClusterActionAnchor(null);
      setSelectedClusterForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upgrade cluster');
    },
  });

  // Table columns definition
  const clustersColumns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Cluster Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'version',
      label: 'Kubernetes Version',
      minWidth: 120,
      sortable: false,
    },
    {
      id: 'cluster_type',
      label: 'Type',
      minWidth: 100,
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value}
          color={value === 'production' ? 'error' : value === 'staging' ? 'warning' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'nodes',
      label: 'Nodes',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value, row) => `${row?.master_nodes || 0} / ${row?.worker_nodes || 0}`,
    },
    {
      id: 'pods',
      label: 'Pods',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => value || '0',
    },
    {
      id: 'cpu_usage',
      label: 'CPU Usage',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value) => value !== undefined ? (
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{ flex: 1, mr: 1, height: 6, borderRadius: 3 }}
            color={value > 80 ? 'error' : value > 60 ? 'warning' : 'primary'}
          />
          <Typography variant="caption">{value.toFixed(1)}%</Typography>
        </Box>
      ) : '-',
    },
    {
      id: 'memory_usage',
      label: 'Memory Usage',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value) => value !== undefined ? (
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{ flex: 1, mr: 1, height: 6, borderRadius: 3 }}
            color={value > 80 ? 'error' : value > 60 ? 'warning' : 'primary'}
          />
          <Typography variant="caption">{value.toFixed(1)}%</Typography>
        </Box>
      ) : '-',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'created_at',
      label: 'Created',
      minWidth: 120,
      sortable: true,
      format: (value) => new Date(value).toLocaleDateString(),
    },
  ], []);

  const pluginsColumns: TableColumn[] = useMemo(() => [
    {
      id: 'plugin_name',
      label: 'Plugin Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'cluster_name',
      label: 'Cluster',
      minWidth: 120,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'version',
      label: 'Version',
      minWidth: 100,
      sortable: false,
    },
    {
      id: 'namespace',
      label: 'Namespace',
      minWidth: 100,
      sortable: false,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'installed_at',
      label: 'Installed',
      minWidth: 120,
      sortable: true,
      format: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ], []);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearchValue('');
    setSelectedItems([]);
  };

  const handleCreate = (data: ClusterFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (item: K8sCluster) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description,
      version: item.version,
      master_nodes: item.master_nodes,
      worker_nodes: item.worker_nodes,
      node_instance_type: item.node_instance_type,
      network_plugin: item.network_plugin,
      storage_class: item.storage_class,
      cluster_type: item.cluster_type,
      status: item.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: ClusterFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleDelete = (item: K8sCluster) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      bulkDeleteMutation.mutate(selectedItems.map(item => item.id));
    }
  };

  const handleViewDetails = (cluster: K8sCluster) => {
    setDetailsCluster(cluster);
    setShowDetailsModal(true);
  };

  const handleClusterAction = (cluster: K8sCluster, event: React.MouseEvent<HTMLElement>) => {
    setSelectedClusterForAction(cluster);
    setClusterActionAnchor(event.currentTarget);
  };

  const handleUpgradeCluster = () => {
    if (selectedClusterForAction) {
      // For demo purposes, upgrade to a newer version
      const newVersion = '1.28.0';
      upgradeMutation.mutate({ id: selectedClusterForAction.id, version: newVersion });
    }
  };

  const handleGetKubeconfig = async () => {
    if (selectedClusterForAction) {
      try {
        const response = await k8sClusters.getKubeconfig(selectedClusterForAction.id);
        // Create a blob and download the kubeconfig
        const blob = new Blob([response.kubeconfig], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedClusterForAction.name}-kubeconfig.yaml`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success('Kubeconfig downloaded successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to download kubeconfig');
      }
      setClusterActionAnchor(null);
      setSelectedClusterForAction(null);
    }
  };

  const statusOptions = [
    { value: 'creating', label: 'Creating' },
    { value: 'running', label: 'Running' },
    { value: 'updating', label: 'Updating' },
    { value: 'deleting', label: 'Deleting' },
    { value: 'error', label: 'Error' },
  ];

  const clusterTypeOptions = [
    { value: 'development', label: 'Development' },
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' },
  ];

  const getCurrentData = () => {
    switch (currentTab) {
      case 0: return clustersData?.results || [];
      case 1: return pluginsData?.results || [];
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (currentTab) {
      case 0: return clustersLoading;
      case 1: return pluginsLoading;
      default: return false;
    }
  };

  const getCurrentColumns = () => {
    switch (currentTab) {
      case 0: return clustersColumns;
      case 1: return pluginsColumns;
      default: return [];
    }
  };

  const getCurrentTotalCount = () => {
    switch (currentTab) {
      case 0: return clustersData?.count || 0;
      case 1: return pluginsData?.count || 0;
      default: return 0;
    }
  };

  const data = getCurrentData();
  const isLoading = getCurrentLoading();
  const columns = getCurrentColumns();
  const totalCount = getCurrentTotalCount();

  if (isLoading && data.length === 0) {
    return <LoadingSpinner fullScreen message="Loading Kubernetes clusters..." />;
  }

  const runningClusters = clustersData?.results.filter(c => c.status === 'running').length || 0;
  const totalNodes = clustersData?.results.reduce((sum, c) => sum + (c.master_nodes || 0) + (c.worker_nodes || 0), 0) || 0;
  const totalPods = clustersData?.results.reduce((sum, c) => sum + (c.pods || 0), 0) || 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Kubernetes Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage Kubernetes clusters, monitor nodes, and control workloads.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['k8s-clusters'] });
              queryClient.invalidateQueries({ queryKey: ['k8s-cluster-plugins'] });
            }}
          >
            Refresh
          </Button>
          {currentTab === 0 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Cluster
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CloudQueue sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{clustersData?.count || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Clusters
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PlayArrow sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{runningClusters}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Running Clusters
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Computer sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{totalNodes}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Nodes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <StorageIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">{totalPods}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Pods
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Clusters" />
          <Tab label="Plugins" />
        </Tabs>
      </Card>

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={data}
        loading={isLoading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchValue={searchValue}
        selectedItems={selectedItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={(sortBy, sortOrder) => {
          setSortBy(sortBy);
          setSortOrder(sortOrder);
        }}
        onSearchChange={setSearchValue}
        onSelectionChange={setSelectedItems}
        onEdit={currentTab === 0 ? handleEdit : undefined}
        onDelete={currentTab === 0 ? handleDelete : undefined}
        onView={currentTab === 0 ? handleViewDetails : undefined}
        bulkActions={currentTab === 0 ? [
          {
            id: 'bulk-delete',
            label: 'Delete Selected',
            icon: Delete,
            onClick: handleBulkDelete,
            color: 'error',
          },
        ] : []}
        rowActions={currentTab === 0 ? [
          {
            id: 'cluster-actions',
            label: 'Cluster Actions',
            icon: Settings,
            onClick: (cluster) => handleClusterAction(cluster, {} as any),
          },
        ] : []}
        emptyStateMessage={`No ${currentTab === 0 ? 'clusters' : 'plugins'} found. ${currentTab === 0 ? 'Create your first cluster to get started.' : ''}`}
      />

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingItem(null);
          reset();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showCreateModal ? 'Create Kubernetes Cluster' : 'Edit Cluster'}
        </DialogTitle>
        <form onSubmit={handleSubmit(showCreateModal ? handleCreate : handleUpdate)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Cluster name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cluster Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="version"
                  control={control}
                  rules={{ required: 'Kubernetes version is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Kubernetes Version"
                      fullWidth
                      placeholder="1.28.0"
                      error={!!errors.version}
                      helperText={errors.version?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="master_nodes"
                  control={control}
                  rules={{ required: 'Master nodes count is required', min: { value: 1, message: 'Must have at least 1 master node' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Master Nodes"
                      type="number"
                      fullWidth
                      error={!!errors.master_nodes}
                      helperText={errors.master_nodes?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="worker_nodes"
                  control={control}
                  rules={{ required: 'Worker nodes count is required', min: { value: 1, message: 'Must have at least 1 worker node' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Worker Nodes"
                      type="number"
                      fullWidth
                      error={!!errors.worker_nodes}
                      helperText={errors.worker_nodes?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="node_instance_type"
                  control={control}
                  rules={{ required: 'Instance type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Node Instance Type"
                      fullWidth
                      placeholder="t3.medium"
                      error={!!errors.node_instance_type}
                      helperText={errors.node_instance_type?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="network_plugin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Network Plugin"
                      fullWidth
                      placeholder="calico"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="storage_class"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Storage Class"
                      fullWidth
                      placeholder="gp2"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.cluster_type}>
                  <InputLabel>Cluster Type</InputLabel>
                  <Controller
                    name="cluster_type"
                    control={control}
                    rules={{ required: 'Cluster type is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Cluster Type">
                        {clusterTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setEditingItem(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Kubernetes Cluster"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This will destroy all workloads and data in the cluster.`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteMutation.isPending}
      />

      {/* Cluster Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsCluster(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Cluster Details - {detailsCluster?.name}
        </DialogTitle>
        <DialogContent>
          {detailsCluster && (
            <Box>
              {/* Cluster Info */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {detailsCluster.version}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Kubernetes Version
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        {(detailsCluster.master_nodes || 0) + (detailsCluster.worker_nodes || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Nodes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="info.main">
                        {detailsCluster.pods || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Running Pods
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <StatusBadge status={detailsCluster.status} />
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        Cluster Status
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Nodes */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    Nodes ({clusterNodes?.nodes.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {nodesLoading ? (
                    <LoadingSpinner message="Loading nodes..." />
                  ) : (
                    <List>
                      {clusterNodes?.nodes.map((node, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Computer color={node.status === 'Ready' ? 'success' : 'error'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={node.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Role: {node.role} | Version: {node.version} | Status: {node.status}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  CPU: {node.cpu_usage?.toFixed(1)}% | Memory: {node.memory_usage?.toFixed(1)}%
                                </Typography>
                                <Typography variant="caption">
                                  Pods: {node.pods}/{node.max_pods}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Pods */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    Pods ({clusterPods?.pods.length || 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {podsLoading ? (
                    <LoadingSpinner message="Loading pods..." />
                  ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {clusterPods?.pods.slice(0, 20).map((pod, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <StorageIcon color={pod.status === 'Running' ? 'success' : pod.status === 'Failed' ? 'error' : 'warning'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={pod.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Namespace: {pod.namespace} | Node: {pod.node}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Status: {pod.status} | Restarts: {pod.restarts} | Age: {pod.age}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                      {(clusterPods?.pods.length || 0) > 20 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${(clusterPods?.pods.length || 0) - 20} more pods`}
                            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cluster Actions Menu */}
      <Menu
        anchorEl={clusterActionAnchor}
        open={Boolean(clusterActionAnchor)}
        onClose={() => {
          setClusterActionAnchor(null);
          setSelectedClusterForAction(null);
        }}
      >
        <MenuItem onClick={handleUpgradeCluster}>
          <Update sx={{ mr: 1 }} fontSize="small" />
          Upgrade Cluster
        </MenuItem>
        <MenuItem onClick={handleGetKubeconfig}>
          <GetApp sx={{ mr: 1 }} fontSize="small" />
          Download Kubeconfig
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedClusterForAction) {
            handleViewDetails(selectedClusterForAction);
          }
          setClusterActionAnchor(null);
          setSelectedClusterForAction(null);
        }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ClustersPage;