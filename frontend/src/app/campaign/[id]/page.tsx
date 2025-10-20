'use client'

import { useParams } from 'next/navigation'
import { CampaignDetail } from '@/components/campaigns/CampaignDetail'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppHeader } from '@/components/layout/app-header'

export default function CampaignPage() {
  const params = useParams()
  const campaignId = params.id as string

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppHeader />
        <CampaignDetail campaignId={campaignId} />
      </div>
    </ProtectedRoute>
  )
}