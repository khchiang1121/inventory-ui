import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants';
import type {
  AnsibleGroup,
  AnsibleGroupCreate,
  AnsibleGroupUpdate,
  AnsibleGroupResponse,
  AnsibleGroupVariable,
  AnsibleGroupVariableCreate,
  AnsibleGroupVariableUpdate,
  AnsibleGroupVariableResponse,
  AnsibleGroupRelationship,
  AnsibleGroupRelationshipCreate,
  AnsibleGroupRelationshipUpdate,
  AnsibleGroupRelationshipResponse,
  AnsibleHost,
  AnsibleHostCreate,
  AnsibleHostUpdate,
  AnsibleHostResponse,
  AnsibleInventory,
  AnsibleGroupFilter,
  AnsibleHostFilter,
  AnsibleGroupVariableFilter,
} from '../../types';

export class AnsibleApiService {
  // Ansible Groups
  static async getGroups(params?: AnsibleGroupFilter): Promise<AnsibleGroupResponse> {
    return apiClient.getPaginated<AnsibleGroup>(API_ENDPOINTS.ANSIBLE.GROUPS, params);
  }

  static async getGroup(id: string): Promise<AnsibleGroup> {
    return apiClient.get<AnsibleGroup>(`${API_ENDPOINTS.ANSIBLE.GROUPS}${id}/`);
  }

  static async createGroup(data: AnsibleGroupCreate): Promise<AnsibleGroup> {
    return apiClient.post<AnsibleGroup>(API_ENDPOINTS.ANSIBLE.GROUPS, data);
  }

  static async updateGroup(id: string, data: AnsibleGroupUpdate): Promise<AnsibleGroup> {
    return apiClient.patch<AnsibleGroup>(`${API_ENDPOINTS.ANSIBLE.GROUPS}${id}/`, data);
  }

  static async deleteGroup(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.ANSIBLE.GROUPS}${id}/`);
  }

  static async getGroupVariables(id: string): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>(`${API_ENDPOINTS.ANSIBLE.GROUPS}${id}/variables/`);
  }

  static async getGroupHosts(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`${API_ENDPOINTS.ANSIBLE.GROUPS}${id}/hosts/`);
  }

  // Ansible Group Variables
  static async getGroupVariablesList(params?: AnsibleGroupVariableFilter): Promise<AnsibleGroupVariableResponse> {
    return apiClient.getPaginated<AnsibleGroupVariable>(API_ENDPOINTS.ANSIBLE.GROUP_VARIABLES, params);
  }

  static async getGroupVariable(id: string): Promise<AnsibleGroupVariable> {
    return apiClient.get<AnsibleGroupVariable>(`${API_ENDPOINTS.ANSIBLE.GROUP_VARIABLES}${id}/`);
  }

  static async createGroupVariable(data: AnsibleGroupVariableCreate): Promise<AnsibleGroupVariable> {
    return apiClient.post<AnsibleGroupVariable>(API_ENDPOINTS.ANSIBLE.GROUP_VARIABLES, data);
  }

  static async updateGroupVariable(id: string, data: AnsibleGroupVariableUpdate): Promise<AnsibleGroupVariable> {
    return apiClient.patch<AnsibleGroupVariable>(`${API_ENDPOINTS.ANSIBLE.GROUP_VARIABLES}${id}/`, data);
  }

  static async deleteGroupVariable(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.ANSIBLE.GROUP_VARIABLES}${id}/`);
  }

  // Ansible Group Relationships
  static async getGroupRelationships(params?: any): Promise<AnsibleGroupRelationshipResponse> {
    return apiClient.getPaginated<AnsibleGroupRelationship>(API_ENDPOINTS.ANSIBLE.GROUP_RELATIONSHIPS, params);
  }

  static async getGroupRelationship(id: string): Promise<AnsibleGroupRelationship> {
    return apiClient.get<AnsibleGroupRelationship>(`${API_ENDPOINTS.ANSIBLE.GROUP_RELATIONSHIPS}${id}/`);
  }

  static async createGroupRelationship(data: AnsibleGroupRelationshipCreate): Promise<AnsibleGroupRelationship> {
    return apiClient.post<AnsibleGroupRelationship>(API_ENDPOINTS.ANSIBLE.GROUP_RELATIONSHIPS, data);
  }

  static async updateGroupRelationship(id: string, data: AnsibleGroupRelationshipUpdate): Promise<AnsibleGroupRelationship> {
    return apiClient.patch<AnsibleGroupRelationship>(`${API_ENDPOINTS.ANSIBLE.GROUP_RELATIONSHIPS}${id}/`, data);
  }

  static async deleteGroupRelationship(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.ANSIBLE.GROUP_RELATIONSHIPS}${id}/`);
  }

  // Ansible Hosts
  static async getHosts(params?: AnsibleHostFilter): Promise<AnsibleHostResponse> {
    return apiClient.getPaginated<AnsibleHost>(API_ENDPOINTS.ANSIBLE.HOSTS, params);
  }

  static async getHost(id: string): Promise<AnsibleHost> {
    return apiClient.get<AnsibleHost>(`${API_ENDPOINTS.ANSIBLE.HOSTS}${id}/`);
  }

  static async createHost(data: AnsibleHostCreate): Promise<AnsibleHost> {
    return apiClient.post<AnsibleHost>(API_ENDPOINTS.ANSIBLE.HOSTS, data);
  }

  static async updateHost(id: string, data: AnsibleHostUpdate): Promise<AnsibleHost> {
    return apiClient.patch<AnsibleHost>(`${API_ENDPOINTS.ANSIBLE.HOSTS}${id}/`, data);
  }

  static async deleteHost(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.ANSIBLE.HOSTS}${id}/`);
  }

  // Utility methods
  static async generateInventory(): Promise<AnsibleInventory> {
    return apiClient.get<AnsibleInventory>(`${API_ENDPOINTS.ANSIBLE.GROUPS}inventory/`);
  }

  static async bulkAssignHosts(groupId: string, hostIds: string[], hostType: string): Promise<AnsibleHost[]> {
    const promises = hostIds.map(hostId => {
      const contentType = hostType === 'virtual_machine' ? 1 : 2; // Adjust based on your content type IDs
      return this.createHost({
        group: groupId,
        content_type: contentType,
        object_id: hostId,
        ansible_port: 22,
        ansible_user: 'root',
        host_vars: {},
      });
    });
    return Promise.all(promises);
  }

  static async bulkUpdateHostVars(hostIds: string[], vars: Record<string, any>): Promise<AnsibleHost[]> {
    const promises = hostIds.map(hostId =>
      this.updateHost(hostId, { host_vars: vars })
    );
    return Promise.all(promises);
  }

  static async bulkDeleteHosts(hostIds: string[]): Promise<void> {
    const promises = hostIds.map(hostId => this.deleteHost(hostId));
    await Promise.all(promises);
  }

  static async getGroupHierarchy(): Promise<AnsibleGroup[]> {
    const response = await apiClient.get<{ results: AnsibleGroup[] }>(`${API_ENDPOINTS.ANSIBLE.GROUPS}?hierarchy=true`);
    return response.results;
  }

  static async validateGroupHierarchy(parentId: string, childId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ valid: boolean }>(`${API_ENDPOINTS.ANSIBLE.GROUP_RELATIONSHIPS}validate/`, {
        parent_group: parentId,
        child_group: childId,
      });
      return response.valid;
    } catch (error) {
      return false;
    }
  }
} 