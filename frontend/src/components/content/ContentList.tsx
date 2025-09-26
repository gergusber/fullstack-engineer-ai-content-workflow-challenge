'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useContentList } from '@/lib/hooks/api/content/queries'
import { ContentType, ReviewState, Priority } from '@/types/content'
import { Loader2, FileText, MessageSquare, Mail, Tag, Target, ShoppingBag, Globe, AlertTriangle, Eye, Edit, Languages } from 'lucide-react'

interface ContentListProps {
  campaignId: string
  searchTerm: string
  contentTypeFilter: string
  onViewContent?: (contentId: string) => void
  onEditContent?: (contentId: string) => void
}

export function ContentList({ campaignId, searchTerm, contentTypeFilter, onViewContent, onEditContent }: ContentListProps) {
  // Fetch content data using our API hook
  const { data: contentResponse, isLoading, error } = useContentList({
    campaignId,
    search: searchTerm || undefined,
    contentType: contentTypeFilter !== 'all' ? contentTypeFilter as ContentType : undefined,
    page: 1,
    limit: 50, // Reasonable limit for UI
  })

  const contentData = contentResponse?.data || []

  // Additional client-side filtering if needed
  const filteredContent = contentData.filter((content) => {
    const matchesSearch = !searchTerm || 
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = contentTypeFilter === 'all' || content.contentType === contentTypeFilter

    return matchesSearch && matchesType
  })

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

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST: return 'Blog Post'
      case ContentType.SOCIAL_POST: return 'Social Post'
      case ContentType.EMAIL_SUBJECT: return 'Email Subject'
      case ContentType.HEADLINE: return 'Headline'
      case ContentType.DESCRIPTION: return 'Description'
      case ContentType.AD_COPY: return 'Ad Copy'
      case ContentType.PRODUCT_DESC: return 'Product Description'
      case ContentType.LANDING_PAGE: return 'Landing Page'
      default: return type
    }
  }

  const getReviewStateColor = (state: ReviewState) => {
    switch (state) {
      case ReviewState.DRAFT: return 'bg-gray-100 text-gray-800'
      case ReviewState.AI_SUGGESTED: return 'bg-purple-100 text-purple-800'
      case ReviewState.PENDING_REVIEW: return 'bg-yellow-100 text-yellow-800'
      case ReviewState.REVIEWED: return 'bg-blue-100 text-blue-800'
      case ReviewState.APPROVED: return 'bg-green-100 text-green-800'
      case ReviewState.REJECTED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-100 text-red-800'
      case Priority.HIGH: return 'bg-orange-100 text-orange-800'
      case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-800'
      case Priority.LOW: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading content...</h3>
          <p className="text-gray-600">Fetching content pieces for this campaign.</p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Error loading content</h3>
          <p className="text-gray-600 mb-4">
            There was an error loading the content pieces. Please try again.
          </p>
          <p className="text-sm text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (filteredContent.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No content found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || contentTypeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Start by creating your first piece of content for this campaign.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredContent.length} content piece{filteredContent.length !== 1 ? 's' : ''}
          {contentResponse?.pagination && (
            <span className="ml-2 text-xs text-gray-500">
              (Total: {contentResponse.pagination.total})
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContent.map((content) => (
          <Card key={content.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight flex items-center gap-2">
                  {getContentTypeIcon(content.contentType)}
                  {content.title}
                </CardTitle>
                <Badge className={getPriorityColor(content.priority)} variant="secondary">
                  {content.priority}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {content.description || 'No description provided'}
              </p>

              {/* Content Type and Language */}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Content Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getContentTypeLabel(content.contentType)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Language</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {content.sourceLanguage} → {content.targetLanguage}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge className={getReviewStateColor(content.reviewState)} variant="secondary">
                      {content.reviewState.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Created: {new Date(content.createdAt).toLocaleDateString()}</div>
                <div>Updated: {new Date(content.updatedAt).toLocaleDateString()}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onViewContent?.(content.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (onEditContent) {
                      onEditContent(content.id)
                    } else {
                      onViewContent?.(content.id)
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onViewContent?.(content.id)}
                >
                  <Languages className="h-4 w-4 mr-1" />
                   Translate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}