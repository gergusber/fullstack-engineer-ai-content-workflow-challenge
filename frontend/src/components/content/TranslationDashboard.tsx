'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useContentList } from '@/lib/hooks/api/content/queries'
import { ContentType, ReviewState } from '@/types/content'
import { Loader2, Globe, Search, Filter, BarChart3, Languages, CheckCircle, Clock, AlertTriangle, FileText, MessageSquare, Mail, Tag, Target, ShoppingBag } from 'lucide-react'

interface TranslationDashboardProps {
  campaignId: string
  onViewContent: (contentId: string) => void
}

export function TranslationDashboard({ campaignId, onViewContent }: TranslationDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'translated'>('all')

  const { data: contentResponse, isLoading } = useContentList({
    campaignId,
    search: searchTerm || undefined,
    page: 1,
    limit: 100,
  })

  const allContent = contentResponse?.data || []

  // Filter content based on translation readiness
  const filteredContent = allContent.filter((content) => {
    const matchesSearch = !searchTerm ||
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    switch (statusFilter) {
      case 'approved':
        return content.reviewState === ReviewState.APPROVED
      case 'pending':
        return content.reviewState === ReviewState.PENDING_REVIEW || content.reviewState === ReviewState.REVIEWED
      case 'translated':
        return content.translations && content.translations.length > 0
      default:
        return true
    }
  })

  // Analytics
  const stats = {
    total: allContent.length,
    approved: allContent.filter(c => c.reviewState === ReviewState.APPROVED).length,
    translated: allContent.filter(c => c.translations && c.translations.length > 0).length,
    pendingApproval: allContent.filter(c =>
      c.reviewState === ReviewState.PENDING_REVIEW ||
      c.reviewState === ReviewState.REVIEWED
    ).length
  }

  // Language stats
  const languageStats = allContent.reduce((acc, content) => {
    if (content.translations) {
      content.translations.forEach(translation => {
        const lang = translation.targetLanguage
        if (!acc[lang]) acc[lang] = { count: 0, quality: [] }
        acc[lang].count++
        if (translation.qualityScore) {
          acc[lang].quality.push(translation.qualityScore)
        }
      })
    }
    return acc
  }, {} as Record<string, { count: number, quality: number[] }>)

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

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST: return <FileText className="h-4 w-4" />
      case ContentType.SOCIAL_POST: return <MessageSquare className="h-4 w-4" />
      case ContentType.EMAIL_SUBJECT: return <Mail className="h-4 w-4" />
      case ContentType.HEADLINE: return <Tag className="h-4 w-4" />
      case ContentType.DESCRIPTION: return <FileText className="h-4 w-4" />
      case ContentType.AD_COPY: return <Target className="h-4 w-4" />
      case ContentType.PRODUCT_DESC: return <ShoppingBag className="h-4 w-4" />
      case ContentType.LANDING_PAGE: return <Globe className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (content: any) => {
    if (content.translations && content.translations.length > 0) {
      return (
        <Badge className="bg-green-100 text-green-800" variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          {content.translations.length} Translation{content.translations.length !== 1 ? 's' : ''}
        </Badge>
      )
    }

    if (content.reviewState === ReviewState.APPROVED) {
      return (
        <Badge className="bg-blue-100 text-blue-800" variant="secondary">
          <Globe className="h-3 w-3 mr-1" />
          Ready for Translation
        </Badge>
      )
    }

    if (content.reviewState === ReviewState.PENDING_REVIEW || content.reviewState === ReviewState.REVIEWED) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Approval
        </Badge>
      )
    }

    return (
      <Badge className="bg-gray-100 text-gray-600" variant="secondary">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Not Ready
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading translation dashboard...</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-6 w-6" />
            Translation Dashboard
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage translations across all content pieces in this campaign
          </p>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Content</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready to Translate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Translated</p>
                <p className="text-2xl font-bold text-green-600">{stats.translated}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Overview */}
      {Object.keys(languageStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Translation Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(languageStats).map(([lang, data]) => {
                const avgQuality = data.quality.length > 0
                  ? data.quality.reduce((a, b) => a + b, 0) / data.quality.length
                  : null

                return (
                  <div key={lang} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{getLanguageLabel(lang)}</span>
                      <Badge variant="outline">{data.count}</Badge>
                    </div>
                    {avgQuality && (
                      <div className="text-xs text-gray-600">
                        Avg Quality: {Math.round(avgQuality * 100)}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Content</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search titles and descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <select
                id="status-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Content ({stats.total})</option>
                <option value="approved">Ready to Translate ({stats.approved})</option>
                <option value="pending">Pending Approval ({stats.pendingApproval})</option>
                <option value="translated">Already Translated ({stats.translated})</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Content Pieces
            <span className="text-base font-normal text-gray-600 ml-2">
              ({filteredContent.length} items)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContent.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No content found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No content pieces available for translation.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContent.map((content) => (
                <Card key={content.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getContentTypeIcon(content.contentType)}</span>
                          <h3 className="font-medium">{content.title || 'Untitled Content'}</h3>
                          {getStatusBadge(content)}
                        </div>

                        {content.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {content.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Type: {content.contentType}</span>
                          <span>Language: {getLanguageLabel(content.sourceLanguage)} → {getLanguageLabel(content.targetLanguage)}</span>
                          <span>Updated: {new Date(content.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewContent(content.id)}
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Manage Translations
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}