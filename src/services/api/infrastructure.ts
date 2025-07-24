import { apiClient } from './client';
import type {
  DataCenter,
  Rack,
  Baremetal,
  BaremetalGroup,
  Room,
  Phase,
  Fabrication,
  VLAN,
  VRF,
  BGPConfig,
  NetworkInterface,
  Brand,
  BaremetalModel,
  PurchaseRequisition,
  PurchaseOrder,
} from '../../types';

// API endpoints
const ENDPOINTS = {
  DATA_CENTERS: '/data-centers',
  RACKS: '/racks',
  SERVERS: '/baremetals',
  BAREMETAL_GROUPS: '/baremetal-groups',
  ROOMS: '/rooms',
  PHASES: '/phases',
  FABRICATIONS: '/fabrications',
  VLANS: '/vlans',
  VRFS: '/vrfs',
  BGP_CONFIGS: '/bgp-configs',
  NETWORK_INTERFACES: '/network-interfaces',
  BRANDS: '/brands',
  BAREMETAL_MODELS: '/baremetal-models',
  PURCHASE_REQUISITIONS: '/purchase-requisitions',
  PURCHASE_ORDERS: '/purchase-orders',
};

// Data Centers API
export const dataCenters = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<DataCenter>(ENDPOINTS.DATA_CENTERS, params),
  
  get: (id: string) =>
    apiClient.get<DataCenter>(`${ENDPOINTS.DATA_CENTERS}${id}/`),
  
  create: (data: Partial<DataCenter>) =>
    apiClient.post<DataCenter>(ENDPOINTS.DATA_CENTERS, data),
  
  update: (id: string, data: Partial<DataCenter>) =>
    apiClient.patch<DataCenter>(`${ENDPOINTS.DATA_CENTERS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.DATA_CENTERS}${id}/`),
  
  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.DATA_CENTERS, ids),
};

// Racks API
export const racks = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Rack>(ENDPOINTS.RACKS, params),
  
  get: (id: string) =>
    apiClient.get<Rack>(`${ENDPOINTS.RACKS}${id}/`),
  
  create: (data: Partial<Rack>) =>
    apiClient.post<Rack>(ENDPOINTS.RACKS, data),
  
  update: (id: string, data: Partial<Rack>) =>
    apiClient.patch<Rack>(`${ENDPOINTS.RACKS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.RACKS}${id}/`),
  
  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.RACKS, ids),
  
  getUtilization: (id: string) =>
    apiClient.get<{ used_units: number; total_units: number; servers: Baremetal[]; used_power?: number }>(
      `${ENDPOINTS.RACKS}${id}/utilization/`
    ),
};

// Servers (Baremetals) API
export const servers = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Baremetal>(ENDPOINTS.SERVERS, params),
  
  get: (id: string) =>
    apiClient.get<Baremetal>(`${ENDPOINTS.SERVERS}${id}/`),
  
  create: (data: Partial<Baremetal>) =>
    apiClient.post<Baremetal>(ENDPOINTS.SERVERS, data),
  
  update: (id: string, data: Partial<Baremetal>) =>
    apiClient.patch<Baremetal>(`${ENDPOINTS.SERVERS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.SERVERS}${id}/`),
  
  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.SERVERS, ids),
  
  power: (id: string, action: 'on' | 'off' | 'reboot') =>
    apiClient.post(`${ENDPOINTS.SERVERS}${id}/power/`, { action }),
  
  getMetrics: (id: string, timeRange?: string) =>
    apiClient.get<{
      cpu_usage: { timestamp: string; value: number }[];
      memory_usage: { timestamp: string; value: number }[];
      disk_usage: { timestamp: string; value: number }[];
      temperature: { timestamp: string; value: number }[];
    }>(`${ENDPOINTS.SERVERS}${id}/metrics/`, { 
      params: timeRange ? { range: timeRange } : undefined 
    }),
  
  getHealth: (id: string) =>
    apiClient.get<{
      status: 'healthy' | 'warning' | 'critical';
      checks: { name: string; status: string; message?: string }[];
    }>(`${ENDPOINTS.SERVERS}${id}/health/`),
};

// Baremetal Groups API
export const baremetalGroups = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<BaremetalGroup>(ENDPOINTS.BAREMETAL_GROUPS, params),
  
  get: (id: string) =>
    apiClient.get<BaremetalGroup>(`${ENDPOINTS.BAREMETAL_GROUPS}${id}/`),
  
  create: (data: Partial<BaremetalGroup>) =>
    apiClient.post<BaremetalGroup>(ENDPOINTS.BAREMETAL_GROUPS, data),
  
  update: (id: string, data: Partial<BaremetalGroup>) =>
    apiClient.patch<BaremetalGroup>(`${ENDPOINTS.BAREMETAL_GROUPS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.BAREMETAL_GROUPS}${id}/`),
  
  getServers: (id: string) =>
    apiClient.get<Baremetal[]>(`${ENDPOINTS.BAREMETAL_GROUPS}${id}/servers/`),
};

// Rooms API
export const rooms = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Room>(ENDPOINTS.ROOMS, params),
  
  get: (id: string) =>
    apiClient.get<Room>(`${ENDPOINTS.ROOMS}${id}/`),
  
  create: (data: Partial<Room>) =>
    apiClient.post<Room>(ENDPOINTS.ROOMS, data),
  
  update: (id: string, data: Partial<Room>) =>
    apiClient.patch<Room>(`${ENDPOINTS.ROOMS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.ROOMS}${id}/`),
};

// Phases API
export const phases = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Phase>(ENDPOINTS.PHASES, params),
  
  get: (id: string) =>
    apiClient.get<Phase>(`${ENDPOINTS.PHASES}${id}/`),
  
  create: (data: Partial<Phase>) =>
    apiClient.post<Phase>(ENDPOINTS.PHASES, data),
  
  update: (id: string, data: Partial<Phase>) =>
    apiClient.patch<Phase>(`${ENDPOINTS.PHASES}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.PHASES}${id}/`),
};

// Fabrications API
export const fabrications = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Fabrication>(ENDPOINTS.FABRICATIONS, params),
  
  get: (id: string) =>
    apiClient.get<Fabrication>(`${ENDPOINTS.FABRICATIONS}${id}/`),
  
  create: (data: Partial<Fabrication>) =>
    apiClient.post<Fabrication>(ENDPOINTS.FABRICATIONS, data),
  
  update: (id: string, data: Partial<Fabrication>) =>
    apiClient.patch<Fabrication>(`${ENDPOINTS.FABRICATIONS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.FABRICATIONS}${id}/`),
};

// VLANs API
export const vlans = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<VLAN>(ENDPOINTS.VLANS, params),
  
  get: (id: string) =>
    apiClient.get<VLAN>(`${ENDPOINTS.VLANS}${id}/`),
  
  create: (data: Partial<VLAN>) =>
    apiClient.post<VLAN>(ENDPOINTS.VLANS, data),
  
  update: (id: string, data: Partial<VLAN>) =>
    apiClient.patch<VLAN>(`${ENDPOINTS.VLANS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.VLANS}${id}/`),
  
  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.VLANS, ids),
};

// VRFs API
export const vrfs = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<VRF>(ENDPOINTS.VRFS, params),
  
  get: (id: string) =>
    apiClient.get<VRF>(`${ENDPOINTS.VRFS}${id}/`),
  
  create: (data: Partial<VRF>) =>
    apiClient.post<VRF>(ENDPOINTS.VRFS, data),
  
  update: (id: string, data: Partial<VRF>) =>
    apiClient.patch<VRF>(`${ENDPOINTS.VRFS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.VRFS}${id}/`),
  
  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.VRFS, ids),
};

// BGP Configs API
export const bgpConfigs = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<BGPConfig>(ENDPOINTS.BGP_CONFIGS, params),
  
  get: (id: string) =>
    apiClient.get<BGPConfig>(`${ENDPOINTS.BGP_CONFIGS}${id}/`),
  
  create: (data: Partial<BGPConfig>) =>
    apiClient.post<BGPConfig>(ENDPOINTS.BGP_CONFIGS, data),
  
  update: (id: string, data: Partial<BGPConfig>) =>
    apiClient.patch<BGPConfig>(`${ENDPOINTS.BGP_CONFIGS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.BGP_CONFIGS}${id}/`),
};

// Network Interfaces API
export const networkInterfaces = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<NetworkInterface>(ENDPOINTS.NETWORK_INTERFACES, params),
  
  get: (id: string) =>
    apiClient.get<NetworkInterface>(`${ENDPOINTS.NETWORK_INTERFACES}${id}/`),
  
  create: (data: Partial<NetworkInterface>) =>
    apiClient.post<NetworkInterface>(ENDPOINTS.NETWORK_INTERFACES, data),
  
  update: (id: string, data: Partial<NetworkInterface>) =>
    apiClient.patch<NetworkInterface>(`${ENDPOINTS.NETWORK_INTERFACES}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.NETWORK_INTERFACES}${id}/`),
  
  getTraffic: (id: string, timeRange?: string) =>
    apiClient.get<{
      rx_bytes: { timestamp: string; value: number }[];
      tx_bytes: { timestamp: string; value: number }[];
      rx_packets: { timestamp: string; value: number }[];
      tx_packets: { timestamp: string; value: number }[];
    }>(`${ENDPOINTS.NETWORK_INTERFACES}${id}/traffic/`, {
      params: timeRange ? { range: timeRange } : undefined
    }),
};

// Brands API
export const brands = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<Brand>(ENDPOINTS.BRANDS, params),
  
  get: (id: string) =>
    apiClient.get<Brand>(`${ENDPOINTS.BRANDS}${id}/`),
  
  create: (data: Partial<Brand>) =>
    apiClient.post<Brand>(ENDPOINTS.BRANDS, data),
  
  update: (id: string, data: Partial<Brand>) =>
    apiClient.patch<Brand>(`${ENDPOINTS.BRANDS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.BRANDS}${id}/`),
};

// Baremetal Models API
export const baremetalModels = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<BaremetalModel>(ENDPOINTS.BAREMETAL_MODELS, params),
  
  get: (id: string) =>
    apiClient.get<BaremetalModel>(`${ENDPOINTS.BAREMETAL_MODELS}${id}/`),
  
  create: (data: Partial<BaremetalModel>) =>
    apiClient.post<BaremetalModel>(ENDPOINTS.BAREMETAL_MODELS, data),
  
  update: (id: string, data: Partial<BaremetalModel>) =>
    apiClient.patch<BaremetalModel>(`${ENDPOINTS.BAREMETAL_MODELS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.BAREMETAL_MODELS}${id}/`),
};

// Purchase Requisitions API
export const purchaseRequisitions = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<PurchaseRequisition>(ENDPOINTS.PURCHASE_REQUISITIONS, params),
  
  get: (id: string) =>
    apiClient.get<PurchaseRequisition>(`${ENDPOINTS.PURCHASE_REQUISITIONS}${id}/`),
  
  create: (data: Partial<PurchaseRequisition>) =>
    apiClient.post<PurchaseRequisition>(ENDPOINTS.PURCHASE_REQUISITIONS, data),
  
  update: (id: string, data: Partial<PurchaseRequisition>) =>
    apiClient.patch<PurchaseRequisition>(`${ENDPOINTS.PURCHASE_REQUISITIONS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.PURCHASE_REQUISITIONS}${id}/`),
};

// Purchase Orders API
export const purchaseOrders = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<PurchaseOrder>(ENDPOINTS.PURCHASE_ORDERS, params),
  
  get: (id: string) =>
    apiClient.get<PurchaseOrder>(`${ENDPOINTS.PURCHASE_ORDERS}${id}/`),
  
  create: (data: Partial<PurchaseOrder>) =>
    apiClient.post<PurchaseOrder>(ENDPOINTS.PURCHASE_ORDERS, data),
  
  update: (id: string, data: Partial<PurchaseOrder>) =>
    apiClient.patch<PurchaseOrder>(`${ENDPOINTS.PURCHASE_ORDERS}${id}/`, data),
  
  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.PURCHASE_ORDERS}${id}/`),
};

// Infrastructure health and monitoring
export const monitoring = {
  getSystemHealth: () =>
    apiClient.get<{
      data_centers_count: number;
      racks_count: number;
      servers_count: number;
      active_servers: number;
      capacity_utilization: number;
      power_consumption: number;
      temperature_avg: number;
    }>('/monitoring/system-health/'),
  
  getCapacityMetrics: () =>
    apiClient.get<{
      total_capacity: { cpu: number; memory: number; storage: number };
      used_capacity: { cpu: number; memory: number; storage: number };
      available_capacity: { cpu: number; memory: number; storage: number };
      utilization_percentage: { cpu: number; memory: number; storage: number };
    }>('/monitoring/capacity/'),
  
  getPowerMetrics: (timeRange?: string) =>
    apiClient.get<{
      power_consumption: { timestamp: string; value: number }[];
      power_capacity: number;
      utilization_percentage: number;
    }>('/monitoring/power/', {
      params: timeRange ? { range: timeRange } : undefined
    }),
  
  getTemperatureMetrics: (timeRange?: string) =>
    apiClient.get<{
      temperature: { timestamp: string; value: number; location: string }[];
      alerts: { location: string; temperature: number; threshold: number }[];
    }>('/monitoring/temperature/', {
      params: timeRange ? { range: timeRange } : undefined
    }),
}; 