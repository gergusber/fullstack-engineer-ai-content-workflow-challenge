'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, AlertTriangle, Send } from 'lucide-react'

interface RejectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, suggestions?: string) => void
  isSubmitting?: boolean
  contentTitle?: string
}

export function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  contentTitle = 'this content'
}: RejectionModalProps) {
  const [reason, setReason] = useState('')
  const [suggestions, setSuggestions] = useState('')

  // Common rejection reasons for quick selection
  const commonReasons = [
    'Content does not meet quality standards',
    'Factual errors or inaccuracies present',
    'Tone or style inappropriate for target audience',
    'Missing key information or requirements',
    'Violates brand guidelines',
    'Requires significant revisions',
  ]

  const handleSubmit = () => {
    if (reason.trim()) {
      onConfirm(reason.trim(), suggestions.trim() || undefined)
      handleClose()
    }
  }

  const handleClose = () => {
    setReason('')
    setSuggestions('')
    onClose()
  }

  const selectCommonReason = (selectedReason: string) => {
    setReason(selectedReason)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-800">Reject Content</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Provide feedback for "{contentTitle}"
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Reason Selection */}
          <div>
            <Label className="text-sm font-medium">Common Rejection Reasons</Label>
            <p className="text-xs text-gray-500 mb-3">
              Click on a reason below or write your own custom reason
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commonReasons.map((commonReason) => (
                <Badge
                  key={commonReason}
                  variant="outline"
                  className="cursor-pointer hover:bg-red-50 hover:border-red-200 p-2 h-auto text-left justify-start text-xs"
                  onClick={() => selectCommonReason(commonReason)}
                >
                  {commonReason}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this content is being rejected. Be specific about what needs to be changed..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={reason.trim() ? 'border-red-200 focus:border-red-500' : ''}
            />
            {!reason.trim() && (
              <p className="text-xs text-red-600">Please provide a reason for rejection</p>
            )}
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label htmlFor="suggestions">Suggestions for Improvement (Optional)</Label>
            <Textarea
              id="suggestions"
              placeholder="Provide specific suggestions on how to improve the content..."
              rows={3}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              className="border-blue-200 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">
              Helpful suggestions will guide the content creator in making necessary improvements
            </p>
          </div>

          {/* Character Count */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Reason: {reason.length} characters</span>
            {suggestions && <span>Suggestions: {suggestions.length} characters</span>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Reject Content
                </>
              )}
            </Button>
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <strong>Important:</strong> This content will be marked as rejected and will need to be revised before it can be approved for translation.
                The content creator will receive your feedback and suggestions.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}