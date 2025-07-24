import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, AuthTokens, LoadingState } from '../types';
import { authService } from '../services/auth/authService';

// Define the auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Define action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: { user: User } };

// Define the context interface
interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  hasPermission: (permission: string, resourceType?: string, resourceId?: number) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasGroup: (groupName: string) => boolean;
  getUserDisplayName: () => string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };

    default:
      return state;
  }
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'AUTH_START' });

      try {
        const user = await authService.initialize();
        
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
          // Start session monitoring
          authService.startSessionMonitoring();
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: { error: 'No valid session found' } });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: 'Failed to initialize authentication' } 
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const { user } = await authService.login({ username, password });
      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
      
      // Start session monitoring
      authService.startSessionMonitoring();
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update user function
  const updateUser = (user: User): void => {
    dispatch({ type: 'UPDATE_USER', payload: { user } });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Permission checking functions
  const hasPermission = (
    permission: string, 
    resourceType?: string, 
    resourceId?: number
  ): boolean => {
    return authService.hasPermission(permission, resourceType, resourceId);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return authService.hasAnyPermission(permissions);
  };

  const hasGroup = (groupName: string): boolean => {
    return authService.hasGroup(groupName);
  };

  const getUserDisplayName = (): string => {
    return authService.getUserDisplayName();
  };

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    updateUser,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasGroup,
    getUserDisplayName,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for requiring authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { state } = useAuth();

    if (!state.isAuthenticated) {
      // Redirect to login or show login component
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
}

// HOC for requiring specific permissions
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string,
  resourceType?: string
): React.ComponentType<P> {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission } = useAuth();

    if (!hasPermission(requiredPermission, resourceType)) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          color: '#f44336'
        }}>
          <h3>Access Denied</h3>
          <p>You don't have permission to access this resource.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for checking permissions
export const usePermissions = () => {
  const { hasPermission, hasAnyPermission, hasGroup } = useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    hasGroup,
    canView: (resource?: string) => hasPermission('view', resource),
    canAdd: (resource?: string) => hasPermission('add', resource),
    canChange: (resource?: string) => hasPermission('change', resource),
    canDelete: (resource?: string) => hasPermission('delete', resource),
    isAdmin: () => hasPermission('admin'),
  };
};

// Component for conditional rendering based on permissions
interface PermissionGateProps {
  permission: string;
  resourceType?: string;
  resourceId?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  resourceType,
  resourceId,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission, resourceType, resourceId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AuthContext;