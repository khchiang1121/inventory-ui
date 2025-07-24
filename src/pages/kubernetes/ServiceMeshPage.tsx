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
} from '@mui/material';
import { 
  Add, 
  Hub,
  Delete,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  Security,
  NetworkCheck,
  TrendingUp,
  Timeline,
  VpnKey,
  AccountTree,
  Visibility,
  Edit,
  MoreVert,
  CloudUpload,
  Update,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  serviceMeshes,
  k8sClusterServiceMeshes,
  k8sClusters,
} from '../../services/api/kubernetes';
import type { ServiceMesh, K8sClusterServiceMesh, K8sCluster, TableColumn } from '../../types';

interface ServiceMeshFormData {
  name: string;
  description?: string;
  mesh_type: 'istio' | 'linkerd' | 'consul-connect' | 'app-mesh';
  version: string;
  configuration: {
    mtls_enabled: boolean;
    traffic_management_enabled: boolean;
    observability_enabled: boolean;
    security_policies_enabled: boolean;
    rate_limiting_enabled: boolean;
    circuit_breaker_enabled: boolean;
    retry_policies_enabled: boolean;
    load_balancing_algorithm: string;
    ingress_gateway_enabled: boolean;
    egress_gateway_enabled: boolean;
  };
  supported_protocols: string[];
  features: string[];
}

interface ClusterServiceMeshFormData {
  cluster: string;
  service_mesh: string;
  configuration_overrides: Record<string, any>;
}

const ServiceMeshPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<ServiceMesh[]>([]);
  const [selectedClusterAssociations, setSelectedClusterAssociations] = useState<K8sClusterServiceMesh[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceMesh | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ServiceMesh | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<ServiceMesh | null>(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [metricsServiceMesh, setMetricsServiceMesh] = useState<ServiceMesh | null>(null);
  const [showTopologyModal, setShowTopologyModal] = useState(false);
  const [topologyServiceMesh, setTopologyServiceMesh] = useState<ServiceMesh | null>(null);
  
  // Action menu
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState<ServiceMesh | null>(null);

  // Form management
  const serviceMeshForm = useForm<ServiceMeshFormData>({
    defaultValues: {
      name: '',
      description: '',
      mesh_type: 'istio',
      version: '',
      configuration: {
        mtls_enabled: true,
        traffic_management_enabled: true,
        observability_enabled: true,
        security_policies_enabled: true,
        rate_limiting_enabled: false,
        circuit_breaker_enabled: false,
        retry_policies_enabled: true,
        load_balancing_algorithm: 'round_robin',
        ingress_gateway_enabled: true,
        egress_gateway_enabled: false,
      },
      supported_protocols: ['HTTP', 'HTTPS', 'gRPC'],
      features: ['Traffic Management', 'Security', 'Observability'],
    },
  });

  const associationForm = useForm<ClusterServiceMeshFormData>({
    defaultValues: {
      cluster: '',
      service_mesh: '',
      configuration_overrides: {},
    },
  });

  // Queries
  const { data: serviceMeshData, isLoading: serviceMeshLoading, error: serviceMeshError } = useQuery({
    queryKey: ['serviceMeshes', { page, pageSize, sortBy, sortOrder, search: searchValue }],
    queryFn: () => serviceMeshes.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue,
    }),
  });

  const { data: clusterServiceMeshData, isLoading: clusterServiceMeshLoading } = useQuery({
    queryKey: ['k8sClusterServiceMeshes'],
    queryFn: () => k8sClusterServiceMeshes.list(),
  });

  const { data: clustersData } = useQuery({
    queryKey: ['k8sClusters'],
    queryFn: () => k8sClusters.list({ page_size: 1000 }),
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['serviceMeshMetrics', metricsServiceMesh?.id],
    queryFn: () => metricsServiceMesh ? serviceMeshes.getMetrics(metricsServiceMesh.id, '24h') : null,
    enabled: !!metricsServiceMesh,
  });

  const { data: topologyData, isLoading: topologyLoading } = useQuery({
    queryKey: ['serviceMeshTopology', topologyServiceMesh?.id],
    queryFn: () => topologyServiceMesh ? serviceMeshes.getTopology(topologyServiceMesh.id) : null,
    enabled: !!topologyServiceMesh,
  });

  const { data: certificatesData } = useQuery({
    queryKey: ['serviceMeshCertificates', detailsItem?.id],
    queryFn: () => detailsItem ? serviceMeshes.getCertificates(detailsItem.id) : null,
    enabled: !!detailsItem,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: serviceMeshes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceMeshes'] });
      toast.success('Service mesh created successfully');
      setShowCreateModal(false);
      serviceMeshForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create service mesh');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceMesh> }) =>
      serviceMeshes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceMeshes'] });
      toast.success('Service mesh updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      serviceMeshForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update service mesh');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: serviceMeshes.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceMeshes'] });
      toast.success('Service mesh deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete service mesh');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => serviceMeshes.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceMeshes'] });
      toast.success('Service meshes deleted successfully');
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete service meshes');
    },
  });

  const associateMutation = useMutation({
    mutationFn: k8sClusterServiceMeshes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8sClusterServiceMeshes'] });
      toast.success('Service mesh associated with cluster successfully');
      setShowAssociateModal(false);
      associationForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to associate service mesh');
    },
  });

  // Table columns for service meshes
  const serviceMeshColumns: TableColumn[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      format: (value: string, row: ServiceMesh) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hub color="primary" />
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'mesh_type',
      label: 'Type',
      format: (value: string) => (
        <Chip 
          label={value.toUpperCase()} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      ),
    },
    {
      id: 'version',
      label: 'Version',
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value: string) => <StatusBadge status={value} />,
    },
    {
      id: 'features',
      label: 'Features',
      format: (value: string[]) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {value.slice(0, 2).map((feature) => (
            <Chip key={feature} label={feature} size="small" variant="outlined" />
          ))}
          {value.length > 2 && (
            <Chip label={`+${value.length - 2}`} size="small" variant="outlined" />
          )}
        </Box>
      ),
    },
    {
      id: 'created_at',
      label: 'Created',
      format: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Table columns for cluster associations
  const clusterAssociationColumns: TableColumn[] = [
    {
      id: 'cluster_name',
      label: 'Cluster',
      format: (value: string) => (
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      ),
    },
    {
      id: 'service_mesh_name',
      label: 'Service Mesh',
      format: (value: string) => (
        <Typography variant="body2">{value}</Typography>
      ),
    },
    {
      id: 'version',
      label: 'Version',
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value: string) => <StatusBadge status={value} />,
    },
    {
      id: 'installation_date',
      label: 'Installed',
      format: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
    serviceMeshForm.reset();
  };

  const handleEdit = (item: ServiceMesh) => {
    setEditingItem(item);
    serviceMeshForm.reset({
      name: item.name,
      description: item.description,
      mesh_type: item.mesh_type,
      version: item.version,
      configuration: item.configuration,
      supported_protocols: item.supported_protocols,
      features: item.features,
    });
    setShowEditModal(true);
  };

  const handleDelete = (item: ServiceMesh) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (item: ServiceMesh) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleViewMetrics = (item: ServiceMesh) => {
    setMetricsServiceMesh(item);
    setShowMetricsModal(true);
  };

  const handleViewTopology = (item: ServiceMesh) => {
    setTopologyServiceMesh(item);
    setShowTopologyModal(true);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, item: ServiceMesh) => {
    setActionAnchor(event.currentTarget);
    setSelectedItemForAction(item);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedItemForAction(null);
  };

  const onCreateSubmit = (data: ServiceMeshFormData) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: ServiceMeshFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const onAssociateSubmit = (data: ClusterServiceMeshFormData) => {
    associateMutation.mutate(data);
  };

  const tabContent = () => {
    switch (currentTab) {
      case 0:
        return (
          <DataGrid
            columns={serviceMeshColumns}
            data={serviceMeshData?.results || []}
            loading={serviceMeshLoading}
            totalCount={serviceMeshData?.count || 0}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchValue={searchValue}
            selectedItems={selectedItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
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
                  const ids = selected.map((item: ServiceMesh) => item.id);
                  bulkDeleteMutation.mutate(ids);
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
                id: 'metrics',
                label: 'View Metrics',
                icon: TrendingUp,
                onClick: handleViewMetrics,
              },
              {
                id: 'topology',
                label: 'View Topology',
                icon: AccountTree,
                onClick: handleViewTopology,
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
            emptyStateMessage="No service meshes found"
          />
        );
      case 1:
        return (
          <DataGrid
            columns={clusterAssociationColumns}
            data={clusterServiceMeshData?.results || []}
            loading={clusterServiceMeshLoading}
            totalCount={clusterServiceMeshData?.count || 0}
            selectedItems={selectedClusterAssociations}
            onSelectionChange={setSelectedClusterAssociations}
            enableSelection
            emptyStateMessage="No cluster associations found"
          />
        );
      default:
        return null;
    }
  };

  if (serviceMeshError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading service meshes: {serviceMeshError.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Service Mesh Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Deploy and manage service mesh configurations for your Kubernetes clusters.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['serviceMeshes'] })}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Deploy Service Mesh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Hub />}
            onClick={() => setShowAssociateModal(true)}
          >
            Associate with Cluster
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Hub />
                Service Meshes
                {serviceMeshData?.count && (
                  <Chip size="small" label={serviceMeshData.count} />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <AccountTree />
                Cluster Associations
                {clusterServiceMeshData?.count && (
                  <Chip size="small" label={clusterServiceMeshData.count} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Content */}
      {tabContent()}

      {/* Create/Edit Service Mesh Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingItem(null);
          serviceMeshForm.reset();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showCreateModal ? 'Deploy New Service Mesh' : 'Edit Service Mesh'}
        </DialogTitle>
        <form onSubmit={serviceMeshForm.handleSubmit(showCreateModal ? onCreateSubmit : onUpdateSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={serviceMeshForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Name"
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
                  name="mesh_type"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Mesh Type</InputLabel>
                      <Select {...field} label="Mesh Type">
                        <MenuItem value="istio">Istio</MenuItem>
                        <MenuItem value="linkerd">Linkerd</MenuItem>
                        <MenuItem value="consul-connect">Consul Connect</MenuItem>
                        <MenuItem value="app-mesh">AWS App Mesh</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="version"
                  control={serviceMeshForm.control}
                  rules={{ required: 'Version is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Version"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="e.g., 1.15.0"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={serviceMeshForm.control}
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
                <Typography variant="h6" gutterBottom>
                  Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="configuration.mtls_enabled"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable mTLS"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="configuration.traffic_management_enabled"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable Traffic Management"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="configuration.observability_enabled"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable Observability"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="configuration.security_policies_enabled"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable Security Policies"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="configuration.ingress_gateway_enabled"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable Ingress Gateway"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="configuration.egress_gateway_enabled"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable Egress Gateway"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="configuration.load_balancing_algorithm"
                  control={serviceMeshForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Load Balancing Algorithm</InputLabel>
                      <Select {...field} label="Load Balancing Algorithm">
                        <MenuItem value="round_robin">Round Robin</MenuItem>
                        <MenuItem value="least_conn">Least Connection</MenuItem>
                        <MenuItem value="random">Random</MenuItem>
                        <MenuItem value="ring_hash">Ring Hash</MenuItem>
                      </Select>
                    </FormControl>
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
                serviceMeshForm.reset();
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
                showCreateModal ? 'Deploy' : 'Update'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Associate with Cluster Modal */}
      <Dialog
        open={showAssociateModal}
        onClose={() => {
          setShowAssociateModal(false);
          associationForm.reset();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Associate Service Mesh with Cluster</DialogTitle>
        <form onSubmit={associationForm.handleSubmit(onAssociateSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="cluster"
                  control={associationForm.control}
                  rules={{ required: 'Cluster is required' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Cluster</InputLabel>
                      <Select {...field} label="Cluster">
                        {clustersData?.results.map((cluster) => (
                          <MenuItem key={cluster.id} value={cluster.id}>
                            {cluster.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="service_mesh"
                  control={associationForm.control}
                  rules={{ required: 'Service mesh is required' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Service Mesh</InputLabel>
                      <Select {...field} label="Service Mesh">
                        {serviceMeshData?.results
                          .filter((mesh) => mesh.status === 'active')
                          .map((mesh) => (
                            <MenuItem key={mesh.id} value={mesh.id}>
                              {mesh.name} ({mesh.mesh_type})
                            </MenuItem>
                          ))}
                      </Select>
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowAssociateModal(false);
                associationForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={associateMutation.isPending}
            >
              {associateMutation.isPending ? <LoadingSpinner size={20} /> : 'Associate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Service Mesh Details Modal */}
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
            <Hub color="primary" />
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
                        <Chip label={detailsItem.mesh_type.toUpperCase()} size="small" />
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Version:
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {detailsItem.version}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Status:
                        </Typography>
                        <StatusBadge status={detailsItem.status} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Features
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {detailsItem.features.map((feature) => (
                        <Chip key={feature} label={feature} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Configuration
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={<Switch checked={detailsItem.configuration.mtls_enabled} disabled />}
                          label="mTLS Enabled"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={<Switch checked={detailsItem.configuration.traffic_management_enabled} disabled />}
                          label="Traffic Management"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={<Switch checked={detailsItem.configuration.observability_enabled} disabled />}
                          label="Observability"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={<Switch checked={detailsItem.configuration.security_policies_enabled} disabled />}
                          label="Security Policies"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={<Switch checked={detailsItem.configuration.ingress_gateway_enabled} disabled />}
                          label="Ingress Gateway"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={<Switch checked={detailsItem.configuration.egress_gateway_enabled} disabled />}
                          label="Egress Gateway"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              {certificatesData && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Certificates
                      </Typography>
                      <List>
                        {certificatesData.certificates.map((cert, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <VpnKey 
                                color={cert.status === 'valid' ? 'success' : cert.status === 'expiring_soon' ? 'warning' : 'error'} 
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={cert.name}
                              secondary={`Issuer: ${cert.issuer} | Expires: ${new Date(cert.expiry).toLocaleDateString()}`}
                            />
                            <Chip 
                              label={cert.status.replace('_', ' ')} 
                              size="small"
                              color={cert.status === 'valid' ? 'success' : cert.status === 'expiring_soon' ? 'warning' : 'error'}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Metrics Modal */}
      <Dialog
        open={showMetricsModal}
        onClose={() => {
          setShowMetricsModal(false);
          setMetricsServiceMesh(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp color="primary" />
            {metricsServiceMesh?.name} - Metrics
          </Box>
        </DialogTitle>
        <DialogContent>
          {metricsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <LoadingSpinner />
            </Box>
          ) : metricsData ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Request Rate
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData.request_rate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Success Rate
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData.success_rate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Response Time
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData.response_time}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#ffc658" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Error Rate
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsData.error_rate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#ff7300" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography>No metrics data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMetricsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Topology Modal */}
      <Dialog
        open={showTopologyModal}
        onClose={() => {
          setShowTopologyModal(false);
          setTopologyServiceMesh(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <AccountTree color="primary" />
            {topologyServiceMesh?.name} - Service Topology
          </Box>
        </DialogTitle>
        <DialogContent>
          {topologyLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <LoadingSpinner />
            </Box>
          ) : topologyData ? (
            <Grid container spacing={2}>
              {topologyData.services.map((service, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Namespace: {service.namespace}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Request Rate:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.metrics.request_rate}/s
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Success Rate:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.metrics.success_rate}%
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Response Time:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {service.metrics.response_time}ms
                          </Typography>
                        </Box>
                      </Box>
                      {service.connections.length > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" gutterBottom>
                            Connections:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {service.connections.map((connection) => (
                              <Chip key={connection} label={connection} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No topology data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTopologyModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        title="Delete Service Mesh"
        message={`Are you sure you want to delete the service mesh "${deletingItem?.name}"? This action cannot be undone.`}
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
        <MenuItem onClick={() => {
          if (selectedItemForAction) {
            handleViewMetrics(selectedItemForAction);
          }
          handleActionClose();
        }}>
          <TrendingUp sx={{ mr: 1 }} />
          View Metrics
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedItemForAction) {
            handleViewTopology(selectedItemForAction);
          }
          handleActionClose();
        }}>
          <AccountTree sx={{ mr: 1 }} />
          View Topology
        </MenuItem>
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

export default ServiceMeshPage;