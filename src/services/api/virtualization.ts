import { apiClient } from './client';
import type {
  VirtualMachine,
  VMSpecification,
  Tenant,
} from '../../types';

// API endpoints
const ENDPOINTS = {
  VIRTUAL_MACHINES: '/virtual-machines',
  VM_SPECIFICATIONS: '/vm-specifications',
  TENANTS: '/tenants',
};

// Virtual Machines API
export const virtualMachines = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<VirtualMachine>(ENDPOINTS.VIRTUAL_MACHINES, params),

  get: (id: string) =>
    apiClient.get<VirtualMachine>(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}`),

  create: (data: Partial<VirtualMachine>) =>
    apiClient.post<VirtualMachine>(ENDPOINTS.VIRTUAL_MACHINES, data),

  update: (id: string, data: Partial<VirtualMachine>) =>
    apiClient.patch<VirtualMachine>(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.VIRTUAL_MACHINES, ids),

  start: (id: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/start/`),

  stop: (id: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/stop/`),

  restart: (id: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/restart/`),

  pause: (id: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/pause/`),

  resume: (id: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/resume/`),

  getMetrics: (id: string, timeRange?: string) =>
    apiClient.get<{
      cpu_usage: { timestamp: string; value: number }[];
      memory_usage: { timestamp: string; value: number }[];
      disk_usage: { timestamp: string; value: number }[];
      network_in: { timestamp: string; value: number }[];
      network_out: { timestamp: string; value: number }[];
    }>(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/metrics/`, {
      params: timeRange ? { range: timeRange } : undefined
    }),

  getConsole: (id: string) =>
    apiClient.get<{ console_url: string }>(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/console/`),

  createSnapshot: (id: string, name: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/snapshots/`, { name }),

  getSnapshots: (id: string) =>
    apiClient.get(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/snapshots/`),

  restoreSnapshot: (id: string, snapshotId: string) =>
    apiClient.post(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/snapshots/${snapshotId}/restore/`),

  deleteSnapshot: (id: string, snapshotId: string) =>
    apiClient.delete(`${ENDPOINTS.VIRTUAL_MACHINES}/${id}/snapshots/${snapshotId}/`),
};

// VM Specifications API
export const vmSpecifications = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<VMSpecification>(ENDPOINTS.VM_SPECIFICATIONS, params),

  get: (id: string) =>
    apiClient.get<VMSpecification>(`${ENDPOINTS.VM_SPECIFICATIONS}${id}/`),

  create: (data: Partial<VMSpecification>) =>
    apiClient.post<VMSpecification>(ENDPOINTS.VM_SPECIFICATIONS, data),

  update: (id: string, data: Partial<VMSpecification>) =>
    apiClient.patch<VMSpecification>(`${ENDPOINTS.VM_SPECIFICATIONS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.VM_SPECIFICATIONS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.VM_SPECIFICATIONS, ids),
};

// Tenants API
export const tenants = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Tenant>(ENDPOINTS.TENANTS, params),

  get: (id: string) =>
    apiClient.get<Tenant>(`${ENDPOINTS.TENANTS}${id}/`),

  create: (data: Partial<Tenant>) =>
    apiClient.post<Tenant>(ENDPOINTS.TENANTS, data),

  update: (id: string, data: Partial<Tenant>) =>
    apiClient.patch<Tenant>(`${ENDPOINTS.TENANTS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.TENANTS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.TENANTS, ids),

  getResourceUsage: (id: string) =>
    apiClient.get<{
      cpu_usage: number;
      memory_usage: number;
      storage_usage: number;
      network_usage: number;
      vm_count: number;
      total_cpu: number;
      total_memory: number;
      total_storage: number;
    }>(`${ENDPOINTS.TENANTS}${id}/resource-usage/`),

  getVirtualMachines: (id: string, params?: Record<string, any>) =>
    apiClient.getPaginated<VirtualMachine>(`${ENDPOINTS.TENANTS}${id}/virtual-machines/`, params),
}; 