import { apiClient } from '../api/client';
import { API_ENDPOINTS, STORAGE_KEYS } from '../../constants';
import type { User, LoginCredentials, AuthTokens } from '../../types';

export class AuthService {
  private currentUser: User | null = null;

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post<{ token: string }>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      const tokens: AuthTokens = {
        access: response.token,
        refresh: response.token, // Simple token auth doesn't have refresh tokens
      };

      // Store tokens
      apiClient.setTokens(tokens);
      
      // Get current user info
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Failed to get user information after login');
      }
      
      // Store last activity timestamp
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());

      return { user, tokens };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate server-side session
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage and reset state
      this.clearSession();
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    if (!apiClient.isAuthenticated()) {
      return null;
    }

    try {
      const user = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Refresh authentication tokens
   * Note: Simple token authentication doesn't support refresh tokens
   */
  async refreshTokens(): Promise<AuthTokens> {
    throw new Error('Token refresh not supported with simple token authentication');
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string, resourceType?: string, resourceId?: number): boolean {
    if (!this.currentUser) {
      return false;
    }

    // Superuser has all permissions
    if (this.currentUser.is_superuser) {
      return true;
    }

    // Check user groups and permissions
    // This is a simplified check - in a real app, you'd check against actual permissions
    if (this.currentUser.is_staff && ['view', 'add', 'change'].includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user belongs to a specific group
   */
  hasGroup(groupName: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.groups.includes(groupName);
  }

  /**
   * Get user's display name
   */
  getUserDisplayName(): string {
    if (!this.currentUser) {
      return 'Unknown User';
    }

    const { first_name, last_name, username } = this.currentUser;
    
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    
    if (first_name) {
      return first_name;
    }
    
    return username;
  }

  /**
   * Check if session is expired based on last activity
   */
  isSessionExpired(): boolean {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    
    if (!lastActivity) {
      return true;
    }

    const lastActivityTime = new Date(lastActivity).getTime();
    const now = new Date().getTime();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return (now - lastActivityTime) > sessionTimeout;
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
  }

  /**
   * Clear session and reset state
   */
  private clearSession(): void {
    apiClient.clearTokens();
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
  }

  /**
   * Initialize auth service - check existing session
   */
  async initialize(): Promise<User | null> {
    if (!apiClient.isAuthenticated()) {
      return null;
    }

    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }

    try {
      const user = await this.getCurrentUser();
      if (user) {
        this.updateLastActivity();
      }
      return user;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Start session monitoring to auto-logout on inactivity
   */
  startSessionMonitoring(): void {
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      this.updateLastActivity();
      
      inactivityTimer = setTimeout(() => {
        this.logout();
        window.location.href = '/login?reason=session_expired';
      }, 24 * 60 * 60 * 1000); // 24 hours
    };

    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Initial timer setup
    resetInactivityTimer();
  }

  /**
   * Get user preferences/settings
   */
  getUserSettings(): Record<string, any> {
    const settings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return settings ? JSON.parse(settings) : {};
  }

  /**
   * Save user preferences/settings
   */
  saveUserSettings(settings: Record<string, any>): void {
    const existingSettings = this.getUserSettings();
    const updatedSettings = { ...existingSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
  }

  /**
   * Validate token format (basic validation)
   */
  private isValidTokenFormat(token: string): boolean {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Get token expiration time
   * Note: Simple tokens don't have expiration
   */
  getTokenExpiration(): Date | null {
    // Simple tokens don't have expiration
    return null;
  }

  /**
   * Check if token is expired
   * Note: Simple tokens don't expire
   */
  isTokenExpired(): boolean {
    // Simple tokens don't expire
    return false;
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
export default authService;