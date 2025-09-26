import { 
  ContentPiece, 
  CreateContentPieceDto, 
  UpdateContentPieceDto,
  ContentFiltersDto,
  UpdateReviewStateDto,
  GenerateAIContentDto,
  TranslateContentDto,
  SubmitForReviewDto,
  ApproveContentDto,
  RejectContentDto,
  ApiResponse,
  PaginatedResponse,
  ContentDetailResponse,
  AIGenerationResult,
  TranslationResult,
  ModelComparison,
  TranslationOverview,
  PendingTranslation,
  PendingAIDraftTranslation,
  AIDraft,
  ContentVersion,
  Review,
  Translation,
  ReviewHistory,
  ContentMetrics
} from '@/types/content';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ContentApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ContentApiError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

// Basic CRUD Operations
export const contentApi = {
  // Get all content pieces with filters and pagination
  async getContentPieces(filters: ContentFiltersDto = {}): Promise<PaginatedResponse<ContentPiece>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/content?${params}`);
    return handleResponse<PaginatedResponse<ContentPiece>>(response);
  },

  // Get a single content piece by ID
  async getContentPiece(id: string): Promise<ContentDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}`);
    return handleResponse<ContentDetailResponse>(response);
  },

  // Create a new content piece
  async createContentPiece(data: CreateContentPieceDto): Promise<ApiResponse<ContentPiece>> {
    const response = await fetch(`${API_BASE_URL}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ContentPiece>>(response);
  },

  // Update an existing content piece
  async updateContentPiece(id: string, data: UpdateContentPieceDto): Promise<ApiResponse<ContentPiece>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ContentPiece>>(response);
  },

  // Delete a content piece
  async deleteContentPiece(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  // AI Integration Endpoints
  
  // Generate AI content for a content piece
  async generateAIContent(id: string, data: GenerateAIContentDto): Promise<ApiResponse<AIGenerationResult>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/generate-ai-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<AIGenerationResult>>(response);
  },

  // Compare AI models for content generation
  async compareAIModels(
    id: string, 
    data: { prompt: string; models?: string[]; userId?: string }
  ): Promise<ApiResponse<ModelComparison>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/compare-ai-models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ModelComparison>>(response);
  },

  // Translate content using AI
  async translateContent(id: string, data: TranslateContentDto): Promise<ApiResponse<TranslationResult>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<TranslationResult>>(response);
  },

  // Translation Management Endpoints

  // Get pending translations for review
  async getPendingTranslations(): Promise<ApiResponse<PendingTranslation[]>> {
    const response = await fetch(`${API_BASE_URL}/api/content/translations/pending`);
    return handleResponse<ApiResponse<PendingTranslation[]>>(response);
  },

  // Approve a translation
  async approveTranslation(
    translationId: string,
    data: { reviewerId: string; reviewerName: string; comments?: string }
  ): Promise<ApiResponse<{ translation: Translation; translatedContent: ContentPiece }>> {
    const response = await fetch(`${API_BASE_URL}/api/content/translations/${translationId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<{ translation: Translation; translatedContent: ContentPiece }>>(response);
  },

  // Reject a translation
  async rejectTranslation(
    translationId: string,
    data: { reviewerId: string; reviewerName: string; reason: string }
  ): Promise<ApiResponse<{ translation: Translation; translatedContent: ContentPiece }>> {
    const response = await fetch(`${API_BASE_URL}/api/content/translations/${translationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<{ translation: Translation; translatedContent: ContentPiece }>>(response);
  },

  // Get pending AI draft translations
  async getPendingAIDraftTranslations(contentId?: string): Promise<ApiResponse<PendingAIDraftTranslation[]>> {
    const params = contentId ? `?contentId=${contentId}` : '';
    const response = await fetch(`${API_BASE_URL}/api/content/ai-draft-translations/pending${params}`);
    return handleResponse<ApiResponse<PendingAIDraftTranslation[]>>(response);
  },

  // Approve an AI draft translation
  async approveAIDraftTranslation(
    aiDraftId: string,
    data: { reviewerId: string; reviewerName: string; comments?: string }
  ): Promise<ApiResponse<{ translation: Translation; translatedContent: ContentPiece }>> {
    const response = await fetch(`${API_BASE_URL}/api/content/ai-draft-translations/${aiDraftId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<{ translation: Translation; translatedContent: ContentPiece }>>(response);
  },

  // Get all translations for a content piece
  async getContentTranslations(id: string): Promise<ApiResponse<Translation[]>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/translations`);
    return handleResponse<ApiResponse<Translation[]>>(response);
  },

  // Get detailed translation overview for a content piece
  async getDetailedTranslations(id: string): Promise<ApiResponse<TranslationOverview>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/translations/detailed`);
    return handleResponse<ApiResponse<TranslationOverview>>(response);
  },

  // Get translations pending review for a specific content piece
  async getContentTranslationsPendingReview(id: string): Promise<ApiResponse<{
    sourceContent: ContentPiece;
    pendingTranslations: Array<{
      translation: Translation;
      translatedContentPiece: ContentPiece;
      status: string;
      reviewRequired: boolean;
    }>;
    count: number;
  }>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/translations/pending-review`);
    return handleResponse<ApiResponse<{
      sourceContent: ContentPiece;
      pendingTranslations: Array<{
        translation: Translation;
        translatedContentPiece: ContentPiece;
        status: string;
        reviewRequired: boolean;
      }>;
      count: number;
    }>>(response);
  },

  // Review Workflow Endpoints

  // Update review state
  async updateReviewState(id: string, data: UpdateReviewStateDto): Promise<ApiResponse<ContentPiece>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/review-state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ContentPiece>>(response);
  },

  // Submit content for review
  async submitForReview(id: string, data: SubmitForReviewDto): Promise<ApiResponse<ContentPiece>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/submit-for-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ContentPiece>>(response);
  },

  // Approve content
  async approveContent(id: string, data: ApproveContentDto): Promise<ApiResponse<ContentPiece>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ContentPiece>>(response);
  },

  // Reject content
  async rejectContent(id: string, data: RejectContentDto): Promise<ApiResponse<ContentPiece>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<ContentPiece>>(response);
  },

  // Analytics and Reporting Endpoints

  // Get content versions
  async getContentVersions(id: string): Promise<ApiResponse<ContentVersion[]>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/versions`);
    return handleResponse<ApiResponse<ContentVersion[]>>(response);
  },

  // Get AI drafts for content
  async getAIDrafts(
    id: string,
    options: { model?: string; limit?: number } = {}
  ): Promise<ApiResponse<AIDraft[]>> {
    const params = new URLSearchParams();
    if (options.model) params.append('model', options.model);
    if (options.limit) params.append('limit', String(options.limit));

    const response = await fetch(`${API_BASE_URL}/api/content/${id}/ai-drafts?${params}`);
    return handleResponse<ApiResponse<AIDraft[]>>(response);
  },

  // Get review history for content
  async getReviewHistory(id: string): Promise<ApiResponse<ReviewHistory>> {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/review-history`);
    return handleResponse<ApiResponse<ReviewHistory>>(response);
  },

  // Helper methods for common use cases

  // Get content by campaign with optional filters
  async getContentByCampaign(
    campaignId: string, 
    additionalFilters: Omit<ContentFiltersDto, 'campaignId'> = {}
  ): Promise<PaginatedResponse<ContentPiece>> {
    return this.getContentPieces({
      campaignId,
      ...additionalFilters,
    });
  },

  // Get content by review state
  async getContentByReviewState(
    reviewState: string,
    additionalFilters: Omit<ContentFiltersDto, 'reviewState'> = {}
  ): Promise<PaginatedResponse<ContentPiece>> {
    return this.getContentPieces({
      reviewState: reviewState as any,
      ...additionalFilters,
    });
  },

  // Get content by type
  async getContentByType(
    contentType: string,
    additionalFilters: Omit<ContentFiltersDto, 'contentType'> = {}
  ): Promise<PaginatedResponse<ContentPiece>> {
    return this.getContentPieces({
      contentType: contentType as any,
      ...additionalFilters,
    });
  },

  // Search content
  async searchContent(
    searchTerm: string,
    additionalFilters: Omit<ContentFiltersDto, 'search'> = {}
  ): Promise<PaginatedResponse<ContentPiece>> {
    return this.getContentPieces({
      search: searchTerm,
      ...additionalFilters,
    });
  },
};

export default contentApi;

// Export error class for error handling
export { ContentApiError };

// Export commonly used types for convenience
export type {
  ContentPiece,
  CreateContentPieceDto,
  UpdateContentPieceDto,
  ContentFiltersDto,
  PaginatedResponse,
  ApiResponse,
};
