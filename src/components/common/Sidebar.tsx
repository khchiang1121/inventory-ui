import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Circle,
} from '@mui/icons-material';
import type { NavigationItem } from '../../types';
import { APP_SETTINGS } from '../../constants';

interface SidebarProps {
  navigationItems: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface SidebarItemProps {
  item: NavigationItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  level?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  currentPath,
  onNavigate,
  level = 0,
}) => {
  const [open, setOpen] = useState(() => {
    // Auto-expand if current path matches any child
    if (item.children) {
      return item.children.some(child => 
        child.path && currentPath.startsWith(child.path)
      );
    }
    return false;
  });

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path ? currentPath === item.path : false;
  const hasActiveChild = hasChildren && item.children!.some(child =>
    child.path && currentPath.startsWith(child.path)
  );

  const handleClick = () => {
    if (hasChildren) {
      setOpen(!open);
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  const IconComponent = item.icon;

  return (
    <>
      <ListItem disablePadding sx={{ display: 'block' }}>
        <ListItemButton
          onClick={handleClick}
          sx={{
            minHeight: 48,
            justifyContent: 'initial',
            px: level > 0 ? 4 : 2,
            py: 1,
            backgroundColor: isActive ? 'primary.main' : 'transparent',
            color: isActive ? 'primary.contrastText' : 'inherit',
            '&:hover': {
              backgroundColor: isActive 
                ? 'primary.dark' 
                : hasActiveChild 
                  ? 'action.hover'
                  : 'action.hover',
            },
            borderLeft: hasActiveChild && !isActive ? '3px solid' : 'none',
            borderLeftColor: 'primary.main',
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: 2,
              justifyContent: 'center',
              color: isActive ? 'primary.contrastText' : 'inherit',
            }}
          >
            {level > 0 ? (
              <Circle sx={{ fontSize: 8 }} />
            ) : IconComponent ? (
              <IconComponent />
            ) : null}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Typography
                variant={level > 0 ? 'body2' : 'body1'}
                sx={{
                  fontWeight: isActive ? 600 : hasActiveChild ? 500 : 400,
                }}
              >
                {item.label}
              </Typography>
            }
            sx={{ opacity: 1 }}
          />
          
          {item.badge && (
            <Badge
              badgeContent={item.badge.count}
              color={item.badge.color}
              sx={{ mr: 1 }}
            />
          )}
          
          {hasChildren && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {open ? <ExpandLess /> : <ExpandMore />}
            </Box>
          )}
        </ListItemButton>
      </ListItem>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children!.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                currentPath={currentPath}
                onNavigate={onNavigate}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  currentPath,
  onNavigate,
}) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Logo/Brand Section */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            mb: 0.5,
          }}
        >
          {APP_SETTINGS.NAME}
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ display: 'block' }}
        >
          v{APP_SETTINGS.VERSION}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ pt: 1, pb: 1 }}>
          {navigationItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <SidebarItem
                item={item}
                currentPath={currentPath}
                onNavigate={onNavigate}
              />
              {/* Add divider after certain sections */}
              {(index === 0 || index === navigationItems.length - 2) && (
                <Divider sx={{ my: 1, mx: 2 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Footer Section */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderTopColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ display: 'block', mb: 0.5 }}
        >
          {APP_SETTINGS.DESCRIPTION}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          © 2024 VirtFlow
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;