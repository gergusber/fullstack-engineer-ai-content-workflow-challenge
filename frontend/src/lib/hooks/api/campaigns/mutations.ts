import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CampaignsService } from '@/lib/services/campaigns.service'
import { queryKeys, getInvalidationKeys } from '@/lib/api/query-keys'
import { CreateCampaignDto } from '@/lib/api/types'
import { CampaignStatus } from '@/types/campaign'
import { toast } from 'sonner'

export const useCreateCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (campaignData: CreateCampaignDto) =>
      CampaignsService.createCampaign(campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lists() })
      toast.success('Campaign created successfully')
    },
    onError: (error: any) => {
      toast.error(`Failed to create campaign: ${error.message}`)
    }
  })
}

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCampaignDto> }) =>
      CampaignsService.updateCampaign(id, data),
    onSuccess: (result, variables) => {
      // Update specific campaign cache
      queryClient.setQueryData(queryKeys.campaigns.detail(variables.id), result)

      // Invalidate related queries
      getInvalidationKeys.forCampaign(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      toast.success('Campaign updated successfully')
    },
    onError: (error: any) => {
      toast.error(`Failed to update campaign: ${error.message}`)
    }
  })
}

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => CampaignsService.deleteCampaign(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.detail(id) })

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lists() })

      toast.success('Campaign deleted successfully')
    },
    onError: (error: any) => {
      toast.error(`Failed to delete campaign: ${error.message}`)
    }
  })
}

export const useUpdateCampaignStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, silent = false }: { id: string; status: CampaignStatus; silent?: boolean }) =>
      CampaignsService.updateCampaignStatus(id, status),
    onSuccess: (result, variables) => {
      // Update specific campaign cache
      queryClient.setQueryData(queryKeys.campaigns.detail(variables.id), result)

      // Invalidate related queries
      getInvalidationKeys.forCampaign(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      if (!variables.silent) {
        const statusLabels = {
          [CampaignStatus.DRAFT]: 'Draft',
          [CampaignStatus.ACTIVE]: 'Active',
          [CampaignStatus.PAUSED]: 'Paused',
          [CampaignStatus.COMPLETED]: 'Completed',
          [CampaignStatus.ARCHIVED]: 'Archived'
        }
        toast.success(`Campaign status updated to ${statusLabels[variables.status]}`)
      }
    },
    onError: (error: any, variables) => {
      if (!variables.silent) {
        toast.error(`Failed to update campaign status: ${error.message}`)
      }
    }
  })
}