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
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { 
  Add, 
  Group,
  Delete,
  Edit,
  Visibility,
  Refresh,
  Business,
  Email,
  Phone,
  LocationOn,
  MoreVert,
  Person,
  Assessment,
  Computer,
  Storage as StorageIcon,
  Memory,
  NetworkCheck,
  TrendingUp,
  Warning,
  CheckCircle,
  Block,
  AttachMoney,
  LocalOffer,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { tenants } from '../../services/api/virtualization';
import type { Tenant, TableColumn } from '../../types';

interface TenantFormData {
  name: string;
  description?: string;
  organization: string;
  contact_email: string;
  contact_phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  cpu_quota: number;
  memory_quota: number;
  storage_quota: number;
  network_quota: number;
  billing_address?: string;
  tags: string[];
}

const TenantsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Tenant[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Tenant | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<Tenant | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceTenant, setResourceTenant] = useState<Tenant | null>(null);
  
  // Action menu
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState<Tenant | null>(null);

  // Form management
  const tenantForm = useForm<TenantFormData>({
    defaultValues: {
      name: '',
      description: '',
      organization: '',
      contact_email: '',
      contact_phone: '',
      status: 'active',
      cpu_quota: 10,
      memory_quota: 32,
      storage_quota: 100,
      network_quota: 10,
      billing_address: '',
      tags: [],
    },
  });

  // Queries
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useQuery({
    queryKey: ['tenants', { page, pageSize, sortBy, sortOrder, search: searchValue, status: filterStatus }],
    queryFn: () => tenants.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue,
      ...(filterStatus !== 'all' && { status: filterStatus }),
    }),
  });

  // Resource usage query for selected tenant
  const { data: resourceUsageData, isLoading: resourceUsageLoading } = useQuery({
    queryKey: ['tenantResourceUsage', resourceTenant?.id],
    queryFn: () => resourceTenant ? tenants.getResourceUsage(resourceTenant.id) : null,
    enabled: !!resourceTenant,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Virtual machines query for selected tenant
  const { data: tenantVMsData } = useQuery({
    queryKey: ['tenantVMs', detailsItem?.id],
    queryFn: () => detailsItem ? tenants.getVirtualMachines(detailsItem.id) : null,
    enabled: !!detailsItem,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: tenants.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created successfully');
      setShowCreateModal(false);
      tenantForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tenant');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) =>
      tenants.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      tenantForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update tenant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tenants.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tenant');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => tenants.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenants deleted successfully');
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tenants');
    },
  });

  // Table columns
  const tenantsColumns: TableColumn[] = [
    {
      id: 'name',
      label: 'Tenant Name',
      sortable: true,
      format: (value: string, row: Tenant) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Group color="primary" />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {value}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.organization}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'contact_email',
      label: 'Contact',
      format: (value: string, row: Tenant) => (
        <Box>
          <Typography variant="body2">{value}</Typography>
          {row.contact_phone && (
            <Typography variant="caption" color="textSecondary">
              {row.contact_phone}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value: string) => <StatusBadge status={value} />,
    },
    {
      id: 'resource_usage',
      label: 'Resource Usage',
      format: (value: any, row: Tenant) => {
        const cpuUsage = (row.used_cpu / row.cpu_quota) * 100;
        const memoryUsage = (row.used_memory / row.memory_quota) * 100;
        const storageUsage = (row.used_storage / row.storage_quota) * 100;
        
        return (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="caption">CPU:</Typography>
              <Box sx={{ width: 60 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(cpuUsage, 100)} 
                  size="small"
                  color={cpuUsage > 80 ? 'error' : cpuUsage > 60 ? 'warning' : 'primary'}
                />
              </Box>
              <Typography variant="caption">{cpuUsage.toFixed(0)}%</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="caption">RAM:</Typography>
              <Box sx={{ width: 60 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(memoryUsage, 100)} 
                  size="small"
                  color={memoryUsage > 80 ? 'error' : memoryUsage > 60 ? 'warning' : 'primary'}
                />
              </Box>
              <Typography variant="caption">{memoryUsage.toFixed(0)}%</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption">Storage:</Typography>
              <Box sx={{ width: 60 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(storageUsage, 100)} 
                  size="small"
                  color={storageUsage > 80 ? 'error' : storageUsage > 60 ? 'warning' : 'primary'}
                />
              </Box>
              <Typography variant="caption">{storageUsage.toFixed(0)}%</Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'tags',
      label: 'Tags',
      format: (value: string[]) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {value.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
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

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'inactive':
        return <Warning color="warning" />;
      case 'suspended':
        return <Block color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const calculateResourceHealth = (used: number, quota: number) => {
    const percentage = (used / quota) * 100;
    if (percentage > 90) return { color: 'error', level: 'Critical' };
    if (percentage > 75) return { color: 'warning', level: 'High' };
    if (percentage > 50) return { color: 'info', level: 'Medium' };
    return { color: 'success', level: 'Low' };
  };

  // Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
    tenantForm.reset();
  };

  const handleEdit = (item: Tenant) => {
    setEditingItem(item);
    tenantForm.reset({
      name: item.name,
      description: item.description,
      organization: item.organization,
      contact_email: item.contact_email,
      contact_phone: item.contact_phone,
      status: item.status,
      cpu_quota: item.cpu_quota,
      memory_quota: item.memory_quota,
      storage_quota: item.storage_quota,
      network_quota: item.network_quota,
      billing_address: item.billing_address,
      tags: item.tags,
    });
    setShowEditModal(true);
  };

  const handleDelete = (item: Tenant) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (item: Tenant) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleViewResources = (item: Tenant) => {
    setResourceTenant(item);
    setShowResourceModal(true);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, item: Tenant) => {
    setActionAnchor(event.currentTarget);
    setSelectedItemForAction(item);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedItemForAction(null);
  };

  const onCreateSubmit = (data: TenantFormData) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: TenantFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  // Filter tenants data
  const filteredTenants = useMemo(() => {
    let filtered = tenantsData?.results || [];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === filterStatus);
    }
    
    return filtered;
  }, [tenantsData, filterStatus]);

  // Statistics
  const tenantStats = useMemo(() => {
    const tenants = tenantsData?.results || [];
    return {
      total: tenants.length,
      active: tenants.filter(t => t.status === 'active').length,
      inactive: tenants.filter(t => t.status === 'inactive').length,
      suspended: tenants.filter(t => t.status === 'suspended').length,
      totalCpuQuota: tenants.reduce((sum, t) => sum + t.cpu_quota, 0),
      totalMemoryQuota: tenants.reduce((sum, t) => sum + t.memory_quota, 0),
      totalStorageQuota: tenants.reduce((sum, t) => sum + t.storage_quota, 0),
      totalCpuUsed: tenants.reduce((sum, t) => sum + t.used_cpu, 0),
      totalMemoryUsed: tenants.reduce((sum, t) => sum + t.used_memory, 0),
      totalStorageUsed: tenants.reduce((sum, t) => sum + t.used_storage, 0),
    };
  }, [tenantsData]);

  // Chart data for resource overview
  const resourceOverviewData = [
    {
      name: 'CPU',
      used: tenantStats.totalCpuUsed,
      quota: tenantStats.totalCpuQuota,
      percentage: (tenantStats.totalCpuUsed / tenantStats.totalCpuQuota) * 100,
    },
    {
      name: 'Memory',
      used: tenantStats.totalMemoryUsed,
      quota: tenantStats.totalMemoryQuota,
      percentage: (tenantStats.totalMemoryUsed / tenantStats.totalMemoryQuota) * 100,
    },
    {
      name: 'Storage',
      used: tenantStats.totalStorageUsed,
      quota: tenantStats.totalStorageQuota,
      percentage: (tenantStats.totalStorageUsed / tenantStats.totalStorageQuota) * 100,
    },
  ];

  if (tenantsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading tenants: {tenantsError.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Tenant Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage multi-tenant resource allocation, quotas, and usage monitoring.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tenants'] })}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Tenant
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Group color="primary" />
                <Box>
                  <Typography variant="h4">{tenantStats.total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Tenants
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
                  <Typography variant="h4">{tenantStats.active}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Tenants
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
                  <Typography variant="h4">{tenantStats.inactive}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Inactive Tenants
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
                <Block color="error" />
                <Box>
                  <Typography variant="h4">{tenantStats.suspended}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Suspended Tenants
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resource Overview Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Resource Usage
          </Typography>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceOverviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    name === 'used' ? `${value} (${((value as number) / resourceOverviewData.find(d => d.name === (arguments[2] && arguments[2].payload.name))?.quota! * 100).toFixed(1)}%)` : value,
                    name === 'used' ? 'Used' : 'Quota'
                  ]}
                />
                <Bar dataKey="used" fill="#8884d8" name="used" />
                <Bar dataKey="quota" fill="#82ca9d" name="quota" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <DataGrid
        columns={tenantsColumns}
        data={filteredTenants}
        loading={tenantsLoading}
        totalCount={tenantsData?.count || 0}
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
              const ids = selected.map((item: Tenant) => item.id);
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
            id: 'resources',
            label: 'View Resources',
            icon: Assessment,
            onClick: handleViewResources,
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
        emptyStateMessage="No tenants found"
      />

      {/* Create/Edit Tenant Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingItem(null);
          tenantForm.reset();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showCreateModal ? 'Create New Tenant' : 'Edit Tenant'}
        </DialogTitle>
        <form onSubmit={tenantForm.handleSubmit(showCreateModal ? onCreateSubmit : onUpdateSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={tenantForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Tenant Name"
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
                  name="organization"
                  control={tenantForm.control}
                  rules={{ required: 'Organization is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Organization"
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
                  name="contact_email"
                  control={tenantForm.control}
                  rules={{ 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Contact Email"
                      type="email"
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
                  name="contact_phone"
                  control={tenantForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Contact Phone"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={tenantForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={tenantForm.control}
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
                  Resource Quotas
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cpu_quota"
                  control={tenantForm.control}
                  rules={{ required: 'CPU quota is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="CPU Quota (cores)"
                      type="number"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="memory_quota"
                  control={tenantForm.control}
                  rules={{ required: 'Memory quota is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Memory Quota (GB)"
                      type="number"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="storage_quota"
                  control={tenantForm.control}
                  rules={{ required: 'Storage quota is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Storage Quota (GB)"
                      type="number"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="network_quota"
                  control={tenantForm.control}
                  rules={{ required: 'Network quota is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Network Quota (Gbps)"
                      type="number"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="billing_address"
                  control={tenantForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Billing Address"
                      fullWidth
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="tags"
                  control={tenantForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tags"
                      fullWidth
                      placeholder="production, critical, customer-a"
                      helperText="Comma-separated list of tags"
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
                tenantForm.reset();
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
                showCreateModal ? 'Create Tenant' : 'Update Tenant'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Tenant Details Modal */}
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
            <Group color="primary" />
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
                          Organization:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {detailsItem.organization}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Contact Email:
                        </Typography>
                        <Typography variant="body2">
                          {detailsItem.contact_email}
                        </Typography>
                      </Box>
                      {detailsItem.contact_phone && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Contact Phone:
                          </Typography>
                          <Typography variant="body2">
                            {detailsItem.contact_phone}
                          </Typography>
                        </Box>
                      )}
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
                      Resource Quotas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                          CPU:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {detailsItem.used_cpu} / {detailsItem.cpu_quota} cores
                          </Typography>
                          <Box sx={{ width: 100 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(detailsItem.used_cpu / detailsItem.cpu_quota) * 100} 
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                          Memory:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {detailsItem.used_memory} / {detailsItem.memory_quota} GB
                          </Typography>
                          <Box sx={{ width: 100 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(detailsItem.used_memory / detailsItem.memory_quota) * 100} 
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                          Storage:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {detailsItem.used_storage} / {detailsItem.storage_quota} GB
                          </Typography>
                          <Box sx={{ width: 100 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(detailsItem.used_storage / detailsItem.storage_quota) * 100} 
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                          Network:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {detailsItem.used_network} / {detailsItem.network_quota} Gbps
                          </Typography>
                          <Box sx={{ width: 100 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(detailsItem.used_network / detailsItem.network_quota) * 100} 
                            />
                          </Box>
                        </Box>
                      </Box>
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
              {detailsItem.billing_address && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Billing Address
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {detailsItem.billing_address}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {detailsItem.tags.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {detailsItem.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {tenantVMsData && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Virtual Machines ({tenantVMsData.count})
                      </Typography>
                      {tenantVMsData.results.length > 0 ? (
                        <List>
                          {tenantVMsData.results.slice(0, 5).map((vm) => (
                            <ListItem key={vm.id}>
                              <ListItemIcon>
                                <Computer />
                              </ListItemIcon>
                              <ListItemText
                                primary={vm.name}
                                secondary={`Status: ${vm.status} | Specification: ${vm.specification_name}`}
                              />
                            </ListItem>
                          ))}
                          {tenantVMsData.results.length > 5 && (
                            <ListItem>
                              <ListItemText primary={`... and ${tenantVMsData.results.length - 5} more VMs`} />
                            </ListItem>
                          )}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No virtual machines found for this tenant.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          {detailsItem && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => {
                handleEdit(detailsItem);
                setShowDetailsModal(false);
              }}
            >
              Edit Tenant
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Resource Usage Modal */}
      <Dialog
        open={showResourceModal}
        onClose={() => {
          setShowResourceModal(false);
          setResourceTenant(null);
        }}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Assessment color="primary" />
            {resourceTenant?.name} - Resource Usage
          </Box>
        </DialogTitle>
        <DialogContent>
          {resourceUsageLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <LoadingSpinner />
            </Box>
          ) : resourceUsageData ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      CPU Usage
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress
                        variant="determinate"
                        value={(resourceUsageData.cpu_usage / resourceUsageData.total_cpu) * 100}
                        size={80}
                        thickness={6}
                      />
                      <Box>
                        <Typography variant="h5">
                          {((resourceUsageData.cpu_usage / resourceUsageData.total_cpu) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {resourceUsageData.cpu_usage} / {resourceUsageData.total_cpu} cores
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Memory Usage
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress
                        variant="determinate"
                        value={(resourceUsageData.memory_usage / resourceUsageData.total_memory) * 100}
                        size={80}
                        thickness={6}
                        color="secondary"
                      />
                      <Box>
                        <Typography variant="h5">
                          {((resourceUsageData.memory_usage / resourceUsageData.total_memory) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {resourceUsageData.memory_usage} / {resourceUsageData.total_memory} GB
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Storage Usage
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress
                        variant="determinate"
                        value={(resourceUsageData.storage_usage / resourceUsageData.total_storage) * 100}
                        size={80}
                        thickness={6}
                        color="success"
                      />
                      <Box>
                        <Typography variant="h5">
                          {((resourceUsageData.storage_usage / resourceUsageData.total_storage) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {resourceUsageData.storage_usage} / {resourceUsageData.total_storage} GB
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Virtual Machines
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Computer sx={{ fontSize: 60, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h5">
                          {resourceUsageData.vm_count}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Active VMs
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography>No resource usage data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResourceModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        title="Delete Tenant"
        message={`Are you sure you want to delete the tenant "${deletingItem?.name}"? This action cannot be undone and will affect all associated resources.`}
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
            handleViewResources(selectedItemForAction);
          }
          handleActionClose();
        }}>
          <Assessment sx={{ mr: 1 }} />
          View Resources
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

export default TenantsPage;