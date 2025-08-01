import { BaseModel } from './common';

// Ansible Group Types
export interface AnsibleGroup extends BaseModel {
  name: string;
  description: string;
  is_special: boolean;
  status: 'active' | 'inactive';
  variables: AnsibleGroupVariable[];
  child_groups: AnsibleGroupSummary[];
  parent_groups: AnsibleGroupSummary[];
  all_variables: Record<string, any>;
  all_hosts: AnsibleHostSummary[];
}

export interface AnsibleGroupSummary {
  id: string;
  name: string;
}

export interface AnsibleGroupCreate {
  name: string;
  description?: string;
  is_special?: boolean;
  status?: 'active' | 'inactive';
}

export interface AnsibleGroupUpdate extends Partial<AnsibleGroupCreate> {}

// Ansible Group Variable Types
export interface AnsibleGroupVariable extends BaseModel {
  group: string | AnsibleGroup;
  key: string;
  value: string;
  value_type: 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'list' | 'dict';
}

export interface AnsibleGroupVariableCreate {
  group: string;
  key: string;
  value: string;
  value_type: 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'list' | 'dict';
}

export interface AnsibleGroupVariableUpdate extends Partial<Omit<AnsibleGroupVariableCreate, 'group'>> {}

// Ansible Group Relationship Types
export interface AnsibleGroupRelationship extends BaseModel {
  parent_group: string | AnsibleGroup;
  child_group: string | AnsibleGroup;
}

export interface AnsibleGroupRelationshipCreate {
  parent_group: string;
  child_group: string;
}

export interface AnsibleGroupRelationshipUpdate extends Partial<AnsibleGroupRelationshipCreate> {}

// Ansible Host Types
export interface AnsibleHost extends BaseModel {
  group: string | AnsibleGroup;
  host: any; // Generic foreign key - can be VM or Baremetal
  content_type: number;
  object_id: string;
  host_vars: Record<string, any>;
  ansible_host: string | null;
  ansible_port: number;
  ansible_user: string;
  ansible_ssh_private_key_file: string;
}

export interface AnsibleHostSummary {
  id: string;
  name: string;
  type: string;
}

export interface AnsibleHostCreate {
  group: string;
  content_type: number;
  object_id: string;
  host_vars?: Record<string, any>;
  ansible_host?: string;
  ansible_port?: number;
  ansible_user?: string;
  ansible_ssh_private_key_file?: string;
}

export interface AnsibleHostUpdate extends Partial<Omit<AnsibleHostCreate, 'group' | 'content_type' | 'object_id'>> {}

// Ansible Inventory Types
export interface AnsibleInventory {
  groups: Record<string, AnsibleInventoryGroup>;
  _meta: {
    hostvars: Record<string, any>;
  };
}

export interface AnsibleInventoryGroup {
  hosts: string[];
  vars: Record<string, any>;
  children: string[];
}

// API Response Types
export interface AnsibleGroupResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AnsibleGroup[];
}

export interface AnsibleGroupVariableResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AnsibleGroupVariable[];
}

export interface AnsibleGroupRelationshipResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AnsibleGroupRelationship[];
}

export interface AnsibleHostResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AnsibleHost[];
}

// Form Types
export interface AnsibleGroupFormData {
  name: string;
  description: string;
  is_special: boolean;
  status: 'active' | 'inactive';
}

export interface AnsibleGroupVariableFormData {
  group: string;
  key: string;
  value: string;
  value_type: 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'list' | 'dict';
}

export interface AnsibleHostFormData {
  group: string;
  host_type: 'virtual_machine' | 'baremetal';
  host_id: string;
  ansible_host?: string;
  ansible_port: number;
  ansible_user: string;
  ansible_ssh_private_key_file?: string;
  host_vars: Record<string, any>;
}

// Filter Types
export interface AnsibleGroupFilter {
  name?: string;
  status?: 'active' | 'inactive';
  is_special?: boolean;
  search?: string;
}

export interface AnsibleHostFilter {
  group?: string;
  host_type?: string;
  search?: string;
}

export interface AnsibleGroupVariableFilter {
  group?: string;
  key?: string;
  value_type?: string;
  search?: string;
} 