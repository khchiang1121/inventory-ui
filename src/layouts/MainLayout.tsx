import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  Notifications,
  Dashboard,
  Storage,
  Computer,
  Cloud,
  Build,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/common/Sidebar';
import { ROUTES, APP_SETTINGS } from '../constants';
import toast from 'react-hot-toast';

const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout, getUserDisplayName } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      handleProfileMenuClose();
    }
  };

  const handleProfileSettings = () => {
    navigate(ROUTES.SETTINGS);
    handleProfileMenuClose();
  };

  // Navigation items configuration
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: ROUTES.DASHBOARD,
      icon: Dashboard,
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      icon: Storage,
      children: [
        {
          id: 'data-centers',
          label: 'Data Centers',
          path: ROUTES.DATA_CENTERS,
        },
        {
          id: 'racks',
          label: 'Racks',
          path: ROUTES.RACKS,
        },
        {
          id: 'servers',
          label: 'Physical Servers',
          path: ROUTES.SERVERS,
        },
        {
          id: 'network',
          label: 'Network',
          path: ROUTES.NETWORK,
        },
      ],
    },
    {
      id: 'virtualization',
      label: 'Virtualization',
      icon: Computer,
      children: [
        {
          id: 'virtual-machines',
          label: 'Virtual Machines',
          path: ROUTES.VIRTUAL_MACHINES,
        },
        {
          id: 'vm-specifications',
          label: 'VM Specifications',
          path: ROUTES.VM_SPECIFICATIONS,
        },
        {
          id: 'tenants',
          label: 'Tenants',
          path: ROUTES.TENANTS,
        },
      ],
    },
    {
      id: 'kubernetes',
      label: 'Kubernetes',
      icon: Cloud,
      children: [
        {
          id: 'clusters',
          label: 'Clusters',
          path: ROUTES.K8S_CLUSTERS,
        },
        {
          id: 'plugins',
          label: 'Plugins',
          path: ROUTES.K8S_PLUGINS,
        },
        {
          id: 'service-mesh',
          label: 'Service Mesh',
          path: ROUTES.SERVICE_MESH,
        },
      ],
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Build,
      children: [
        {
          id: 'schedule',
          label: 'Schedule',
          path: ROUTES.MAINTENANCE_SCHEDULE,
        },
        {
          id: 'history',
          label: 'History',
          path: ROUTES.MAINTENANCE_HISTORY,
        },
      ],
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: AdminPanelSettings,
      children: [
        {
          id: 'users',
          label: 'Users',
          path: ROUTES.USERS,
        },
        {
          id: 'permissions',
          label: 'Permissions',
          path: ROUTES.PERMISSIONS,
        },
        {
          id: 'settings',
          label: 'Settings',
          path: ROUTES.SETTINGS,
        },
      ],
    },
  ];

  const drawer = (
    <Sidebar
      navigationItems={navigationItems}
      currentPath={location.pathname}
      onNavigate={(path) => {
        navigate(path);
        if (isMobile) {
          setMobileOpen(false);
        }
      }}
    />
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {APP_SETTINGS.NAME}
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>

          {/* User Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {state.user ? getUserDisplayName().charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>

          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText
                primary={getUserDisplayName()}
                secondary={state.user?.email}
              />
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleProfileSettings}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;