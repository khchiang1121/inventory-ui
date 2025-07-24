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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { 
  Add, 
  Person, 
  Delete,
  Edit,
  Security,
  Block,
  Check,
  VpnKey,
  Group,
  History,
  Shield,
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
  Refresh,
  MoreVert,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  users,
  permissions,
  groups,
  activityLogs,
} from '../../services/api/admin';
import type { User, Permission, ActivityLog, TableColumn } from '../../types';

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;  
  password?: string;
  confirm_password?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  user_permissions: string[];
}

const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityUser, setActivityUser] = useState<User | null>(null);
  const [userActionAnchor, setUserActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form management
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>();
  const watchPassword = watch('password');

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => users.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 0,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissions.list({ page_size: 100 }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groups.list({ page_size: 100 }),
  });

  const { data: activityLogsData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-logs', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => activityLogs.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 1,
  });

  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', permissionsUser?.id],
    queryFn: () => permissionsUser ? users.getPermissions(permissionsUser.id) : null,
    enabled: !!permissionsUser && showPermissionsModal,
  });

  const { data: userActivity } = useQuery({
    queryKey: ['user-activity', activityUser?.id],
    queryFn: () => activityUser ? users.getActivityLog(activityUser.id, { page_size: 50 }) : null,
    enabled: !!activityUser && showActivityModal,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'deactivate' }) => {
      return action === 'activate' ? users.activate(id) : users.deactivate(id);
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User ${action}d successfully`);
      setUserActionAnchor(null);
      setSelectedUserForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: users.resetPassword,
    onSuccess: (response) => {
      toast.success(`Password reset. Temporary password: ${response.temporary_password}`);
      setUserActionAnchor(null);
      setSelectedUserForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => users.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`${selectedItems.length} users deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete users');
    },
  });

  // Table columns definition
  const usersColumns: TableColumn[] = useMemo(() => [
    {
      id: 'avatar',
      label: '',
      minWidth: 60,
      sortable: false,
      format: (value, row) => (
        <Avatar sx={{ width: 32, height: 32 }}>
          {row?.first_name?.[0] || row?.username?.[0] || '?'}
        </Avatar>
      ),
    },
    {
      id: 'username',
      label: 'Username',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'full_name',
      label: 'Full Name',
      minWidth: 150,
      sortable: false,
      format: (value, row) => `${row?.first_name || ''} ${row?.last_name || ''}`.trim() || '-',
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
      sortable: true,
    },
    {
      id: 'is_active',
      label: 'Active',
      minWidth: 90,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value ? 'Active' : 'Inactive'}
          color={value ? 'success' : 'default'}
          icon={value ? <Check /> : <Block />}
        />
      ),
    },
    {
      id: 'is_staff',
      label: 'Staff',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => value ? <Shield color="primary" /> : '-',
    },
    {
      id: 'is_superuser',
      label: 'Admin',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => value ? <AdminPanelSettings color="error" /> : '-',
    },
    {
      id: 'last_login',
      label: 'Last Login',
      minWidth: 150,
      sortable: true,
      format: (value) => value ? new Date(value).toLocaleString() : 'Never',
    },
    {
      id: 'date_joined',
      label: 'Joined',
      minWidth: 120,
      sortable: true,
      format: (value) => new Date(value).toLocaleDateString(),
    },
  ], []);

  const activityColumns: TableColumn[] = useMemo(() => [
    {
      id: 'timestamp',
      label: 'Time',
      minWidth: 150,
      sortable: true,
      format: (value) => new Date(value).toLocaleString(),
    },
    {
      id: 'user_name',
      label: 'User',
      minWidth: 120,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 120,
      sortable: false,
      format: (value) => (
        <Chip size="small" label={value} variant="outlined" />
      ),
    },
    {
      id: 'resource_type',
      label: 'Resource Type',
      minWidth: 120,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'resource_name',
      label: 'Resource',
      minWidth: 150,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'ip_address',
      label: 'IP Address',
      minWidth: 120,
      sortable: false,
    },
    {
      id: 'result',
      label: 'Result',
      minWidth: 100,
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value}
          color={value === 'success' ? 'success' : value === 'error' ? 'error' : 'default'}
        />
      ),
    },
  ], []);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearchValue('');
    setSelectedItems([]);
  };

  const handleCreate = (data: UserFormData) => {
    // Remove confirm_password from data
    const { confirm_password, ...userData } = data;
    createMutation.mutate(userData);
  };

  const handleEdit = (item: User) => {
    setEditingItem(item);
    reset({
      username: item.username,
      email: item.email,
      first_name: item.first_name,
      last_name: item.last_name,
      is_active: item.is_active,
      is_staff: item.is_staff,
      is_superuser: item.is_superuser,
      groups: item.groups || [],
      user_permissions: item.user_permissions || [],
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: UserFormData) => {
    if (editingItem) {
      // Remove password fields if not provided
      const { password, confirm_password, ...userData } = data;
      const updateData = password ? { ...userData, password } : userData;
      updateMutation.mutate({ id: editingItem.id, data: updateData });
    }
  };

  const handleDelete = (item: User) => {
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

  const handleUserAction = (user: User, event: React.MouseEvent<HTMLElement>) => {
    setSelectedUserForAction(user);
    setUserActionAnchor(event.currentTarget);
  };

  const handleToggleActive = (action: 'activate' | 'deactivate') => {
    if (selectedUserForAction) {
      toggleActiveMutation.mutate({ id: selectedUserForAction.id, action });
    }
  };

  const handleResetPassword = () => {
    if (selectedUserForAction) {
      resetPasswordMutation.mutate(selectedUserForAction.id);
    }
  };

  const handleViewPermissions = (user: User) => {
    setPermissionsUser(user);
    setShowPermissionsModal(true);
  };

  const handleViewActivity = (user: User) => {
    setActivityUser(user);
    setShowActivityModal(true);
  };

  const getCurrentData = () => {
    switch (currentTab) {
      case 0: return usersData?.results || [];
      case 1: return activityLogsData?.results || [];
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (currentTab) {
      case 0: return usersLoading;
      case 1: return activityLoading;
      default: return false;
    }
  };

  const getCurrentColumns = () => {
    switch (currentTab) {
      case 0: return usersColumns;
      case 1: return activityColumns;
      default: return [];
    }
  };

  const getCurrentTotalCount = () => {
    switch (currentTab) {
      case 0: return usersData?.count || 0;
      case 1: return activityLogsData?.count || 0;
      default: return 0;
    }
  };

  const data = getCurrentData();
  const isLoading = getCurrentLoading();
  const columns = getCurrentColumns();
  const totalCount = getCurrentTotalCount();

  if (isLoading && data.length === 0) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  const activeUsers = usersData?.results.filter(u => u.is_active).length || 0;
  const staffUsers = usersData?.results.filter(u => u.is_staff).length || 0;
  const adminUsers = usersData?.results.filter(u => u.is_superuser).length || 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage users, permissions, and monitor system activity.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
              queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
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
              Add User
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
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{usersData?.count || 0}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Check sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{activeUsers}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Shield sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{staffUsers}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Staff Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AdminPanelSettings sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">{adminUsers}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Administrators
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
          <Tab label="Users" />
          <Tab label="Activity Log" />
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
        enableSelection={currentTab === 0}
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
            id: 'user-permissions',
            label: 'Permissions',
            icon: VpnKey,
            onClick: handleViewPermissions,
          },
          {
                id: 'user-activity',
    label: 'Activity',
    icon: History,
    onClick: handleViewActivity,
          },
          {
            id: 'user-actions',
            label: 'Actions',
            icon: MoreVert,
            onClick: (user) => handleUserAction(user, {} as any),
          },
        ] : []}
        emptyStateMessage={`No ${currentTab === 0 ? 'users' : 'activity logs'} found. ${currentTab === 0 ? 'Add your first user to get started.' : ''}`}
      />

      {/* Create/Edit User Modal */}
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
          {showCreateModal ? 'Add User' : 'Edit User'}
        </DialogTitle>
        <form onSubmit={handleSubmit(showCreateModal ? handleCreate : handleUpdate)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="username"
                  control={control}
                  rules={{ 
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Username"
                      fullWidth
                      error={!!errors.username}
                      helperText={errors.username?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{ 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="password"
                  control={control}
                  rules={showCreateModal ? { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  } : {}}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={showCreateModal ? "Password" : "New Password (leave blank to keep current)"}
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="confirm_password"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (showCreateModal || watchPassword) {
                        return value === watchPassword || 'Passwords do not match';
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Confirm Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.confirm_password}
                      helperText={errors.confirm_password?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  User Status
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="is_active"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={field.onChange} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="is_staff"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={field.onChange} />}
                      label="Staff"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="is_superuser"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={field.onChange} />}
                      label="Administrator"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Groups</InputLabel>
                  <Controller
                    name="groups"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <Select
                        {...field}
                        multiple
                        label="Groups"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const group = groupsData?.results.find(g => g.id === value);
                              return (
                                <Chip key={value} label={group?.name || value} size="small" />
                              );
                            })}
                          </Box>
                        )}
                      >
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
        title="Delete User"
        message={`Are you sure you want to delete "${deletingItem?.username}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteMutation.isPending}
      />

      {/* User Permissions Modal */}
      <Dialog
        open={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setPermissionsUser(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Permissions - {permissionsUser?.username}
        </DialogTitle>
        <DialogContent>
          {userPermissions ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Groups
              </Typography>
              {userPermissions.groups.length > 0 ? (
                <Box mb={3}>
                  {userPermissions.groups.map((group, index) => (
                    <Chip key={index} label={group} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary" mb={3}>No groups assigned</Typography>
              )}

              <Typography variant="h6" gutterBottom>
                Direct Permissions
              </Typography>
              {userPermissions.permissions.length > 0 ? (
                <List>
                  {userPermissions.permissions.map((permission, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <VpnKey />
                      </ListItemIcon>
                      <ListItemText
                        primary={permission.name}
                        secondary={permission.codename}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">No direct permissions assigned</Typography>
              )}
            </Box>
          ) : (
            <LoadingSpinner message="Loading permissions..." />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermissionsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Activity Modal */}
      <Dialog
        open={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setActivityUser(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          User Activity - {activityUser?.username}
        </DialogTitle>
        <DialogContent>
          {userActivity ? (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {userActivity.results.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <History color={activity.result === 'success' ? 'success' : activity.result === 'error' ? 'error' : 'default'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.action}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Resource: {activity.resource_type} - {activity.resource_name}
                        </Typography>
                        <Typography variant="caption">
                          IP: {activity.ip_address} | Result: {activity.result}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {userActivity.results.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No activity found"
                    secondary="This user has no recorded activity"
                  />
                </ListItem>
              )}
            </List>
          ) : (
            <LoadingSpinner message="Loading activity..." />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivityModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Actions Menu */}
      <Menu
        anchorEl={userActionAnchor}
        open={Boolean(userActionAnchor)}
        onClose={() => {
          setUserActionAnchor(null);
          setSelectedUserForAction(null);
        }}
      >
        <MenuItem 
          onClick={() => handleToggleActive(selectedUserForAction?.is_active ? 'deactivate' : 'activate')}
        >
          {selectedUserForAction?.is_active ? <Block sx={{ mr: 1 }} fontSize="small" /> : <Check sx={{ mr: 1 }} fontSize="small" />}
          {selectedUserForAction?.is_active ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <VpnKey sx={{ mr: 1 }} fontSize="small" />
          Reset Password
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UsersPage;