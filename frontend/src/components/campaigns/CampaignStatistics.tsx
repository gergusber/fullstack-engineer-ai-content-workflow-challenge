'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useContentList } from '@/lib/hooks/api/content/queries'
import { ContentType, ReviewState, Priority } from '@/types/content'
import { Campaign } from '@/types/campaign'
import {
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  Globe,
  AlertCircle,
  TrendingUp,
  Languages,
  Target,
  Calendar
} from 'lucide-react'

interface CampaignStatisticsProps {
  campaign: Campaign
  campaignId: string
}

export function CampaignStatistics({ campaign, campaignId }: CampaignStatisticsProps) {
  const { data: contentResponse } = useContentList({
    campaignId,
    limit: 1000, // Get all content for stats
  })

  const allContent = contentResponse?.data || []

  // Calculate statistics
  const stats = {
    total: allContent.length,
    draft: allContent.filter(c => c.reviewState === ReviewState.DRAFT).length,
    pendingReview: allContent.filter(c =>
      c.reviewState === ReviewState.PENDING_REVIEW ||
      c.reviewState === ReviewState.REVIEWED
    ).length,
    approved: allContent.filter(c => c.reviewState === ReviewState.APPROVED).length,
    rejected: allContent.filter(c => c.reviewState === ReviewState.REJECTED).length,
    aiSuggested: allContent.filter(c => c.reviewState === ReviewState.AI_SUGGESTED).length,

    // Translation stats
    totalTranslations: allContent.reduce((acc, content) =>
      acc + (content.translations?.length || 0), 0
    ),
    contentWithTranslations: allContent.filter(c =>
      c.translations && c.translations.length > 0
    ).length,

    // Priority breakdown
    urgent: allContent.filter(c => c.priority === Priority.URGENT).length,
    high: allContent.filter(c => c.priority === Priority.HIGH).length,
    medium: allContent.filter(c => c.priority === Priority.MEDIUM).length,
    low: allContent.filter(c => c.priority === Priority.LOW).length,

    // Content type breakdown
    contentTypes: allContent.reduce((acc, content) => {
      acc[content.contentType] = (acc[content.contentType] || 0) + 1
      return acc
    }, {} as Record<ContentType, number>),

    // Language stats
    languages: Array.from(new Set([
      ...allContent.map(c => c.sourceLanguage),
      ...allContent.flatMap(c => c.translations?.map(t => t.targetLanguage) || [])
    ])).filter(Boolean)
  }

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST: return '📝'
      case ContentType.SOCIAL_POST: return '📱'
      case ContentType.EMAIL_SUBJECT: return '📧'
      case ContentType.HEADLINE: return '🏷️'
      case ContentType.DESCRIPTION: return '📄'
      case ContentType.AD_COPY: return '🎯'
      case ContentType.PRODUCT_DESC: return '🛍️'
      case ContentType.LANDING_PAGE: return '🌐'
      default: return '📄'
    }
  }

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST: return 'Blog Posts'
      case ContentType.SOCIAL_POST: return 'Social Posts'
      case ContentType.EMAIL_SUBJECT: return 'Email Subjects'
      case ContentType.HEADLINE: return 'Headlines'
      case ContentType.DESCRIPTION: return 'Descriptions'
      case ContentType.AD_COPY: return 'Ad Copy'
      case ContentType.PRODUCT_DESC: return 'Product Descriptions'
      case ContentType.LANDING_PAGE: return 'Landing Pages'
      default: return type
    }
  }

  const getLanguageLabel = (code: string) => {
    const languageMap: Record<string, string> = {
      'en': '🇺🇸 English',
      'es': '🇪🇸 Spanish',
      'fr': '🇫🇷 French',
      'de': '🇩🇪 German',
      'pt': '🇵🇹 Portuguese',
      'it': '🇮🇹 Italian',
      'zh': '🇨🇳 Chinese',
      'ja': '🇯🇵 Japanese',
    }
    return languageMap[code] || code
  }

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Statistics
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Overview of {campaign.name} performance and content status
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Content</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Translations</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalTranslations}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.draft > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium">Draft</span>
                </div>
                <Badge variant="secondary">{stats.draft}</Badge>
              </div>
            )}

            {stats.aiSuggested > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-sm font-medium">AI Suggested</span>
                </div>
                <Badge variant="secondary">{stats.aiSuggested}</Badge>
              </div>
            )}

            {stats.pendingReview > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm font-medium">Pending Review</span>
                </div>
                <Badge variant="secondary">{stats.pendingReview}</Badge>
              </div>
            )}

            {stats.approved > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <Badge variant="secondary">{stats.approved}</Badge>
              </div>
            )}

            {stats.rejected > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <Badge variant="secondary">{stats.rejected}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Types & Priority */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.contentTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getContentTypeIcon(type as ContentType)}</span>
                    <span className="text-sm font-medium">{getContentTypeLabel(type as ContentType)}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.urgent > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Urgent</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800" variant="secondary">{stats.urgent}</Badge>
                </div>
              )}
              {stats.high > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">High</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800" variant="secondary">{stats.high}</Badge>
                </div>
              )}
              {stats.medium > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Medium</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">{stats.medium}</Badge>
                </div>
              )}
              {stats.low > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Low</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800" variant="secondary">{stats.low}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Translation & Language Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translation Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.contentWithTranslations}</p>
              <p className="text-sm text-gray-600">Content Pieces Translated</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.totalTranslations}</p>
              <p className="text-sm text-gray-600">Total Translations</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.languages.length}</p>
              <p className="text-sm text-gray-600">Languages</p>
            </div>
          </div>

          {stats.languages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Available Languages</h4>
              <div className="flex flex-wrap gap-2">
                {stats.languages.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {getLanguageLabel(lang)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}