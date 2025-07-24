import type { BaseEntity } from './common';

// Tenant Management Types
export interface Tenant extends BaseEntity {
  name: string;
  description?: string;
  organization: string;
  contact_email: string;
  contact_phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  cpu_quota: number;
  memory_quota: number;
  storage_quota: number;
  network_quota: number;
  used_cpu: number;
  used_memory: number;
  used_storage: number;
  used_network: number;
  billing_address?: string;
  tags: string[];
}

// Virtual Machine Management Types
export interface VMSpecification extends BaseEntity {
  name: string;
  description?: string;
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  network_interfaces: number;
  os_type: 'linux' | 'windows' | 'other';
  os_version?: string;
  template_image?: string;
  is_template: boolean;
  tags: string[];
}

export interface VirtualMachine extends BaseEntity {
  name: string;
  description?: string;
  specification: number;
  specification_name?: string;
  tenant: number;
  tenant_name?: string;
  host_server: number;
  host_server_name?: string;
  status: 'running' | 'stopped' | 'paused' | 'error' | 'creating' | 'deleting';
  ip_addresses: string[];
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_usage?: number;
  uptime?: number;
  os_type: 'linux' | 'windows' | 'other';
  os_version?: string;
  hypervisor_type: 'kvm' | 'vmware' | 'xen' | 'hyperv';
  last_backup?: string;
  scheduled_backups: boolean;
  tags: string[];
  configuration: VMConfiguration;
}

export interface VMConfiguration {
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  network_interfaces: VMNetworkInterface[];
  boot_order: string[];
  auto_start: boolean;
  backup_enabled: boolean;
  monitoring_enabled: boolean;
}

export interface VMNetworkInterface {
  name: string;
  mac_address: string;
  ip_address?: string;
  network_type: 'bridge' | 'nat' | 'host-only';
  vlan_id?: number;
  bandwidth_limit?: number;
}

// Kubernetes Management Types
export interface K8sCluster extends BaseEntity {
  name: string;
  description?: string;
  tenant: number;
  tenant_name?: string;
  version: string;
  master_nodes: number;
  worker_nodes: number;
  total_nodes: number;
  status: 'creating' | 'running' | 'error' | 'updating' | 'deleting' | 'stopped';
  api_endpoint: string;
  dashboard_url?: string;
  network_plugin: 'flannel' | 'calico' | 'weave' | 'cilium';
  ingress_controller?: string;
  storage_class: string;
  backup_enabled: boolean;
  monitoring_enabled: boolean;
  logging_enabled: boolean;
  auto_scaling_enabled: boolean;
  min_nodes: number;
  max_nodes: number;
  cpu_usage?: number;
  memory_usage?: number;
  pod_count?: number;
  service_count?: number;
  namespace_count?: number;
  tags: string[];
  configuration: K8sClusterConfiguration;
}

export interface K8sClusterConfiguration {
  kubernetes_version: string;
  cni_plugin: string;
  service_subnet: string;
  pod_subnet: string;
  dns_service: string;
  ingress_enabled: boolean;
  load_balancer_enabled: boolean;
  persistent_storage_enabled: boolean;
  rbac_enabled: boolean;
  network_policies_enabled: boolean;
  pod_security_policies_enabled: boolean;
  audit_logging_enabled: boolean;
  etcd_backup_enabled: boolean;
}

export interface K8sClusterPlugin extends BaseEntity {
  name: string;
  description?: string;
  version: string;
  plugin_type: 'networking' | 'storage' | 'monitoring' | 'security' | 'ingress' | 'other';
  repository_url?: string;
  configuration_schema: Record<string, any>;
  is_system_plugin: boolean;
  supported_k8s_versions: string[];
  status: 'available' | 'installed' | 'deprecated';
}

export interface ServiceMesh extends BaseEntity {
  name: string;
  description?: string;
  mesh_type: 'istio' | 'linkerd' | 'consul-connect' | 'app-mesh';
  version: string;
  configuration: ServiceMeshConfiguration;
  status: 'installing' | 'active' | 'error' | 'upgrading' | 'uninstalling';
  supported_protocols: string[];
  features: string[];
}

export interface ServiceMeshConfiguration {
  mtls_enabled: boolean;
  traffic_management_enabled: boolean;
  observability_enabled: boolean;
  security_policies_enabled: boolean;
  rate_limiting_enabled: boolean;
  circuit_breaker_enabled: boolean;
  retry_policies_enabled: boolean;
  load_balancing_algorithm: string;
  ingress_gateway_enabled: boolean;
  egress_gateway_enabled: boolean;
}

export interface K8sClusterServiceMesh extends BaseEntity {
  cluster: number;
  cluster_name?: string;
  service_mesh: number;
  service_mesh_name?: string;
  installation_date: string;
  status: 'installing' | 'active' | 'error' | 'upgrading' | 'uninstalling';
  configuration_overrides: Record<string, any>;
  version: string;
}

export interface BastionClusterAssociation extends BaseEntity {
  cluster: number;
  cluster_name?: string;
  bastion_host: string;
  bastion_port: number;
  ssh_key_path?: string;
  status: 'active' | 'inactive' | 'error';
  connection_type: 'ssh' | 'vpn' | 'direct';
  created_by: number;
  created_by_name?: string;
}

// Maintenance Management Types
export interface MaintenanceWindow extends BaseEntity {
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  maintenance_type: 'hardware' | 'software' | 'network' | 'security' | 'preventive';
  affected_services: string[];
  affected_servers: number[];
  affected_clusters: number[];
  assignee: number;
  assignee_name?: string;
  approval_required: boolean;
  approved_by?: number;
  approved_by_name?: string;
  approval_date?: string;
  impact_assessment: string;
  rollback_plan?: string;
  communication_plan?: string;
  tags: string[];
}

export interface MaintenanceTask extends BaseEntity {
  maintenance_window: number;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  assignee?: number;
  assignee_name?: string;
  estimated_duration: number; // in minutes
  actual_duration?: number; // in minutes
  notes?: string;
  checklist_items: MaintenanceChecklistItem[];
}

export interface MaintenanceChecklistItem {
  id: number;
  task: number;
  description: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: number;
  completed_by_name?: string;
  notes?: string;
}

// Permission Management Types
export interface Permission extends BaseEntity {
  name: string;
  content_type: string;
  object_id?: number;
  user: number;
  user_name?: string;
  permission_type: 'view' | 'add' | 'change' | 'delete';
  granted_by: number;
  granted_by_name?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

// Dashboard and Analytics Types
export interface DashboardStats {
  total_servers: number;
  active_servers: number;
  total_vms: number;
  running_vms: number;
  total_clusters: number;
  active_clusters: number;
  total_tenants: number;
  active_tenants: number;
  total_storage_gb: number;
  used_storage_gb: number;
  total_memory_gb: number;
  used_memory_gb: number;
  total_cpu_cores: number;
  used_cpu_cores: number;
  pending_maintenance: number;
  critical_alerts: number;
}

export interface ResourceUtilization {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  storage_usage: number;
  network_usage: number;
  active_connections: number;
}

export interface ActivityLog extends BaseEntity {
  user: number;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id: number;
  resource_name?: string;
  description: string;
  ip_address: string;
  user_agent?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
  details?: Record<string, any>;
}