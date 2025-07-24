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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  Add, 
  Security, 
  Delete,
  Edit,
  VpnKey,
  History,
  Shield,
  AdminPanelSettings,
  Visibility,
  Person,
  Check,
  Block,
  Refresh,
  Assignment,
  ExpandMore,
  ViewList,
  AccountTree,
  Timeline,
  FilterList,
  Download,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  permissions,
  users,
  groups,
} from '../../services/api/admin';
import type { Permission, User, Group, TableColumn } from '../../types';

interface PermissionFormData {
  name: string;
  content_type: string;
  object_id?: number;
  user?: number;
  permission_type: 'view' | 'add' | 'change' | 'delete';
  expires_at?: string;
}

interface PermissionMatrixData {
  resourceType: string;
  permissions: {
    view: boolean;
    add: boolean;
    change: boolean;
    delete: boolean;
  };
}

const RESOURCE_TYPES = [
  { value: 'tenant', label: 'Tenants' },
  { value: 'virtualmachine', label: 'Virtual Machines' },
  { value: 'vmspecification', label: 'VM Specifications' },
  { value: 'k8scluster', label: 'Kubernetes Clusters' },
  { value: 'k8sclusterplugin', label: 'K8s Plugins' },
  { value: 'servicemesh', label: 'Service Mesh' },
  { value: 'baremetal', label: 'Bare Metal' },
  { value: 'maintenancewindow', label: 'Maintenance Windows' },
  { value: 'user', label: 'Users' },
  { value: 'group', label: 'Groups' },
];

const PERMISSION_TYPES = [
  { value: 'view', label: 'View', color: 'info' as const },
  { value: 'add', label: 'Create', color: 'success' as const },
  { value: 'change', label: 'Edit', color: 'warning' as const },
  { value: 'delete', label: 'Delete', color: 'error' as const },
];

const PermissionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Permission[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Permission | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Permission | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [permissionMatrixUser, setPermissionMatrixUser] = useState<User | null>(null);
  const [permissionMatrixGroup, setPermissionMatrixGroup] = useState<Group | null>(null);
  const [filterResourceType, setFilterResourceType] = useState('');
  const [filterPermissionType, setFilterPermissionType] = useState('');

  // Form management
  const { control, handleSubmit, reset, formState: { errors } } = useForm<PermissionFormData>();

  // Queries
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions', page, pageSize, sortBy, sortOrder, searchValue, filterResourceType, filterPermissionType],
    queryFn: () => permissions.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
      content_type: filterResourceType || undefined,
      permission_type: filterPermissionType || undefined,
    }),
    enabled: currentTab === 0,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-permissions'],
    queryFn: () => users.list({ page_size: 100 }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups-for-permissions'],
    queryFn: () => groups.list({ page_size: 100 }),
  });

  const { data: userPermissionMatrix } = useQuery({
    queryKey: ['user-permission-matrix', permissionMatrixUser?.id],
    queryFn: () => permissionMatrixUser ? permissions.getByUser(permissionMatrixUser.id) : null,
    enabled: !!permissionMatrixUser && currentTab === 1,
  });

  const { data: groupPermissionMatrix } = useQuery({
    queryKey: ['group-permission-matrix', permissionMatrixGroup?.id],
    queryFn: () => permissionMatrixGroup ? groups.getPermissions(permissionMatrixGroup.id) : null,
    enabled: !!permissionMatrixGroup && currentTab === 1,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: permissions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission created successfully');
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create permission');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Permission> }) =>
      permissions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permission');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: permissions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete permission');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => permissions.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success(`${selectedItems.length} permissions deleted successfully`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete permissions');
    },
  });

  const assignUserPermissionMutation = useMutation({
    mutationFn: (data: { userId: string; permissionIds: string[] }) =>
      users.assignPermissions(data.userId, data.permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permission-matrix'] });
      toast.success('Permissions assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign permissions');
    },
  });

  const assignGroupPermissionMutation = useMutation({
    mutationFn: (data: { groupId: string; permissionIds: string[] }) =>
      groups.assignPermissions(data.groupId, data.permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-permission-matrix'] });
      toast.success('Permissions assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign permissions');
    },
  });

  // Table columns definition
  const permissionsColumns: TableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Permission Name',
      minWidth: 200,
      sortable: true,
      format: (value) => (
        <Box display="flex" alignItems="center">
          <VpnKey sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
          {value}
        </Box>
      ),
    },
    {
      id: 'content_type',
      label: 'Resource Type',
      minWidth: 150,
      sortable: true,
      format: (value) => {
        const resourceType = RESOURCE_TYPES.find(rt => rt.value === value);
        return (
          <Chip
            size="small"
            label={resourceType?.label || value}
            variant="outlined"
          />
        );
      },
    },
    {
      id: 'permission_type',
      label: 'Permission Type',
      minWidth: 120,
      sortable: true,
      format: (value) => {
        const permType = PERMISSION_TYPES.find(pt => pt.value === value);
        return (
          <Chip
            size="small"
            label={permType?.label || value}
            color={permType?.color || 'default'}
          />
        );
      },
    },
    {
      id: 'user_name',
      label: 'User',
      minWidth: 150,
      sortable: false,
      format: (value, row) => value ? (
        <Box display="flex" alignItems="center">
          <Person sx={{ mr: 1 }} fontSize="small" />
          {value}
        </Box>
      ) : '-',
    },
    {
      id: 'object_id',
      label: 'Object ID',
      minWidth: 100,
      sortable: false,
      format: (value) => value || 'Global',
    },
    {
      id: 'is_active',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      sortable: true,
      format: (value) => (
        <StatusBadge
          status={value ? 'active' : 'inactive'}
          text={value ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      id: 'granted_at',
      label: 'Granted At',
      minWidth: 150,
      sortable: true,
      format: (value) => new Date(value).toLocaleString(),
    },
    {
      id: 'expires_at',
      label: 'Expires At',
      minWidth: 150,
      sortable: true,
      format: (value) => value ? new Date(value).toLocaleString() : 'Never',
    },
  ], []);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearchValue('');
    setSelectedItems([]);
  };

  const handleCreate = (data: PermissionFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (item: Permission) => {
    setEditingItem(item);
    reset({
      name: item.name,
      content_type: item.content_type,
      object_id: item.object_id,
      user: item.user,
      permission_type: item.permission_type,
      expires_at: item.expires_at,
    });
    setShowEditModal(true);
  };

  const handleUpdate = (data: PermissionFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    }
  };

  const handleDelete = (item: Permission) => {
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

  const renderPermissionMatrix = () => {
    const matrixData = permissionMatrixUser ? userPermissionMatrix : groupPermissionMatrix;
    if (!matrixData) return null;

    const permissionsByResource = RESOURCE_TYPES.reduce((acc, resourceType) => {
      const resourcePermissions = matrixData.permissions.filter(
        p => p.content_type === resourceType.value
      );
      acc[resourceType.value] = {
        view: resourcePermissions.some(p => p.permission_type === 'view'),
        add: resourcePermissions.some(p => p.permission_type === 'add'),
        change: resourcePermissions.some(p => p.permission_type === 'change'),
        delete: resourcePermissions.some(p => p.permission_type === 'delete'),
      };
      return acc;
    }, {} as Record<string, { view: boolean; add: boolean; change: boolean; delete: boolean }>);

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resource Type</TableCell>
              <TableCell align="center">View</TableCell>
              <TableCell align="center">Create</TableCell>
              <TableCell align="center">Edit</TableCell>
              <TableCell align="center">Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {RESOURCE_TYPES.map((resourceType) => (
              <TableRow key={resourceType.value}>
                <TableCell component="th" scope="row">
                  {resourceType.label}
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={permissionsByResource[resourceType.value]?.view || false}
                    color="info"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={permissionsByResource[resourceType.value]?.add || false}
                    color="success"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={permissionsByResource[resourceType.value]?.change || false}
                    color="warning"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={permissionsByResource[resourceType.value]?.delete || false}
                    color="error"
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderObjectLevelPermissions = () => {
    if (!permissionsData?.results) return null;

    const objectPermissions = permissionsData.results.filter(p => p.object_id);
    const groupedByResource = objectPermissions.reduce((acc, permission) => {
      const key = permission.content_type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return (
      <Box>
        {Object.entries(groupedByResource).map(([resourceType, perms]) => {
          const resourceTypeLabel = RESOURCE_TYPES.find(rt => rt.value === resourceType)?.label || resourceType;
          return (
            <Accordion key={resourceType}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  {resourceTypeLabel} ({perms.length} permissions)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {perms.map((permission) => (
                    <ListItem key={permission.id}>
                      <ListItemIcon>
                        <VpnKey color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${permission.permission_type} permission for Object ID: ${permission.object_id}`}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              User: {permission.user_name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Granted: {new Date(permission.granted_at).toLocaleString()}
                            </Typography>
                            {permission.expires_at && (
                              <Typography variant="caption" color="warning.main">
                                Expires: {new Date(permission.expires_at).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" onClick={() => handleEdit(permission)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(permission)} color="error">
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  if (permissionsLoading && (!permissionsData?.results || permissionsData.results.length === 0)) {
    return <LoadingSpinner fullScreen message="Loading permissions..." />;
  }

  const totalPermissions = permissionsData?.count || 0;
  const activePermissions = permissionsData?.results.filter(p => p.is_active).length || 0;
  const objectLevelPermissions = permissionsData?.results.filter(p => p.object_id).length || 0;
  const expiredPermissions = permissionsData?.results.filter(p => 
    p.expires_at && new Date(p.expires_at) < new Date()
  ).length || 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Permission Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage user permissions, RBAC, and access controls across the platform.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['permissions'] });
              queryClient.invalidateQueries({ queryKey: ['user-permission-matrix'] });
              queryClient.invalidateQueries({ queryKey: ['group-permission-matrix'] });
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export Report
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Permission
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{totalPermissions}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Permissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Check sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{activePermissions}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Active Permissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{objectLevelPermissions}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Object-Level Permissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Timeline sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">{expiredPermissions}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Expired Permissions
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
          <Tab 
            label="All Permissions" 
            icon={<ViewList />}
            iconPosition="start"
          />
          <Tab 
            label="Permission Matrix" 
            icon={<ViewList />}
            iconPosition="start"
          />
          <Tab 
            label="Object-Level Permissions" 
            icon={<AccountTree />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {currentTab === 0 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Resource Type</InputLabel>
                    <Select
                      value={filterResourceType}
                      onChange={(e) => setFilterResourceType(e.target.value)}
                      label="Resource Type"
                    >
                      <MenuItem value="">All</MenuItem>
                      {RESOURCE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Permission Type</InputLabel>
                    <Select
                      value={filterPermissionType}
                      onChange={(e) => setFilterPermissionType(e.target.value)}
                      label="Permission Type"
                    >
                      <MenuItem value="">All</MenuItem>
                      {PERMISSION_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => {
                      setFilterResourceType('');
                      setFilterPermissionType('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Data Grid */}
          <DataGrid
            columns={permissionsColumns}
            data={permissionsData?.results || []}
            loading={permissionsLoading}
            totalCount={permissionsData?.count || 0}
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
            enableSelection
            bulkActions={[
              {
                id: 'bulk-delete',
                label: 'Delete Selected',
                icon: Delete,
                onClick: handleBulkDelete,
                color: 'error',
              },
            ]}
            emptyStateMessage="No permissions found. Add your first permission to get started."
          />
        </>
      )}

      {currentTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Permission Matrix
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select User</InputLabel>
                    <Select
                      value={permissionMatrixUser?.id || ''}
                      onChange={(e) => {
                        const user = usersData?.results.find(u => u.id === e.target.value);
                        setPermissionMatrixUser(user || null);
                      }}
                      label="Select User"
                    >
                      {usersData?.results.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {permissionMatrixUser && renderPermissionMatrix()}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Group Permission Matrix
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Group</InputLabel>
                    <Select
                      value={permissionMatrixGroup?.id || ''}
                      onChange={(e) => {
                        const group = groupsData?.results.find(g => g.id === e.target.value);
                        setPermissionMatrixGroup(group || null);
                      }}
                      label="Select Group"
                    >
                      {groupsData?.results.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {permissionMatrixGroup && renderPermissionMatrix()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Object-Level Permissions
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Permissions assigned to specific resource instances.
            </Typography>
            {renderObjectLevelPermissions()}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Permission Modal */}
      <Dialog
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingItem(null);
          reset();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {showCreateModal ? 'Add Permission' : 'Edit Permission'}
        </DialogTitle>
        <form onSubmit={handleSubmit(showCreateModal ? handleCreate : handleUpdate)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Permission name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Permission Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="content_type"
                  control={control}
                  rules={{ required: 'Resource type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.content_type}>
                      <InputLabel>Resource Type</InputLabel>
                      <Select {...field} label="Resource Type">
                        {RESOURCE_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="permission_type"
                  control={control}
                  rules={{ required: 'Permission type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.permission_type}>
                      <InputLabel>Permission Type</InputLabel>
                      <Select {...field} label="Permission Type">
                        {PERMISSION_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="user"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>User (Optional)</InputLabel>
                      <Select {...field} label="User (Optional)">
                        <MenuItem value="">None</MenuItem>
                        {usersData?.results.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.username} ({user.email})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="object_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Object ID (Optional)"
                      type="number"
                      fullWidth
                      helperText="Leave empty for global permission"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="expires_at"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Expires At (Optional)"
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      helperText="Leave empty for permanent permission"
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
        title="Delete Permission"
        message={`Are you sure you want to delete the permission "${deletingItem?.name}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default PermissionsPage;