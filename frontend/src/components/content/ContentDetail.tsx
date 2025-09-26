'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useContent, useContentTranslations } from '@/lib/hooks/api/content/queries'
import {
  useTranslateContent,
  useSubmitForReview,
  useUpdateContent
} from '@/lib/hooks/api/content/mutations'
import { useContentWorkflow } from '@/lib/hooks/useContentWorkflow'
import { ContentType, ReviewState, Priority, TranslateContentDto } from '@/types/content'
import { Loader2, ArrowLeft, Globe, Copy, Edit, CheckCircle, Check, X, Send, Languages, FileText, MessageSquare, Mail, Tag, Target, ShoppingBag, AlertTriangle, History } from 'lucide-react'
import { ContentEdit } from './ContentEdit'
import { TranslationOverview } from './TranslationOverview'
import { ContentVersionHistory } from './ContentVersionHistory'
import { RejectionModal } from '@/components/ui/rejection-modal'
import { toast } from 'sonner'

// Translation Detail Modal Component
interface TranslationDetailModalProps {
  translationId: string
  contentId: string
  isOpen: boolean
  onClose: () => void
}

function TranslationDetailModal({ translationId, contentId, isOpen, onClose }: TranslationDetailModalProps) {
  const { data: contentResponse } = useContent(contentId)
  const { data: translationsResponse } = useContentTranslations(contentId)

  const translations = translationsResponse?.data || []
  const translation = translations.find(t => t.id === translationId)
  const content = contentResponse?.data

  if (!isOpen || !translation) return null

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Translation Details</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Translation Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Original Content</CardTitle>
                <div className="text-xs text-gray-500">
                  {getLanguageLabel(translation.sourceLanguage)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Title</Label>
                  <p className="text-sm font-medium">{content?.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm">{content?.description}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Content</Label>
                  <div className="text-sm bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                    {content?.finalText || 'No content available'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Translated Content</CardTitle>
                <div className="text-xs text-gray-500">
                  {getLanguageLabel(translation.targetLanguage)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Title</Label>
                  <p className="text-sm font-medium">{translation.translatedTitle || 'Not translated'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm">{translation.translatedDesc || 'Not translated'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Content</Label>
                  <div className="text-sm bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                    {translation.translatedContent?.body || 'No translated content available'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translation Metadata */}
          {(translation.translatedContent?.culturalNotes || translation.qualityScore) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Translation Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {translation.qualityScore && (
                  <div>
                    <Label className="text-xs text-gray-500">Quality Score</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{width: `${(translation.qualityScore || 0) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {((translation.qualityScore || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
                {translation.translatedContent?.culturalNotes && (
                  <div>
                    <Label className="text-xs text-gray-500">Cultural Notes</Label>
                    <p className="text-sm">{translation.translatedContent.culturalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(translation.translatedContent?.body || '')
              toast.success('Translation copied to clipboard')
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Translation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ContentDetailProps {
  contentId: string
  onBack?: () => void
}

export function ContentDetail({ contentId, onBack }: ContentDetailProps) {
  const [showTranslationForm, setShowTranslationForm] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [translationModel, setTranslationModel] = useState<'claude' | 'openai'>('claude')
  const [context, setContext] = useState('')
  const [translationType, setTranslationType] = useState<'literal' | 'localized' | 'culturally_adapted'>('localized')
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'translations' | 'history'>('details')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(null)
  const [showTranslationDetail, setShowTranslationDetail] = useState(false)

  // Fetch content data
  const { data: contentResponse, isLoading, error } = useContent(contentId)
  const { data: translationsResponse, isLoading: translationsLoading } = useContentTranslations(contentId)
  const { mutateAsync: translateContent, isPending: isTranslating } = useTranslateContent()
  const { mutateAsync: submitForReview, isPending: isSubmitting } = useSubmitForReview()
  const { mutateAsync: updateContent, isPending: isUpdatingContent } = useUpdateContent()

  // Use workflow hooks for approve/reject with campaign status automation
  const {
    approveContentWithWorkflow: approveContent,
    rejectContentWithWorkflow: rejectContent,
    isApprovingWithWorkflow: isApproving,
    isRejectingWithWorkflow: isRejecting
  } = useContentWorkflow({ autoUpdateCampaignStatus: true, showWorkflowMessages: true })

  const content = contentResponse?.data
  const translations = translationsResponse?.data || []

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

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "pt", label: "Portuguese" },
    { value: "it", label: "Italian" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
  ]

  const getLanguageLabel = (code: string) => {
    return languageOptions.find(lang => lang.value === code)?.label || code
  }

  const handleTranslate = async () => {
    if (!content) return

    // Check if content is approved for translation
    if (content.reviewState !== ReviewState.APPROVED) {
      toast.warning('Content Not Ready for Translation', {
        description: 'Content must be approved before translation. Please approve the content first.'
      })
      return
    }

    const translateDto: TranslateContentDto = {
      sourceLanguage: content.sourceLanguage || 'en',
      targetLanguage,
      model: translationModel,
      translationType,
      context: context.trim() || undefined,
      userId: 'user@example.com' // TODO: Get from auth context
    }

    try {
      await translateContent({ id: contentId, translateDto })
      setShowTranslationForm(false)
      setContext('')
    } catch (error) {
      console.error('Translation error:', error)
    }
  }

  const handleSubmitForReview = async () => {
    try {
      await submitForReview({
        id: contentId,
        data: {
          comments: 'Submitted for review via content detail view'
        }
      })
    } catch (error) {
      console.error('Submit for review error:', error)
    }
  }

  const handleApprove = async () => {
    try {
      await approveContent({
        id: contentId,
        approveData: {
          reviewerId: 'current-user@example.com', // TODO: Get from auth context
          reviewerName: 'Current User', // TODO: Get from auth context
          comments: 'Approved via content detail view',
          publishImmediately: false
        }
      })
    } catch (error) {
      console.error('Approval error:', error)
    }
  }

  const handleReject = () => {
    setShowRejectionModal(true)
  }

  const handleConfirmReject = async (reason: string, suggestions?: string) => {
    try {
      await rejectContent({
        id: contentId,
        rejectData: {
          reviewerId: 'current-user@example.com', // TODO: Get from auth context
          reviewerName: 'Current User', // TODO: Get from auth context
          reason,
          suggestions: suggestions || 'Please review and address the concerns mentioned.'
        }
      })
    } catch (error) {
      console.error('Rejection error:', error)
    }
  }

  const canTranslate = () => {
    return content?.reviewState === ReviewState.APPROVED
  }

  const canApprove = () => {
    return content?.reviewState === ReviewState.PENDING_REVIEW ||
           content?.reviewState === ReviewState.REVIEWED ||
           content?.reviewState === ReviewState.AI_SUGGESTED
  }

  const canSubmitForReview = () => {
    return content?.reviewState === ReviewState.DRAFT
  }

  const handleEditSave = () => {
    setIsEditing(false)
    // Content will be refetched automatically due to query invalidation
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading content...</h3>
          <p className="text-gray-600">Fetching content details.</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !content) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Error loading content</h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Content not found'}
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              ← Back to List
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show edit form if in editing mode
  if (isEditing && content) {
    return (
      <div className="space-y-6">
        <ContentEdit
          content={content}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getContentTypeIcon(content.contentType)}
                  {content.title || 'Untitled Content'}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Content ID: {content.id}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              {/* Review Actions */}
              {canSubmitForReview() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              )}

              {canApprove() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="text-green-700 border-green-200 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isApproving ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isRejecting ? 'Rejecting...' : 'Reject'}
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranslationForm(!showTranslationForm)}
                disabled={!canTranslate()}
                className={!canTranslate() ? 'opacity-50' : ''}
              >
                <Globe className="h-4 w-4 mr-2" />
                Translate {!canTranslate() && '(Approval Required)'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('translations')}
                className={activeTab === 'translations' ? 'bg-blue-50 border-blue-200' : ''}
              >
                <Languages className="h-4 w-4 mr-2" />
                Translations ({translations.length})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Status */}
      {!canTranslate() && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <h4 className="font-medium text-amber-800">Translation Requires Approval</h4>
                <p className="text-sm text-amber-700">
                  {canSubmitForReview() && "Submit this content for review first, then it can be approved for translation."}
                  {canApprove() && "This content is ready for approval. Approve it to enable translation."}
                  {content?.reviewState === ReviewState.REJECTED && "This content was rejected and needs revision before translation."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {content?.reviewState === ReviewState.APPROVED && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h4 className="font-medium text-green-800">Content Approved</h4>
                <p className="text-sm text-green-700">
                  This content has been approved and is ready for translation to other languages.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Translation Info for translated content */}
      {content.translationOf && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Languages className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-800">This is a Translation</h4>
                  <p className="text-sm text-blue-700">
                    This content is a translation from {getLanguageLabel(content.sourceLanguage)} to {getLanguageLabel(content.targetLanguage)}.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/content/${content.translationOf}`}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Globe className="h-4 w-4 mr-2" />
                View Original Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <Button
              variant="ghost"
              className={`flex-1 rounded-none border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('details')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Content Details
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-none border-b-2 ${
                activeTab === 'translations'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('translations')}
            >
              <Languages className="h-4 w-4 mr-2" />
              Translations ({translations.length})
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-none border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <History className="h-4 w-4 mr-2" />
              Version History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <>
          {/* Content Overview */}
          <div className="grid md:grid-cols-2 gap-6">
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-500">Content Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {getContentTypeIcon(content.contentType)} {content.contentType}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-500">Priority</Label>
                <div className="mt-1">
                  <Badge className={getPriorityColor(content.priority)} variant="secondary">
                    {content.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-500">Language</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {getLanguageLabel(content.sourceLanguage)} → {getLanguageLabel(content.targetLanguage)}
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

            {/* Description */}
            {content.description && (
              <div>
                <Label className="text-xs font-medium text-gray-500">Description</Label>
                <p className="mt-1 text-sm text-gray-800">{content.description}</p>
              </div>
            )}

            {/* Content Body */}
            <div>
              <Label className="text-xs font-medium text-gray-500">Content Body</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {content.finalText ? (
                  <div className="whitespace-pre-wrap text-sm">
                    {content.finalText}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No content body available
                  </div>
                )}
              </div>
              {content.finalText && (
                <Button variant="ghost" size="sm" className="mt-2">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </Button>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
              <div>Created: {new Date(content.createdAt).toLocaleDateString()} at {new Date(content.createdAt).toLocaleTimeString()}</div>
              <div>Updated: {new Date(content.updatedAt).toLocaleDateString()} at {new Date(content.updatedAt).toLocaleTimeString()}</div>
              {content.publishedAt && (
                <div>Published: {new Date(content.publishedAt).toLocaleDateString()} at {new Date(content.publishedAt).toLocaleTimeString()}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Translation Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Translations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Translations */}
            {translationsLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading translations...</p>
              </div>
            ) : translations.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-xs font-medium text-gray-500">Available Translations</Label>
                {translations.map((translation) => (
                  <div key={translation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {getLanguageLabel(translation.sourceLanguage)} → {getLanguageLabel(translation.targetLanguage)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {translation.isHumanReviewed && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-xs text-gray-500">
                          {translation.qualityScore ? `${Math.round(translation.qualityScore * 100)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {translation.translatedContent?.body && (
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {translation.translatedContent.body}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(translation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No translations yet</p>
              </div>
            )}

            {/* Translation Form */}
            {showTranslationForm && !canTranslate() && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <X className="h-5 w-5" />
                  <h4 className="font-medium">Translation Not Available</h4>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  This content must be approved before it can be translated. Please use the approval workflow above.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowTranslationForm(false)}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            )}

            {showTranslationForm && canTranslate() && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-800">Create New Translation</Label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Target Language</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                    >
                      {languageOptions.filter(lang => lang.value !== content.sourceLanguage).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">AI Model</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={translationModel}
                      onChange={(e) => setTranslationModel(e.target.value as 'claude' | 'openai')}
                    >
                      <option value="claude">Claude</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Translation Type</Label>
                  <select
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={translationType}
                    onChange={(e) => setTranslationType(e.target.value as 'literal' | 'localized' | 'culturally_adapted')}
                  >
                    <option value="literal">Literal Translation</option>
                    <option value="localized">Localized (Recommended)</option>
                    <option value="culturally_adapted">Culturally Adapted</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Context (Optional)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Provide additional context for the translation (e.g., target audience, tone, specific requirements...)"
                    rows={3}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: &ldquo;Professional fashion content for Spanish market, maintain professional tone while adapting cultural references&rdquo;
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    size="sm"
                    className="flex-1"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Start Translation
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTranslationForm(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* Translations Tab */}
      {activeTab === 'translations' && (
        <TranslationOverview
          contentId={contentId}
          onViewTranslation={(translationId) => {
            setSelectedTranslationId(translationId)
            setShowTranslationDetail(true)
          }}
        />
      )}

      {/* Version History Tab */}
      {activeTab === 'history' && content && (
        <ContentVersionHistory
          contentPiece={content}
          onCompareVersions={(version1, version2) => {
            console.log('Comparing versions:', version1, version2)
            toast.success('Version comparison initialized', {
              description: 'Check the comparison view in the history tab'
            })
          }}
          onRestoreVersion={async (versionId) => {
            if (!content) return

            try {
              // Find the version data to restore from
              const versionToRestore = content.contentVersions?.find(v => v.id === versionId)

              if (!versionToRestore) {
                toast.error('Version not found')
                return
              }

              // Update the content with the version data
              await updateContent({
                id: contentId,
                data: {
                  title: versionToRestore.title || content.title,
                  description: versionToRestore.description || content.description,
                  finalText: versionToRestore.content || content.finalText
                }
              })

              toast.success('Version restored successfully!', {
                description: `Restored to version ${versionToRestore.versionNumber}`
              })
            } catch (error) {
              console.error('Version restoration error:', error)
              toast.error('Failed to restore version', {
                description: 'Please try again or check your connection.'
              })
            }
          }}
        />
      )}

      {/* Translation Detail Modal */}
      {showTranslationDetail && selectedTranslationId && (
        <TranslationDetailModal
          translationId={selectedTranslationId}
          contentId={contentId}
          isOpen={showTranslationDetail}
          onClose={() => {
            setShowTranslationDetail(false)
            setSelectedTranslationId(null)
          }}
        />
      )}

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleConfirmReject}
        isSubmitting={isRejecting}
        contentTitle={content?.title || 'this content'}
      />
    </div>
  )
}