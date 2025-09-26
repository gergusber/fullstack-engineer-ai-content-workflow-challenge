import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TranslationsService } from '@/lib/services/translations.service'
import { queryKeys, getInvalidationKeys } from '@/lib/api/query-keys'
import { ApproveTranslationDto } from '@/lib/api/types'
import { toast } from 'sonner'

export const useApproveTranslation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ translationId, approveData }: {
      translationId: string;
      approveData: ApproveTranslationDto
    }) => TranslationsService.approveTranslation(translationId, approveData),

    onSuccess: () => {
      getInvalidationKeys.forTranslation().forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('Translation approved successfully')
    },

    onError: (error: any) => {
      toast.error(`Failed to approve translation: ${error.message}`)
    }
  })
}

export const useApproveAIDraftTranslation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ aiDraftId, approveData }: {
      aiDraftId: string;
      approveData: ApproveTranslationDto
    }) => TranslationsService.approveAIDraftTranslation(aiDraftId, approveData),

    onSuccess: () => {
      // Invalidate all translation-related queries
      getInvalidationKeys.forTranslation().forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('AI draft translation approved and moved to translations table')
    },

    onError: (error: any) => {
      toast.error(`Failed to approve AI draft translation: ${error.message}`)
    }
  })
}

export const useRejectTranslation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ translationId, rejectData }: {
      translationId: string;
      rejectData: { reviewerId: string; reviewerName: string; reason: string }
    }) => TranslationsService.rejectTranslation(translationId, rejectData),

    onSuccess: () => {
      getInvalidationKeys.forTranslation().forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('Translation rejected')
    },

    onError: (error: any) => {
      toast.error(`Failed to reject translation: ${error.message}`)
    }
  })
}