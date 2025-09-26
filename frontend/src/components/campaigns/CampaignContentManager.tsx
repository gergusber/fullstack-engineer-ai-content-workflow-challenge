'use client'

import { useState } from 'react'
import { Campaign } from '@/types/campaign'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ContentCreation } from '../content/ContentCreation'
import { ContentList } from '../content/ContentList'
import { ContentDetail } from '../content/ContentDetail'
import { TranslationDashboard } from '../content/TranslationDashboard'
import { ContentType, Priority } from '@/types/content'

interface CampaignContentManagerProps {
  campaignId: string
  campaign: Campaign
}

type ContentView = 'list' | 'create' | 'detail' | 'translations'

interface QuickContentTemplate {
  contentType: ContentType
  title: string
  description: string
  icon: string
}

export function CampaignContentManager({ campaignId, campaign }: CampaignContentManagerProps) {
  const [currentView, setCurrentView] = useState<ContentView>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all')
  const [quickTemplate, setQuickTemplate] = useState<QuickContentTemplate | null>(null)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)

  // Quick content templates
  const contentTemplates: QuickContentTemplate[] = [
    {
      contentType: ContentType.BLOG_POST,
      title: "Blog Post",
      description: "Create engaging long-form content",
      icon: "📝"
    },
    {
      contentType: ContentType.SOCIAL_POST,
      title: "Social Media Post",
      description: "Quick and engaging social content",
      icon: "📱"
    },
    {
      contentType: ContentType.EMAIL_SUBJECT,
      title: "Email Subject Line",
      description: "Compelling email headlines",
      icon: "📧"
    },
    {
      contentType: ContentType.AD_COPY,
      title: "Advertisement Copy",
      description: "Persuasive ad content",
      icon: "🎯"
    },
    {
      contentType: ContentType.PRODUCT_DESC,
      title: "Product Description",
      description: "Detailed product information",
      icon: "🛍️"
    },
    {
      contentType: ContentType.HEADLINE,
      title: "Headlines & Titles",
      description: "Catchy headlines and titles",
      icon: "🏷️"
    }
  ]

  const handleQuickCreate = (template: QuickContentTemplate) => {
    setQuickTemplate(template)
    setCurrentView('create')
  }

  const handleAIContentSprint = () => {
    // This would open a modal or dedicated view for bulk AI content generation
    alert('🤖 AI Content Sprint: Select content pieces and generate AI improvements for all at once!')
  }

  const handleViewContent = (contentId: string) => {
    setSelectedContentId(contentId)
    setCurrentView('detail')
  }

  const handleEditContent = (contentId: string) => {
    setSelectedContentId(contentId)
    setCurrentView('detail')
    // The detail view will handle edit mode internally
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedContentId(null)
  }

  return (
    <div className="space-y-6">
      {/* Content Management Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                📝 Content Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and organize content for {campaign.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentView === 'list' ? 'default' : 'outline'}
                onClick={() => setCurrentView('list')}
                size="sm"
              >
                📋 View Content
              </Button>
              <Button
                variant={currentView === 'create' ? 'default' : 'outline'}
                onClick={() => setCurrentView('create')}
                size="sm"
              >
                ➕ Create Content
              </Button>
              <Button
                variant={currentView === 'translations' ? 'default' : 'outline'}
                onClick={() => setCurrentView('translations')}
                size="sm"
              >
                🌍 Translation Hub
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Action Templates */}
      {currentView === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Quick Create
            </CardTitle>
            <p className="text-sm text-gray-600">
              Start with pre-configured content types for faster creation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Individual Content Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {contentTemplates.map((template) => (
                    <Button
                      key={template.contentType}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary/20"
                      onClick={() => handleQuickCreate(template)}
                    >
                      <div className="text-2xl">{template.icon}</div>
                      <div className="text-xs font-medium text-center">{template.title}</div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Bulk Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                    onClick={handleAIContentSprint}
                  >
                    <div className="text-xl">🤖⚡</div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-purple-800">AI Content Sprint</div>
                      <div className="text-xs text-purple-600">Bulk AI improvements</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12"
                    onClick={() => alert('Social Media Campaign bulk creation coming soon!')}
                  >
                    <div className="text-xl">📱✨</div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Social Campaign</div>
                      <div className="text-xs text-gray-500">Create social posts for multiple platforms</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12"
                    onClick={() => alert('Email Campaign bulk creation coming soon!')}
                  >
                    <div className="text-xl">📧🎯</div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Email Campaign</div>
                      <div className="text-xs text-gray-500">Create email subjects and content</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12"
                    onClick={() => alert('Product Launch bulk creation coming soon!')}
                  >
                    <div className="text-xl">🚀📝</div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Product Launch</div>
                      <div className="text-xs text-gray-500">All content for a product launch</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content View */}
      {currentView === 'list' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-search">Search Content</Label>
                  <Input
                    id="content-search"
                    placeholder="Search by title, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-type-filter">Filter by Content Type</Label>
                  <select
                    id="content-type-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {Object.values(ContentType).map((type) => {
                      const template = contentTemplates.find(t => t.contentType === type)
                      return (
                        <option key={type} value={type}>
                          {template ? `${template.icon} ${template.title}` : type}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content List */}
          <ContentList
            campaignId={campaignId}
            searchTerm={searchTerm}
            contentTypeFilter={contentTypeFilter}
            onViewContent={handleViewContent}
            onEditContent={handleEditContent}
          />
        </div>
      )}

      {currentView === 'create' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentView('list')}
                  size="sm"
                >
                  ← Back to Content List
                </Button>
                <CardTitle>Create New Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ContentCreation
                campaignId={campaignId}
                quickTemplate={quickTemplate}
                onSuccess={() => {
                  setCurrentView('list')
                  setQuickTemplate(null)
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {currentView === 'detail' && selectedContentId && (
        <ContentDetail
          contentId={selectedContentId}
          onBack={handleBackToList}
        />
      )}

      {currentView === 'translations' && (
        <TranslationDashboard
          campaignId={campaignId}
          onViewContent={handleViewContent}
        />
      )}
    </div>
  )
}