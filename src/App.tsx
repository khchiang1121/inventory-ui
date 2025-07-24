import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Components
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// Infrastructure Pages
import DataCentersPage from './pages/infrastructure/DataCentersPage';
import RacksPage from './pages/infrastructure/RacksPage';
import ServersPage from './pages/infrastructure/ServersPage';
import NetworkPage from './pages/infrastructure/NetworkPage';

// Virtualization Pages
import VirtualMachinesPage from './pages/virtualization/VirtualMachinesPage';
import VMSpecificationsPage from './pages/virtualization/VMSpecificationsPage';
import TenantsPage from './pages/virtualization/TenantsPage';

// Kubernetes Pages
import ClustersPage from './pages/kubernetes/ClustersPage';
import PluginsPage from './pages/kubernetes/PluginsPage';
import ServiceMeshPage from './pages/kubernetes/ServiceMeshPage';

// Maintenance Pages
import MaintenanceSchedulePage from './pages/maintenance/MaintenanceSchedulePage';
import MaintenanceHistoryPage from './pages/maintenance/MaintenanceHistoryPage';

// Admin Pages
import UsersPage from './pages/admin/UsersPage';
import PermissionsPage from './pages/admin/PermissionsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Constants
import { ROUTES } from './constants';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderColor: '#f0f0f0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#fafafa',
            borderColor: '#f0f0f0',
          },
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Router>
              <div className="App">
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      style: {
                        background: '#4caf50',
                      },
                    },
                    error: {
                      style: {
                        background: '#f44336',
                      },
                    },
                  }}
                />

                <Routes>
                  {/* Public routes */}
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />

                  {/* Protected routes */}
                  <Route
                    path={ROUTES.HOME}
                    element={
                      <ProtectedRoute>
                        <Navigate to={ROUTES.DASHBOARD} replace />
                      </ProtectedRoute>
                    }
                  />

                  {/* Main application routes with layout */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Routes>
                            {/* Dashboard */}
                            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

                            {/* Infrastructure Management */}
                            <Route path={ROUTES.DATA_CENTERS} element={<DataCentersPage />} />
                            <Route path={ROUTES.RACKS} element={<RacksPage />} />
                            <Route path={ROUTES.SERVERS} element={<ServersPage />} />
                            <Route path={ROUTES.NETWORK} element={<NetworkPage />} />

                            {/* Virtualization Management */}
                            <Route path={ROUTES.VIRTUAL_MACHINES} element={<VirtualMachinesPage />} />
                            <Route path={ROUTES.VM_SPECIFICATIONS} element={<VMSpecificationsPage />} />
                            <Route path={ROUTES.TENANTS} element={<TenantsPage />} />

                            {/* Kubernetes Management */}
                            <Route path={ROUTES.K8S_CLUSTERS} element={<ClustersPage />} />
                            <Route path={ROUTES.K8S_PLUGINS} element={<PluginsPage />} />
                            <Route path={ROUTES.SERVICE_MESH} element={<ServiceMeshPage />} />

                            {/* Maintenance Management */}
                            <Route path={ROUTES.MAINTENANCE_SCHEDULE} element={<MaintenanceSchedulePage />} />
                            <Route path={ROUTES.MAINTENANCE_HISTORY} element={<MaintenanceHistoryPage />} />

                            {/* Administration */}
                            <Route path={ROUTES.USERS} element={<UsersPage />} />
                            <Route path={ROUTES.PERMISSIONS} element={<PermissionsPage />} />
                            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />

                            {/* Catch all route */}
                            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                          </Routes>
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </ThemeProvider>

        {/* React Query DevTools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;