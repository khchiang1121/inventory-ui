// Common types
export * from './api/common';

// Infrastructure types
export * from './api/infrastructure';

// Virtualization types
export * from './api/virtualization';

// Component-specific types
export interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactElement;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ComponentType;
  onClick: (item?: any) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  [key: string]: string | number;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalConfig {
  title: string;
  content: React.ReactNode;
  actions?: ActionItem[];
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'datetime';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | boolean;
  };
}

export interface StepConfig {
  id: string;
  label: string;
  description?: string;
  fields: FormFieldConfig[];
  validation?: (data: any) => Promise<boolean>;
}

export interface WizardConfig {
  title: string;
  steps: StepConfig[];
  onComplete: (data: any) => Promise<void>;
  onCancel?: () => void;
}

// Theme and styling types
export interface ThemeMode {
  mode: 'light' | 'dark';
}

export interface AppSettings {
  theme: ThemeMode;
  language: string;
  notifications: {
    desktop: boolean;
    email: boolean;
    sound: boolean;
  };
  dashboard: {
    refreshInterval: number;
    showWelcome: boolean;
    defaultView: string;
  };
  tables: {
    pageSize: number;
    showFilters: boolean;
    expandableRows: boolean;
  };
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
  badge?: {
    count: number;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  };
  permissions?: string[];
}

// Search and filter types
export interface SearchConfig {
  placeholder: string;
  fields: string[];
  debounceMs?: number;
  minLength?: number;
}

export interface FilterOption {
  field: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
  options?: { value: any; label: string }[];
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
}

export interface AppliedFilter {
  field: string;
  operator: string;
  value: any;
  label: string;
}

// Error handling types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}