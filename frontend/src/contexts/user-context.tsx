'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { User } from '@/types/user';
import { useAuthApi } from '@/hooks/use-auth-api';
import { UsersService } from '@/lib/api/services/users.service';

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: boolean;
  isContentManager: boolean;
  isCopywriter: boolean;
  isReviewer: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const apiClient = useAuthApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const usersService = new UsersService(apiClient);

      // Try to get existing user first
      try {
        const userData = await usersService.getCurrentUser();
        setUser(userData);
      } catch (err: any) {
        // If user doesn't exist (404), sync from Clerk
        if (err.response?.status === 404) {
          console.log('User not found, syncing from Clerk...');
          const syncedUser = await usersService.syncUser();
          setUser(syncedUser);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkLoaded) {
      fetchUser();
    }
  }, [clerkLoaded, isSignedIn, clerkUser?.id]);

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value: UserContextValue = {
    user,
    loading,
    error,
    refetch: fetchUser,
    hasRole,
    isAdmin: user?.role === 'admin',
    isContentManager: user?.role === 'content_manager',
    isCopywriter: user?.role === 'copywriter',
    isReviewer: user?.role === 'reviewer',
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
