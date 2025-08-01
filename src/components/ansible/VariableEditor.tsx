import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Save,
  Cancel,
  Code,
  DataObject,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import type {
  AnsibleGroupVariable,
  AnsibleGroupVariableCreate,
  AnsibleGroupVariableUpdate,
} from '../../types';

interface VariableEditorProps {
  variables: AnsibleGroupVariable[];
  groupId: string;
  groupName: string;
  onVariableCreate?: (data: AnsibleGroupVariableCreate) => void;
  onVariableUpdate?: (id: string, data: AnsibleGroupVariableUpdate) => void;
  onVariableDelete?: (id: string) => void;
  readonly?: boolean;
}

interface VariableFormData {
  key: string;
  value: string;
  value_type: 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'list' | 'dict';
}

const VALUE_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
  { value: 'list', label: 'List' },
  { value: 'dict', label: 'Dictionary' },
];

const formatVariableValue = (variable: AnsibleGroupVariable): string => {
  switch (variable.value_type) {
    case 'json':
    case 'list':
    case 'dict':
      try {
        return JSON.stringify(JSON.parse(variable.value), null, 2);
      } catch {
        return variable.value;
      }
    default:
      return variable.value;
  }
};

const validateVariableValue = (value: string, type: string): boolean => {
  switch (type) {
    case 'integer':
      return !isNaN(parseInt(value, 10));
    case 'float':
      return !isNaN(parseFloat(value));
    case 'boolean':
      return ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(value.toLowerCase());
    case 'json':
    case 'list':
    case 'dict':
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    case 'string':
    default:
      return true;
  }
};

export const VariableEditor: React.FC<VariableEditorProps> = ({
  variables,
  groupId,
  groupName,
  onVariableCreate,
  onVariableUpdate,
  onVariableDelete,
  readonly = false,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<AnsibleGroupVariable | null>(null);
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());

  // Form handling
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<VariableFormData>({
    defaultValues: {
      key: '',
      value: '',
      value_type: 'string',
    },
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue, watch: watchEdit } = useForm<VariableFormData>();

  const watchedType = watch('value_type');
  const watchedEditType = watchEdit('value_type');

  // Event handlers
  const handleCreateVariable = (data: VariableFormData) => {
    if (!validateVariableValue(data.value, data.value_type)) {
      toast.error(`Invalid ${data.value_type} value`);
      return;
    }

    onVariableCreate?.({
      group: groupId,
      key: data.key,
      value: data.value,
      value_type: data.value_type,
    });

    setCreateDialogOpen(false);
    reset();
  };

  const handleEditVariable = (data: VariableFormData) => {
    if (!editingVariable) return;

    if (!validateVariableValue(data.value, data.value_type)) {
      toast.error(`Invalid ${data.value_type} value`);
      return;
    }

    onVariableUpdate?.(editingVariable.id, {
      key: data.key,
      value: data.value,
      value_type: data.value_type,
    });

    setEditingVariable(null);
    resetEdit();
  };

  const handleDeleteVariable = (variable: AnsibleGroupVariable) => {
    if (window.confirm(`Are you sure you want to delete the variable "${variable.key}"?`)) {
      onVariableDelete?.(variable.id);
    }
  };

  const handleOpenEditDialog = (variable: AnsibleGroupVariable) => {
    setEditingVariable(variable);
    setEditValue('key', variable.key);
    setEditValue('value', variable.value);
    setEditValue('value_type', variable.value_type);
  };

  const handleToggleExpand = (variableId: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableId)) {
        newSet.delete(variableId);
      } else {
        newSet.add(variableId);
      }
      return newSet;
    });
  };

  const getValuePreview = (variable: AnsibleGroupVariable): string => {
    const maxLength = 50;
    const formatted = formatVariableValue(variable);
    if (formatted.length <= maxLength) {
      return formatted;
    }
    return formatted.substring(0, maxLength) + '...';
  };

  const isComplexType = (type: string): boolean => {
    return ['json', 'list', 'dict'].includes(type);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Variables for "{groupName}"
        </Typography>
        {!readonly && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Variable
          </Button>
        )}
      </Box>

      {variables.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No variables defined for this group
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  {!readonly && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {variables.map((variable) => (
                  <React.Fragment key={variable.id}>
                    <TableRow hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {variable.key}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={variable.value_type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ 
                              fontFamily: isComplexType(variable.value_type) ? 'monospace' : 'inherit',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getValuePreview(variable)}
                          </Typography>
                          {isComplexType(variable.value_type) && (
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExpand(variable.id)}
                            >
                              {expandedVariables.has(variable.id) ? <ExpandMore /> : <Code />}
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      {!readonly && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(variable)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteVariable(variable)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                    {isComplexType(variable.value_type) && expandedVariables.has(variable.id) && (
                      <TableRow>
                        <TableCell colSpan={readonly ? 3 : 4}>
                          <Accordion expanded>
                            <AccordionDetails>
                              <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                maxRows={10}
                                value={formatVariableValue(variable)}
                                InputProps={{
                                  readOnly: true,
                                  sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                                }}
                                variant="outlined"
                              />
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create Variable Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleCreateVariable)}>
          <DialogTitle>Add Variable</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="key"
                  control={control}
                  rules={{ 
                    required: 'Variable key is required',
                    pattern: {
                      value: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                      message: 'Invalid variable name format'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Variable Key"
                      error={!!errors.key}
                      helperText={errors.key?.message || 'Use valid variable name format (e.g., my_variable)'}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="value_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select {...field} label="Type">
                        {VALUE_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="value"
                  control={control}
                  rules={{ required: 'Variable value is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Value"
                      multiline={isComplexType(watchedType)}
                      rows={isComplexType(watchedType) ? 4 : 1}
                      error={!!errors.value}
                      helperText={errors.value?.message || getTypeHelperText(watchedType)}
                      InputProps={{
                        sx: isComplexType(watchedType) ? { fontFamily: 'monospace' } : {},
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Add Variable
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Variable Dialog */}
      <Dialog
        open={!!editingVariable}
        onClose={() => setEditingVariable(null)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleEditSubmit(handleEditVariable)}>
          <DialogTitle>Edit Variable</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="key"
                  control={editControl}
                  rules={{ 
                    required: 'Variable key is required',
                    pattern: {
                      value: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                      message: 'Invalid variable name format'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Variable Key"
                      helperText="Use valid variable name format (e.g., my_variable)"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="value_type"
                  control={editControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select {...field} label="Type">
                        {VALUE_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="value"
                  control={editControl}
                  rules={{ required: 'Variable value is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Value"
                      multiline={isComplexType(watchedEditType)}
                      rows={isComplexType(watchedEditType) ? 4 : 1}
                      helperText={getTypeHelperText(watchedEditType)}
                      InputProps={{
                        sx: isComplexType(watchedEditType) ? { fontFamily: 'monospace' } : {},
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingVariable(null)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update Variable
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

function getTypeHelperText(type: string): string {
  switch (type) {
    case 'integer':
      return 'Enter a whole number (e.g., 42)';
    case 'float':
      return 'Enter a decimal number (e.g., 3.14)';
    case 'boolean':
      return 'Enter true/false, 1/0, yes/no, or on/off';
    case 'json':
      return 'Enter valid JSON (e.g., {"key": "value"})';
    case 'list':
      return 'Enter a JSON array (e.g., ["item1", "item2"])';
    case 'dict':
      return 'Enter a JSON object (e.g., {"key1": "value1", "key2": "value2"})';
    case 'string':
    default:
      return 'Enter any text value';
  }
} 