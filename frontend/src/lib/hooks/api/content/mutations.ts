import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ContentService } from '@/lib/services/content.service'
import { queryKeys, getInvalidationKeys } from '@/lib/api/query-keys'
import { 
  CreateContentPieceDto, 
  UpdateContentPieceDto,
  TranslateContentDto, 
  GenerateAIContentDto, 
  UpdateReviewStateDto,
  SubmitForReviewDto,
  ApproveContentDto,
  RejectContentDto
} from '@/types/content'
import { toast } from 'sonner'

export const useCreateContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contentData: CreateContentPieceDto) =>
      ContentService.createContent(contentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() })
      toast.success('Content created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create content: ${error.message}`)
    }
  })
}

export const useUpdateContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContentPieceDto }) =>
      ContentService.updateContent(id, data),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(queryKeys.content.detail(variables.id), result)
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() })
      toast.success('Content updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update content: ${error.message}`)
    }
  })
}

export const useDeleteContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ContentService.deleteContent(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.content.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() })
      toast.success('Content deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete content: ${error.message}`)
    }
  })
}

// Review workflow mutations
export const useSubmitForReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitForReviewDto }) =>
      ContentService.submitForReview(id, data),
    onSuccess: (_, variables) => {
      getInvalidationKeys.forContent(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('Content submitted for review')
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit for review: ${error.message}`)
    }
  })
}

export const useUpdateReviewState = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: UpdateReviewStateDto }) =>
      ContentService.updateReviewState(id, updateData),
    onSuccess: (_, variables) => {
      getInvalidationKeys.forContent(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('Review state updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update review state: ${error.message}`)
    }
  })
}

export const useApproveContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, approveData }: { id: string; approveData: ApproveContentDto }) => 
      ContentService.approveContent(id, approveData),
    onSuccess: (_, variables) => {
      getInvalidationKeys.forContent(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('Content approved successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve content: ${error.message}`)
    }
  })
}

export const useRejectContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rejectData }: { id: string; rejectData: RejectContentDto }) => 
      ContentService.rejectContent(id, rejectData),
    onSuccess: (_, variables) => {
      getInvalidationKeys.forContent(variables.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      toast.success('Content rejected')
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject content: ${error.message}`)
    }
  })
}

// AI operations
export const useGenerateAIContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, generateDto }: { id: string; generateDto: GenerateAIContentDto }) => {
      console.log('Generating AI content for:', id, 'with:', generateDto)
      return ContentService.generateAIContent(id, generateDto)
    },
    onSuccess: (result, variables) => {
      console.log('AI generation successful:', result)
      queryClient.invalidateQueries({ queryKey: queryKeys.content.aiDrafts(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.content.detail(variables.id) })
      toast.success('AI content generated successfully')
    },
    onError: (error: Error) => {
      console.error('AI generation failed:', error)
      toast.error(`Failed to generate AI content: ${error.message}`)
    }
  })
}

export const useCompareAIModels = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, compareDto }: { id: string; compareDto: { prompt: string; models?: string[]; userId?: string } }) =>
      ContentService.compareAIModels(id, compareDto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.aiDrafts(variables.id) })
      toast.success('AI model comparison completed')
    },
    onError: (error: Error) => {
      toast.error(`Failed to compare AI models: ${error.message}`)
    }
  })
}

export const useTranslateContent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, translateDto }: { id: string; translateDto: TranslateContentDto }) =>
      ContentService.translateContent(id, translateDto),
    onSuccess: (_, variables) => {
      // Invalidate translations for this content
      queryClient.invalidateQueries({ queryKey: queryKeys.content.translations(variables.id) })
      // Invalidate pending AI draft translations (the new workflow)
      queryClient.invalidateQueries({ queryKey: queryKeys.translations.aiDraftsPending() })
      queryClient.invalidateQueries({ queryKey: queryKeys.translations.aiDraftsPending(variables.id) })
      // Invalidate content lists
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() })

      toast.success('Content translated successfully - check pending AI draft translations for approval')
    },
    onError: (error: Error) => {
      toast.error(`Failed to translate content: ${error.message}`)
    }
  })
}