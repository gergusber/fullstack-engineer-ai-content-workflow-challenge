'use client';

import { useUserContext } from '@/contexts/user-context';
import { ReactNode } from 'react';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: string | string[];
  fallback?: ReactNode;
}

/**
 * Component that only renders children if user has one of the allowed roles
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { user, loading } = useUserContext();

  if (loading) {
    return null;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = roles.includes(user.role);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
