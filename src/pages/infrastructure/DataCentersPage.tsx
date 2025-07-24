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
  Alert,
} from '@mui/material';
import { 
  Add, 
  Storage, 
  Edit, 
  Delete, 
  Visibility,
  Dashboard,
  LocationOn,
  Power,
  Thermostat,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { dataCenters, phases, monitoring } from '../../services/api/infrastructure';
import type { DataCenter, Phase, TableColumn } from '../../types';

interface DataCenterFormData {
  name: string;
  description?: string;
  phase: string;
  location: string;
  capacity: number;
  power_capacity: number;
  cooling_capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
}

const DataCentersPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<DataCenter[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DataCenter | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<DataCenter | null>(null);

  // Form management
  const { control, handleSubmit, reset, formState: { errors } } = useForm<DataCenterFormData>();

  // Queries
  const { data: dataCentersData, isLoading: dataCentersLoading } = useQuery({
    queryKey: ['data-centers', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => dataCenters.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
  });

  const { data: phasesData } = useQuery({
    queryKey: ['phases'],
    queryFn: () => phases.list({ page_size: 100 }),
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => monitoring.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: dataCenters.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-centers'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast.success('Data center created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create data center');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataCenter> }) =>
      dataCenters.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-centers'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast.success('Data center updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update data center');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: dataCenters.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-centers'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast.success('Data center deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete data center');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => dataCenters.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-centers'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast.success(`${selectedItems.length} data centers deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete data centers');
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
      id: 'location',
      label: 'Location',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'phase_name',
      label: 'Phase',
      minWidth: 100,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'capacity',
      label: 'Capacity',
      minWidth: 100,
      align: 'right',
      sortable: true,
      format: (value) => `${value} U`,
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
      id: 'cooling_capacity',
      label: 'Cooling Capacity',
      minWidth: 120,
      align: 'right',
      sortable: true,
      format: (value) => `${value} tons`,
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

  // Event handlers
  const handleCreate = (data: DataCenterFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (item: DataCenter) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description,
      phase: item.phase,
      location: item.location,
      capacity: item.capacity,
      power_capacity: item.power_capacity,
      cooling_capacity: item.cooling_capacity,
      status: item.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: DataCenterFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleDelete = (item: DataCenter) => {
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

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  const data = dataCentersData?.results || [];
  const totalCount = dataCentersData?.count || 0;

  if (dataCentersLoading && !dataCentersData) {
    return <LoadingSpinner fullScreen message="Loading data centers..." />;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Data Centers
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your data center infrastructure and facilities.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateModal(true)}
        >
          Add Data Center
        </Button>
      </Box>

      {/* System Health Cards */}
      {systemHealth && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Storage sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{systemHealth.data_centers_count}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Total Data Centers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Dashboard sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">{systemHealth.capacity_utilization.toFixed(1)}%</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Capacity Utilization
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Power sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">{systemHealth.power_consumption.toFixed(1)} kW</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Power Consumption
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Thermostat sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">{systemHealth.temperature_avg.toFixed(1)}°C</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Average Temperature
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={data}
        loading={dataCentersLoading}
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
        emptyStateMessage="No data centers found. Create your first data center to get started."
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
          {showCreateModal ? 'Create Data Center' : 'Edit Data Center'}
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
                <Controller
                  name="location"
                  control={control}
                  rules={{ required: 'Location is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Location"
                      fullWidth
                      error={!!errors.location}
                      helperText={errors.location?.message}
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
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.phase}>
                  <InputLabel>Phase</InputLabel>
                  <Controller
                    name="phase"
                    control={control}
                    rules={{ required: 'Phase is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Phase">
                        {phasesData?.results.map((phase) => (
                          <MenuItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
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
              <Grid item xs={12} sm={4}>
                <Controller
                  name="capacity"
                  control={control}
                  rules={{ 
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Capacity (U)"
                      type="number"
                      fullWidth
                      error={!!errors.capacity}
                      helperText={errors.capacity?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="power_capacity"
                  control={control}
                  rules={{ 
                    required: 'Power capacity is required',
                    min: { value: 1, message: 'Power capacity must be at least 1' }
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
              <Grid item xs={12} sm={4}>
                <Controller
                  name="cooling_capacity"
                  control={control}
                  rules={{ 
                    required: 'Cooling capacity is required',
                    min: { value: 1, message: 'Cooling capacity must be at least 1' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cooling Capacity (tons)"
                      type="number"
                      fullWidth
                      error={!!errors.cooling_capacity}
                      helperText={errors.cooling_capacity?.message}
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
        title="Delete Data Center"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default DataCentersPage;