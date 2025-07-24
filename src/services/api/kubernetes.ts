import { apiClient } from './client';
import type {
  K8sCluster,
  K8sClusterPlugin,
  ServiceMesh,
  K8sClusterServiceMesh,
  BastionClusterAssociation,
} from '../../types';

// API endpoints
const ENDPOINTS = {
  K8S_CLUSTERS: '/k8s-clusters',
  K8S_CLUSTER_PLUGINS: '/k8s-cluster-plugins',
  SERVICE_MESHES: '/service-meshes',
  K8S_CLUSTER_SERVICE_MESHES: '/k8s-cluster-service-meshes',
  BASTION_CLUSTER_ASSOCIATIONS: '/bastion-cluster-associations',
};

// Kubernetes Clusters API  
export const k8sClusters = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<K8sCluster>(ENDPOINTS.K8S_CLUSTERS, params),

  get: (id: string) =>
    apiClient.get<K8sCluster>(`${ENDPOINTS.K8S_CLUSTERS}${id}/`),

  create: (data: Partial<K8sCluster>) =>
    apiClient.post<K8sCluster>(ENDPOINTS.K8S_CLUSTERS, data),

  update: (id: string, data: Partial<K8sCluster>) =>
    apiClient.patch<K8sCluster>(`${ENDPOINTS.K8S_CLUSTERS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.K8S_CLUSTERS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.K8S_CLUSTERS, ids),

  getNodes: (id: string) =>
    apiClient.get<{
      nodes: {
        name: string;
        status: 'Ready' | 'NotReady' | 'Unknown';
        role: 'control-plane' | 'worker';
        version: string;
        cpu_usage: number;
        memory_usage: number;
        pods: number;
        max_pods: number;
      }[];
    }>(`${ENDPOINTS.K8S_CLUSTERS}${id}/nodes/`),

  getPods: (id: string, namespace?: string) =>
    apiClient.get<{
      pods: {
        name: string;
        namespace: string;
        status: 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Unknown';
        node: string;
        cpu_usage?: number;
        memory_usage?: number;
        restarts: number;
        age: string;
      }[];
    }>(`${ENDPOINTS.K8S_CLUSTERS}${id}/pods/`, {
      params: namespace ? { namespace } : undefined
    }),

  getServices: (id: string, namespace?: string) =>
    apiClient.get(`${ENDPOINTS.K8S_CLUSTERS}${id}/services/`, {
      params: namespace ? { namespace } : undefined
    }),

  getNamespaces: (id: string) =>
    apiClient.get<{ namespaces: string[] }>(`${ENDPOINTS.K8S_CLUSTERS}${id}/namespaces/`),

  getMetrics: (id: string, timeRange?: string) =>
    apiClient.get<{
      cpu_usage: { timestamp: string; value: number }[];
      memory_usage: { timestamp: string; value: number }[];
      pod_count: { timestamp: string; value: number }[];
      node_count: { timestamp: string; value: number }[];
    }>(`${ENDPOINTS.K8S_CLUSTERS}${id}/metrics/`, {
      params: timeRange ? { range: timeRange } : undefined
    }),

  scale: (id: string, deployment: string, namespace: string, replicas: number) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTERS}${id}/scale/`, {
      deployment,
      namespace,
      replicas
    }),

  restart: (id: string, deployment: string, namespace: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTERS}${id}/restart/`, {
      deployment,
      namespace
    }),

  getKubeconfig: (id: string) =>
    apiClient.get<{ kubeconfig: string }>(`${ENDPOINTS.K8S_CLUSTERS}${id}/kubeconfig/`),

  upgrade: (id: string, version: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTERS}${id}/upgrade/`, { version }),

  drain: (id: string, nodeName: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTERS}${id}/drain/`, { node: nodeName }),

  cordon: (id: string, nodeName: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTERS}${id}/cordon/`, { node: nodeName }),

  uncordon: (id: string, nodeName: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTERS}${id}/uncordon/`, { node: nodeName }),
};

// Kubernetes Cluster Plugins API
export const k8sClusterPlugins = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<K8sClusterPlugin>(ENDPOINTS.K8S_CLUSTER_PLUGINS, params),

  get: (id: string) =>
    apiClient.get<K8sClusterPlugin>(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/`),

  create: (data: Partial<K8sClusterPlugin>) =>
    apiClient.post<K8sClusterPlugin>(ENDPOINTS.K8S_CLUSTER_PLUGINS, data),

  update: (id: string, data: Partial<K8sClusterPlugin>) =>
    apiClient.patch<K8sClusterPlugin>(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.K8S_CLUSTER_PLUGINS, ids),

  install: (id: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/install/`),

  uninstall: (id: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/uninstall/`),

  upgrade: (id: string, version: string) =>
    apiClient.post(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/upgrade/`, { version }),

  getStatus: (id: string) =>
    apiClient.get<{
      status: 'installed' | 'uninstalled' | 'installing' | 'uninstalling' | 'failed';
      version: string;
      health: 'healthy' | 'unhealthy' | 'unknown';
    }>(`${ENDPOINTS.K8S_CLUSTER_PLUGINS}${id}/status/`),
};

// Service Meshes API
export const serviceMeshes = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<ServiceMesh>(ENDPOINTS.SERVICE_MESHES, params),

  get: (id: string) =>
    apiClient.get<ServiceMesh>(`${ENDPOINTS.SERVICE_MESHES}${id}/`),

  create: (data: Partial<ServiceMesh>) =>
    apiClient.post<ServiceMesh>(ENDPOINTS.SERVICE_MESHES, data),

  update: (id: string, data: Partial<ServiceMesh>) =>
    apiClient.patch<ServiceMesh>(`${ENDPOINTS.SERVICE_MESHES}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.SERVICE_MESHES}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.SERVICE_MESHES, ids),

  getMetrics: (id: string, timeRange?: string) =>
    apiClient.get<{
      request_rate: { timestamp: string; value: number }[];
      success_rate: { timestamp: string; value: number }[];
      response_time: { timestamp: string; value: number }[];
      error_rate: { timestamp: string; value: number }[];
    }>(`${ENDPOINTS.SERVICE_MESHES}${id}/metrics/`, {
      params: timeRange ? { range: timeRange } : undefined
    }),

  getTopology: (id: string) =>
    apiClient.get<{
      services: {
        name: string;
        namespace: string;
        connections: string[];
        metrics: {
          request_rate: number;
          success_rate: number;
          response_time: number;
        };
      }[];
    }>(`${ENDPOINTS.SERVICE_MESHES}${id}/topology/`),

  getCertificates: (id: string) =>
    apiClient.get<{
      certificates: {
        name: string;
        issuer: string;
        expiry: string;
        status: 'valid' | 'expired' | 'expiring_soon';
      }[];
    }>(`${ENDPOINTS.SERVICE_MESHES}${id}/certificates/`),
};

// K8s Cluster Service Mesh Associations API
export const k8sClusterServiceMeshes = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<K8sClusterServiceMesh>(ENDPOINTS.K8S_CLUSTER_SERVICE_MESHES, params),

  get: (id: string) =>
    apiClient.get<K8sClusterServiceMesh>(`${ENDPOINTS.K8S_CLUSTER_SERVICE_MESHES}${id}/`),

  create: (data: Partial<K8sClusterServiceMesh>) =>
    apiClient.post<K8sClusterServiceMesh>(ENDPOINTS.K8S_CLUSTER_SERVICE_MESHES, data),

  update: (id: string, data: Partial<K8sClusterServiceMesh>) =>
    apiClient.patch<K8sClusterServiceMesh>(`${ENDPOINTS.K8S_CLUSTER_SERVICE_MESHES}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.K8S_CLUSTER_SERVICE_MESHES}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.K8S_CLUSTER_SERVICE_MESHES, ids),
};

// Bastion Cluster Associations API
export const bastionClusterAssociations = {
  list: (params?: Record<string, any>) =>
    apiClient.getPaginated<BastionClusterAssociation>(ENDPOINTS.BASTION_CLUSTER_ASSOCIATIONS, params),

  get: (id: string) =>
    apiClient.get<BastionClusterAssociation>(`${ENDPOINTS.BASTION_CLUSTER_ASSOCIATIONS}${id}/`),

  create: (data: Partial<BastionClusterAssociation>) =>
    apiClient.post<BastionClusterAssociation>(ENDPOINTS.BASTION_CLUSTER_ASSOCIATIONS, data),

  update: (id: string, data: Partial<BastionClusterAssociation>) =>
    apiClient.patch<BastionClusterAssociation>(`${ENDPOINTS.BASTION_CLUSTER_ASSOCIATIONS}${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${ENDPOINTS.BASTION_CLUSTER_ASSOCIATIONS}${id}/`),

  bulkDelete: (ids: string[]) =>
    apiClient.bulkDelete(ENDPOINTS.BASTION_CLUSTER_ASSOCIATIONS, ids),
}; 