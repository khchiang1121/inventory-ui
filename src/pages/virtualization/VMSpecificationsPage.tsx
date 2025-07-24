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
  IconButton,
  Menu,
  Alert,
  Tabs,
  Tab,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  Add, 
  Settings,
  Delete,
  Edit,
  Visibility,
  Refresh,
  Computer,
  Memory,
  Storage as StorageIcon,
  NetworkCheck,
  MoreVert,
  ContentCopy,
  CloudDownload,
  Star,
  StarBorder,
  ExpandMore,
  Speed,
  Description,
  LocalOffer,
  DesktopWindows,
  Terminal,
  Web,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { vmSpecifications } from '../../services/api/virtualization';
import type { VMSpecification, TableColumn } from '../../types';

interface VMSpecificationFormData {
  name: string;
  description?: string;
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  network_interfaces: number;
  os_type: 'linux' | 'windows' | 'other';
  os_version?: string;
  template_image?: string;
  is_template: boolean;
  tags: string[];
}

const VMSpecificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<VMSpecification[]>([]);
  const [filterOSType, setFilterOSType] = useState<string>('all');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VMSpecification | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<VMSpecification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<VMSpecification | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningItem, setCloningItem] = useState<VMSpecification | null>(null);
  
  // Action menu
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState<VMSpecification | null>(null);

  // Form management
  const specForm = useForm<VMSpecificationFormData>({
    defaultValues: {
      name: '',
      description: '',
      cpu_cores: 2,
      memory_gb: 4,
      storage_gb: 50,
      network_interfaces: 1,
      os_type: 'linux',
      os_version: '',
      template_image: '',
      is_template: true,
      tags: [],
    },
  });

  // Queries
  const { data: specificationsData, isLoading: specificationsLoading, error: specificationsError } = useQuery({
    queryKey: ['vmSpecifications', { page, pageSize, sortBy, sortOrder, search: searchValue, os_type: filterOSType, template: filterTemplate }],
    queryFn: () => vmSpecifications.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue,
      ...(filterOSType !== 'all' && { os_type: filterOSType }),
      ...(filterTemplate !== 'all' && { is_template: filterTemplate === 'templates' }),
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: vmSpecifications.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vmSpecifications'] });
      toast.success('VM specification created successfully');
      setShowCreateModal(false);
      specForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create VM specification');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VMSpecification> }) =>
      vmSpecifications.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vmSpecifications'] });
      toast.success('VM specification updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      specForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update VM specification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: vmSpecifications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vmSpecifications'] });
      toast.success('VM specification deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete VM specification');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => vmSpecifications.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vmSpecifications'] });
      toast.success('VM specifications deleted successfully');
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete VM specifications');
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (data: Partial<VMSpecification>) => vmSpecifications.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vmSpecifications'] });
      toast.success('VM specification cloned successfully');
      setShowCloneModal(false);
      setCloningItem(null);
      specForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clone VM specification');
    },
  });

  // Table columns
  const specificationsColumns: TableColumn[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      format: (value: string, row: VMSpecification) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getOSIcon(row.os_type)}
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight="medium">
                {value}
              </Typography>
              {row.is_template && (
                <Chip label="Template" size="small" color="primary" variant="outlined" />
              )}
            </Box>
            {row.description && (
              <Typography variant="caption" color="textSecondary">
                {row.description.length > 50 ? `${row.description.substring(0, 50)}...` : row.description}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'os_type',
      label: 'OS Type',
      format: (value: string, row: VMSpecification) => (
        <Box>
          <Chip 
            label={value.toUpperCase()} 
            size="small" 
            color={getOSTypeColor(value)} 
            variant="outlined" 
          />
          {row.os_version && (
            <Typography variant="caption" display="block" color="textSecondary">
              {row.os_version}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'resources',
      label: 'Resources',
      format: (value: any, row: VMSpecification) => (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Speed sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              {row.cpu_cores} cores
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Memory sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              {row.memory_gb} GB RAM
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <StorageIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              {row.storage_gb} GB Storage
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <NetworkCheck sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              {row.network_interfaces} NICs
            </Typography>
          </Box>
        </Box>
      ),
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
  const getOSIcon = (osType: string) => {
    switch (osType) {
      case 'windows':
        return <DesktopWindows color="primary" />;
      case 'linux':
        return <Terminal color="primary" />;
      default:
        return <Computer color="primary" />;
    }
  };

  const getOSTypeColor = (osType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (osType) {
      case 'windows':
        return 'info';
      case 'linux':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getResourceTier = (cpu: number, memory: number) => {
    if (cpu <= 2 && memory <= 4) return { tier: 'Small', color: 'success' };
    if (cpu <= 4 && memory <= 8) return { tier: 'Medium', color: 'warning' };
    if (cpu <= 8 && memory <= 16) return { tier: 'Large', color: 'error' };
    return { tier: 'XLarge', color: 'error' };
  };

  // Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
    specForm.reset();
  };

  const handleEdit = (item: VMSpecification) => {
    setEditingItem(item);
    specForm.reset({
      name: item.name,
      description: item.description,
      cpu_cores: item.cpu_cores,
      memory_gb: item.memory_gb,
      storage_gb: item.storage_gb,
      network_interfaces: item.network_interfaces,
      os_type: item.os_type,
      os_version: item.os_version,
      template_image: item.template_image,
      is_template: item.is_template,
      tags: item.tags,
    });
    setShowEditModal(true);
  };

  const handleDelete = (item: VMSpecification) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (item: VMSpecification) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleClone = (item: VMSpecification) => {
    setCloningItem(item);
    specForm.reset({
      name: `${item.name} (Copy)`,
      description: item.description,
      cpu_cores: item.cpu_cores,
      memory_gb: item.memory_gb,
      storage_gb: item.storage_gb,
      network_interfaces: item.network_interfaces,
      os_type: item.os_type,
      os_version: item.os_version,
      template_image: item.template_image,
      is_template: item.is_template,
      tags: item.tags,
    });
    setShowCloneModal(true);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, item: VMSpecification) => {
    setActionAnchor(event.currentTarget);
    setSelectedItemForAction(item);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setSelectedItemForAction(null);
  };

  const onCreateSubmit = (data: VMSpecificationFormData) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: VMSpecificationFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const onCloneSubmit = (data: VMSpecificationFormData) => {
    const { name, ...rest } = data;
    cloneMutation.mutate({ name, ...rest });
  };

  // Filter specifications data
  const filteredSpecifications = useMemo(() => {
    let filtered = specificationsData?.results || [];
    
    if (filterOSType !== 'all') {
      filtered = filtered.filter(spec => spec.os_type === filterOSType);
    }
    
    if (filterTemplate !== 'all') {
      filtered = filtered.filter(spec => 
        filterTemplate === 'templates' ? spec.is_template : !spec.is_template
      );
    }
    
    return filtered;
  }, [specificationsData, filterOSType, filterTemplate]);

  // Statistics
  const specStats = useMemo(() => {
    const specs = specificationsData?.results || [];
    return {
      total: specs.length,
      templates: specs.filter(s => s.is_template).length,
      specifications: specs.filter(s => !s.is_template).length,
      linux: specs.filter(s => s.os_type === 'linux').length,
      windows: specs.filter(s => s.os_type === 'windows').length,
      other: specs.filter(s => s.os_type === 'other').length,
      small: specs.filter(s => s.cpu_cores <= 2 && s.memory_gb <= 4).length,
      medium: specs.filter(s => s.cpu_cores <= 4 && s.memory_gb <= 8).length,
      large: specs.filter(s => s.cpu_cores > 4 || s.memory_gb > 8).length,
    };
  }, [specificationsData]);

  // Common resource presets
  const resourcePresets = [
    { name: 'Micro', cpu: 1, memory: 1, storage: 20, description: 'Minimal resources for testing' },
    { name: 'Small', cpu: 2, memory: 4, storage: 50, description: 'Light workloads, development' },
    { name: 'Medium', cpu: 4, memory: 8, storage: 100, description: 'Standard applications' },
    { name: 'Large', cpu: 8, memory: 16, storage: 200, description: 'Database, heavy workloads' },
    { name: 'XLarge', cpu: 16, memory: 32, storage: 500, description: 'Enterprise applications' },
  ];

  if (specificationsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading VM specifications: {specificationsError.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            VM Specifications & Templates
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage virtual machine specification templates and resource configurations.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['vmSpecifications'] })}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Create Specification
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Settings color="primary" />
                <Box>
                  <Typography variant="h4">{specStats.total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Specifications
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
                <Star color="warning" />
                <Box>
                  <Typography variant="h4">{specStats.templates}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Templates
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
                <Terminal color="success" />
                <Box>
                  <Typography variant="h4">{specStats.linux}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Linux
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
                <DesktopWindows color="info" />
                <Box>
                  <Typography variant="h4">{specStats.windows}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Windows
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
            Resource Size Distribution
          </Typography>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Small', count: specStats.small },
                { name: 'Medium', count: specStats.medium },
                { name: 'Large', count: specStats.large },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8" />
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
              <InputLabel>Filter by OS Type</InputLabel>
              <Select
                value={filterOSType}
                onChange={(e) => setFilterOSType(e.target.value)}
                label="Filter by OS Type"
              >
                <MenuItem value="all">All OS Types</MenuItem>
                <MenuItem value="linux">Linux</MenuItem>
                <MenuItem value="windows">Windows</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value)}
                label="Filter by Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="templates">Templates Only</MenuItem>
                <MenuItem value="specifications">Specifications Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <DataGrid
        columns={specificationsColumns}
        data={filteredSpecifications}
        loading={specificationsLoading}
        totalCount={specificationsData?.count || 0}
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
              const ids = selected.map((item: VMSpecification) => item.id);
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
            id: 'clone',
            label: 'Clone Specification',
            icon: ContentCopy,
            onClick: handleClone,
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
        emptyStateMessage="No VM specifications found"
      />

      {/* Create/Edit VM Specification Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingItem(null);
          specForm.reset();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showCreateModal ? 'Create VM Specification' : 'Edit VM Specification'}
        </DialogTitle>
        <form onSubmit={specForm.handleSubmit(showCreateModal ? onCreateSubmit : onUpdateSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={specForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Specification Name"
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
                  name="is_template"
                  control={specForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Use as Template"
                      sx={{ mt: 1 }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={specForm.control}
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

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Resource Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Resource Presets */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Presets:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {resourcePresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        specForm.setValue('cpu_cores', preset.cpu);
                        specForm.setValue('memory_gb', preset.memory);
                        specForm.setValue('storage_gb', preset.storage);
                      }}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cpu_cores"
                  control={specForm.control}
                  rules={{ required: 'CPU cores is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        CPU Cores: {field.value}
                      </Typography>
                      <Slider
                        {...field}
                        min={1}
                        max={64}
                        step={1}
                        marks={[
                          { value: 1, label: '1' },
                          { value: 16, label: '16' },
                          { value: 32, label: '32' },
                          { value: 64, label: '64' },
                        ]}
                        valueLabelDisplay="auto"
                      />
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="memory_gb"
                  control={specForm.control}
                  rules={{ required: 'Memory is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Memory: {field.value} GB
                      </Typography>
                      <Slider
                        {...field}
                        min={1}
                        max={256}
                        step={1}
                        marks={[
                          { value: 1, label: '1GB' },
                          { value: 64, label: '64GB' },
                          { value: 128, label: '128GB' },
                          { value: 256, label: '256GB' },
                        ]}
                        valueLabelDisplay="auto"
                      />
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="storage_gb"
                  control={specForm.control}
                  rules={{ required: 'Storage is required', min: 10 }}
                  render={({ field, fieldState }) => (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Storage: {field.value} GB
                      </Typography>
                      <Slider
                        {...field}
                        min={10}
                        max={2000}
                        step={10}
                        marks={[
                          { value: 10, label: '10GB' },
                          { value: 500, label: '500GB' },
                          { value: 1000, label: '1TB' },
                          { value: 2000, label: '2TB' },
                        ]}
                        valueLabelDisplay="auto"
                      />
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="network_interfaces"
                  control={specForm.control}
                  rules={{ required: 'Network interfaces is required', min: 1 }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Network Interfaces"
                      type="number"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1, max: 8 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Operating System
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="os_type"
                  control={specForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>OS Type</InputLabel>
                      <Select {...field} label="OS Type">
                        <MenuItem value="linux">Linux</MenuItem>
                        <MenuItem value="windows">Windows</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="os_version"
                  control={specForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="OS Version"
                      fullWidth
                      placeholder="e.g., Ubuntu 22.04, Windows Server 2022"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="template_image"
                  control={specForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Template Image"
                      fullWidth
                      placeholder="e.g., ubuntu-22.04-server"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="tags"
                  control={specForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tags"
                      fullWidth
                      placeholder="development, production, database"
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
                specForm.reset();
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
                showCreateModal ? 'Create Specification' : 'Update Specification'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Clone Specification Modal */}
      <Dialog
        open={showCloneModal}
        onClose={() => {
          setShowCloneModal(false);
          setCloningItem(null);
          specForm.reset();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clone VM Specification</DialogTitle>
        <form onSubmit={specForm.handleSubmit(onCloneSubmit)}>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Creating a copy of "{cloningItem?.name}"
            </Typography>
            <Controller
              name="name"
              control={specForm.control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="New Specification Name"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mt: 2 }}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowCloneModal(false);
                setCloningItem(null);
                specForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={cloneMutation.isPending}
            >
              {cloneMutation.isPending ? <LoadingSpinner size={20} /> : 'Clone Specification'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* VM Specification Details Modal */}
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
            {detailsItem && getOSIcon(detailsItem.os_type)}
            {detailsItem?.name} Details
            {detailsItem?.is_template && (
              <Chip label="Template" size="small" color="primary" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resource Configuration
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Speed />
                        </ListItemIcon>
                        <ListItemText
                          primary="CPU Cores"
                          secondary={`${detailsItem.cpu_cores} cores`}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={getResourceTier(detailsItem.cpu_cores, detailsItem.memory_gb).tier} 
                            size="small" 
                            color={getResourceTier(detailsItem.cpu_cores, detailsItem.memory_gb).color as any}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Memory />
                        </ListItemIcon>
                        <ListItemText
                          primary="Memory"
                          secondary={`${detailsItem.memory_gb} GB RAM`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <StorageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Storage"
                          secondary={`${detailsItem.storage_gb} GB`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <NetworkCheck />
                        </ListItemIcon>
                        <ListItemText
                          primary="Network Interfaces"
                          secondary={`${detailsItem.network_interfaces} NICs`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Operating System
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getOSIcon(detailsItem.os_type)}
                        <Chip 
                          label={detailsItem.os_type.toUpperCase()} 
                          color={getOSTypeColor(detailsItem.os_type)} 
                          variant="outlined"
                        />
                      </Box>
                      {detailsItem.os_version && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Version:
                          </Typography>
                          <Typography variant="body1">
                            {detailsItem.os_version}
                          </Typography>
                        </Box>
                      )}
                      {detailsItem.template_image && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Template Image:
                          </Typography>
                          <Typography variant="body1" fontFamily="monospace">
                            {detailsItem.template_image}
                          </Typography>
                        </Box>
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
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          {detailsItem && (
            <>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => {
                  handleClone(detailsItem);
                  setShowDetailsModal(false);
                }}
              >
                Clone
              </Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => {
                  handleEdit(detailsItem);
                  setShowDetailsModal(false);
                }}
              >
                Edit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        title="Delete VM Specification"
        message={`Are you sure you want to delete the VM specification "${deletingItem?.name}"? This action cannot be undone.`}
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
            handleClone(selectedItemForAction);
          }
          handleActionClose();
        }}>
          <ContentCopy sx={{ mr: 1 }} />
          Clone Specification
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

export default VMSpecificationsPage;