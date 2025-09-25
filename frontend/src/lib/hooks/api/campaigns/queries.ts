import { useQuery } from '@tanstack/react-query'
import { CampaignsService } from '@/lib/services/campaigns.service'
import { queryKeys } from '@/lib/api/query-keys'
import { CampaignFilters } from '@/lib/api/types'

export const useCampaigns = (filters?: CampaignFilters) => {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters || {}),
    queryFn: () => CampaignsService.getCampaigns(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => CampaignsService.getCampaign(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCampaignStats = (id: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.stats(id),
    queryFn: () => CampaignsService.getCampaignStats(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
  })
}