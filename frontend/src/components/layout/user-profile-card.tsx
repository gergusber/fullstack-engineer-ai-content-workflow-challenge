'use client';

import { useUserContext } from '@/contexts/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Building, Calendar } from 'lucide-react';

export const UserProfileCard = () => {
  const { user, loading, error } = useUserContext();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">Failed to load user profile</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600">No user information available</p>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      content_manager: 'bg-blue-100 text-blue-800',
      copywriter: 'bg-green-100 text-green-800',
      reviewer: 'bg-orange-100 text-orange-800',
      viewer: 'bg-gray-100 text-gray-800',
    };

    const roleLabels: Record<string, string> = {
      admin: 'Admin',
      content_manager: 'Content Manager',
      copywriter: 'Copywriter',
      reviewer: 'Reviewer',
      viewer: 'Viewer',
    };

    return (
      <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[user.role] || user.role}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          {getRoleBadge()}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>

          {user.organizationId && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>Organization: {user.organizationId}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>

          {user.lastLoginAt && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Last login {new Date(user.lastLoginAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
            <p>User ID: {user.clerkId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
