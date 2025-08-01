import React, { useState } from 'react';
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
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Menu,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  AccountTree,
  Settings,
  Group,
  Computer,
  Storage,
  Search,
  FilterList,
  Download,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { AnsibleApiService } from '../../services/api/ansible';
import type {
  AnsibleGroup,
  AnsibleGroupCreate,
  AnsibleGroupUpdate,
  AnsibleGroupFilter,
} from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ansible-tabpanel-${index}`}
      aria-labelledby={`ansible-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AnsibleGroupsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AnsibleGroup | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedGroupForMenu, setSelectedGroupForMenu] = useState<AnsibleGroup | null>(null);

  const queryClient = useQueryClient();

  // Build filter object
  const filters: AnsibleGroupFilter = {
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive') : undefined,
  };

  // Queries
  const {
    data: groupsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ansible-groups', filters, page, rowsPerPage],
    queryFn: () => AnsibleApiService.getGroups({ ...filters, page: page + 1, page_size: rowsPerPage }),
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: AnsibleApiService.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ansible-groups'] });
      setCreateDialogOpen(false);
      toast.success('Ansible group created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnsibleGroupUpdate }) =>
      AnsibleApiService.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ansible-groups'] });
      setEditingGroup(null);
      toast.success('Ansible group updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update group: ${error.message}`);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: AnsibleApiService.deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ansible-groups'] });
      toast.success('Ansible group deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete group: ${error.message}`);
    },
  });

  // Form handling
  const { control, handleSubmit, reset, formState: { errors } } = useForm<AnsibleGroupCreate>({
    defaultValues: {
      name: '',
      description: '',
      is_special: false,
      status: 'active',
    },
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm<AnsibleGroupUpdate>();

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateGroup = (data: AnsibleGroupCreate) => {
    createGroupMutation.mutate(data);
  };

  const handleEditGroup = (data: AnsibleGroupUpdate) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data });
    }
  };

  const handleDeleteGroup = (group: AnsibleGroup) => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const handleOpenEditDialog = (group: AnsibleGroup) => {
    setEditingGroup(group);
    setEditValue('name', group.name);
    setEditValue('description', group.description);
    setEditValue('is_special', group.is_special);
    setEditValue('status', group.status);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, group: AnsibleGroup) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedGroupForMenu(group);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedGroupForMenu(null);
  };

  const handleSelectAllGroups = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedGroups(groupsData?.results.map(group => group.id) || []);
    } else {
      setSelectedGroups([]);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const groups = groupsData?.results || [];
  const totalCount = groupsData?.count || 0;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ansible Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage Ansible groups, hosts, variables, and inventory configuration
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ansible management tabs">
          <Tab icon={<Group />} label="Groups" />
          <Tab icon={<Computer />} label="Hosts" />
          <Tab icon={<Settings />} label="Variables" />
          <Tab icon={<Storage />} label="Inventory" />
        </Tabs>
      </Box>

      {/* Groups Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              disabled={selectedGroups.length === 0}
            >
              Export ({selectedGroups.length})
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Group
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load Ansible groups: {error.message}
          </Alert>
        )}

        {/* Groups Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedGroups.length > 0 && selectedGroups.length < groups.length}
                      checked={groups.length > 0 && selectedGroups.length === groups.length}
                      onChange={handleSelectAllGroups}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Hosts</TableCell>
                  <TableCell>Variables</TableCell>
                  <TableCell>Children</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      Loading groups...
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      No groups found
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => handleSelectGroup(group.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {group.name}
                          </Typography>
                          {group.is_special && (
                            <Chip label="Special" size="small" color="primary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {group.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={group.status}
                          size="small"
                          color={group.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {group.is_special ? 'Special' : 'Regular'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {group.all_hosts?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {Object.keys(group.all_variables || {}).length}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {group.child_groups?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, group)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>
      </TabPanel>

      {/* Other tabs placeholders */}
      <TabPanel value={tabValue} index={1}>
        <Typography>Ansible Hosts management coming soon...</Typography>
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Typography>Ansible Variables management coming soon...</Typography>
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <Typography>Ansible Inventory viewer coming soon...</Typography>
      </TabPanel>

      {/* Create Group Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleCreateGroup)}>
          <DialogTitle>Create Ansible Group</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Group Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
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
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="is_special"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      }
                      label="Special Group (all, ungrouped)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog
        open={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleEditSubmit(handleEditGroup)}>
          <DialogTitle>Edit Ansible Group</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={editControl}
                  rules={{ required: 'Group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Group Name"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={editControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="status"
                  control={editControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="is_special"
                  control={editControl}
                  render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={value || false}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      }
                      label="Special Group (all, ungrouped)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingGroup(null)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateGroupMutation.isPending}
            >
              {updateGroupMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => {
          handleOpenEditDialog(selectedGroupForMenu!);
          handleActionMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Navigate to group details
          handleActionMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteGroup(selectedGroupForMenu!);
          handleActionMenuClose();
        }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AnsibleGroupsPage; 