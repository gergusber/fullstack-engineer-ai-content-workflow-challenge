import { useQuery } from '@tanstack/react-query'
import { TranslationsService } from '@/lib/services/translations.service'
import { queryKeys } from '@/lib/api/query-keys'

export const usePendingTranslations = () => {
  return useQuery({
    queryKey: queryKeys.translations.pending(),
    queryFn: () => TranslationsService.getPendingTranslations(),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const usePendingAIDraftTranslations = (contentId?: string) => {
  return useQuery({
    queryKey: queryKeys.translations.aiDraftsPending(contentId),
    queryFn: () => TranslationsService.getPendingAIDraftTranslations(contentId),
    refetchInterval: 30 * 1000, // Real-time updates
    staleTime: 1 * 60 * 1000,
  })
}