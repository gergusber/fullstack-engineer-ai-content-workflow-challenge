'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Campaign } from '@/types/campaign'
import { Save, X, RotateCcw, Edit, Play, Pause, CheckCircle, Archive } from 'lucide-react'

// Campaign edit schema
const campaignEditSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .min(3, "Campaign name must be at least 3 characters")
    .max(100, "Campaign name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  status: z
    .enum(['active', 'paused', 'completed', 'archived'])
    .optional(),
})

type CampaignEditFormData = z.infer<typeof campaignEditSchema>

interface CampaignEditProps {
  campaign: Campaign
  onSave: (data: CampaignEditFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function CampaignEdit({
  campaign,
  onSave,
  onCancel,
  isSubmitting = false
}: CampaignEditProps) {
  const form = useForm<CampaignEditFormData>({
    resolver: zodResolver(campaignEditSchema),
    defaultValues: {
      name: campaign.name || "",
      description: campaign.description || "",
      status: campaign.status || 'active',
    },
  })

  const statusOptions = [
    { value: 'active', label: 'Active', description: 'Campaign is currently running', icon: Play },
    { value: 'paused', label: 'Paused', description: 'Campaign is temporarily stopped', icon: Pause },
    { value: 'completed', label: 'Completed', description: 'Campaign has finished successfully', icon: CheckCircle },
    { value: 'archived', label: 'Archived', description: 'Campaign is archived for reference', icon: Archive },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const onSubmit = (data: CampaignEditFormData) => {
    onSave(data)
  }

  const handleReset = () => {
    form.reset({
      name: campaign.name || "",
      description: campaign.description || "",
      status: campaign.status || 'active',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Campaign
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} size="sm" disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              placeholder="Enter campaign name"
              {...form.register("name")}
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              A clear, descriptive name for your campaign
            </p>
          </div>

          {/* Campaign Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the campaign goals, target audience, and key objectives..."
              rows={4}
              {...form.register("description")}
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">
                {form.formState.errors.description.message}
              </p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Optional but recommended for team clarity</span>
              <span>{form.watch('description')?.length || 0}/500 characters</span>
            </div>
          </div>

          {/* Campaign Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Campaign Status</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register("status")}
              disabled={isSubmitting}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-600">
                {form.formState.errors.status.message}
              </p>
            )}

            {/* Status Descriptions */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {statusOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <div
                    key={option.value}
                    className={`p-2 rounded border text-xs ${
                      form.watch('status') === option.value
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium flex items-center gap-1">
                      <IconComponent className="h-3 w-3" />
                      {option.label}
                    </div>
                    <div className="text-gray-600">{option.description}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Status Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Current Campaign Status</h4>
              <Badge className={getStatusColor(form.watch('status') || 'active')} variant="secondary">
                {(() => {
                  const currentStatus = statusOptions.find(s => s.value === form.watch('status'))
                  const IconComponent = currentStatus?.icon || Play
                  return (
                    <span className="flex items-center gap-1">
                      <IconComponent className="h-3 w-3" />
                      {currentStatus?.label || 'Active'}
                    </span>
                  )
                })()}
              </Badge>
            </div>
            <div className="text-xs text-gray-600">
              <div>Campaign ID: {campaign.id}</div>
              <div>Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
              <div>Last Updated: {new Date(campaign.updatedAt).toLocaleDateString()}</div>
              {campaign.createdBy && <div>Created By: {campaign.createdBy}</div>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
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