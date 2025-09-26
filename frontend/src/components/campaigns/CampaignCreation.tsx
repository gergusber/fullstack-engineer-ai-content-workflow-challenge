'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCampaign } from '@/lib/hooks/api/campaigns/mutations'
import { CreateCampaignDto } from '@/lib/api/types'
import { Campaign, CampaignStatus } from '@/types/campaign'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Rocket, Loader2 } from 'lucide-react'

// Campaign creation schema (matching backend API)
const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  targetMarkets: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignCreationProps {
  onSuccess?: (campaign: Campaign) => void
}

export function CampaignCreation({ onSuccess }: CampaignCreationProps) {
  const createCampaign = useCreateCampaign()
  const [targetMarketsInput, setTargetMarketsInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      status:CampaignStatus.DRAFT,
      targetMarkets: [],
      tags: [],
      createdBy: '',
    }
  })

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData: CreateCampaignDto = {
        name: data.name,
        description: data.description || undefined,
        status: data.status as CampaignStatus,
        targetMarkets: data.targetMarkets,
        tags: data.tags,
        createdBy: data.createdBy || undefined
      }

      await createCampaign.mutateAsync(campaignData)

      form.reset()
      if (onSuccess) {
        onSuccess(campaignData as Campaign)
      }
    } catch (error) {
      console.error('Campaign creation error:', error)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Rocket className="h-5 w-5 mr-2" />
          Create New Campaign
        </CardTitle>
        <p className="text-muted-foreground">
          Set up a new marketing campaign with detailed targeting and objectives.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="Enter campaign name"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Campaign Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 opacity-50 cursor-not-allowed"
                {...form.register('status')}
                value="draft"
                disabled
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <p className="text-xs text-muted-foreground">
                New campaigns are created as drafts and can be activated later
              </p>
              {form.formState.errors.status && (
                <p className="text-sm text-red-600">{form.formState.errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your campaign goals and strategy..."
              rows={3}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Target Markets */}
          <div className="space-y-2">
            <Label htmlFor="targetMarkets">Target Markets</Label>
            <Input
              id="targetMarkets"
              placeholder="US, ES, DE, FR (comma-separated)"
              value={targetMarketsInput}
              onChange={(e) => {
                const value = e.target.value
                setTargetMarketsInput(value)
                const markets = value.split(',').map(m => m.trim()).filter(m => m.length > 0)
                form.setValue('targetMarkets', markets)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter target markets separated by commas (e.g., US, ES, DE, FR)
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="product-launch, summer, social-media (comma-separated)"
              value={tagsInput}
              onChange={(e) => {
                const value = e.target.value
                setTagsInput(value)
                const tagsList = value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                form.setValue('tags', tagsList)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter tags separated by commas for filtering and search
            </p>
          </div>

          {/* Created By */}
          <div className="space-y-2">
            <Label htmlFor="createdBy">Created By</Label>
            <Input
              id="createdBy"
              placeholder="user@example.com"
              {...form.register('createdBy')}
            />
            {form.formState.errors.createdBy && (
              <p className="text-sm text-red-600">{form.formState.errors.createdBy.message}</p>
            )}
          </div>


          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Reset Form
            </Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}