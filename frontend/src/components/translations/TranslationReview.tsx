'use client'

import { useState } from 'react'
import { usePendingAIDraftTranslations, useApproveAIDraftTranslation } from '@/lib/hooks/api/translations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Clock, CheckCircle } from 'lucide-react'

interface TranslationReviewProps {
  contentId?: string
}

export function TranslationReview({ contentId }: TranslationReviewProps) {
  const [selectedContentId, setSelectedContentId] = useState(contentId)
  const [reviewComments, setReviewComments] = useState<{ [key: string]: string }>({})

  const { data: aiDrafts, isLoading, error } = usePendingAIDraftTranslations(selectedContentId)
  const approveAIDraft = useApproveAIDraftTranslation()

  const handleApprove = (aiDraftId: string) => {
    approveAIDraft.mutate({
      aiDraftId,
      approveData: {
        reviewerId: 'user@example.com', // TODO: Get from auth context
        reviewerName: 'John Doe', // TODO: Get from auth context
        comments: reviewComments[aiDraftId] || 'AI draft translation approved and ready for publication'
      }
    })
  }

  const updateComments = (aiDraftId: string, comments: string) => {
    setReviewComments(prev => ({
      ...prev,
      [aiDraftId]: comments
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading pending translations...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <span>❌ Error loading translations: {(error as any)?.message || 'Unknown error'}</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          🌍 AI Draft Translation Review
        </h1>
        <p className="text-gray-600">
          Review and approve AI-generated translations. This is the new workflow that properly handles the Spanish translation approval process.
        </p>
      </div>

      {/* Content filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="contentId">Content ID (Optional)</Label>
              <Input
                id="contentId"
                type="text"
                placeholder="Filter by specific content ID..."
                value={selectedContentId || ''}
                onChange={(e) => setSelectedContentId(e.target.value || undefined)}
                className="mt-1"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedContentId(undefined)}
            >
              Show All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {/* {!aiDrafts?.data || aiDrafts.data.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-16 w-16 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Pending AI Draft Translations</h3>
            <p className="text-gray-600">
              {selectedContentId
                ? 'No translations pending review for this specific content piece.'
                : 'All AI draft translations have been reviewed and approved!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Pending AI Draft Translations ({aiDrafts.data.length})
            </h2>
            <Badge variant="secondary" className="text-sm">
              {selectedContentId ? 'Filtered by Content ID' : 'All Translations'}
            </Badge>
          </div>

          {aiDrafts.data.map(({ aiDraft, contentPiece }) => (
            <Card key={aiDraft.id} className="border-l-4 border-l-orange-400">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{contentPiece.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{contentPiece.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {contentPiece.sourceLanguage} → {contentPiece.targetLanguage}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-600">
                      ⭐ Quality: {aiDraft.qualityScore?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Original Content</Label>
                    <div className="bg-gray-50 p-3 rounded border">
                      <h4 className="font-medium">{contentPiece.title}</h4>
                      <p className="text-sm text-gray-600">{contentPiece.description}</p>
                      {contentPiece.finalText && (
                        <p className="text-sm mt-2">{contentPiece.finalText.substring(0, 200)}...</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">AI Generated Translation</Label>
                    <div className="bg-blue-50 p-3 rounded border">
                      <h4 className="font-medium">{aiDraft.generatedContent.title}</h4>
                      <p className="text-sm text-gray-600">{aiDraft.generatedContent.description}</p>
                      {aiDraft.generatedContent.body && (
                        <p className="text-sm mt-2">{aiDraft.generatedContent.body.substring(0, 200)}...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Model Used</Label>
                      <p className="text-gray-600">{aiDraft.modelUsed}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Generation Type</Label>
                      <p className="text-gray-600">{aiDraft.generationType}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Status</Label>
                      <Badge variant="secondary">{aiDraft.status}</Badge>
                    </div>
                    <div>
                      <Label className="font-medium">Created</Label>
                      <p className="text-gray-600">{new Date(aiDraft.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`comments-${aiDraft.id}`}>Review Comments (Optional)</Label>
                  <Textarea
                    id={`comments-${aiDraft.id}`}
                    placeholder="Add your review comments here..."
                    value={reviewComments[aiDraft.id] || ''}
                    onChange={(e) => updateComments(aiDraft.id, e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleApprove(aiDraft.id)}
                    disabled={approveAIDraft.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approveAIDraft.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Move to Translations
                      </>
                    )}
                  </Button>

                  <Button variant="destructive">
                    ❌ Reject Translation
                  </Button>

                  <Button variant="outline">
                    Request Changes
                  </Button>
                </div>

                {approveAIDraft.isSuccess && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded">
                    <p className="text-green-800 text-sm">
                      Translation approved successfully! The AI draft has been converted to a proper translation record and is now available for publication.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )} */}
    </div>
  )
}