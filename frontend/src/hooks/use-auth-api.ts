import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';
import { createAuthenticatedClient } from '@/lib/api/auth-client';

/**
 * Hook that provides an authenticated API client
 * Uses Clerk's session token for authentication
 */
export const useAuthApi = () => {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    return createAuthenticatedClient(() => getToken());
  }, [getToken]);

  return apiClient;
};
