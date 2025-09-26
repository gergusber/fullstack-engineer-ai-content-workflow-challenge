'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCampaign } from '@/lib/hooks/api/campaigns/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CampaignContentManager } from './CampaignContentManager'

interface CampaignDetailProps {
  campaignId: string
}

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content'>('overview')
  const { data: campaignResponse, isLoading, error } = useCampaign(campaignId)

  const campaign = campaignResponse?.data

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
          <span>Loading campaign details...</span>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">Campaign not found</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'The requested campaign could not be found.'}
            </p>
            <Link href="/">
              <Button>← Back to Campaigns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Back to Campaigns
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-sm text-gray-600">Campaign Management & Content</p>
              </div>
            </div>
            <Badge className={getStatusColor(campaign.status)} variant="secondary">
              {campaign.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Content Management
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Campaign Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ℹ️ Campaign Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Campaign Name</Label>
                      <p className="text-lg font-semibold">{campaign.name}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Description</Label>
                      <p className="text-gray-700">{campaign.description || 'No description provided'}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(campaign.status)} variant="secondary">
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {campaign.targetMarkets && campaign.targetMarkets.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Target Markets</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {campaign.targetMarkets.map((market) => (
                            <Badge key={market} variant="outline" className="text-xs">
                              {market}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {campaign.tags && campaign.tags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {campaign.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Created By</Label>
                      <p className="text-gray-700">{campaign.createdBy || 'Unknown'}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Created Date</Label>
                      <p className="text-gray-700">
                        {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <CampaignContentAnalytics campaignId={campaignId} /> */}
          </div>
        )}

        {activeTab === 'content' && (
          <CampaignContentManager campaignId={campaignId} campaign={campaign} />
        )}
      </div>
    </div>
  )
}