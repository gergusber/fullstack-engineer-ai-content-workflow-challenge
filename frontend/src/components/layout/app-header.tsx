'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { Languages, User as UserIcon } from 'lucide-react';
import { useUserContext } from '@/contexts/user-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AppHeader = () => {
  const { user, loading } = useUserContext();

  const getRoleBadge = () => {
    if (!user) return null;

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
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Languages className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Content Workflow
              </h1>
              <p className="text-sm text-gray-600">
                Campaign & Content Management Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!loading && user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    {getRoleBadge()}
                  </div>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-10 w-10',
                    },
                  }}
                />
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              </div>
            )}

            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Backend Connected
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
