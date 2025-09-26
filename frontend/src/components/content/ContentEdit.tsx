'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useUpdateContent } from '@/lib/hooks/api/content/mutations'
import { ContentType, Priority, ContentPiece } from '@/types/content'
import { Save, X, RotateCcw } from 'lucide-react'

// Content edit schema
const contentEditSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  contentType: z
    .enum([...Object.values(ContentType)] as [ContentType, ...ContentType[]])
    .transform((val) => val as ContentType),
  targetLanguage: z.string().min(1, "Target language is required"),
  sourceLanguage: z.string().min(1, "Source language is required"),
  priority: z
    .enum([...Object.values(Priority)] as [Priority, ...Priority[]])
    .transform((val) => val as Priority),
  finalText: z.string().optional(),
})

type ContentEditFormData = z.infer<typeof contentEditSchema>

interface ContentEditProps {
  content: ContentPiece
  onSave: () => void
  onCancel: () => void
}

export function ContentEdit({ content, onSave, onCancel }: ContentEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: updateContent } = useUpdateContent()

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST:
        return "📝 Blog Post"
      case ContentType.SOCIAL_POST:
        return "📱 Social Post"
      case ContentType.EMAIL_SUBJECT:
        return "📧 Email Subject"
      case ContentType.HEADLINE:
        return "🏷️ Headline"
      case ContentType.DESCRIPTION:
        return "📄 Description"
      case ContentType.AD_COPY:
        return "🎯 Ad Copy"
      case ContentType.PRODUCT_DESC:
        return "🛍️ Product Description"
      case ContentType.LANDING_PAGE:
        return "🌐 Landing Page"
      default:
        return type
    }
  }

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return "🟢 Low"
      case Priority.MEDIUM:
        return "🟡 Medium"
      case Priority.HIGH:
        return "🟠 High"
      case Priority.URGENT:
        return "🔴 Urgent"
      default:
        return priority
    }
  }

  const form = useForm<ContentEditFormData>({
    resolver: zodResolver(contentEditSchema),
    defaultValues: {
      title: content.title || "",
      description: content.description || "",
      contentType: content.contentType,
      targetLanguage: content.targetLanguage || "en",
      sourceLanguage: content.sourceLanguage || "en",
      priority: content.priority,
      finalText: content.finalText || "",
    },
  })

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

  const onSubmit = async (data: ContentEditFormData) => {
    setIsSubmitting(true)
    try {
      await updateContent({
        id: content.id,
        data: {
          title: data.title,
          description: data.description,
          contentType: data.contentType,
          targetLanguage: data.targetLanguage,
          sourceLanguage: data.sourceLanguage,
          priority: data.priority as Priority,
          finalText: data.finalText || "",
          changeReason: "Updated via content edit form",
          updatedBy: "user@example.com", // TODO: Get from auth context
        },
      })

      onSave()
    } catch (error) {
      console.error("Content update error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    form.reset({
      title: content.title || "",
      description: content.description || "",
      contentType: content.contentType,
      targetLanguage: content.targetLanguage || "en",
      sourceLanguage: content.sourceLanguage || "en",
      priority: content.priority,
      finalText: content.finalText || "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">✏️</div>
            Edit Content
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} size="sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Content Title *</Label>
              <Input
                id="title"
                placeholder="Enter content title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type *</Label>
              <select
                id="contentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...form.register("contentType")}
              >
                {Object.values(ContentType).map((option) => (
                  <option key={option} value={option}>
                    {getContentTypeLabel(option)}
                  </option>
                ))}
              </select>
              {form.formState.errors.contentType && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.contentType.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the content purpose and requirements..."
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Language and Priority */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceLanguage">Source Language *</Label>
              <select
                id="sourceLanguage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...form.register("sourceLanguage")}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.sourceLanguage && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.sourceLanguage.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLanguage">Target Language *</Label>
              <select
                id="targetLanguage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...form.register("targetLanguage")}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.targetLanguage && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.targetLanguage.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...form.register("priority")}
              >
                {Object.values(Priority).map((option) => (
                  <option key={option} value={option}>
                    {getPriorityLabel(option)}
                  </option>
                ))}
              </select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="space-y-2">
            <Label htmlFor="finalText">Content Body</Label>
            <Textarea
              id="finalText"
              placeholder="Write your content here..."
              rows={10}
              {...form.register("finalText")}
              className="min-h-[200px]"
            />
            <p className="text-xs text-gray-500">
              Edit the main content text here. This is what will be translated and published.
            </p>
            {form.formState.errors.finalText && (
              <p className="text-sm text-red-600">
                {form.formState.errors.finalText.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isSubmitting}
              className="text-gray-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}