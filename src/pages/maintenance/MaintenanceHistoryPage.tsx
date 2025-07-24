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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import { 
  History,
  Refresh,
  Delete,
  Visibility,
  TrendingUp,
  GetApp,
  FilterList,
  DateRange,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Cancel,
  PlayArrow,
  ExpandMore,
  Computer,
  NetworkCheck,
  Build,
  Security,
  Update,
  BugReport,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  CalendarToday,
  AccessTime,
  Person,
  Business,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInHours } from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

import { DataGrid } from '../../components/common/DataGrid';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { maintenanceWindows } from '../../services/api/maintenance';
import type { MaintenanceWindow, TableColumn } from '../../types';

interface FilterFormData {
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  maintenanceType: string;
  assignee: string;
}

const MaintenanceHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('scheduled_start');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<MaintenanceWindow[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<MaintenanceWindow | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Form management
  const filterForm = useForm<FilterFormData>({
    defaultValues: {
      startDate: dateRange.start,
      endDate: dateRange.end,
      status: statusFilter,
      priority: priorityFilter,
      maintenanceType: typeFilter,
      assignee: '',
    },
  });

  // Queries
  const { data: historyData, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['maintenanceHistory', { 
      page, 
      pageSize, 
      sortBy, 
      sortOrder, 
      search: searchValue,
      startDate: dateRange.start,
      endDate: dateRange.end,
      status: statusFilter,
      priority: priorityFilter,
      type: typeFilter,
    }],
    queryFn: () => maintenanceWindows.getHistory({
      page: page + 1,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      search: searchValue,
      scheduled_start__gte: dateRange.start,
      scheduled_start__lte: dateRange.end,
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(typeFilter !== 'all' && { maintenance_type: typeFilter }),
    }),
  });

  // Table columns
  const historyColumns: TableColumn[] = [
    {
      id: 'title',
      label: 'Maintenance Window',
      sortable: true,
      format: (value: string, row: MaintenanceWindow) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getMaintenanceTypeIcon(row.maintenance_type)}
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {value}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.maintenance_type.replace('_', ' ').toUpperCase()}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'scheduled_dates',
      label: 'Scheduled Period',
      format: (value: any, row: MaintenanceWindow) => {
        const start = parseISO(row.scheduled_start);
        const end = parseISO(row.scheduled_end);
        const duration = differenceInHours(end, start);
        
        return (
          <Box>
            <Typography variant="body2">
              {format(start, 'MMM dd, yyyy HH:mm')}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Duration: {duration}h
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'actual_duration',
      label: 'Actual Duration',
      format: (value: any, row: MaintenanceWindow) => {
        if (row.actual_start && row.actual_end) {
          const actualStart = parseISO(row.actual_start);
          const actualEnd = parseISO(row.actual_end);
          const actualDuration = differenceInHours(actualEnd, actualStart);
          const scheduledDuration = differenceInHours(parseISO(row.scheduled_end), parseISO(row.scheduled_start));
          const variance = actualDuration - scheduledDuration;
          
          return (
            <Box>
              <Typography variant="body2">
                {actualDuration}h
              </Typography>
              <Typography 
                variant="caption" 
                color={variance > 0 ? 'error' : variance < 0 ? 'success' : 'textSecondary'}
              >
                {variance > 0 ? `+${variance}h` : variance < 0 ? `${variance}h` : 'On time'}
              </Typography>
            </Box>
          );
        }
        return (
          <Typography variant="body2" color="textSecondary">
            Not completed
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      format: (value: string) => <StatusBadge status={value} />,
    },
    {
      id: 'priority',
      label: 'Priority',
      format: (value: string) => (
        <Chip 
          label={value.toUpperCase()} 
          size="small" 
          color={getPriorityColor(value)} 
          variant="outlined" 
        />
      ),
    },
    {
      id: 'assignee_name',
      label: 'Assignee',
      format: (value: string) => value || 'Unassigned',
    },
    {
      id: 'affected_resources',
      label: 'Affected Resources',
      format: (value: any, row: MaintenanceWindow) => {
        const totalAffected = row.affected_servers.length + row.affected_clusters.length + row.affected_services.length;
        return (
          <Box>
            <Typography variant="body2">
              {totalAffected} resources
            </Typography>
            <Box display="flex" gap={0.5} mt={0.5}>
              {row.affected_servers.length > 0 && (
                <Chip label={`${row.affected_servers.length} servers`} size="small" variant="outlined" />
              )}
              {row.affected_clusters.length > 0 && (
                <Chip label={`${row.affected_clusters.length} clusters`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        );
      },
    },
  ];

  // Helper functions
  const getMaintenanceTypeIcon = (type: string) => {
    switch (type) {
      case 'hardware':
        return <Computer color="primary" />;
      case 'software':
        return <Update color="primary" />;
      case 'network':
        return <NetworkCheck color="primary" />;
      case 'security':
        return <Security color="primary" />;
      case 'preventive':
        return <Build color="primary" />;
      default:
        return <Build color="primary" />;
    }
  };

  const getPriorityColor = (priority: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <Cancel color="warning" />;
      case 'in-progress':
        return <PlayArrow color="info" />;
      default:
        return <Schedule color="secondary" />;
    }
  };

  // Handlers
  const handleViewDetails = (item: MaintenanceWindow) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleFilterSubmit = (data: FilterFormData) => {
    setDateRange({
      start: data.startDate,
      end: data.endDate,
    });
    setStatusFilter(data.status);
    setPriorityFilter(data.priority);
    setTypeFilter(data.maintenanceType);
    setShowFilterModal(false);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Implementation would handle the actual export
    toast.success(`Exporting maintenance history as ${format.toUpperCase()}...`);
    setShowExportModal(false);
  };

  // Filter data
  const filteredHistory = useMemo(() => {
    let filtered = historyData?.results || [];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.maintenance_type === typeFilter);
    }
    
    return filtered;
  }, [historyData, statusFilter, priorityFilter, typeFilter]);

  // Statistics
  const historyStats = useMemo(() => {
    const history = historyData?.results || [];
    const completed = history.filter(h => h.status === 'completed');
    const failed = history.filter(h => h.status === 'failed');
    const cancelled = history.filter(h => h.status === 'cancelled');
    
    // Calculate average duration variance
    const completedWithDuration = completed.filter(h => h.actual_start && h.actual_end);
    const avgVariance = completedWithDuration.length > 0 
      ? completedWithDuration.reduce((sum, h) => {
          const actualDuration = differenceInHours(parseISO(h.actual_end!), parseISO(h.actual_start!));
          const scheduledDuration = differenceInHours(parseISO(h.scheduled_end), parseISO(h.scheduled_start));
          return sum + (actualDuration - scheduledDuration);
        }, 0) / completedWithDuration.length
      : 0;
    
    return {
      total: history.length,
      completed: completed.length,
      failed: failed.length,
      cancelled: cancelled.length,
      inProgress: history.filter(h => h.status === 'in-progress').length,
      successRate: history.length > 0 ? (completed.length / history.length) * 100 : 0,
      avgVariance: Math.round(avgVariance * 10) / 10,
      hardware: history.filter(h => h.maintenance_type === 'hardware').length,
      software: history.filter(h => h.maintenance_type === 'software').length,
      network: history.filter(h => h.maintenance_type === 'network').length,
      security: history.filter(h => h.maintenance_type === 'security').length,
      preventive: history.filter(h => h.maintenance_type === 'preventive').length,
    };
  }, [historyData]);

  // Chart data
  const statusChartData = [
    { name: 'Completed', value: historyStats.completed, color: '#4caf50' },
    { name: 'Failed', value: historyStats.failed, color: '#f44336' },
    { name: 'Cancelled', value: historyStats.cancelled, color: '#ff9800' },
    { name: 'In Progress', value: historyStats.inProgress, color: '#2196f3' },
  ].filter(item => item.value > 0);

  const typeChartData = [
    { name: 'Hardware', count: historyStats.hardware },
    { name: 'Software', count: historyStats.software },
    { name: 'Network', count: historyStats.network },
    { name: 'Security', count: historyStats.security },
    { name: 'Preventive', count: historyStats.preventive },
  ].filter(item => item.count > 0);

  // Monthly trend data
  const monthlyTrendData = useMemo(() => {
    const history = historyData?.results || [];
    const months = new Map();
    
    history.forEach(item => {
      const month = format(parseISO(item.scheduled_start), 'MMM yyyy');
      if (!months.has(month)) {
        months.set(month, { month, total: 0, completed: 0, failed: 0 });
      }
      const data = months.get(month);
      data.total++;
      if (item.status === 'completed') data.completed++;
      if (item.status === 'failed') data.failed++;
    });
    
    return Array.from(months.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [historyData]);

  const tabContent = () => {
    switch (currentTab) {
      case 0:
        return (
          <DataGrid
            columns={historyColumns}
            data={filteredHistory}
            loading={historyLoading}
            totalCount={historyData?.count || 0}
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
            rowActions={[
              {
                id: 'view',
                label: 'View Details',
                icon: Visibility,
                onClick: handleViewDetails,
              },
            ]}
            enableSearch
            enableSelection
            emptyStateMessage="No maintenance history found"
          />
        );
      case 1:
        return (
          <Grid container spacing={3}>
            {/* Success Rate Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Maintenance Status Distribution
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Maintenance Type Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Maintenance Type Distribution
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={typeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Monthly Trend */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Maintenance Trend
                  </Typography>
                  <Box height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="completed" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="failed" stackId="3" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  if (historyError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading maintenance history: {historyError.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Maintenance History & Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View historical maintenance records, analyze trends, and generate reports.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilterModal(true)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={() => setShowExportModal(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['maintenanceHistory'] })}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <History color="primary" />
                <Box>
                  <Typography variant="h4">{historyStats.total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Maintenance
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
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h4">{historyStats.successRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Success Rate
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
                <AccessTime color="info" />
                <Box>
                  <Typography variant="h4">
                    {historyStats.avgVariance > 0 ? '+' : ''}{historyStats.avgVariance}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Duration Variance
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
                <ErrorIcon color="error" />
                <Box>
                  <Typography variant="h4">{historyStats.failed}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Failed Maintenance
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Filters Display */}
      {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all') && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Active Filters:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {statusFilter !== 'all' && (
              <Chip 
                label={`Status: ${statusFilter}`} 
                size="small" 
                onDelete={() => setStatusFilter('all')} 
              />
            )}
            {priorityFilter !== 'all' && (
              <Chip 
                label={`Priority: ${priorityFilter}`} 
                size="small" 
                onDelete={() => setPriorityFilter('all')} 
              />
            )}
            {typeFilter !== 'all' && (
              <Chip 
                label={`Type: ${typeFilter}`} 
                size="small" 
                onDelete={() => setTypeFilter('all')} 
              />
            )}
            <Chip 
              label={`Period: ${dateRange.start} to ${dateRange.end}`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <History />
                History Records
                {historyData?.count && (
                  <Chip size="small" label={historyData.count} />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Assessment />
                Analytics & Reports
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Content */}
      {tabContent()}

      {/* Filter Modal */}
      <Dialog
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Filter Maintenance History</DialogTitle>
        <form onSubmit={filterForm.handleSubmit(handleFilterSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="startDate"
                  control={filterForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="endDate"
                  control={filterForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={filterForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="priority"
                  control={filterForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select {...field} label="Priority">
                        <MenuItem value="all">All Priorities</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="critical">Critical</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maintenanceType"
                  control={filterForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Maintenance Type</InputLabel>
                      <Select {...field} label="Maintenance Type">
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="hardware">Hardware</MenuItem>
                        <MenuItem value="software">Software</MenuItem>
                        <MenuItem value="network">Network</MenuItem>
                        <MenuItem value="security">Security</MenuItem>
                        <MenuItem value="preventive">Preventive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFilterModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Apply Filters</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Export Modal */}
      <Dialog
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Maintenance History</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose the export format for the maintenance history report:
          </Typography>
          <Box display="flex" gap={2} mt={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleExport('csv')}
              startIcon={<GetApp />}
            >
              Export as CSV
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleExport('pdf')}
              startIcon={<GetApp />}
            >
              Export as PDF
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Details Modal */}
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
            {detailsItem && getMaintenanceTypeIcon(detailsItem.maintenance_type)}
            {detailsItem?.title}
            {detailsItem && <StatusBadge status={detailsItem.status} />}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Schedule Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday />
                        </ListItemIcon>
                        <ListItemText
                          primary="Scheduled Start"
                          secondary={format(parseISO(detailsItem.scheduled_start), 'MMM dd, yyyy HH:mm')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday />
                        </ListItemIcon>
                        <ListItemText
                          primary="Scheduled End"
                          secondary={format(parseISO(detailsItem.scheduled_end), 'MMM dd, yyyy HH:mm')}
                        />
                      </ListItem>
                      {detailsItem.actual_start && (
                        <ListItem>
                          <ListItemIcon>
                            <PlayArrow />
                          </ListItemIcon>
                          <ListItemText
                            primary="Actual Start"
                            secondary={format(parseISO(detailsItem.actual_start), 'MMM dd, yyyy HH:mm')}
                          />
                        </ListItem>
                      )}
                      {detailsItem.actual_end && (
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle />
                          </ListItemIcon>
                          <ListItemText
                            primary="Actual End"
                            secondary={format(parseISO(detailsItem.actual_end), 'MMM dd, yyyy HH:mm')}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Priority:
                        </Typography>
                        <Chip 
                          label={detailsItem.priority.toUpperCase()} 
                          size="small" 
                          color={getPriorityColor(detailsItem.priority)} 
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Type:
                        </Typography>
                        <Typography variant="body1">
                          {detailsItem.maintenance_type.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Assignee:
                        </Typography>
                        <Typography variant="body1">
                          {detailsItem.assignee_name || 'Unassigned'}
                        </Typography>
                      </Box>
                      {detailsItem.approved_by_name && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Approved By:
                          </Typography>
                          <Typography variant="body1">
                            {detailsItem.approved_by_name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
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
              {detailsItem.impact_assessment && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Impact Assessment
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {detailsItem.impact_assessment}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Affected Resources
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Servers ({detailsItem.affected_servers.length})
                        </Typography>
                        {detailsItem.affected_servers.map((serverId) => (
                          <Chip key={serverId} label={`Server ${serverId}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Clusters ({detailsItem.affected_clusters.length})
                        </Typography>
                        {detailsItem.affected_clusters.map((clusterId) => (
                          <Chip key={clusterId} label={`Cluster ${clusterId}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Services ({detailsItem.affected_services.length})
                        </Typography>
                        {detailsItem.affected_services.map((service) => (
                          <Chip key={service} label={service} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
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
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceHistoryPage;