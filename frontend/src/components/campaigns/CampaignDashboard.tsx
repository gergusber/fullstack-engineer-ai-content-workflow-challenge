'use client'

import { useState } from 'react'
import { CampaignList } from './CampaignList'
import { CampaignCreation } from './CampaignCreation'
import { Campaign } from '@/types/campaign'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ViewMode = 'list' | 'create' | 'edit'

export function CampaignDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const handleCreateNew = () => {
    setSelectedCampaign(null)
    setViewMode('create')
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setViewMode('edit')
  }

  const handleCampaignCreated = (campaign: any) => {
    // TODO: Refresh campaigns list
    setViewMode('list')
  }

  const handleBackToList = () => {
    setSelectedCampaign(null)
    setViewMode('list')
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {viewMode === 'list' && (
        <CampaignList
          onCreateNew={handleCreateNew}
          onEditCampaign={handleEditCampaign}
        />
      )}

      {viewMode === 'create' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
            >
              ← Back to Campaigns
            </Button>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
          </div>

          <CampaignCreation onSuccess={handleCampaignCreated} />
        </div>
      )}

      {viewMode === 'edit' && selectedCampaign && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
            >
              ← Back to Campaigns
            </Button>
            <h1 className="text-3xl font-bold">Edit Campaign: {selectedCampaign.name}</h1>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold mb-2">Edit Campaign Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Campaign editing functionality will be implemented in the next phase.
              </p>
              <Button onClick={handleBackToList}>
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}