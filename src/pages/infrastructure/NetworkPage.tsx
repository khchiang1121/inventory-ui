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
  Tabs,
  Tab,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  Add, 
  NetworkCheck, 
  Delete,
  Router,
  Settings,
  Security,
  ExpandMore,
  Refresh,
  Cable,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  vlans, 
  vrfs, 
  bgpConfigs, 
  networkInterfaces 
} from '../../services/api/infrastructure';
import type { VLAN, VRF, BGPConfig, NetworkInterface, TableColumn } from '../../types';

interface VLANFormData {
  vlan_id: number;
  name: string;
  description?: string;
  subnet: string;
  gateway: string;
  dhcp_enabled: boolean;
  status: 'active' | 'inactive';
}

interface VRFFormData {
  name: string;
  description?: string;
  rd: string;
  import_targets: string[];
  export_targets: string[];
  status: 'active' | 'inactive';
}

interface BGPFormData {
  as_number: number;
  router_id: string;
  description?: string;
  status: 'active' | 'inactive';
}

const NetworkPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  // Form management
  const { control: vlanControl, handleSubmit: handleVlanSubmit, reset: resetVlan, formState: { errors: vlanErrors } } = useForm<VLANFormData>();
  const { control: vrfControl, handleSubmit: handleVrfSubmit, reset: resetVrf, formState: { errors: vrfErrors } } = useForm<VRFFormData>();
  const { control: bgpControl, handleSubmit: handleBgpSubmit, reset: resetBgp, formState: { errors: bgpErrors } } = useForm<BGPFormData>();

  // Queries
  const { data: vlansData, isLoading: vlansLoading } = useQuery({
    queryKey: ['vlans', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => vlans.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 0,
  });

  const { data: vrfsData, isLoading: vrfsLoading } = useQuery({
    queryKey: ['vrfs', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => vrfs.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 1,
  });

  const { data: bgpConfigsData, isLoading: bgpConfigsLoading } = useQuery({
    queryKey: ['bgp-configs', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => bgpConfigs.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 2,
  });

  const { data: interfacesData, isLoading: interfacesLoading } = useQuery({
    queryKey: ['network-interfaces', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => networkInterfaces.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 3,
  });

  // Mutations
  const createVlanMutation = useMutation({
    mutationFn: vlans.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vlans'] });
      toast.success('VLAN created successfully');
      setShowCreateModal(false);
      resetVlan();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create VLAN');
    },
  });

  const createVrfMutation = useMutation({
    mutationFn: vrfs.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrfs'] });
      toast.success('VRF created successfully');
      setShowCreateModal(false);
      resetVrf();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create VRF');
    },
  });

  const createBgpMutation = useMutation({
    mutationFn: bgpConfigs.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgp-configs'] });
      toast.success('BGP configuration created successfully');
      setShowCreateModal(false);
      resetBgp();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create BGP configuration');
    },
  });

  const deleteVlanMutation = useMutation({
    mutationFn: vlans.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vlans'] });
      toast.success('VLAN deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete VLAN');
    },
  });

  const deleteVrfMutation = useMutation({
    mutationFn: vrfs.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrfs'] });
      toast.success('VRF deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete VRF');
    },
  });

  const deleteBgpMutation = useMutation({
    mutationFn: bgpConfigs.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgp-configs'] });
      toast.success('BGP configuration deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete BGP configuration');
    },
  });

  // Column definitions
  const vlanColumns: TableColumn[] = useMemo(() => [
    {
      id: 'vlan_id',
      label: 'VLAN ID',
      minWidth: 80,
      sortable: true,
    },
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'subnet',
      label: 'Subnet',
      minWidth: 120,
      sortable: false,
    },
    {
      id: 'gateway',
      label: 'Gateway',
      minWidth: 120,
      sortable: false,
    },
    {
      id: 'dhcp_enabled',
      label: 'DHCP',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value ? 'Enabled' : 'Disabled'}
          color={value ? 'success' : 'default'}
        />
      ),
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

  const vrfColumns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'rd',
      label: 'Route Distinguisher',
      minWidth: 150,
      sortable: false,
    },
    {
      id: 'import_targets',
      label: 'Import Targets',
      minWidth: 150,
      sortable: false,
      format: (value) => Array.isArray(value) ? value.join(', ') : '-',
    },
    {
      id: 'export_targets',
      label: 'Export Targets',
      minWidth: 150,
      sortable: false,
      format: (value) => Array.isArray(value) ? value.join(', ') : '-',
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

  const bgpColumns: TableColumn[] = useMemo(() => [
    {
      id: 'as_number',
      label: 'AS Number',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'router_id',
      label: 'Router ID',
      minWidth: 120,
      sortable: false,
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      sortable: false,
      format: (value) => value || '-',
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

  const interfaceColumns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Interface',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'mac_address',
      label: 'MAC Address',
      minWidth: 140,
      sortable: false,
    },
    {
      id: 'ip_address',
      label: 'IP Address',
      minWidth: 120,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'interface_type',
      label: 'Type',
      minWidth: 100,
      sortable: false,
      format: (value) => (
        <Chip size="small" label={value} variant="outlined" />
      ),
    },
    {
      id: 'speed',
      label: 'Speed',
      minWidth: 80,
      sortable: false,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
    },
  ], []);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearchValue('');
    setSelectedItems([]);
  };

  const handleCreateVlan = (data: VLANFormData) => {
    createVlanMutation.mutate(data);
  };

  const handleCreateVrf = (data: VRFFormData) => {
    createVrfMutation.mutate(data);
  };

  const handleCreateBgp = (data: BGPFormData) => {
    createBgpMutation.mutate(data);
  };

  const handleDelete = (item: any) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      switch (currentTab) {
        case 0:
          deleteVlanMutation.mutate(deletingItem.id);
          break;
        case 1:
          deleteVrfMutation.mutate(deletingItem.id);
          break;
        case 2:
          deleteBgpMutation.mutate(deletingItem.id);
          break;
      }
    }
  };

  const getCurrentData = () => {
    switch (currentTab) {
      case 0: return vlansData?.results || [];
      case 1: return vrfsData?.results || [];
      case 2: return bgpConfigsData?.results || [];
      case 3: return interfacesData?.results || [];
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (currentTab) {
      case 0: return vlansLoading;
      case 1: return vrfsLoading;
      case 2: return bgpConfigsLoading;
      case 3: return interfacesLoading;
      default: return false;
    }
  };

  const getCurrentColumns = () => {
    switch (currentTab) {
      case 0: return vlanColumns;
      case 1: return vrfColumns;
      case 2: return bgpColumns;
      case 3: return interfaceColumns;
      default: return [];
    }
  };

  const getCurrentTotalCount = () => {
    switch (currentTab) {
      case 0: return vlansData?.count || 0;
      case 1: return vrfsData?.count || 0;
      case 2: return bgpConfigsData?.count || 0;
      case 3: return interfacesData?.count || 0;
      default: return 0;
    }
  };

  const data = getCurrentData();
  const isLoading = getCurrentLoading();
  const columns = getCurrentColumns();
  const totalCount = getCurrentTotalCount();

  if (isLoading && data.length === 0) {
    return <LoadingSpinner fullScreen message="Loading network configuration..." />;
  }

  const tabLabels = ['VLANs', 'VRFs', 'BGP Configs', 'Interfaces'];
  const canCreate = currentTab < 3; // Can't create interfaces directly

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Network Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Configure VLANs, VRFs, BGP, and monitor network interfaces.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              switch (currentTab) {
                case 0: queryClient.invalidateQueries({ queryKey: ['vlans'] }); break;
                case 1: queryClient.invalidateQueries({ queryKey: ['vrfs'] }); break;
                case 2: queryClient.invalidateQueries({ queryKey: ['bgp-configs'] }); break;
                case 3: queryClient.invalidateQueries({ queryKey: ['network-interfaces'] }); break;
              }
            }}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateModal(true)}
            >
              Add {tabLabels[currentTab].slice(0, -1)}
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
                <NetworkCheck sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{vlansData?.count || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                VLANs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Router sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{vrfsData?.count || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                VRFs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Settings sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">{bgpConfigsData?.count || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                BGP Configs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Cable sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{interfacesData?.count || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Interfaces
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
          <Tab label="VLANs" />
          <Tab label="VRFs" />
          <Tab label="BGP Configs" />
          <Tab label="Network Interfaces" />
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
        onDelete={handleDelete}
        enableSelection={currentTab < 3}
        bulkActions={currentTab < 3 ? [
          {
            id: 'bulk-delete',
            label: 'Delete Selected',
            icon: Delete,
            onClick: () => {
              // TODO: Implement bulk delete
            },
            color: 'error',
          },
        ] : []}
        emptyStateMessage={`No ${tabLabels[currentTab].toLowerCase()} found. ${canCreate ? 'Create your first one to get started.' : ''}`}
      />

      {/* Create Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetVlan();
          resetVrf();
          resetBgp();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create {tabLabels[currentTab].slice(0, -1)}
        </DialogTitle>
        
        {currentTab === 0 && (
          <form onSubmit={handleVlanSubmit(handleCreateVlan)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="vlan_id"
                    control={vlanControl}
                    rules={{ 
                      required: 'VLAN ID is required',
                      min: { value: 1, message: 'VLAN ID must be between 1 and 4094' },
                      max: { value: 4094, message: 'VLAN ID must be between 1 and 4094' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="VLAN ID"
                        type="number"
                        fullWidth
                        error={!!vlanErrors.vlan_id}
                        helperText={vlanErrors.vlan_id?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="name"
                    control={vlanControl}
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Name"
                        fullWidth
                        error={!!vlanErrors.name}
                        helperText={vlanErrors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={vlanControl}
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
                    name="subnet"
                    control={vlanControl}
                    rules={{ required: 'Subnet is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Subnet"
                        fullWidth
                        placeholder="192.168.1.0/24"
                        error={!!vlanErrors.subnet}
                        helperText={vlanErrors.subnet?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="gateway"
                    control={vlanControl}
                    rules={{ required: 'Gateway is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Gateway"
                        fullWidth
                        placeholder="192.168.1.1"
                        error={!!vlanErrors.gateway}
                        helperText={vlanErrors.gateway?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Controller
                      name="status"
                      control={vlanControl}
                      defaultValue="active"
                      render={({ field }) => (
                        <Select {...field} label="Status">
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name="dhcp_enabled"
                      control={vlanControl}
                      defaultValue={false}
                      render={({ field }) => (
                        <Select
                          {...field}
                          displayEmpty
                          value={field.value ? 'true' : 'false'}
                          onChange={(e) => field.onChange(e.target.value === 'true')}
                        >
                          <MenuItem value="">DHCP Status</MenuItem>
                          <MenuItem value="true">Enabled</MenuItem>
                          <MenuItem value="false">Disabled</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createVlanMutation.isPending}>
                {createVlanMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        )}

        {currentTab === 1 && (
          <form onSubmit={handleVrfSubmit(handleCreateVrf)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="name"
                    control={vrfControl}
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="VRF Name"
                        fullWidth
                        error={!!vrfErrors.name}
                        helperText={vrfErrors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="rd"
                    control={vrfControl}
                    rules={{ required: 'Route Distinguisher is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Route Distinguisher"
                        fullWidth
                        placeholder="65000:100"
                        error={!!vrfErrors.rd}
                        helperText={vrfErrors.rd?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={vrfControl}
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
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Controller
                      name="status"
                      control={vrfControl}
                      defaultValue="active"
                      render={({ field }) => (
                        <Select {...field} label="Status">
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createVrfMutation.isPending}>
                {createVrfMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        )}

        {currentTab === 2 && (
          <form onSubmit={handleBgpSubmit(handleCreateBgp)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="as_number"
                    control={bgpControl}
                    rules={{ 
                      required: 'AS Number is required',
                      min: { value: 1, message: 'AS Number must be valid' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="AS Number"
                        type="number"
                        fullWidth
                        error={!!bgpErrors.as_number}
                        helperText={bgpErrors.as_number?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="router_id"
                    control={bgpControl}
                    rules={{ required: 'Router ID is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Router ID"
                        fullWidth
                        placeholder="192.168.1.1"
                        error={!!bgpErrors.router_id}
                        helperText={bgpErrors.router_id?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={bgpControl}
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
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Controller
                      name="status"
                      control={bgpControl}
                      defaultValue="active"
                      render={({ field }) => (
                        <Select {...field} label="Status">
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createBgpMutation.isPending}>
                {createBgpMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${tabLabels[currentTab].slice(0, -1)}`}
        message={`Are you sure you want to delete "${deletingItem?.name || deletingItem?.router_id}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteVlanMutation.isPending || deleteVrfMutation.isPending || deleteBgpMutation.isPending}
      />
    </Box>
  );
};

export default NetworkPage;