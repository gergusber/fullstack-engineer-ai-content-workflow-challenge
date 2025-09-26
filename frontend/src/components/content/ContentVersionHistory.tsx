'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ContentPiece,
  ContentVersion,
  VersionHistoryEntry,
  AIDraft,
  Review,
  ReviewState,
  ReviewAction,
  DraftStatus
} from '@/types/content'
import {
  History,
  User,
  Calendar,
  Edit,
  Bot,
  Eye,
  MessageSquare,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Diff,
  ArrowRight,
  X,
  DiffIcon
} from 'lucide-react'

interface ContentVersionHistoryProps {
  contentPiece: ContentPiece
  onCompareVersions?: (version1: string, version2: string) => void
  onRestoreVersion?: (versionId: string) => void
}

type TimelineItemType = 'version' | 'edit' | 'ai_draft' | 'review' | 'created'

interface TimelineItem {
  id: string
  type: TimelineItemType
  title: string
  description: string
  timestamp: string
  user?: string
  data?: ContentVersion | VersionHistoryEntry | AIDraft | Review
  icon: React.ReactNode
  color: string
}

export function ContentVersionHistory({
  contentPiece,
  onCompareVersions,
  onRestoreVersion
}: ContentVersionHistoryProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'timeline' | 'versions' | 'drafts' | 'reviews' | 'comparison'>('timeline')

  // Create timeline from all version-related data
  const createTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = []

    // Add creation event
    items.push({
      id: `created-${contentPiece.id}`,
      type: 'created',
      title: 'Content Created',
      description: `Initial content piece created`,
      timestamp: contentPiece.createdAt,
      user: 'System',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'bg-gray-500'
    })

    // Add content versions
    contentPiece.contentVersions?.forEach(version => {
      items.push({
        id: `version-${version.id}`,
        type: 'version',
        title: `Version ${version.versionNumber}${version.isCurrentVersion ? ' (Current)' : ''}`,
        description: version.changeReason || 'Content updated',
        timestamp: version.createdAt,
        user: version.changedBy || 'Unknown',
        data: version,
        icon: <Edit className="h-4 w-4" />,
        color: version.isCurrentVersion ? 'bg-blue-500' : 'bg-gray-500'
      })
    })

    // Add version history entries
    contentPiece.versionHistory?.forEach((entry, index) => {
      items.push({
        id: `edit-${index}`,
        type: 'edit',
        title: `Manual Edit`,
        description: entry.changeReason || 'Content manually edited',
        timestamp: entry.editedAt,
        user: entry.editedBy,
        data: entry,
        icon: <User className="h-4 w-4" />,
        color: 'bg-green-500'
      })
    })

    // Add AI drafts
    contentPiece.aiDrafts?.forEach(draft => {
      items.push({
        id: `draft-${draft.id}`,
        type: 'ai_draft',
        title: `AI Draft (${draft.modelUsed})`,
        description: `${draft.generationType} - ${draft.status}`,
        timestamp: draft.createdAt,
        user: 'AI Assistant',
        data: draft,
        icon: <Bot className="h-4 w-4" />,
        color: 'bg-purple-500'
      })
    })

    // Add reviews
    contentPiece.reviews?.forEach(review => {
      const actionColors = {
        approve: 'bg-green-500',
        reject: 'bg-red-500',
        edit: 'bg-yellow-500',
        request_changes: 'bg-orange-500'
      }

      items.push({
        id: `review-${review.id}`,
        type: 'review',
        title: `Review: ${review.action}`,
        description: review.comments || `State changed from ${review.previousState} to ${review.newState}`,
        timestamp: review.createdAt,
        user: review.reviewerName || review.reviewerId,
        data: review,
        icon: <MessageSquare className="h-4 w-4" />,
        color: actionColors[review.action] || 'bg-gray-500'
      })
    })

    // Sort by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const timeline = createTimeline()

  const handleItemSelect = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else if (selectedItems.length < 2) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      // Replace the oldest selection
      setSelectedItems([selectedItems[1], itemId])
    }
  }

  const getStatusIcon = (state: ReviewState) => {
    switch (state) {
      case ReviewState.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case ReviewState.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />
      case ReviewState.PENDING_REVIEW:
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getDraftStatusColor = (status: DraftStatus) => {
    switch (status) {
      case DraftStatus.SELECTED:
        return 'bg-green-100 text-green-800'
      case DraftStatus.CANDIDATE:
        return 'bg-blue-100 text-blue-800'
      case DraftStatus.DISCARDED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getSelectedItemData = (itemId: string) => {
    const item = timeline.find(t => t.id === itemId)
    return item
  }

  const handleCompareSelected = () => {
    if (selectedItems.length === 2) {
      setViewMode('comparison')
      if (onCompareVersions) {
        onCompareVersions(selectedItems[0], selectedItems[1])
      }
    }
  }

  const getItemContent = (item: TimelineItem) => {
    const formatContent = (content: any): string => {
      if (typeof content === 'string') {
        return content
      }
      if (typeof content === 'object' && content !== null) {
        return JSON.stringify(content, null, 2)
      }
      return 'No content'
    }

    if (item.type === 'version' && item.data) {
      const version = item.data as ContentVersion
      return {
        title: version.title || 'No title',
        description: version.description || 'No description',
        content: formatContent(version.content)
      }
    }

    if (item.type === 'ai_draft' && item.data) {
      const draft = item.data as AIDraft
      return {
        title: draft.generatedTitle || 'No title',
        description: draft.generatedDesc || 'No description',
        content: formatContent(draft.generatedContent)
      }
    }

    if (item.type === 'edit' && item.data) {
      const edit = item.data as VersionHistoryEntry
      return {
        title: edit.title || 'No title',
        description: edit.description || 'No description',
        content: formatContent(edit.content)
      }
    }

    // Fallback for other types
    return {
      title: item.title,
      description: item.description,
      content: 'Content not available for this item type'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle>Content Version History</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <History className="h-4 w-4 mr-2" />
                Timeline
              </Button>
              <Button
                variant={viewMode === 'versions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('versions')}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Versions
              </Button>
              <Button
                variant={viewMode === 'drafts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('drafts')}
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Drafts
              </Button>
              <Button
                variant={viewMode === 'reviews' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('reviews')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Reviews
              </Button>
              {selectedItems.length === 2 && (
                <Button
                  variant={viewMode === 'comparison' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('comparison')}
                >
                  <Diff className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              )}
            </div>
          </div>
          {selectedItems.length === 2 && onCompareVersions && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  2 items selected for comparison
                </span>
                <Button
                  size="sm"
                  onClick={handleCompareSelected}
                >
                  <Diff className="h-4 w-4 mr-2" />
                  Compare Selected
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Timeline</CardTitle>
            <p className="text-sm text-gray-600">
              Complete history of all changes and updates to this content piece
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedItems.includes(item.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemSelect(item.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    {item.user && (
                      <div className="flex items-center gap-1 mt-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{item.user}</span>
                      </div>
                    )}
                  </div>
                  {selectedItems.includes(item.id) && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versions View */}
      {viewMode === 'versions' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Versions</CardTitle>
            <p className="text-sm text-gray-600">
              Formal versions of the content piece with change tracking
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentPiece.contentVersions?.map(version => (
                <div
                  key={version.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.isCurrentVersion ? 'default' : 'secondary'}>
                        Version {version.versionNumber}
                      </Badge>
                      {version.isCurrentVersion && (
                        <Badge variant="outline" className="text-green-600">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemSelect(`version-${version.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {!version.isCurrentVersion && onRestoreVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRestoreVersion(version.id)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">Title</Label>
                      <p className="text-sm">{version.title || 'No title'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Description</Label>
                      <p className="text-sm">{version.description || 'No description'}</p>
                    </div>
                    {version.changeReason && (
                      <div>
                        <Label className="text-xs text-gray-500">Change Reason</Label>
                        <p className="text-sm">{version.changeReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.changedBy || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(version.createdAt)}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No formal versions created yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Drafts View */}
      {viewMode === 'drafts' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Generated Drafts</CardTitle>
            <p className="text-sm text-gray-600">
              AI-generated content variations and improvements
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentPiece.aiDrafts?.map(draft => (
                <div
                  key={draft.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getDraftStatusColor(draft.status)}>
                        {draft.status}
                      </Badge>
                      <Badge variant="outline">
                        {draft.modelUsed}
                      </Badge>
                      <Badge variant="outline">
                        {draft.generationType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {draft.qualityScore && (
                        <span className="text-sm text-gray-600">
                          Quality: {(draft.qualityScore * 100).toFixed(0)}%
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemSelect(`draft-${draft.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">Generated Title</Label>
                      <p className="text-sm">{draft.generatedTitle || 'No title generated'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Generated Description</Label>
                      <p className="text-sm">{draft.generatedDesc || 'No description generated'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Prompt Used</Label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded text-xs">
                        {draft.prompt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {draft.responseTimeMs}ms
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(draft.createdAt)}
                    </div>
                    {draft.costUsd && (
                      <div className="flex items-center gap-1">
                        ${draft.costUsd.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No AI drafts generated yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews View */}
      {viewMode === 'reviews' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review History</CardTitle>
            <p className="text-sm text-gray-600">
              All review actions and feedback on this content piece
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentPiece.reviews?.map(review => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(review.newState)}
                      <Badge variant="outline">
                        {review.action.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {review.reviewType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(review.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">State Change</Label>
                      <p className="text-sm">
                        {review.previousState} → {review.newState}
                      </p>
                    </div>
                    {review.comments && (
                      <div>
                        <Label className="text-xs text-gray-500">Comments</Label>
                        <p className="text-sm">{review.comments}</p>
                      </div>
                    )}
                    {review.suggestions && (
                      <div>
                        <Label className="text-xs text-gray-500">Suggestions</Label>
                        <p className="text-sm">{review.suggestions}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {review.reviewerName || review.reviewerId}
                    </div>
                    {review.reviewerRole && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {review.reviewerRole}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No reviews completed yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && selectedItems.length === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DiffIcon className="h-5 w-5" />
                  Version Comparison
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Compare two selected items side by side
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                >
                  Back to Timeline
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedItems([])
                    setViewMode('timeline')
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedItems.map((itemId, index) => {
                const item = getSelectedItemData(itemId)
                if (!item) return null

                const content = getItemContent(item)

                return (
                  <div key={itemId} className="space-y-4">
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${item.color}`}>
                            {item.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatTimestamp(item.timestamp)}
                          {item.user && (
                            <>
                              <span>•</span>
                              <User className="h-3 w-3" />
                              {item.user}
                            </>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Title</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <p className="text-sm">{content.title}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Description</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <p className="text-sm">{content.description}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Content</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border max-h-60 overflow-y-auto">
                            <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                          </div>
                        </div>

                        {/* Additional metadata based on item type */}
                        {item.type === 'version' && item.data && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Version Info</Label>
                            <div className="mt-1 p-3 bg-blue-50 rounded-md border space-y-1">
                              <p className="text-xs">Version: {(item.data as ContentVersion).versionNumber}</p>
                              {(item.data as ContentVersion).changeReason && (
                                <p className="text-xs">Change Reason: {(item.data as ContentVersion).changeReason}</p>
                              )}
                              <p className="text-xs">
                                Status: {(item.data as ContentVersion).isCurrentVersion ? 'Current' : 'Historical'}
                              </p>
                            </div>
                          </div>
                        )}

                        {item.type === 'ai_draft' && item.data && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">AI Draft Info</Label>
                            <div className="mt-1 p-3 bg-purple-50 rounded-md border space-y-1">
                              <p className="text-xs">Model: {(item.data as AIDraft).modelUsed}</p>
                              <p className="text-xs">Type: {(item.data as AIDraft).generationType}</p>
                              <p className="text-xs">Status: {(item.data as AIDraft).status}</p>
                              {(item.data as AIDraft).qualityScore && (
                                <p className="text-xs">
                                  Quality Score: {((item.data as AIDraft).qualityScore * 100).toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {item.type === 'review' && item.data && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Review Info</Label>
                            <div className="mt-1 p-3 bg-green-50 rounded-md border space-y-1">
                              <p className="text-xs">Action: {(item.data as Review).action}</p>
                              <p className="text-xs">
                                State Change: {(item.data as Review).previousState} → {(item.data as Review).newState}
                              </p>
                              <p className="text-xs">Type: {(item.data as Review).reviewType}</p>
                              {(item.data as Review).comments && (
                                <p className="text-xs">Comments: {(item.data as Review).comments}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}