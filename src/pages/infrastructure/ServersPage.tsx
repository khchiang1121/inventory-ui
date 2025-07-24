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
  Tooltip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Add, 
  Computer, 
  Delete,
  PowerSettingsNew,
  RestartAlt,
  Stop,
  PlayArrow,
  Memory,
  Storage as StorageIcon,
  Speed,
  DeviceThermostat,
  NetworkCheck,
  MoreVert,
  Refresh,
  Dashboard,
  List,
  Timeline,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useDebouncedSearch, globalCache } from '../../utils/performance';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ServerMonitoringDashboard } from '../../components/monitoring';
import { 
  servers, 
  racks, 
  baremetalGroups, 
  baremetalModels,
  brands 
} from '../../services/api/infrastructure';
import type { Baremetal, Rack, BaremetalGroup, BaremetalModel, Brand, TableColumn } from '../../types';

interface ServerFormData {
  name: string;
  serial_number: string;
  model: string;
  group: string;
  rack: string;
  position: number;
  asset_tag?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'failed' | 'retired';
  available_cpu: number;
  available_memory: number;
  available_storage: number;
  ip_address?: string;
  mac_address: string;
}

const ServersPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Baremetal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Baremetal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Baremetal | null>(null);
  const [powerActionAnchor, setPowerActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedServerForPower, setSelectedServerForPower] = useState<Baremetal | null>(null);

  // Debounced search to improve performance
  const debouncedSearch = useDebouncedSearch(setSearchValue, 300);

  // Form management
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ServerFormData>();

  // Queries
  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ['servers', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => servers.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
  });

  const { data: racksData } = useQuery({
    queryKey: ['racks'],
    queryFn: () => racks.list({ page_size: 100 }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['baremetal-groups'],
    queryFn: () => baremetalGroups.list({ page_size: 100 }),
  });

  const { data: modelsData } = useQuery({
    queryKey: ['baremetal-models'],
    queryFn: () => baremetalModels.list({ page_size: 100 }),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brands.list({ page_size: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: servers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Server created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create server');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Baremetal> }) =>
      servers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Server updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update server');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servers.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Server deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete server');
    },
  });

  const powerMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'on' | 'off' | 'reboot' }) =>
      servers.power(id, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success(`Server ${action} command sent successfully`);
      setPowerActionAnchor(null);
      setSelectedServerForPower(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute power command');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => servers.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success(`${selectedItems.length} servers deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete servers');
    },
  });

  // Table columns definition
  const columns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Server Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'model_name',
      label: 'Model',
      minWidth: 120,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'group_name',
      label: 'Group',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'rack_name',
      label: 'Rack',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'position',
      label: 'Position',
      minWidth: 80,
      align: 'center',
      sortable: true,
      format: (value) => value ? `${value}U` : '-',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'power_status',
      label: 'Power',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value}
          color={value === 'on' ? 'success' : value === 'off' ? 'default' : 'warning'}
          icon={<PowerSettingsNew fontSize="small" />}
        />
      ),
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
      id: 'ip_address',
      label: 'IP Address',
      minWidth: 120,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'last_seen',
      label: 'Last Seen',
      minWidth: 120,
      sortable: true,
      format: (value) => value ? new Date(value).toLocaleString() : '-',
    },
  ], []);

  // Event handlers
  const handleCreate = (data: ServerFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (item: Baremetal) => {
    setEditingItem(item);
    reset({
      name: item.name,
      serial_number: item.serial_number,
      model: item.model,
      group: item.group,
      rack: item.rack,
      position: item.position,
      asset_tag: item.asset_tag,
      status: item.status,
      available_cpu: item.available_cpu,
      available_memory: item.available_memory,
      available_storage: item.available_storage,
      ip_address: item.ip_address,
      mac_address: item.mac_address,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: ServerFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleDelete = (item: Baremetal) => {
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

  const handlePowerAction = (server: Baremetal, event: React.MouseEvent<HTMLElement>) => {
    setSelectedServerForPower(server);
    setPowerActionAnchor(event.currentTarget);
  };

  const handlePowerCommand = (action: 'on' | 'off' | 'reboot') => {
    if (selectedServerForPower) {
      powerMutation.mutate({ id: selectedServerForPower.id, action });
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'failed', label: 'Failed' },
    { value: 'retired', label: 'Retired' },
  ];

  const data = serversData?.results || [];
  const totalCount = serversData?.count || 0;

  if (serversLoading && !serversData) {
    return <LoadingSpinner fullScreen message="Loading servers..." />;
  }

  const activeServers = data.filter(s => s.status === 'active').length;
  const totalCpuUsage = data.length > 0 ? data.reduce((sum, s) => sum + (s.cpu_usage || 0), 0) / data.length : 0;
  const totalMemoryUsage = data.length > 0 ? data.reduce((sum, s) => sum + (s.memory_usage || 0), 0) / data.length : 0;
  const onlineServers = data.filter(s => s.power_status === 'on').length;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Servers
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your bare metal servers and monitor their performance.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['servers'] })}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Server
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Computer sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{totalCount}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Servers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PlayArrow sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{onlineServers}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Online Servers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Speed sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">{totalCpuUsage.toFixed(1)}%</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Avg CPU Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Memory sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{totalMemoryUsage.toFixed(1)}%</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Avg Memory Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="server management tabs"
        >
          <Tab 
            label="Server List" 
            icon={<List />} 
            iconPosition="start"
            id="server-tab-0"
            aria-controls="server-tabpanel-0"
          />
          <Tab 
            label="Real-time Monitoring" 
            icon={<Timeline />} 
            iconPosition="start"
            id="server-tab-1"
            aria-controls="server-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Box role="tabpanel" id="server-tabpanel-0" aria-labelledby="server-tab-0">
          <DataGrid
        columns={columns}
        data={data}
        loading={serversLoading}
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
        onSearchChange={debouncedSearch}
        onSelectionChange={setSelectedItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        bulkActions={[
          {
            id: 'bulk-delete',
            label: 'Delete Selected',
            icon: Delete,
            onClick: handleBulkDelete,
            color: 'error',
          },
        ]}
        rowActions={[
          {
            id: 'power-management',
            label: 'Power Management',
            icon: PowerSettingsNew,
            onClick: (server) => handlePowerAction(server, {} as any),
          },
        ]}
        emptyStateMessage="No servers found. Add your first server to get started."
      />
        </Box>
      )}

      {activeTab === 1 && (
        <Box role="tabpanel" id="server-tabpanel-1" aria-labelledby="server-tab-1">
          <ServerMonitoringDashboard />
        </Box>
      )}

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
          {showCreateModal ? 'Add Server' : 'Edit Server'}
        </DialogTitle>
        <form onSubmit={handleSubmit(showCreateModal ? handleCreate : handleUpdate)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Server name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Server Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="serial_number"
                  control={control}
                  rules={{ required: 'Serial number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Serial Number"
                      fullWidth
                      error={!!errors.serial_number}
                      helperText={errors.serial_number?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.model}>
                  <InputLabel>Model</InputLabel>
                  <Controller
                    name="model"
                    control={control}
                    rules={{ required: 'Model is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Model">
                        {modelsData?.results.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.brand_name} {model.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.group}>
                  <InputLabel>Group</InputLabel>
                  <Controller
                    name="group"
                    control={control}
                    rules={{ required: 'Group is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Group">
                        {groupsData?.results.map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Rack</InputLabel>
                  <Controller
                    name="rack"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Rack">
                        <MenuItem value="">None</MenuItem>
                        {racksData?.results.map((rack) => (
                          <MenuItem key={rack.id} value={rack.id}>
                            {rack.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Position (U)"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="asset_tag"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Asset Tag"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: 'Status is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Status">
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="ip_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="IP Address"
                      fullWidth
                      placeholder="192.168.1.100"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="mac_address"
                  control={control}
                  rules={{ required: 'MAC address is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="MAC Address"
                      fullWidth
                      placeholder="00:11:22:33:44:55"
                      error={!!errors.mac_address}
                      helperText={errors.mac_address?.message}
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
        title="Delete Server"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteMutation.isPending}
      />

      {/* Power Management Menu */}
      <Menu
        anchorEl={powerActionAnchor}
        open={Boolean(powerActionAnchor)}
        onClose={() => {
          setPowerActionAnchor(null);
          setSelectedServerForPower(null);
        }}
      >
        <MenuItem 
          onClick={() => handlePowerCommand('on')}
          disabled={selectedServerForPower?.power_status === 'on'}
        >
          <PlayArrow sx={{ mr: 1 }} fontSize="small" />
          Power On
        </MenuItem>
        <MenuItem 
          onClick={() => handlePowerCommand('off')}
          disabled={selectedServerForPower?.power_status === 'off'}
        >
          <Stop sx={{ mr: 1 }} fontSize="small" />
          Power Off
        </MenuItem>
        <MenuItem onClick={() => handlePowerCommand('reboot')}>
          <RestartAlt sx={{ mr: 1 }} fontSize="small" />
          Reboot
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ServersPage;