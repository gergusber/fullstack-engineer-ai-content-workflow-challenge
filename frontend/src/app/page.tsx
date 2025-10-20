'use client';

import { CampaignDashboard } from '@/components/campaigns/CampaignDashboard';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppHeader } from '@/components/layout/app-header';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppHeader />
        <CampaignDashboard />
      </div>
    </ProtectedRoute>
  );
}

   