import { AxiosInstance } from 'axios';
import { User, UserRole } from '@/types/user';

export class UsersService {
  constructor(private apiClient: AxiosInstance) {}

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.apiClient.get<User>('/users/me');
    return response.data;
  }

  /**
   * Sync current user from Clerk
   */
  async syncUser(): Promise<User> {
    const response = await this.apiClient.post<User>('/users/sync');
    return response.data;
  }

  /**
   * Get all users (Admin/Content Manager only)
   */
  async getUsers(filters?: {
    role?: UserRole;
    isActive?: boolean;
  }): Promise<User[]> {
    const response = await this.apiClient.get<User[]>('/users', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const response = await this.apiClient.get<User[]>(`/users/by-role/${role}`);
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateUser(
    clerkId: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      isActive?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<User> {
    const response = await this.apiClient.patch<User>(`/users/${clerkId}`, data);
    return response.data;
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(clerkId: string, role: UserRole): Promise<User> {
    const response = await this.apiClient.patch<User>(`/users/${clerkId}/role`, {
      role,
    });
    return response.data;
  }
}
