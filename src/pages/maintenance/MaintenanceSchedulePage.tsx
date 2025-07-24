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
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Divider,
} from '@mui/material';
import { 
  Add, 
  Event, 
  Delete,
  Edit,
  PlayArrow,
  Stop,
  Pause,
  Check,
  Cancel,
  Schedule,
  Assignment,
  Warning,
  Info,
  History,
  Refresh,
  CalendarToday,
  List as ListIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { 
  maintenanceWindows,
  maintenanceTasks,
} from '../../services/api/maintenance';
import type { MaintenanceWindow, MaintenanceTask, TableColumn } from '../../types';

interface MaintenanceWindowFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  maintenance_type: 'scheduled' | 'emergency' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  affected_systems: string[];
  assigned_technician: string;
  notification_enabled: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
}

interface MaintenanceTaskFormData {
  title: string;
  description?: string;
  maintenance_window: string;
  estimated_duration: number;
  order: number;
  required: boolean;
  task_type: 'preparation' | 'execution' | 'verification' | 'rollback';
}

const MaintenanceSchedulePage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('start_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<MaintenanceWindow[]>([]);
  const [showCreateWindowModal, setShowCreateWindowModal] = useState(false);
  const [showEditWindowModal, setShowEditWindowModal] = useState(false);
  const [editingWindow, setEditingWindow] = useState<MaintenanceWindow | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MaintenanceWindow | null>(null);
  const [showWindowDetailsModal, setShowWindowDetailsModal] = useState(false);
  const [detailsWindow, setDetailsWindow] = useState<MaintenanceWindow | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [windowActionAnchor, setWindowActionAnchor] = useState<null | HTMLElement>(null);
  const [selectedWindowForAction, setSelectedWindowForAction] = useState<MaintenanceWindow | null>(null);

  // Form management
  const { control: windowControl, handleSubmit: handleWindowSubmit, reset: resetWindow, formState: { errors: windowErrors } } = useForm<MaintenanceWindowFormData>();
  const { control: taskControl, handleSubmit: handleTaskSubmit, reset: resetTask, formState: { errors: taskErrors } } = useForm<MaintenanceTaskFormData>();

  // Queries
  const { data: windowsData, isLoading: windowsLoading } = useQuery({
    queryKey: ['maintenance-windows', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => maintenanceWindows.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 0,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['maintenance-tasks', page, pageSize, sortBy, sortOrder, searchValue],
    queryFn: () => maintenanceTasks.list({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue || undefined,
    }),
    enabled: currentTab === 1,
  });

  const { data: upcomingWindows } = useQuery({
    queryKey: ['upcoming-maintenance'],
    queryFn: () => maintenanceWindows.getUpcoming({ page_size: 10 }),
  });

  const { data: historyWindows } = useQuery({
    queryKey: ['maintenance-history'],
    queryFn: () => maintenanceWindows.getHistory({ page_size: 10 }),
  });

  const { data: calendarData } = useQuery({
    queryKey: ['maintenance-calendar', selectedDate],
    queryFn: () => {
      const startDate = new Date(selectedDate);
      startDate.setDate(1);
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      return maintenanceWindows.getCalendar(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    },
    enabled: currentView === 'calendar',
  });

  const { data: windowTasks } = useQuery({
    queryKey: ['window-tasks', detailsWindow?.id],
    queryFn: () => detailsWindow ? maintenanceWindows.getTasks(detailsWindow.id) : null,
    enabled: !!detailsWindow && showWindowDetailsModal,
  });

  // Mutations
  const createWindowMutation = useMutation({
    mutationFn: maintenanceWindows.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-windows'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-calendar'] });
      toast.success('Maintenance window created successfully');
      setShowCreateWindowModal(false);
      resetWindow();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create maintenance window');
    },
  });

  const updateWindowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceWindow> }) =>
      maintenanceWindows.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-windows'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-calendar'] });
      toast.success('Maintenance window updated successfully');
      setShowEditWindowModal(false);
      setEditingWindow(null);
      resetWindow();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update maintenance window');
    },
  });

  const deleteWindowMutation = useMutation({
    mutationFn: maintenanceWindows.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-windows'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-calendar'] });
      toast.success('Maintenance window deleted successfully');
      setShowDeleteModal(false);
      setDeletingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete maintenance window');
    },
  });

  const windowActionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'complete' | 'cancel' }) => {
      switch (action) {
        case 'start': return maintenanceWindows.start(id);
        case 'complete': return maintenanceWindows.complete(id);
        case 'cancel': return maintenanceWindows.cancel(id);
        default: throw new Error('Invalid action');
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-windows'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-calendar'] });
      toast.success(`Maintenance window ${action}ed successfully`);
      setWindowActionAnchor(null);
      setSelectedWindowForAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute maintenance action');
    },
  });

  // Table columns definition
  const windowsColumns: TableColumn[] = useMemo(() => [
    {
      id: 'title',
      label: 'Title',
      minWidth: 200,
      sortable: true,
    },
    {
      id: 'maintenance_type',
      label: 'Type',
      minWidth: 100,
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value}
          color={value === 'emergency' ? 'error' : value === 'preventive' ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      minWidth: 100,
      sortable: false,
      format: (value) => (
        <Chip
          size="small"
          label={value}
          color={value === 'critical' ? 'error' : value === 'high' ? 'warning' : 'default'}
        />
      ),
    },
    {
      id: 'start_time',
      label: 'Start Time',
      minWidth: 150,
      sortable: true,
      format: (value) => new Date(value).toLocaleString(),
    },
    {
      id: 'end_time',
      label: 'End Time',
      minWidth: 150,
      sortable: true,
      format: (value) => new Date(value).toLocaleString(),
    },
    {
      id: 'assigned_technician',
      label: 'Technician',
      minWidth: 120,
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

  const tasksColumns: TableColumn[] = useMemo(() => [
    {
      id: 'title',
      label: 'Task Title',
      minWidth: 200,
      sortable: true,
    },
    {
      id: 'maintenance_window_title',
      label: 'Maintenance Window',
      minWidth: 150,
      sortable: false,
      format: (value) => value || '-',
    },
    {
      id: 'task_type',
      label: 'Type',
      minWidth: 100,
      sortable: false,
      format: (value) => (
        <Chip size="small" label={value} variant="outlined" />
      ),
    },
    {
      id: 'estimated_duration',
      label: 'Duration (min)',
      minWidth: 100,
      align: 'center',
      sortable: false,
    },
    {
      id: 'order',
      label: 'Order',
      minWidth: 80,
      align: 'center',
      sortable: true,
    },
    {
      id: 'required',
      label: 'Required',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => value ? <Check color="success" /> : '-',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'progress_percentage',
      label: 'Progress',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value) => value !== undefined ? (
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{ flex: 1, mr: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption">{value}%</Typography>
        </Box>
      ) : '-',
    },
  ], []);

  // Event handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearchValue('');
    setSelectedItems([]);
  };

  const handleCreateWindow = (data: MaintenanceWindowFormData) => {
    createWindowMutation.mutate(data);
  };

  const handleEditWindow = (item: MaintenanceWindow) => {
    setEditingWindow(item);
    resetWindow({
      title: item.title,
      description: item.description,
      start_time: new Date(item.start_time).toISOString().slice(0, 16),
      end_time: new Date(item.end_time).toISOString().slice(0, 16),
      maintenance_type: item.maintenance_type,
      priority: item.priority,
      affected_systems: item.affected_systems || [],
      assigned_technician: item.assigned_technician,
      notification_enabled: item.notification_enabled,
      status: item.status,
    });
    setShowEditWindowModal(true);
  };

  const handleUpdateWindow = (data: MaintenanceWindowFormData) => {
    if (editingWindow) {
      updateWindowMutation.mutate({ id: editingWindow.id, data });
    }
  };

  const handleDeleteWindow = (item: MaintenanceWindow) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteWindowMutation.mutate(deletingItem.id);
    }
  };

  const handleViewWindowDetails = (window: MaintenanceWindow) => {
    setDetailsWindow(window);
    setShowWindowDetailsModal(true);
  };

  const handleWindowAction = (window: MaintenanceWindow, event: React.MouseEvent<HTMLElement>) => {
    setSelectedWindowForAction(window);
    setWindowActionAnchor(event.currentTarget);
  };

  const handleWindowActionCommand = (action: 'start' | 'complete' | 'cancel') => {
    if (selectedWindowForAction) {
      windowActionMutation.mutate({ id: selectedWindowForAction.id, action });
    }
  };

  const maintenanceTypeOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'preventive', label: 'Preventive' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const taskTypeOptions = [
    { value: 'preparation', label: 'Preparation' },
    { value: 'execution', label: 'Execution' },
    { value: 'verification', label: 'Verification' },
    { value: 'rollback', label: 'Rollback' },
  ];

  const getCurrentData = () => {
    switch (currentTab) {
      case 0: return windowsData?.results || [];
      case 1: return tasksData?.results || [];
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (currentTab) {
      case 0: return windowsLoading;
      case 1: return tasksLoading;
      default: return false;
    }
  };

  const getCurrentColumns = () => {
    switch (currentTab) {
      case 0: return windowsColumns;
      case 1: return tasksColumns;
      default: return [];
    }
  };

  const getCurrentTotalCount = () => {
    switch (currentTab) {
      case 0: return windowsData?.count || 0;
      case 1: return tasksData?.count || 0;
      default: return 0;
    }
  };

  const data = getCurrentData();
  const isLoading = getCurrentLoading();
  const columns = getCurrentColumns();
  const totalCount = getCurrentTotalCount();

  if (isLoading && data.length === 0) {
    return <LoadingSpinner fullScreen message="Loading maintenance schedule..." />;
  }

  const upcomingCount = upcomingWindows?.results.length || 0;
  const scheduledCount = windowsData?.results.filter(w => w.status === 'scheduled').length || 0;
  const inProgressCount = windowsData?.results.filter(w => w.status === 'in_progress').length || 0;
  const completedCount = historyWindows?.results.filter(w => w.status === 'completed').length || 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Maintenance Schedule
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Schedule and manage maintenance windows, tasks, and workflows.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['maintenance-windows'] });
              queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
              queryClient.invalidateQueries({ queryKey: ['maintenance-calendar'] });
            }}
          >
            Refresh
          </Button>
          <Button
            variant={currentView === 'calendar' ? 'contained' : 'outlined'}
            startIcon={<CalendarToday />}
            onClick={() => setCurrentView('calendar')}
          >
            Calendar
          </Button>
          <Button
            variant={currentView === 'list' ? 'contained' : 'outlined'}
            startIcon={<ListIcon />}
            onClick={() => setCurrentView('list')}
          >
            List
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateWindowModal(true)}
          >
            Schedule Maintenance
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{upcomingCount}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PlayArrow sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">{inProgressCount}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Event sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{scheduledCount}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Scheduled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Check sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{completedCount}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {currentView === 'calendar' ? (
        /* Calendar View */
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6">Maintenance Calendar</Typography>
              <TextField
                type="month"
                value={selectedDate.slice(0, 7)}
                onChange={(e) => setSelectedDate(e.target.value + '-01')}
                size="small"
              />
            </Box>
            {calendarData && calendarData.windows.length > 0 ? (
              <Grid container spacing={2}>
                {calendarData.windows.map((window, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { elevation: 2 },
                        borderColor: window.color || 'grey.300'
                      }}
                      onClick={() => handleViewWindowDetails(window)}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {window.title}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {new Date(window.start).toLocaleDateString()} - {new Date(window.end).toLocaleDateString()}
                        </Typography>
                        <Box mt={1}>
                          <StatusBadge status={window.status} />
                          <Chip
                            size="small"
                            label={window.priority}
                            color={window.priority === 'critical' ? 'error' : window.priority === 'high' ? 'warning' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No maintenance windows scheduled for this month
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Box>
          {/* Tabs */}
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Maintenance Windows" />
              <Tab label="Tasks" />
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
            onEdit={currentTab === 0 ? handleEditWindow : undefined}
            onDelete={currentTab === 0 ? handleDeleteWindow : undefined}
            onView={currentTab === 0 ? handleViewWindowDetails : undefined}
            bulkActions={currentTab === 0 ? [
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
            rowActions={currentTab === 0 ? [
              {
                id: 'maintenance-actions',
                label: 'Actions',
                icon: Assignment,
                onClick: (window) => handleWindowAction(window, {} as any),
              },
            ] : []}
            emptyStateMessage={`No ${currentTab === 0 ? 'maintenance windows' : 'tasks'} found. ${currentTab === 0 ? 'Schedule your first maintenance window to get started.' : ''}`}
          />
        </Box>
      )}

      {/* Create/Edit Maintenance Window Modal */}
      <Dialog
        open={showCreateWindowModal || showEditWindowModal}
        onClose={() => {
          setShowCreateWindowModal(false);
          setShowEditWindowModal(false);
          setEditingWindow(null);
          resetWindow();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showCreateWindowModal ? 'Schedule Maintenance Window' : 'Edit Maintenance Window'}
        </DialogTitle>
        <form onSubmit={handleWindowSubmit(showCreateWindowModal ? handleCreateWindow : handleUpdateWindow)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="title"
                  control={windowControl}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Title"
                      fullWidth
                      error={!!windowErrors.title}
                      helperText={windowErrors.title?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={windowControl}
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
                <Controller
                  name="start_time"
                  control={windowControl}
                  rules={{ required: 'Start time is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Time"
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!windowErrors.start_time}
                      helperText={windowErrors.start_time?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="end_time"
                  control={windowControl}
                  rules={{ required: 'End time is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Time"
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!windowErrors.end_time}
                      helperText={windowErrors.end_time?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!windowErrors.maintenance_type}>
                  <InputLabel>Maintenance Type</InputLabel>
                  <Controller
                    name="maintenance_type"
                    control={windowControl}
                    rules={{ required: 'Maintenance type is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Maintenance Type">
                        {maintenanceTypeOptions.map((option) => (
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
                <FormControl fullWidth error={!!windowErrors.priority}>
                  <InputLabel>Priority</InputLabel>
                  <Controller
                    name="priority"
                    control={windowControl}
                    rules={{ required: 'Priority is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Priority">
                        {priorityOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="assigned_technician"
                  control={windowControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Assigned Technician"
                      fullWidth
                      placeholder="Enter technician name or email"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowCreateWindowModal(false);
                setShowEditWindowModal(false);
                setEditingWindow(null);
                resetWindow();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createWindowMutation.isPending || updateWindowMutation.isPending}
            >
              {createWindowMutation.isPending || updateWindowMutation.isPending ? 'Saving...' : 'Save'}
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
        title="Delete Maintenance Window"
        message={`Are you sure you want to delete "${deletingItem?.title}"?`}
        confirmText="Delete"
        type="error"
        destructive
        loading={deleteWindowMutation.isPending}
      />

      {/* Maintenance Window Details Modal */}
      <Dialog
        open={showWindowDetailsModal}
        onClose={() => {
          setShowWindowDetailsModal(false);
          setDetailsWindow(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Maintenance Window Details - {detailsWindow?.title}
        </DialogTitle>
        <DialogContent>
          {detailsWindow && (
            <Box>
              {/* Window Info */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {detailsWindow.maintenance_type}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Type
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Chip
                        label={detailsWindow.priority}
                        color={detailsWindow.priority === 'critical' ? 'error' : detailsWindow.priority === 'high' ? 'warning' : 'default'}
                      />
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        Priority
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <StatusBadge status={detailsWindow.status} />
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        Status
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="info.main">
                        {windowTasks?.results.length || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Tasks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Schedule Info */}
              <Typography variant="h6" gutterBottom>
                Schedule Information
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Start Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(detailsWindow.start_time).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    End Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(detailsWindow.end_time).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {detailsWindow.description || 'No description provided'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Tasks */}
              <Typography variant="h6" gutterBottom>
                Tasks ({windowTasks?.results.length || 0})
              </Typography>
              {windowTasks && windowTasks.results.length > 0 ? (
                <List>
                  {windowTasks.results.map((task, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Assignment 
                          color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Type: {task.task_type} | Duration: {task.estimated_duration} min | Order: {task.order}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Status: {task.status} | Progress: {task.progress_percentage || 0}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" style={{ fontStyle: 'italic' }}>
                  No tasks defined for this maintenance window
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWindowDetailsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Window Actions Menu */}
      <Menu
        anchorEl={windowActionAnchor}
        open={Boolean(windowActionAnchor)}
        onClose={() => {
          setWindowActionAnchor(null);
          setSelectedWindowForAction(null);
        }}
      >
        <MenuItem 
          onClick={() => handleWindowActionCommand('start')}
          disabled={selectedWindowForAction?.status !== 'scheduled'}
        >
          <PlayArrow sx={{ mr: 1 }} fontSize="small" />
          Start Maintenance
        </MenuItem>
        <MenuItem 
          onClick={() => handleWindowActionCommand('complete')}
          disabled={selectedWindowForAction?.status !== 'in_progress'}
        >
          <Check sx={{ mr: 1 }} fontSize="small" />
          Complete Maintenance
        </MenuItem>
        <MenuItem onClick={() => handleWindowActionCommand('cancel')}>
          <Cancel sx={{ mr: 1 }} fontSize="small" />
          Cancel Maintenance
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MaintenanceSchedulePage;