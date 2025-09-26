import { useCallback } from 'react'
import { useContentList } from './api/content/queries'
import { useUpdateCampaignStatus } from './api/campaigns/mutations'
import { CampaignStatus, Campaign } from '@/types/campaign'
import { ReviewState } from '@/types/content'

interface CampaignWorkflowOptions {
  autoUpdateStatus?: boolean
  silent?: boolean
}

export const useCampaignWorkflow = (campaign: Campaign, options: CampaignWorkflowOptions = {}) => {
  const { autoUpdateStatus = true, silent = true } = options
  const { mutateAsync: updateCampaignStatus } = useUpdateCampaignStatus()

  // Get all content for this campaign to analyze status
  const { data: contentResponse, refetch } = useContentList({
    campaignId: campaign.id,
    limit: 1000,
  })

  const allContent = contentResponse?.data || []

  const calculateOptimalStatus = useCallback((): CampaignStatus => {
    if (allContent.length === 0) {
      return CampaignStatus.DRAFT
    }

    const stats = {
      total: allContent.length,
      approved: allContent.filter(c => c.reviewState === ReviewState.APPROVED).length,
      rejected: allContent.filter(c => c.reviewState === ReviewState.REJECTED).length,
      draft: allContent.filter(c => c.reviewState === ReviewState.DRAFT).length,
      pendingReview: allContent.filter(c =>
        c.reviewState === ReviewState.PENDING_REVIEW ||
        c.reviewState === ReviewState.REVIEWED
      ).length,
      aiSuggested: allContent.filter(c => c.reviewState === ReviewState.AI_SUGGESTED).length,
    }

    // Campaign workflow logic:

    // If all content is approved → COMPLETED
    if (stats.approved > 0 && stats.approved === stats.total) {
      return CampaignStatus.COMPLETED
    }

    // If has approved content AND no pending/draft/rejected → COMPLETED
    if (stats.approved > 0 &&
        stats.pendingReview === 0 &&
        stats.draft === 0 &&
        stats.rejected === 0 &&
        stats.aiSuggested === 0) {
      return CampaignStatus.COMPLETED
    }

    // If has approved content AND has pending/review content → ACTIVE
    if (stats.approved > 0 && (stats.pendingReview > 0 || stats.aiSuggested > 0)) {
      return CampaignStatus.ACTIVE
    }

    // If has content pending review or in review → ACTIVE
    if (stats.pendingReview > 0 || stats.aiSuggested > 0) {
      return CampaignStatus.ACTIVE
    }

    // If only has approved content → COMPLETED
    if (stats.approved > 0 && stats.draft === 0 && stats.rejected === 0 && stats.pendingReview === 0) {
      return CampaignStatus.COMPLETED
    }

    // If only draft or rejected content → DRAFT
    if (stats.approved === 0 && stats.pendingReview === 0 && stats.aiSuggested === 0) {
      return CampaignStatus.DRAFT
    }

    // Default to current status if logic is unclear
    return campaign.status
  }, [allContent, campaign.status])

  const updateCampaignStatusBasedOnContent = useCallback(async () => {
    if (!autoUpdateStatus) return

    const optimalStatus = calculateOptimalStatus()

    // Only update if status actually needs to change
    if (optimalStatus !== campaign.status) {
      try {
        await updateCampaignStatus({
          id: campaign.id,
          status: optimalStatus,
          silent
        })
      } catch (error) {
        console.error('Failed to auto-update campaign status:', error)
      }
    }
  }, [campaign.id, campaign.status, calculateOptimalStatus, updateCampaignStatus, autoUpdateStatus, silent])

  const getStatusRecommendation = useCallback(() => {
    const optimalStatus = calculateOptimalStatus()
    const shouldUpdate = optimalStatus !== campaign.status

    return {
      current: campaign.status,
      recommended: optimalStatus,
      shouldUpdate,
      contentStats: {
        total: allContent.length,
        approved: allContent.filter(c => c.reviewState === ReviewState.APPROVED).length,
        rejected: allContent.filter(c => c.reviewState === ReviewState.REJECTED).length,
        draft: allContent.filter(c => c.reviewState === ReviewState.DRAFT).length,
        pendingReview: allContent.filter(c =>
          c.reviewState === ReviewState.PENDING_REVIEW ||
          c.reviewState === ReviewState.REVIEWED
        ).length,
        aiSuggested: allContent.filter(c => c.reviewState === ReviewState.AI_SUGGESTED).length,
      }
    }
  }, [campaign.status, calculateOptimalStatus, allContent])

  return {
    updateCampaignStatusBasedOnContent,
    getStatusRecommendation,
    contentStats: {
      total: allContent.length,
      approved: allContent.filter(c => c.reviewState === ReviewState.APPROVED).length,
      rejected: allContent.filter(c => c.reviewState === ReviewState.REJECTED).length,
      draft: allContent.filter(c => c.reviewState === ReviewState.DRAFT).length,
      pendingReview: allContent.filter(c =>
        c.reviewState === ReviewState.PENDING_REVIEW ||
        c.reviewState === ReviewState.REVIEWED
      ).length,
    },
    refetchContent: refetch,
  }
}