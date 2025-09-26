'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useContent, useContentTranslations } from '@/lib/hooks/api/content/queries'
import { ContentType, ReviewState, Priority, Translation } from '@/types/content'
import { Loader2, Globe, CheckCircle, Clock, AlertCircle, Copy, Eye } from 'lucide-react'

interface TranslationOverviewProps {
  contentId: string
  onViewTranslation?: (translationId: string) => void
}

export function TranslationOverview({ contentId, onViewTranslation }: TranslationOverviewProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')

  const { data: contentResponse, isLoading: contentLoading } = useContent(contentId)
  const { data: translationsResponse, isLoading: translationsLoading } = useContentTranslations(contentId)

  const content = contentResponse?.data
  const translations = translationsResponse?.data || []

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

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600'
    if (score >= 0.9) return 'bg-green-100 text-green-800'
    if (score >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Not rated'
    if (score >= 0.9) return 'Excellent'
    if (score >= 0.7) return 'Good'
    return 'Needs review'
  }

  const filteredTranslations = selectedLanguage === 'all'
    ? translations
    : translations.filter(t => t.targetLanguage === selectedLanguage)

  const availableLanguages = Array.from(new Set(translations.map(t => t.targetLanguage)))

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast here
    })
  }

  if (contentLoading || translationsLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading translation overview...</p>
        </CardContent>
      </Card>
    )
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">Content not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Translation Overview
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage translations for: "{content.title}"
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {translations.length} Translation{translations.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Original Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {getContentTypeIcon(content.contentType)}
            Original Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Title</Label>
              <p className="font-medium">{content.title || 'Untitled'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Language</Label>
              <p>{getLanguageLabel(content.sourceLanguage)}</p>
            </div>
          </div>

          {content.description && (
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <p className="text-sm text-gray-700">{content.description}</p>
            </div>
          )}

          {content.finalText && (
            <div>
              <Label className="text-xs text-gray-500">Content Body</Label>
              <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 rounded border">
                <p className="text-sm whitespace-pre-wrap">{content.finalText}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.finalText || '')}
                className="mt-1"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Filters */}
      {availableLanguages.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter by Language</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLanguage === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLanguage('all')}
              >
                All Languages ({translations.length})
              </Button>
              {availableLanguages.map((lang) => {
                const count = translations.filter(t => t.targetLanguage === lang).length
                return (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {getLanguageLabel(lang)} ({count})
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Translations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Translations
            {selectedLanguage !== 'all' && (
              <span className="text-base font-normal text-gray-600 ml-2">
                - {getLanguageLabel(selectedLanguage)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTranslations.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No translations found</h3>
              <p className="text-sm text-gray-500">
                {selectedLanguage === 'all'
                  ? "This content hasn't been translated yet."
                  : `No translations found for ${getLanguageLabel(selectedLanguage)}.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTranslations.map((translation) => (
                <Card key={translation.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getLanguageLabel(translation.targetLanguage)}
                        </Badge>
                        <Badge className={getQualityColor(translation.qualityScore)} variant="secondary">
                          {getQualityLabel(translation.qualityScore)}
                          {translation.qualityScore && ` (${Math.round(translation.qualityScore * 100)}%)`}
                        </Badge>
                        {translation.isHumanReviewed && (
                          <Badge className="bg-blue-100 text-blue-800" variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Human Reviewed
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {onViewTranslation && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTranslation(translation.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                        {translation.translatedContent?.body && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(translation.translatedContent?.body || '')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>

                    {translation.translatedContent && (
                      <div className="space-y-2">
                        {translation.translatedContent.title && (
                          <div>
                            <Label className="text-xs text-gray-500">Translated Title</Label>
                            <p className="font-medium text-sm">{translation.translatedContent.title}</p>
                          </div>
                        )}

                        {translation.translatedContent.description && (
                          <div>
                            <Label className="text-xs text-gray-500">Translated Description</Label>
                            <p className="text-sm text-gray-700">{translation.translatedContent.description}</p>
                          </div>
                        )}

                        {translation.translatedContent.body && (
                          <div>
                            <Label className="text-xs text-gray-500">Translated Content</Label>
                            <div className="max-h-24 overflow-y-auto p-2 bg-gray-50 rounded border">
                              <p className="text-sm whitespace-pre-wrap">{translation.translatedContent.body}</p>
                            </div>
                          </div>
                        )}

                        {translation.translatedContent.culturalNotes && (
                          <div>
                            <Label className="text-xs text-gray-500">Cultural Notes</Label>
                            <p className="text-xs text-gray-600 italic">{translation.translatedContent.culturalNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        {translation.modelUsed && (
                          <span>Model: {translation.modelUsed}</span>
                        )}
                        <span>Created: {new Date(translation.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(translation.updatedAt).toLocaleTimeString()}</span>
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