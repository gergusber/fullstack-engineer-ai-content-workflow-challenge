import { apiClient, ApiResponse } from '@/lib/api/client'
import {
  ContentPiece,
  CreateContentDto,
  ContentFilters,
  TranslateContentDto,
  GenerateAIContentDto,
  UpdateReviewStateDto,
  DetailedTranslationOverview
} from '@/lib/api/types'

export class ContentService {
  private static readonly BASE_URL = '/api/content'

  static async getContentList(filters?: ContentFilters): Promise<ApiResponse<ContentPiece[]>> {
    const params = new URLSearchParams()

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value.toString())
    })

    const { data } = await apiClient.get(`${this.BASE_URL}?${params}`)
    return data
  }

  static async getContent(id: string): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}`)
    return data
  }

  static async createContent(contentData: CreateContentDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(this.BASE_URL, contentData)
    return data
  }

  static async updateContent(id: string, contentData: Partial<CreateContentDto>): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.patch(`${this.BASE_URL}/${id}`, contentData)
    return data
  }

  static async deleteContent(id: string): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`${this.BASE_URL}/${id}`)
    return data
  }

  // Review workflow
  static async submitForReview(id: string, comments?: string): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/submit-for-review`, {
      comments: comments || 'Submitted for review'
    })
    return data
  }

  static async updateReviewState(id: string, updateData: UpdateReviewStateDto): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.patch(`${this.BASE_URL}/${id}/review-state`, updateData)
    return data
  }

  static async approveContent(id: string, approveData: { reviewerId: string; reviewerName: string; comments?: string; publishImmediately?: boolean }): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/approve`, approveData)
    return data
  }

  static async rejectContent(id: string, rejectData: { reviewerId: string; reviewerName: string; reason: string; suggestions?: string }): Promise<ApiResponse<ContentPiece>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/reject`, rejectData)
    return data
  }

  // AI Operations
  static async generateAIContent(id: string, generateDto: GenerateAIContentDto): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/generate-ai-content`, generateDto)
    return data
  }

  static async compareAIModels(id: string, compareDto: { prompt: string; models?: string[]; userId?: string }): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/compare-ai-models`, compareDto)
    return data
  }

  static async translateContent(id: string, translateDto: TranslateContentDto): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`${this.BASE_URL}/${id}/translate`, translateDto)
    return data
  }

  // Translation Management
  static async getContentTranslations(id: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/translations`)
    return data
  }

  static async getContentTranslationDetails(id: string): Promise<ApiResponse<DetailedTranslationOverview>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/translations/detailed`)
    return data
  }

  static async getContentTranslationsPendingReview(id: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/translations/pending-review`)
    return data
  }

  // Analytics and versions
  static async getContentVersions(id: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/versions`)
    return data
  }

  static async getAIDrafts(id: string, options?: { model?: string; limit?: number }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (options?.model) params.append('model', options.model)
    if (options?.limit) params.append('limit', options.limit.toString())

    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/ai-drafts?${params}`)
    return data
  }

  static async getReviewHistory(id: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/review-history`)
    return data
  }
}