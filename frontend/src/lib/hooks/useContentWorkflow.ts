import { useQueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { ContentService } from '@/lib/services/content.service'
import { useUpdateCampaignStatus } from './api/campaigns/mutations'
import { useCampaign } from './api/campaigns/queries'
import { useContent, useContentList } from './api/content/queries'
import { getInvalidationKeys, queryKeys } from '@/lib/api/query-keys'
import { ApproveContentDto, RejectContentDto } from '@/types/content'
import { CampaignStatus } from '@/types/campaign'
import { ReviewState } from '@/types/content'
import { toast } from 'sonner'

interface ContentWorkflowOptions {
  autoUpdateCampaignStatus?: boolean
  showWorkflowMessages?: boolean
}

export const useContentWorkflow = (options: ContentWorkflowOptions = {}) => {
  const { autoUpdateCampaignStatus = true, showWorkflowMessages = true } = options
  const queryClient = useQueryClient()
  const { mutateAsync: updateCampaignStatus } = useUpdateCampaignStatus()

  // Enhanced approve content with campaign workflow
  const approveContentWithWorkflow = useMutation({
    mutationFn: async ({ id, approveData }: { id: string; approveData: ApproveContentDto }) => {
      // First approve the content
      const result = await ContentService.approveContent(id, approveData)

      if (autoUpdateCampaignStatus && result.data) {
        // Get the campaign ID from the approved content
        const campaignId = result.data.campaignId

        if (campaignId) {
          // Get current campaign and all its content to determine status
          const [campaignResponse, contentResponse] = await Promise.all([
            queryClient.fetchQuery({
              queryKey: queryKeys.campaigns.detail(campaignId),
              staleTime: 0, // Force fresh fetch
            }),
            queryClient.fetchQuery({
              queryKey: queryKeys.content.list({ campaignId, limit: 1000 }),
              staleTime: 0, // Force fresh fetch
            })
          ])

          const campaign = campaignResponse?.data
          const allContent = contentResponse?.data || []

          if (campaign && allContent.length > 0) {
            // Calculate if campaign should be moved to ACTIVE or COMPLETED
            const contentStats = {
              total: allContent.length,
              approved: allContent.filter(c => c.reviewState === ReviewState.APPROVED).length + 1, // +1 for the just approved content
              pending: allContent.filter(c =>
                c.reviewState === ReviewState.PENDING_REVIEW ||
                c.reviewState === ReviewState.REVIEWED
              ).length,
              draft: allContent.filter(c => c.reviewState === ReviewState.DRAFT).length,
              rejected: allContent.filter(c => c.reviewState === ReviewState.REJECTED).length,
              aiSuggested: allContent.filter(c => c.reviewState === ReviewState.AI_SUGGESTED).length,
            }

            let newStatus: CampaignStatus | null = null

            // Campaign workflow logic
            if (campaign.status === CampaignStatus.DRAFT && contentStats.approved > 0) {
              // Move from DRAFT to ACTIVE when first content is approved
              newStatus = CampaignStatus.ACTIVE
            } else if (contentStats.approved === contentStats.total && contentStats.total > 0) {
              // Move to COMPLETED when all content is approved
              newStatus = CampaignStatus.COMPLETED
            } else if (campaign.status === CampaignStatus.PAUSED && contentStats.approved > 0) {
              // Reactivate paused campaigns when content is approved
              newStatus = CampaignStatus.ACTIVE
            }

            if (newStatus && newStatus !== campaign.status) {
              try {
                await updateCampaignStatus({
                  id: campaignId,
                  status: newStatus,
                  silent: !showWorkflowMessages
                })

                if (showWorkflowMessages) {
                  const statusMessages = {
                    [CampaignStatus.ACTIVE]: '🎯 Campaign activated! Content is now in review workflow.',
                    [CampaignStatus.COMPLETED]: '🎉 Campaign completed! All content has been approved.',
                    [CampaignStatus.PAUSED]: '⏸️ Campaign paused.',
                    [CampaignStatus.DRAFT]: '📝 Campaign moved to draft.',
                    [CampaignStatus.ARCHIVED]: '📦 Campaign archived.'
                  }
                  toast.success('Campaign Status Updated', {
                    description: statusMessages[newStatus] || `Campaign status updated to ${newStatus}`
                  })
                }
              } catch (error) {
                console.error('Failed to auto-update campaign status:', error)
              }
            }
          }
        }
      }

      return result
    },
    onSuccess: (_, variables) => {
      getInvalidationKeys.forContent(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('✅ Content approved successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve content: ${error.message}`)
    }
  })

  // Enhanced reject content with campaign workflow
  const rejectContentWithWorkflow = useMutation({
    mutationFn: async ({ id, rejectData }: { id: string; rejectData: RejectContentDto }) => {
      const result = await ContentService.rejectContent(id, rejectData)

      if (autoUpdateCampaignStatus && result.data) {
        const campaignId = result.data.campaignId

        if (campaignId) {
          // Get current campaign to potentially update status
          const campaignResponse = await queryClient.fetchQuery({
            queryKey: queryKeys.campaigns.detail(campaignId),
            staleTime: 0,
          })

          const campaign = campaignResponse?.data

          if (campaign && campaign.status === CampaignStatus.COMPLETED) {
            // If campaign was completed but content is now rejected, move back to ACTIVE
            try {
              await updateCampaignStatus({
                id: campaignId,
                status: CampaignStatus.ACTIVE,
                silent: !showWorkflowMessages
              })

              if (showWorkflowMessages) {
                toast.info('Campaign Status Updated', {
                  description: '🔄 Campaign reactivated due to content rejection requiring revision.'
                })
              }
            } catch (error) {
              console.error('Failed to auto-update campaign status after rejection:', error)
            }
          }
        }
      }

      return result
    },
    onSuccess: (_, variables) => {
      getInvalidationKeys.forContent(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('❌ Content rejected - feedback provided for revision')
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject content: ${error.message}`)
    }
  })

  return {
    approveContentWithWorkflow: approveContentWithWorkflow.mutateAsync,
    rejectContentWithWorkflow: rejectContentWithWorkflow.mutateAsync,
    isApprovingWithWorkflow: approveContentWithWorkflow.isPending,
    isRejectingWithWorkflow: rejectContentWithWorkflow.isPending,
  }
}