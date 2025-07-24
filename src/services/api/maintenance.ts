import { apiClient } from './client';
import type {
  MaintenanceWindow,
  MaintenanceTask,
} from '../../types';

// API endpoints
const ENDPOINTS = {
  MAINTENANCE_WINDOWS: '/maintenance-windows',
  MAINTENANCE_TASKS: '/maintenance-tasks',
};

// Maintenance Windows API
export const maintenanceWindows = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<MaintenanceWindow>(ENDPOINTS.MAINTENANCE_WINDOWS, params),

  get: (id: string) =>
    apiClient.get<MaintenanceWindow>(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/`),

  create: (data: Partial<MaintenanceWindow>) =>
    apiClient.post<MaintenanceWindow>(ENDPOINTS.MAINTENANCE_WINDOWS, data),

  update: (id: string, data: Partial<MaintenanceWindow>) =>
    apiClient.patch<MaintenanceWindow>(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.MAINTENANCE_WINDOWS, ids),

  start: (id: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/start/`),

  complete: (id: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/complete/`),

  cancel: (id: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/cancel/`),

  postpone: (id: string, newStartTime: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/postpone/`, {
      new_start_time: newStartTime
    }),

  getTasks: (id: string) =>
    apiClient.getPaginated<MaintenanceTask>(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/tasks/`),

  addTask: (id: string, taskData: Partial<MaintenanceTask>) =>
    apiClient.post<MaintenanceTask>(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/tasks/`, taskData),

  getAffectedResources: (id: string) =>
    apiClient.get<{
      servers: { id: string; name: string; status: string }[];
      clusters: { id: string; name: string; status: string }[];
      networks: { id: string; name: string; status: string }[];
    }>(`${ENDPOINTS.MAINTENANCE_WINDOWS}${id}/affected-resources/`),

  getHistory: (params?: Record<string, any>) =>
    apiClient.getPaginated<MaintenanceWindow>(`${ENDPOINTS.MAINTENANCE_WINDOWS}history/`, params),

  getUpcoming: (params?: Record<string, any>) =>
    apiClient.getPaginated<MaintenanceWindow>(`${ENDPOINTS.MAINTENANCE_WINDOWS}upcoming/`, params),

  getCalendar: (startDate: string, endDate: string) =>
    apiClient.get<{
      windows: (MaintenanceWindow & {
        start: string;
        end: string;
        title: string;
        color: string;
      })[];
    }>(`${ENDPOINTS.MAINTENANCE_WINDOWS}calendar/`, {
      params: { start_date: startDate, end_date: endDate }
    }),
};

// Maintenance Tasks API
export const maintenanceTasks = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<MaintenanceTask>(ENDPOINTS.MAINTENANCE_TASKS, params),

  get: (id: string) =>
    apiClient.get<MaintenanceTask>(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/`),

  create: (data: Partial<MaintenanceTask>) =>
    apiClient.post<MaintenanceTask>(ENDPOINTS.MAINTENANCE_TASKS, data),

  update: (id: string, data: Partial<MaintenanceTask>) =>
    apiClient.patch<MaintenanceTask>(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.MAINTENANCE_TASKS, ids),

  start: (id: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/start/`),

  complete: (id: string, notes?: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/complete/`, {
      completion_notes: notes
    }),

  fail: (id: string, reason: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/fail/`, {
      failure_reason: reason
    }),

  skip: (id: string, reason: string) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/skip/`, {
      skip_reason: reason
    }),

  updateProgress: (id: string, progress: number, notes?: string) =>
    apiClient.patch(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/`, {
      progress_percentage: progress,
      progress_notes: notes
    }),

  getProgress: (id: string) =>
    apiClient.get<{
      progress_percentage: number;
      progress_notes: string;
      status: string;
      started_at?: string;
      completed_at?: string;
    }>(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/progress/`),

  getLogs: (id: string) =>
    apiClient.get<{
      logs: {
        timestamp: string;
        level: 'info' | 'warning' | 'error';
        message: string;
        details?: Record<string, any>;
      }[];
    }>(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/logs/`),

  addLog: (id: string, level: string, message: string, details?: Record<string, any>) =>
    apiClient.post(`${ENDPOINTS.MAINTENANCE_TASKS}${id}/logs/`, {
      level,
      message,
      details
    }),

  getTemplates: () =>
    apiClient.get<{
      templates: {
        id: string;
        name: string;
        description: string;
        category: string;
        estimated_duration: number;
        steps: {
          title: string;
          description: string;
          estimated_duration: number;
          required: boolean;
        }[];
      }[];
    }>(`${ENDPOINTS.MAINTENANCE_TASKS}templates/`),

  createFromTemplate: (templateId: string, data: Partial<MaintenanceTask>) =>
    apiClient.post<MaintenanceTask>(`${ENDPOINTS.MAINTENANCE_TASKS}from-template/`, {
      template_id: templateId,
      ...data
    }),
}; 