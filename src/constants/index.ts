// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8201/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/refresh/',
    ME: '/auth/me/',
    CHANGE_PASSWORD: '/auth/change-password/',
  },

  // Infrastructure Management
  INFRASTRUCTURE: {
    FABRICATIONS: '/fabrications/',
    PHASES: '/phases/',
    DATA_CENTERS: '/data-centers/',
    ROOMS: '/rooms/',
    RACKS: '/racks/',
  },

  // Network Management
  NETWORK: {
    VLANS: '/vlans',
    VRFS: '/vrfs/',
    BGP_CONFIGS: '/bgp-configs/',
    NETWORK_INTERFACES: '/network-interfaces/',
  },

  // Purchase Management
  PURCHASE: {
    REQUISITIONS: '/purchase-requisitions/',
    ORDERS: '/purchase-orders/',
  },

  // Baremetal Management
  BAREMETAL: {
    BRANDS: '/brands/',
    MODELS: '/baremetal-models/',
    GROUPS: '/baremetal-groups/',
    SERVERS: '/baremetals/',
    QUOTAS: '/baremetal-group-tenant-quotas/',
  },

  // Virtualization Management
  VIRTUALIZATION: {
    TENANTS: '/tenants/',
    VM_SPECIFICATIONS: '/vm-specifications/',
    VIRTUAL_MACHINES: '/virtual-machines/',
  },

  // Kubernetes Management
  KUBERNETES: {
    CLUSTERS: '/k8s-clusters/',
    PLUGINS: '/k8s-cluster-plugins/',
    SERVICE_MESHES: '/service-meshes/',
    CLUSTER_SERVICE_MESHES: '/k8s-cluster-service-meshes/',
    BASTION_ASSOCIATIONS: '/bastion-cluster-associations/',
  },

  // User Management
  USERS: {
    USERS: '/users/',
    PERMISSIONS: '/permissions/',
  },

  // Dashboard and Analytics
  DASHBOARD: {
    STATS: '/dashboard/stats/',
    RESOURCE_UTILIZATION: '/dashboard/resource-utilization/',
    ACTIVITY_LOG: '/dashboard/activity-log/',
  },

  // Maintenance
  MAINTENANCE: {
    WINDOWS: '/maintenance-windows/',
    TASKS: '/maintenance-tasks/',
  },
} as const;

// Application Settings
export const APP_SETTINGS = {
  NAME: 'VirtFlow',
  VERSION: '1.0.0',
  DESCRIPTION: 'Virtualization Resource Management System',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_THEME: 'light',
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  NOTIFICATION_DURATION: 5000, // 5 seconds
} as const;

// Status Colors
export const STATUS_COLORS = {
  active: '#4caf50',
  inactive: '#9e9e9e',
  maintenance: '#ff9800',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
  info: '#2196f3',
  running: '#4caf50',
  stopped: '#f44336',
  paused: '#ff9800',
  creating: '#2196f3',
  deleting: '#f44336',
  pending: '#ff9800',
  completed: '#4caf50',
  failed: '#f44336',
  cancelled: '#9e9e9e',
} as const;

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  
  // Infrastructure
  INFRASTRUCTURE: '/infrastructure',
  DATA_CENTERS: '/infrastructure/data-centers',
  RACKS: '/infrastructure/racks',
  SERVERS: '/infrastructure/servers',
  NETWORK: '/infrastructure/network',
  
  // Virtualization
  VIRTUALIZATION: '/virtualization',
  VIRTUAL_MACHINES: '/virtualization/vms',
  VM_SPECIFICATIONS: '/virtualization/specifications',
  TENANTS: '/virtualization/tenants',
  
  // Kubernetes
  KUBERNETES: '/kubernetes',
  K8S_CLUSTERS: '/kubernetes/clusters',
  K8S_PLUGINS: '/kubernetes/plugins',
  SERVICE_MESH: '/kubernetes/service-mesh',
  
  // Maintenance
  MAINTENANCE: '/maintenance',
  MAINTENANCE_SCHEDULE: '/maintenance/schedule',
  MAINTENANCE_HISTORY: '/maintenance/history',
  
  // Administration
  ADMIN: '/admin',
  USERS: '/admin/users',
  PERMISSIONS: '/admin/permissions',
  SETTINGS: '/admin/settings',
} as const;

// Permission Levels
export const PERMISSIONS = {
  VIEW: 'view',
  ADD: 'add',
  CHANGE: 'change',
  DELETE: 'delete',
  ADMIN: 'admin',
} as const;

// Resource Types
export const RESOURCE_TYPES = {
  FABRICATION: 'fabrication',
  PHASE: 'phase',
  DATA_CENTER: 'datacenter',
  ROOM: 'room',
  RACK: 'rack',
  BAREMETAL: 'baremetal',
  VIRTUAL_MACHINE: 'virtualmachine',
  K8S_CLUSTER: 'k8scluster',
  TENANT: 'tenant',
  USER: 'user',
} as const;

// Chart Colors
export const CHART_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
  '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
] as const;

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 150,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  IP_ADDRESS: {
    PATTERN: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  },
  MAC_ADDRESS: {
    PATTERN: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  },
  VLAN_ID: {
    MIN: 1,
    MAX: 4094,
  },
  BGP_AS: {
    MIN: 1,
    MAX: 4294967295,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'virtflow_auth_token',
  REFRESH_TOKEN: 'virtflow_refresh_token',
  USER_SETTINGS: 'virtflow_user_settings',
  THEME: 'virtflow_theme',
  LANGUAGE: 'virtflow_language',
  LAST_ACTIVITY: 'virtflow_last_activity',
  SAVED_FILTERS: 'virtflow_saved_filters',
  DASHBOARD_LAYOUT: 'virtflow_dashboard_layout',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  SERVER_STATUS: 'server_status',
  VM_STATUS: 'vm_status',
  CLUSTER_STATUS: 'cluster_status',
  MAINTENANCE_UPDATE: 'maintenance_update',
  RESOURCE_USAGE: 'resource_usage',
  ALERT: 'alert',
  NOTIFICATION: 'notification',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  CREATE_SUCCESS: 'Resource created successfully.',
  UPDATE_SUCCESS: 'Resource updated successfully.',
  DELETE_SUCCESS: 'Resource deleted successfully.',
  IMPORT_SUCCESS: 'Data imported successfully.',
  EXPORT_SUCCESS: 'Data exported successfully.',
  BACKUP_SUCCESS: 'Backup completed successfully.',
} as const;