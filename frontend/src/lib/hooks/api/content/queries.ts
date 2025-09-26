import { useQuery } from '@tanstack/react-query'
import { ContentService } from '@/lib/services/content.service'
import { queryKeys } from '@/lib/api/query-keys'
import { ContentFiltersDto } from '@/types/content'

export const useContentList = (filters?: ContentFiltersDto) => {
  return useQuery({
    queryKey: queryKeys.content.list(filters || {}),
    queryFn: () => ContentService.getContentList(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useContent = (id: string) => {
  return useQuery({
    queryKey: queryKeys.content.detail(id),
    queryFn: () => ContentService.getContent(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useContentTranslations = (id: string) => {
  return useQuery({
    queryKey: queryKeys.content.translations(id),
    queryFn: () => ContentService.getContentTranslations(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useContentTranslationDetails = (id: string) => {
  return useQuery({
    queryKey: queryKeys.content.translationDetails(id),
    queryFn: () => ContentService.getContentTranslationDetails(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export const useContentTranslationsPendingReview = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.content.translations(id), 'pending-review'],
    queryFn: () => ContentService.getContentTranslationsPendingReview(id),
    enabled: !!id,
    refetchInterval: 30 * 1000, // Real-time updates for pending reviews
  })
}

export const useContentVersions = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.content.detail(id), 'versions'],
    queryFn: () => ContentService.getContentVersions(id),
    enabled: !!id,
  })
}

export const useAIDrafts = (id: string, options?: { model?: string; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.content.aiDrafts(id),
    queryFn: () => ContentService.getAIDrafts(id, options),
    enabled: !!id,
  })
}

export const useReviewHistory = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.content.detail(id), 'review-history'],
    queryFn: () => ContentService.getReviewHistory(id),
    enabled: !!id,
  })
}