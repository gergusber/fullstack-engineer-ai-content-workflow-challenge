export enum UserRole {
  ADMIN = 'admin',
  CONTENT_MANAGER = 'content_manager',
  COPYWRITER = 'copywriter',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer',
}

export interface User {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role: UserRole;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
