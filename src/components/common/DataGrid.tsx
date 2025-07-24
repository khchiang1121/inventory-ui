import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Toolbar,
  Typography,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  MoreVert,
  FilterList,
  GetApp,
  Delete,
  Edit,
  Visibility,
} from '@mui/icons-material';
import type { TableColumn, ActionItem, AppliedFilter } from '../../types';

export interface DataGridProps<T> {
  columns: TableColumn[];
  data: T[];
  loading?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchValue?: string;
  selectedItems?: T[];
  filters?: AppliedFilter[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSearchChange?: (search: string) => void;
  onSelectionChange?: (selected: T[]) => void;
  onFilterChange?: (filters: AppliedFilter[]) => void;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  bulkActions?: ActionItem[];
  rowActions?: ActionItem[];
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableSelection?: boolean;
  enableExport?: boolean;
  emptyStateMessage?: string;
  getRowId?: (row: T) => string | number;
}

export function DataGrid<T extends Record<string, any>>({
  columns = [],
  data = [],
  loading = false,
  totalCount = 0,
  page = 0,
  pageSize = 25,
  sortBy,
  sortOrder = 'asc',
  searchValue = '',
  selectedItems = [],
  filters = [],
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onSelectionChange,
  onFilterChange,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  bulkActions = [],
  rowActions = [],
  enableSearch = true,
  enableFilters = true,
  enableSelection = true,
  enableExport = true,
  emptyStateMessage = 'No data available',
  getRowId = (row) => row.id,
}: DataGridProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowForActions, setSelectedRowForActions] = useState<T | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const selectedIds = useMemo(() => 
    new Set(selectedItems.map(item => {
      try {
        return getRowId(item);
      } catch (error) {
        console.error('Error getting row ID:', error);
        return null;
      }
    }).filter(id => id !== null)), 
    [selectedItems, getRowId]
  );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.checked) {
        onSelectionChange?.(data || []);
      } else {
        onSelectionChange?.([]);
      }
    } catch (error) {
      console.error('Error handling select all:', error);
    }
  };

  const handleSelectRow = (row: T) => {
    try {
      const id = getRowId(row);
      const isSelected = selectedIds.has(id);
      
      if (isSelected) {
        onSelectionChange?.(selectedItems.filter(item => {
          try {
            return getRowId(item) !== id;
          } catch (error) {
            console.error('Error getting row ID for filtering:', error);
            return false;
          }
        }));
      } else {
        onSelectionChange?.([...selectedItems, row]);
      }
    } catch (error) {
      console.error('Error handling row selection:', error);
    }
  };

  const handleSort = (columnId: string) => {
    try {
      const isAsc = sortBy === columnId && sortOrder === 'asc';
      onSortChange?.(columnId, isAsc ? 'desc' : 'asc');
    } catch (error) {
      console.error('Error handling sort:', error);
    }
  };

  const handleRowActionClick = (event: React.MouseEvent<HTMLElement>, row: T) => {
    try {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedRowForActions(row);
    } catch (error) {
      console.error('Error handling row action click:', error);
    }
  };

  const handleCloseRowActions = () => {
    setAnchorEl(null);
    setSelectedRowForActions(null);
  };

  const handleRowActionSelect = (action: ActionItem) => {
    try {
      if (selectedRowForActions) {
        action.onClick(selectedRowForActions);
      }
      handleCloseRowActions();
    } catch (error) {
      console.error('Error handling row action select:', error);
      handleCloseRowActions();
    }
  };

  const handleExport = () => {
    // Basic CSV export functionality
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csvContent = [
      columns.map(col => col.label || '').join(','),
      ...data.map(row => 
        columns.map(col => {
          try {
            const value = row[col.id];
            return typeof value === 'string' ? `"${value}"` : value;
          } catch (error) {
            console.error('Error processing CSV value:', error);
            return '';
          }
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Safe date handling with fallback
    try {
      const date = new Date();
      const dateString = date.toISOString();
      const datePart = dateString ? dateString.split('T')[0] : 'export';
      link.download = `export-${datePart}.csv`;
    } catch (error) {
      link.download = 'export.csv';
    }
    
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const renderCellValue = (column: TableColumn, value: any, row: any) => {
    try {
      if (column.format) {
        return column.format(value, row);
      }
      
      if (value === null || value === undefined) {
        return '-';
      }
      
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      
      return value;
    } catch (error) {
      console.error('Error rendering cell value:', error);
      return '-';
    }
  };

  const isSelected = selectedItems.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < (data?.length || 0);
  const isAllSelected = selectedItems.length === (data?.length || 0) && (data?.length || 0) > 0;

  return (
    <Paper sx={{ width: '100%' }}>
      {/* Toolbar */}
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(isSelected && {
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
          }),
        }}
      >
        {isSelected ? (
          <>
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selectedItems.length} selected
            </Typography>
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                variant="outlined"
                size="small"
                startIcon={action.icon && <action.icon />}
                onClick={() => {
                  try {
                    action.onClick(selectedItems);
                  } catch (error) {
                    console.error('Error handling bulk action:', error);
                  }
                }}
                disabled={action.disabled}
                color={action.color}
                sx={{ ml: 1 }}
              >
                {action.label}
              </Button>
            ))}
          </>
        ) : (
          <>
            <Typography
              sx={{ flex: '1 1 100%' }}
              variant="h6"
              component="div"
            >
              {totalCount} items
            </Typography>
            
            {enableSearch && (
              <TextField
                size="small"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => {
                  try {
                    onSearchChange?.(e.target.value);
                  } catch (error) {
                    console.error('Error handling search change:', error);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200, mr: 1 }}
              />
            )}
            
            {enableFilters && (
              <IconButton
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                color={filters.length > 0 ? 'primary' : 'default'}
              >
                <FilterList />
              </IconButton>
            )}
            
            {enableExport && (
              <IconButton onClick={handleExport}>
                <GetApp />
              </IconButton>
            )}
          </>
        )}
      </Toolbar>

      {/* Applied Filters */}
      {filters.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          {filters.map((filter, index) => (
            <Chip
              key={index}
              label={filter.label}
              onDelete={() => {
                const newFilters = filters.filter((_, i) => i !== index);
                onFilterChange?.(newFilters);
              }}
              size="small"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
      )}

      {/* Table */}
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {enableSelection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={data.length === 0}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label || ''}
                    </TableSortLabel>
                  ) : (
                    column.label || ''
                  )}
                </TableCell>
              ))}
              {rowActions.length > 0 && (
                <TableCell align="center" width={60}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={(columns?.length || 0) + (enableSelection ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (data?.length || 0) === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={(columns?.length || 0) + (enableSelection ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography color="textSecondary">
                    {emptyStateMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                try {
                  const id = getRowId(row);
                  const isItemSelected = selectedIds.has(id);
                  
                  return (
                    <TableRow
                      hover
                      key={id}
                      selected={isItemSelected}
                      onClick={() => {
                      try {
                        onRowClick?.(row);
                      } catch (error) {
                        console.error('Error handling row click:', error);
                      }
                    }}
                      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    >
                      {enableSelection && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={() => handleSelectRow(row)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.id} align={column.align}>
                          {renderCellValue(column, row[column.id], row)}
                        </TableCell>
                      ))}
                      {rowActions.length > 0 && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleRowActionClick(e, row)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                } catch (error) {
                  console.error('Error rendering table row:', error);
                  return null;
                }
              }).filter(Boolean)
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={(_, newPage) => {
          try {
            onPageChange?.(newPage);
          } catch (error) {
            console.error('Error handling page change:', error);
          }
        }}
        onRowsPerPageChange={(e) => {
          try {
            onPageSizeChange?.(parseInt(e.target.value, 10));
          } catch (error) {
            console.error('Error handling page size change:', error);
          }
        }}
      />

      {/* Row Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseRowActions}
      >
        {onView && (
          <MenuItem onClick={() => handleRowActionSelect({ 
            id: 'view', 
            label: 'View', 
            icon: Visibility, 
            onClick: onView 
          })}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handleRowActionSelect({ 
            id: 'edit', 
            label: 'Edit', 
            icon: Edit, 
            onClick: onEdit 
          })}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => handleRowActionSelect({ 
            id: 'delete', 
            label: 'Delete', 
            icon: Delete, 
            onClick: onDelete,
            color: 'error' 
          })}>
            <Delete sx={{ mr: 1 }} fontSize="small" color="error" />
            Delete
          </MenuItem>
        )}
        {rowActions.map((action) => (
          <MenuItem key={action.id} onClick={() => handleRowActionSelect(action)}>
            {action.icon && (
              <Box component={action.icon} sx={{ mr: 1 }} fontSize="small" />
            )}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
} 