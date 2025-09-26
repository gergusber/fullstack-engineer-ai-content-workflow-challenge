import { apiClient, ApiResponse } from '@/lib/api/client'
import {
  ContentPiece,
  CreateContentPieceDto,
  UpdateContentPieceDto,
  ContentFiltersDto,
  TranslateContentDto,
  GenerateAIContentDto,
  UpdateReviewStateDto,
  SubmitForReviewDto,
  ApproveContentDto,
  RejectContentDto,
  PaginatedResponse,
  TranslationOverview,
  AIDraft,
  ContentVersion,
  Translation,
  ReviewHistory,
  AIGenerationResult,
  TranslationResult,
  ModelComparison
} from '@/types/content'

export class ContentService {
  private static readonly BASE_URL = '/api/content'

  static async getContentList(filters?: ContentFiltersDto): Promise<PaginatedResponse<ContentPiece>> {
    const params = new URLSearchParams()

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const { data } = await apiClient.get(`${this.BASE_URL}?${params}`)
    return data
  }

  static async getContent(id: string): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}`)
    return data
  }

  static async createContent(contentData: CreateContentPieceDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(this.BASE_URL, contentData)
    return data
  }

  static async updateContent(id: string, contentData: UpdateContentPieceDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.patch(`${this.BASE_URL}/${id}`, contentData)
    return data
  }

  static async deleteContent(id: string): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`${this.BASE_URL}/${id}`)
    return data
  }

  // Review workflow
  static async submitForReview(id: string, data: SubmitForReviewDto): Promise<ApiResponse<ContentPiece>> {
    const { data: response } = await apiClient.post(`${this.BASE_URL}/${id}/submit-for-review`, data)
    return response
  }

  static async updateReviewState(id: string, updateData: UpdateReviewStateDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.patch(`${this.BASE_URL}/${id}/review-state`, updateData)
    return data
  }

  static async approveContent(id: string, approveData: ApproveContentDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/approve`, approveData)
    return data
  }

  static async rejectContent(id: string, rejectData: RejectContentDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/reject`, rejectData)
    return data
  }

  // AI Operations
  static async generateAIContent(id: string, generateDto: GenerateAIContentDto): Promise<ApiResponse<AIGenerationResult>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/generate-ai-content`, generateDto)
    return data
  }

  static async compareAIModels(id: string, compareDto: { prompt: string; models?: string[]; userId?: string }): Promise<ApiResponse<ModelComparison>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/compare-ai-models`, compareDto)
    return data
  }

  static async translateContent(id: string, translateDto: TranslateContentDto): Promise<ApiResponse<TranslationResult>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/translate`, translateDto)
    return data
  }

  // Translation Management
  static async getContentTranslations(id: string): Promise<ApiResponse<Translation[]>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/translations`)
    return data
  }

  static async getContentTranslationDetails(id: string): Promise<ApiResponse<TranslationOverview>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/translations/detailed`)
    return data
  }

  static async getContentTranslationsPendingReview(id: string): Promise<ApiResponse<{
    sourceContent: ContentPiece;
    pendingTranslations: Array<{
      translation: Translation;
      translatedContentPiece: ContentPiece;
      status: string;
      reviewRequired: boolean;
    }>;
    count: number;
  }>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/translations/pending-review`)
    return data
  }

  // Analytics and versions
  static async getContentVersions(id: string): Promise<ApiResponse<ContentVersion[]>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/versions`)
    return data
  }

  static async getAIDrafts(id: string, options?: { model?: string; limit?: number }): Promise<ApiResponse<AIDraft[]>> {
    const params = new URLSearchParams()
    if (options?.model) params.append('model', options.model)
    if (options?.limit) params.append('limit', options.limit.toString())

    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/ai-drafts?${params}`)
    return data
  }

  static async getReviewHistory(id: string): Promise<ApiResponse<ReviewHistory>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/review-history`)
    return data
  }
}