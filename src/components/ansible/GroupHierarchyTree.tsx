import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Group,
  Folder,
  FolderOpen,
  MoreVert,
  Edit,
  Delete,
  Add,
  Computer,
} from '@mui/icons-material';
import type { AnsibleGroup } from '../../types';

interface GroupHierarchyTreeProps {
  groups: AnsibleGroup[];
  selectedGroupId?: string;
  onGroupSelect?: (group: AnsibleGroup) => void;
  onGroupEdit?: (group: AnsibleGroup) => void;
  onGroupDelete?: (group: AnsibleGroup) => void;
  onAddChild?: (parentGroup: AnsibleGroup) => void;
  onAddHost?: (group: AnsibleGroup) => void;
  showActions?: boolean;
}

interface TreeNodeProps {
  group: AnsibleGroup;
  level: number;
  isExpanded: boolean;
  onToggleExpand: (groupId: string) => void;
  selectedGroupId?: string;
  onGroupSelect?: (group: AnsibleGroup) => void;
  onGroupEdit?: (group: AnsibleGroup) => void;
  onGroupDelete?: (group: AnsibleGroup) => void;
  onAddChild?: (parentGroup: AnsibleGroup) => void;
  onAddHost?: (group: AnsibleGroup) => void;
  showActions?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  group,
  level,
  isExpanded,
  onToggleExpand,
  selectedGroupId,
  onGroupSelect,
  onGroupEdit,
  onGroupDelete,
  onAddChild,
  onAddHost,
  showActions = true,
}) => {
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const hasChildren = group.child_groups && group.child_groups.length > 0;
  const isSelected = selectedGroupId === group.id;

  return (
    <Box>
      <ListItem
        disablePadding
        sx={{
          pl: level * 2,
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <ListItemButton
          onClick={() => onGroupSelect?.(group)}
          sx={{ py: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(group.id);
                }}
              >
                {isExpanded ? <ExpandMore /> : <ChevronRight />}
              </IconButton>
            ) : (
              <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                {hasChildren ? (
                  isExpanded ? <FolderOpen /> : <Folder />
                ) : (
                  <Group />
                )}
              </Box>
            )}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={isSelected ? 'medium' : 'normal'}>
                  {group.name}
                </Typography>
                {group.is_special && (
                  <Chip label="Special" size="small" color="primary" />
                )}
                <Chip
                  label={group.status}
                  size="small"
                  color={group.status === 'active' ? 'success' : 'default'}
                />
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {group.all_hosts?.length || 0} hosts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Object.keys(group.all_variables || {}).length} vars
                </Typography>
                {group.child_groups && group.child_groups.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {group.child_groups.length} children
                  </Typography>
                )}
              </Box>
            }
          />
          
          {showActions && (
            <ListItemSecondaryAction>
              <IconButton
                size="small"
                onClick={handleActionMenuOpen}
              >
                <MoreVert />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </ListItemButton>
      </ListItem>

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {group.child_groups?.map((childGroup) => {
              // Find the full group object for the child
              // In a real implementation, you'd need to pass a full groups lookup
              const fullChildGroup = childGroup as any; // Type assertion for demo
              return (
                <TreeNode
                  key={childGroup.id}
                  group={fullChildGroup}
                  level={level + 1}
                  isExpanded={false} // You'd manage this state properly
                  onToggleExpand={onToggleExpand}
                  selectedGroupId={selectedGroupId}
                  onGroupSelect={onGroupSelect}
                  onGroupEdit={onGroupEdit}
                  onGroupDelete={onGroupDelete}
                  onAddChild={onAddChild}
                  onAddHost={onAddHost}
                  showActions={showActions}
                />
              );
            })}
          </List>
        </Collapse>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => {
          onGroupEdit?.(group);
          handleActionMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit Group
        </MenuItem>
        <MenuItem onClick={() => {
          onAddChild?.(group);
          handleActionMenuClose();
        }}>
          <Add sx={{ mr: 1 }} />
          Add Child Group
        </MenuItem>
        <MenuItem onClick={() => {
          onAddHost?.(group);
          handleActionMenuClose();
        }}>
          <Computer sx={{ mr: 1 }} />
          Add Host
        </MenuItem>
        <MenuItem 
          onClick={() => {
            onGroupDelete?.(group);
            handleActionMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete Group
        </MenuItem>
      </Menu>
    </Box>
  );
};

export const GroupHierarchyTree: React.FC<GroupHierarchyTreeProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  onGroupEdit,
  onGroupDelete,
  onAddChild,
  onAddHost,
  showActions = true,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleToggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Build hierarchy: find root groups (groups without parents)
  const rootGroups = groups.filter(group => 
    !group.parent_groups || group.parent_groups.length === 0
  );

  if (rootGroups.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No groups found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <List dense>
        {rootGroups.map((group) => (
          <TreeNode
            key={group.id}
            group={group}
            level={0}
            isExpanded={expandedGroups.has(group.id)}
            onToggleExpand={handleToggleExpand}
            selectedGroupId={selectedGroupId}
            onGroupSelect={onGroupSelect}
            onGroupEdit={onGroupEdit}
            onGroupDelete={onGroupDelete}
            onAddChild={onAddChild}
            onAddHost={onAddHost}
            showActions={showActions}
          />
        ))}
      </List>
    </Box>
  );
}; 