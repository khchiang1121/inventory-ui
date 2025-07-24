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
} from '@mui/material';
import { 
  Add, 
  Computer, 
  Delete,
  PowerSettingsNew,
  RestartAlt,
  Stop,
  PlayArrow,
  Pause,
  Memory,
  Storage as StorageIcon,
  Speed,
  Monitor,
  PhotoCamera,
  History,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  virtualMachines, 
  vmSpecifications, 
  tenants 
} from '../../services/api/virtualization';
import type { VirtualMachine, VMSpecification, Tenant, TableColumn } from '../../types';

interface VMFormData {
  name: string;
  description?: string;
  specification: string;
  tenant: string;
  vcpus: number;
  memory_gb: number;
  disk_gb: number;
  operating_system: string;
  network_config: string;
  status: 'running' | 'stopped' | 'paused' | 'suspended' | 'creating' | 'error';
}

const VirtualMachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<VirtualMachine[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VirtualMachine | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<VirtualMachine | null>(null);
  const [powerActionAnchor, setPowerActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedVmForPower, setSelectedVmForPower] = useState<VirtualMachine | null>(null);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [consoleVm, setConsoleVm] = useState<VirtualMachine | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotVm, setSnapshotVm] = useState<VirtualMachine | null>(null);

  // Form management
  const { control, handleSubmit, reset, formState: { errors } } = useForm<VMFormData>();

  // Queries
  const { data: vmsData, isLoading: vmsLoading } = useQuery({
    queryKey: ['virtual-machines', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => virtualMachines.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
  });

  const { data: specificationsData } = useQuery({
    queryKey: ['vm-specifications'],
    queryFn: () => vmSpecifications.list({ page_size: 100 }),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenants.list({ page_size: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: virtualMachines.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-machines'] });
      toast.success('Virtual machine created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create virtual machine');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VirtualMachine> }) =>
      virtualMachines.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-machines'] });
      toast.success('Virtual machine updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update virtual machine');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: virtualMachines.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-machines'] });
      toast.success('Virtual machine deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete virtual machine');
    },
  });

  const powerMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' | 'pause' | 'resume' }) => {
      switch (action) {
        case 'start': return virtualMachines.start(id);
        case 'stop': return virtualMachines.stop(id);
        case 'restart': return virtualMachines.restart(id);
        case 'pause': return virtualMachines.pause(id);
        case 'resume': return virtualMachines.resume(id);
        default: throw new Error('Invalid action');
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['virtual-machines'] });
      toast.success(`Virtual machine ${action} command sent successfully`);
      setPowerActionAnchor(null);
      setSelectedVmForPower(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute power command');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => virtualMachines.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-machines'] });
      toast.success(`${selectedItems.length} virtual machines deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete virtual machines');
    },
  });

  // Table columns definition
  const columns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'VM Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'tenant_name',
      label: 'Tenant',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'operating_system',
      label: 'OS',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'vcpus',
      label: 'vCPUs',
      minWidth: 80,
      align: 'center',
      sortable: true,
    },
    {
      id: 'memory_gb',
      label: 'Memory (GB)',
      minWidth: 100,
      align: 'center',
      sortable: true,
    },
    {
      id: 'disk_gb',
      label: 'Disk (GB)',
      minWidth: 100,
      align: 'center',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
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
      id: 'uptime',
      label: 'Uptime',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'created_at',
      label: 'Created',
      minWidth: 120,
      sortable: true,
      format: (value) => new Date(value).toLocaleDateString(),
    },
  ], []);

  // Event handlers
  const handleCreate = (data: VMFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (item: VirtualMachine) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description,
      specification: item.specification,
      tenant: item.tenant,
      vcpus: item.vcpus,
      memory_gb: item.memory_gb,
      disk_gb: item.disk_gb,
      operating_system: item.operating_system,
      network_config: item.network_config,
      status: item.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: VMFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleDelete = (item: VirtualMachine) => {
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

  const handlePowerAction = (vm: VirtualMachine, event: React.MouseEvent<HTMLElement>) => {
    setSelectedVmForPower(vm);
    setPowerActionAnchor(event.currentTarget);
  };

  const handlePowerCommand = (action: 'start' | 'stop' | 'restart' | 'pause' | 'resume') => {
    if (selectedVmForPower) {
      powerMutation.mutate({ id: selectedVmForPower.id, action });
    }
  };

  const handleConsole = (vm: VirtualMachine) => {
    setConsoleVm(vm);
    setShowConsoleModal(true);
  };

  const handleSnapshot = (vm: VirtualMachine) => {
    setSnapshotVm(vm);
    setShowSnapshotModal(true);
  };

  const statusOptions = [
    { value: 'running', label: 'Running' },
    { value: 'stopped', label: 'Stopped' },
    { value: 'paused', label: 'Paused' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'creating', label: 'Creating' },
    { value: 'error', label: 'Error' },
  ];

  const data = vmsData?.results || [];
  const totalCount = vmsData?.count || 0;

  if (vmsLoading && !vmsData) {
    return <LoadingSpinner fullScreen message="Loading virtual machines..." />;
  }

  const runningVms = data.filter(vm => vm.status === 'running').length;
  const totalCpuUsage = data.length > 0 ? data.reduce((sum, vm) => sum + (vm.cpu_usage || 0), 0) / data.length : 0;
  const totalMemoryUsage = data.length > 0 ? data.reduce((sum, vm) => sum + (vm.memory_usage || 0), 0) / data.length : 0;
  const totalVcpus = data.reduce((sum, vm) => sum + vm.vcpus, 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Virtual Machines
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage virtual machines, monitor resources, and control VM lifecycle.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['virtual-machines'] })}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
          >
            Create VM
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
                Total VMs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PlayArrow sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{runningVms}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Running VMs
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

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={data}
        loading={vmsLoading}
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
            onClick: (vm) => handlePowerAction(vm, {} as any),
          },
          {
            id: 'console',
            label: 'Console',
            icon: Monitor,
            onClick: handleConsole,
          },
          {
            id: 'snapshot',
            label: 'Snapshots',
            icon: PhotoCamera,
            onClick: handleSnapshot,
          },
        ]}
        emptyStateMessage="No virtual machines found. Create your first VM to get started."
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
          {showCreateModal ? 'Create Virtual Machine' : 'Edit Virtual Machine'}
        </DialogTitle>
        <form onSubmit={handleSubmit(showCreateModal ? handleCreate : handleUpdate)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'VM name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="VM Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.tenant}>
                  <InputLabel>Tenant</InputLabel>
                  <Controller
                    name="tenant"
                    control={control}
                    rules={{ required: 'Tenant is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Tenant">
                        {tenantsData?.results.map((tenant) => (
                          <MenuItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
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
                <FormControl fullWidth error={!!errors.specification}>
                  <InputLabel>Specification</InputLabel>
                  <Controller
                    name="specification"
                    control={control}
                    rules={{ required: 'Specification is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Specification">
                        {specificationsData?.results.map((spec) => (
                          <MenuItem key={spec.id} value={spec.id}>
                            {spec.name} ({spec.vcpus} vCPU, {spec.memory_gb}GB RAM)
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="operating_system"
                  control={control}
                  rules={{ required: 'Operating system is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Operating System"
                      fullWidth
                      error={!!errors.operating_system}
                      helperText={errors.operating_system?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="vcpus"
                  control={control}
                  rules={{ required: 'vCPUs is required', min: { value: 1, message: 'Must be at least 1' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="vCPUs"
                      type="number"
                      fullWidth
                      error={!!errors.vcpus}
                      helperText={errors.vcpus?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="memory_gb"
                  control={control}
                  rules={{ required: 'Memory is required', min: { value: 1, message: 'Must be at least 1GB' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Memory (GB)"
                      type="number"
                      fullWidth
                      error={!!errors.memory_gb}
                      helperText={errors.memory_gb?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="disk_gb"
                  control={control}
                  rules={{ required: 'Disk size is required', min: { value: 1, message: 'Must be at least 1GB' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Disk (GB)"
                      type="number"
                      fullWidth
                      error={!!errors.disk_gb}
                      helperText={errors.disk_gb?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="network_config"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Network Configuration"
                      fullWidth
                      placeholder="bridge0"
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
        title="Delete Virtual Machine"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
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
          setSelectedVmForPower(null);
        }}
      >
        <MenuItem 
          onClick={() => handlePowerCommand('start')}
          disabled={selectedVmForPower?.status === 'running'}
        >
          <PlayArrow sx={{ mr: 1 }} fontSize="small" />
          Start
        </MenuItem>
        <MenuItem 
          onClick={() => handlePowerCommand('stop')}
          disabled={selectedVmForPower?.status === 'stopped'}
        >
          <Stop sx={{ mr: 1 }} fontSize="small" />
          Stop
        </MenuItem>
        <MenuItem 
          onClick={() => handlePowerCommand('restart')}
          disabled={selectedVmForPower?.status !== 'running'}
        >
          <RestartAlt sx={{ mr: 1 }} fontSize="small" />
          Restart
        </MenuItem>
        <MenuItem 
          onClick={() => handlePowerCommand('pause')}
          disabled={selectedVmForPower?.status !== 'running'}
        >
          <Pause sx={{ mr: 1 }} fontSize="small" />
          Pause
        </MenuItem>
        <MenuItem 
          onClick={() => handlePowerCommand('resume')}
          disabled={selectedVmForPower?.status !== 'paused'}
        >
          <PlayArrow sx={{ mr: 1 }} fontSize="small" />
          Resume
        </MenuItem>
      </Menu>

      {/* Console Modal */}
      <Dialog
        open={showConsoleModal}
        onClose={() => setShowConsoleModal(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          VM Console - {consoleVm?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            VM console functionality would be implemented here using noVNC or similar technology.
          </Alert>
          <Box 
            sx={{ 
              height: 400, 
              bgcolor: 'black', 
              color: 'green', 
              fontFamily: 'monospace',
              p: 2,
              border: 1,
              borderColor: 'grey.300'
            }}
          >
            <Typography>VM Console placeholder for {consoleVm?.name}</Typography>
            <Typography color="text.secondary" variant="caption">
              Console access would be implemented with proper VM console integration
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConsoleModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VirtualMachinesPage;