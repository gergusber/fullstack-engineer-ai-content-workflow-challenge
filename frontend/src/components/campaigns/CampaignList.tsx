'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Campaign, CampaignStatus } from '@/types/campaign'
import { useCampaigns } from '@/lib/hooks/api/campaigns/queries'
import type { CampaignFilters } from '@/lib/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface CampaignListProps {
  onCreateNew?: () => void
  onEditCampaign?: (campaign: Campaign) => void
}

export function CampaignList({ onCreateNew, onEditCampaign }: CampaignListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Campaign['status'] | 'all'>('all')

  // Create filters for the API call
  const apiFilters = useMemo<CampaignFilters>(() => {
    const filters: CampaignFilters = {}

    if (searchTerm.trim()) {
      filters.search = searchTerm.trim()
    }

    if (statusFilter !== 'all') {
      filters.status = statusFilter
    }

    return filters
  }, [searchTerm, statusFilter])

  // Fetch campaigns from API
  const { data: campaignsResponse, isLoading, error } = useCampaigns(apiFilters)

  const campaigns = campaignsResponse?.data || []

  // Client-side filtering for tags (since backend might not support tag filtering)
  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchTerm.trim()) return true

    // Additional client-side filtering for tags if backend doesn't handle it
    const matchesClientSearch = campaign.tags?.some(tag =>
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return matchesClientSearch || true // Backend already handles name/description search
  })

  const getStatusColor = (status: Campaign['status']) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🚀 Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your marketing campaigns and content workflows</p>
        </div>
        <Button onClick={onCreateNew}>
          ➕ Create New Campaign
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Campaigns</Label>
              <Input
                id="search"
                placeholder="Search by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <select
                id="status-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Campaign['status'] | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredCampaigns.length} of {campaigns.length} campaigns
        </p>
        {(searchTerm || statusFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading campaigns...</h3>
            <p className="text-gray-600">Please wait while we fetch your campaigns.</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">Failed to load campaigns</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              🔄 Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign Grid */}
      {!isLoading && !error && filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first campaign.'}
            </p>
            <Button onClick={onCreateNew}>
              ➕ Create First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : !isLoading && !error ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Link href={`/campaign/${campaign.id}`}>
                    <CardTitle className="text-lg leading-tight hover:text-blue-600 cursor-pointer transition-colors">
                      {campaign.name}
                    </CardTitle>
                  </Link>
                  <Badge className={getStatusColor(campaign.status as Campaign['status'])} variant="secondary">
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {campaign.description}
                </p>

                {/* Target Markets */}
                {campaign.targetMarkets && campaign.targetMarkets.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Target Markets</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {campaign.targetMarkets.map((market) => (
                        <Badge key={market} variant="outline" className="text-xs">
                          {market}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {campaign.tags && campaign.tags.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {campaign.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {campaign.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created by: {campaign.createdBy}</div>
                  <div>Created: {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditCampaign?.(campaign as Campaign)}
                  >
                    📝 Edit
                  </Button>
                  <Link href={`/campaign/${campaign.id}`}>
                    <Button variant="outline" size="sm" className="flex-1 w-full">
                      📊 View Content
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}