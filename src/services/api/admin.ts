import { apiClient } from './client';
import type {
  User,
  Permission,
  ActivityLog,
} from '../../types';

// API endpoints
const ENDPOINTS = {
  USERS: '/users',
  PERMISSIONS: '/permissions',
  ACTIVITY_LOGS: '/activity-logs',
  GROUPS: '/groups',
  ROLES: '/roles',
};

// Users API
export const users = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<User>(ENDPOINTS.USERS, params),

  get: (id: string) =>
    apiClient.get<User>(`${ENDPOINTS.USERS}${id}/`),

  create: (data: Partial<User>) =>
    apiClient.post<User>(ENDPOINTS.USERS, data),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(`${ENDPOINTS.USERS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.USERS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.USERS, ids),

  changePassword: (id: string, currentPassword: string, newPassword: string) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/change-password/`, {
      current_password: currentPassword,
      new_password: newPassword
    }),

  resetPassword: (id: string) =>
    apiClient.post<{ temporary_password: string }>(`${ENDPOINTS.USERS}${id}/reset-password/`),

  activate: (id: string) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/activate/`),

  deactivate: (id: string) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/deactivate/`),

  getPermissions: (id: string) =>
    apiClient.get<{
      permissions: Permission[];
      groups: string[];
      roles: string[];
    }>(`${ENDPOINTS.USERS}${id}/permissions/`),

  assignPermissions: (id: string, permissionIds: string[]) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/permissions/`, {
      permission_ids: permissionIds
    }),

  removePermissions: (id: string, permissionIds: string[]) =>
    apiClient.delete(`${ENDPOINTS.USERS}${id}/permissions/`, {
      data: { permission_ids: permissionIds }
    }),

  addToGroups: (id: string, groupIds: string[]) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/groups/`, {
      group_ids: groupIds
    }),

  removeFromGroups: (id: string, groupIds: string[]) =>
    apiClient.delete(`${ENDPOINTS.USERS}${id}/groups/`, {
      data: { group_ids: groupIds }
    }),

  getActivityLog: (id: string, params?: Record<string, any>) =>
    apiClient.getPaginated<ActivityLog>(`${ENDPOINTS.USERS}${id}/activity/`, params),

  getCurrentUser: () =>
    apiClient.get<User>(`${ENDPOINTS.USERS}me/`),

  updateCurrentUser: (data: Partial<User>) =>
    apiClient.patch<User>(`${ENDPOINTS.USERS}me/`, data),

  uploadAvatar: (id: string, file: File) =>
    apiClient.uploadFile(`${ENDPOINTS.USERS}${id}/avatar/`, file),

  removeAvatar: (id: string) =>
    apiClient.delete(`${ENDPOINTS.USERS}${id}/avatar/`),

  getTwoFactorAuth: (id: string) =>
    apiClient.get<{
      enabled: boolean;
      backup_codes: string[];
      qr_code?: string;
    }>(`${ENDPOINTS.USERS}${id}/2fa/`),

  enableTwoFactorAuth: (id: string) =>
    apiClient.post<{
      qr_code: string;
      backup_codes: string[];
    }>(`${ENDPOINTS.USERS}${id}/2fa/enable/`),

  disableTwoFactorAuth: (id: string) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/2fa/disable/`),

  verifyTwoFactorAuth: (id: string, code: string) =>
    apiClient.post(`${ENDPOINTS.USERS}${id}/2fa/verify/`, { code }),
};

// Permissions API
export const permissions = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Permission>(ENDPOINTS.PERMISSIONS, params),

  get: (id: string) =>
    apiClient.get<Permission>(`${ENDPOINTS.PERMISSIONS}${id}/`),

  create: (data: Partial<Permission>) =>
    apiClient.post<Permission>(ENDPOINTS.PERMISSIONS, data),

  update: (id: string, data: Partial<Permission>) =>
    apiClient.patch<Permission>(`${ENDPOINTS.PERMISSIONS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.PERMISSIONS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.PERMISSIONS, ids),

  getByResource: (resourceType: string, resourceId?: string) =>
    apiClient.get<Permission[]>(`${ENDPOINTS.PERMISSIONS}by-resource/`, {
      params: {
        resource_type: resourceType,
        resource_id: resourceId
      }
    }),

  getByUser: (userId: string) =>
    apiClient.get<Permission[]>(`${ENDPOINTS.PERMISSIONS}by-user/`, {
      params: { user_id: userId }
    }),

  checkPermission: (permission: string, resourceType?: string, resourceId?: string) =>
    apiClient.get<{ has_permission: boolean }>(`${ENDPOINTS.PERMISSIONS}check/`, {
      params: {
        permission,
        resource_type: resourceType,
        resource_id: resourceId
      }
    }),
};

// Activity Logs API
export const activityLogs = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<ActivityLog>(ENDPOINTS.ACTIVITY_LOGS, params),

  get: (id: string) =>
    apiClient.get<ActivityLog>(`${ENDPOINTS.ACTIVITY_LOGS}${id}/`),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.ACTIVITY_LOGS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.ACTIVITY_LOGS, ids),

  getByUser: (userId: string, params?: Record<string, any>) =>
    apiClient.getPaginated<ActivityLog>(`${ENDPOINTS.ACTIVITY_LOGS}by-user/`, {
      ...params,
      user_id: userId
    }),

  getByResource: (resourceType: string, resourceId: string, params?: Record<string, any>) =>
    apiClient.getPaginated<ActivityLog>(`${ENDPOINTS.ACTIVITY_LOGS}by-resource/`, {
      ...params,
      resource_type: resourceType,
      resource_id: resourceId
    }),

  getStatistics: (startDate?: string, endDate?: string) =>
    apiClient.get<{
      total_actions: number;
      actions_by_type: Record<string, number>;
      actions_by_user: Record<string, number>;
      actions_by_resource: Record<string, number>;
      timeline: { date: string; count: number }[];
    }>(`${ENDPOINTS.ACTIVITY_LOGS}statistics/`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    }),

  export: (params?: Record<string, any>) =>
    apiClient.get(`${ENDPOINTS.ACTIVITY_LOGS}export/`, {
      params,
      responseType: 'blob'
    }),

  cleanup: (olderThanDays: number) =>
    apiClient.post(`${ENDPOINTS.ACTIVITY_LOGS}cleanup/`, {
      older_than_days: olderThanDays
    }),
};

// Groups API
export const groups = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<{
      id: string;
      name: string;
      description?: string;
      permissions: Permission[];
      user_count: number;
      created_at: string;
      updated_at: string;
    }>(ENDPOINTS.GROUPS, params),

  get: (id: string) =>
    apiClient.get(`${ENDPOINTS.GROUPS}${id}/`),

  create: (data: { name: string; description?: string; permissions?: string[] }) =>
    apiClient.post(ENDPOINTS.GROUPS, data),

  update: (id: string, data: Partial<{ name: string; description?: string; permissions?: string[] }>) =>
    apiClient.patch(`${ENDPOINTS.GROUPS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.GROUPS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.GROUPS, ids),

  getUsers: (id: string, params?: Record<string, any>) =>
    apiClient.getPaginated<User>(`${ENDPOINTS.GROUPS}${id}/users/`, params),

  addUsers: (id: string, userIds: string[]) =>
    apiClient.post(`${ENDPOINTS.GROUPS}${id}/users/`, { user_ids: userIds }),

  removeUsers: (id: string, userIds: string[]) =>
    apiClient.delete(`${ENDPOINTS.GROUPS}${id}/users/`, { data: { user_ids: userIds } }),
};

// System Settings API
export const systemSettings = {
  get: () =>
    apiClient.get<{
      site_name: string;
      site_description: string;
      maintenance_mode: boolean;
      max_login_attempts: number;
      session_timeout: number;
      password_policy: {
        min_length: number;
        require_uppercase: boolean;
        require_lowercase: boolean;
        require_numbers: boolean;
        require_symbols: boolean;
      };
      email_settings: {
        enabled: boolean;
        smtp_host: string;
        smtp_port: number;
        use_tls: boolean;
        from_email: string;
      };
      backup_settings: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        retention_days: number;
        storage_path: string;
      };
    }>('/settings/'),

  update: (data: Record<string, any>) =>
    apiClient.patch('/settings/', data),

  getSystemInfo: () =>
    apiClient.get<{
      version: string;
      database_status: 'connected' | 'disconnected';
      cache_status: 'connected' | 'disconnected';
      disk_usage: {
        total: number;
        used: number;
        free: number;
        percentage: number;
      };
      memory_usage: {
        total: number;
        used: number;
        free: number;
        percentage: number;
      };
      uptime: number;
      last_backup: string;
    }>('/system-info'),

  createBackup: () =>
    apiClient.post<{ backup_id: string; status: string }>('/backup/'),

  getBackups: () =>
    apiClient.get<{
      backups: {
        id: string;
        created_at: string;
        size: number;
        status: 'completed' | 'failed' | 'in_progress';
      }[];
    }>('/backups/'),

  restoreBackup: (backupId: string) =>
    apiClient.post(`/backups/${backupId}/restore/`),

  deleteBackup: (backupId: string) =>
    apiClient.delete(`/backups/${backupId}/`),

  testEmail: (email: string) =>
    apiClient.post('/test-email/', { email }),

  getAuditLog: (params?: Record<string, any>) =>
    apiClient.getPaginated('/audit-log/', params),
}; 