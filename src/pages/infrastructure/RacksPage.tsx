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
  Drawer,
  IconButton,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Add, 
  ViewList, 
  ViewModule,
  Close,
  Delete,
  DeveloperBoard,
  Computer,
  Power,
  Speed,
  Timeline,
  List,
  Dashboard,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import RackVisualization from '../../components/infrastructure/RackVisualization';
import { RackMonitoringDashboard } from '../../components/monitoring';
import { racks, rooms, servers } from '../../services/api/infrastructure';
import type { Rack, Room, Baremetal, TableColumn } from '../../types';

interface RackFormData {
  name: string;
  bgp_number: string;
  as_number: number;
  old_system_id?: string;
  height_units: number;
  power_capacity: number;
  status: 'active' | 'inactive' | 'maintenance' | 'full';
}

const RacksPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Rack[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Rack | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Rack | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedRackForView, setSelectedRackForView] = useState<Rack | null>(null);
  const [showRackVisualization, setShowRackVisualization] = useState(false);

  // Form management
  const { control, handleSubmit, reset, formState: { errors } } = useForm<RackFormData>();

  // Queries
  const { data: racksData, isLoading: racksLoading } = useQuery({
    queryKey: ['racks', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => racks.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => rooms.list({ page_size: 100 }),
  });

  const { data: rackServers } = useQuery({
    queryKey: ['rack-servers', selectedRackForView?.id],
    queryFn: () => servers.list({ rack: selectedRackForView?.id }),
    enabled: !!selectedRackForView,
  });

  const { data: rackUtilization } = useQuery({
    queryKey: ['rack-utilization', selectedRackForView?.id],
    queryFn: () => racks.getUtilization(selectedRackForView!.id),
    enabled: !!selectedRackForView,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: racks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['racks'] });
      toast.success('Rack created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create rack');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Rack> }) =>
      racks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['racks'] });
      toast.success('Rack updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rack');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: racks.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['racks'] });
      toast.success('Rack deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete rack');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => racks.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['racks'] });
      toast.success(`${selectedItems.length} racks deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete racks');
    },
  });

  // Table columns definition
  const columns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Name',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'room_name',
      label: 'Room',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'position',
      label: 'Position',
      minWidth: 80,
      sortable: true,
    },
    {
      id: 'height_units',
      label: 'Height',
      minWidth: 80,
      align: 'right',
      sortable: true,
      format: (value) => `${value}U`,
    },
    {
      id: 'used_units',
      label: 'Used/Available',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value, row) => `${value || 0}/${row?.available_units || row?.height_units || 0}`,
    },
    {
      id: 'power_capacity',
      label: 'Power Capacity',
      minWidth: 120,
      align: 'right',
      sortable: true,
      format: (value) => `${value} kW`,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'as_number',
      label: 'BGP ASN',
      minWidth: 100,
      align: 'right',
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
  const handleCreate = (data: RackFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (item: Rack) => {
    setEditingItem(item);
    reset({
      name: item.name,
      bgp_number: item.bgp_number,
      as_number: item.as_number,
      old_system_id: item.old_system_id,
      height_units: item.height_units,
      power_capacity: item.power_capacity,
      status: item.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: RackFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleDelete = (item: Rack) => {
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

  const handleViewRack = (rack: Rack) => {
    setSelectedRackForView(rack);
    setShowRackVisualization(true);
  };

  const handleServerClick = (server: Baremetal) => {
    // You can add navigation to server details here
    console.log('Server clicked:', server);
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'full', label: 'Full' },
  ];

  const data = racksData?.results || [];
  const totalCount = racksData?.count || 0;

  if (racksLoading && !racksData) {
    return <LoadingSpinner fullScreen message="Loading racks..." />;
  }

  const renderGridView = () => (
    <Grid container spacing={3}>
      {data.map((rack) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={rack.id}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4,
              },
            }}
            onClick={() => handleViewRack(rack)}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DeveloperBoard sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" noWrap>
                  {rack.name}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {rack.room_name || 'No room assigned'}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="textSecondary">
                  Position: {rack.position}
                </Typography>
                <StatusBadge status={rack.status} size="small" />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption">
                  {rack.used_units || 0}/{rack.height_units}U
                </Typography>
                <Typography variant="caption">
                  {rack.power_capacity}kW
                </Typography>
              </Box>
              
              {rack.as_number && (
                <Typography variant="caption" color="textSecondary">
                  BGP AS: {rack.as_number}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Racks
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your rack infrastructure and server placement.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            {viewMode === 'list' ? <ViewModule /> : <ViewList />}
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Rack
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DeveloperBoard sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{totalCount}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Racks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Computer sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  {data.reduce((sum, rack) => sum + (parseInt(rack.used_units) || 0), 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Servers Deployed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Speed sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">
                  {data.reduce((sum, rack) => sum + (parseInt(rack.available_units) || parseInt(rack.height_units) || 0), 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Available Units
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Power sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">
                  {data.reduce((sum, rack) => sum + (parseFloat(rack.power_capacity) || 0), 0).toFixed(1)} kW
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Power Capacity
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
          aria-label="rack management tabs"
        >
          <Tab 
            label="Rack Management" 
            icon={<List />} 
            iconPosition="start"
            id="rack-tab-0"
            aria-controls="rack-tabpanel-0"
          />
          <Tab 
            label="Real-time Monitoring" 
            icon={<Timeline />} 
            iconPosition="start"
            id="rack-tab-1"
            aria-controls="rack-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Box role="tabpanel" id="rack-tabpanel-0" aria-labelledby="rack-tab-0">
          {/* Data Grid or Grid View */}
          {viewMode === 'list' ? (
        <DataGrid
          columns={columns}
          data={data}
          loading={racksLoading}
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
          onView={handleViewRack}
          bulkActions={[
            {
              id: 'bulk-delete',
              label: 'Delete Selected',
              icon: Delete,
              onClick: handleBulkDelete,
              color: 'error',
            },
          ]}
          emptyStateMessage="No racks found. Create your first rack to get started."
        />
      ) : (
        renderGridView()
      )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box role="tabpanel" id="rack-tabpanel-1" aria-labelledby="rack-tab-1">
          <RackMonitoringDashboard />
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
          {showCreateModal ? 'Create Rack' : 'Edit Rack'}
        </DialogTitle>
        <form onSubmit={handleSubmit(showCreateModal ? handleCreate : handleUpdate)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
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
                  name="height_units"
                  control={control}
                  rules={{ 
                    required: 'Height is required',
                    min: { value: 1, message: 'Height must be at least 1U' },
                    max: { value: 48, message: 'Height cannot exceed 48U' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Height (U)"
                      type="number"
                      fullWidth
                      error={!!errors.height_units}
                      helperText={errors.height_units?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="power_capacity"
                  control={control}
                  rules={{ 
                    required: 'Power capacity is required',
                    min: { value: 0, message: 'Power capacity cannot be negative' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Power Capacity (kW)"
                      type="number"
                      fullWidth
                      error={!!errors.power_capacity}
                      helperText={errors.power_capacity?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="as_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="BGP AS Number"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="bgp_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="BGP Number"
                      fullWidth
                      placeholder="BGP001"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="old_system_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Old System ID"
                      fullWidth
                      placeholder="Legacy system identifier"
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
        title="Delete Rack"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteMutation.isPending}
      />

      {/* Rack Visualization Drawer */}
      <Drawer
        anchor="right"
        open={showRackVisualization}
        onClose={() => {
          setShowRackVisualization(false);
          setSelectedRackForView(null);
        }}
        PaperProps={{
          sx: { width: 400 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Rack Details</Typography>
          <IconButton
            onClick={() => {
              setShowRackVisualization(false);
              setSelectedRackForView(null);
            }}
          >
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2, flex: 1 }}>
          {selectedRackForView && (
            <RackVisualization
              rackName={selectedRackForView.name}
              heightUnits={selectedRackForView.height_units}
              servers={rackServers?.results || []}
              powerCapacity={selectedRackForView.power_capacity}
              powerUsage={rackUtilization?.used_power || 0}
              onServerClick={handleServerClick}
            />
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default RacksPage;