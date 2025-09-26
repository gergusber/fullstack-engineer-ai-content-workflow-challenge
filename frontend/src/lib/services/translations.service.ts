import { apiClient, ApiResponse } from '@/lib/api/client'
import { Translation, AIDraft, ApproveTranslationDto, PendingAIDraftTranslation } from '@/lib/api/types'

export class TranslationsService {
  private static readonly BASE_URL = '/api/content'

  static async getPendingTranslations(): Promise<ApiResponse<Array<{ translation: Translation; contentPiece: any }>>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/translations/pending`)
    return data
  }

  static async getPendingAIDraftTranslations(contentId?: string): Promise<ApiResponse<PendingAIDraftTranslation[]>> {
    const params = contentId ? `?contentId=${contentId}` : ''
    const { data } = await apiClient.get(`${this.BASE_URL}/ai-draft-translations/pending${params}`)
    return data
  }

  static async approveTranslation(translationId: string, approveData: ApproveTranslationDto): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/translations/${translationId}/approve`, approveData)
    return data
  }

  static async approveAIDraftTranslation(aiDraftId: string, approveData: ApproveTranslationDto): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/ai-draft-translations/${aiDraftId}/approve`, approveData)
    return data
  }

  static async rejectTranslation(translationId: string, rejectData: { reviewerId: string; reviewerName: string; reason: string }): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/translations/${translationId}/reject`, rejectData)
    return data
  }
}