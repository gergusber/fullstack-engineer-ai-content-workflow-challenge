// Base entity types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// Campaign types
export interface Campaign extends BaseEntity {
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  targetMarkets?: string[]
  tags?: string[]
  createdBy?: string
}

export interface CampaignStats {
  totalContent: number
  publishedContent: number
  pendingReview: number
  translations: number
  aiGenerated: number
}

// Content types
export interface ContentPiece extends BaseEntity {
  campaignId: string
  title: string
  description: string
  contentType: 'blog_post' | 'social_media' | 'email_subject' | 'email_body'
  targetLanguage: string
  sourceLanguage: string
  reviewState: 'draft' | 'ai_suggested' | 'pending_review' | 'reviewed' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  finalText?: string
  translationOf?: string
  contentMetadata?: Record<string, any>
}

// Translation types
export interface Translation extends BaseEntity {
  contentPieceId: string
  sourceLanguage: string
  targetLanguage: string
  translatedTitle?: string
  translatedDesc?: string
  translatedContent?: Record<string, any>
  modelUsed: string
  qualityScore?: number
  isHumanReviewed: boolean
}

export interface AIDraft extends BaseEntity {
  contentPieceId: string
  modelUsed: string
  generationType: 'original' | 'variation' | 'improvement' | 'translation' | 'summary'
  generatedContent: Record<string, any>
  status: 'candidate' | 'selected' | 'discarded'
  qualityScore?: number
  userRating?: number
}

// Request/Response types
export interface CreateCampaignDto {
  name: string
  description?: string
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  targetMarkets?: string[]
  tags?: string[]
  createdBy?: string
}

export interface CreateContentDto {
  campaignId: string
  title: string
  description: string
  contentType: ContentPiece['contentType']
  targetLanguage?: string
  sourceLanguage?: string
  finalText?: string
}

export interface TranslateContentDto {
  targetLanguage: string
  sourceLanguage: string
  model: 'claude' | 'openai'
  translationType: 'literal' | 'localized' | 'culturally_adapted'
  context?: string
}

export interface GenerateAIContentDto {
  prompt: string
  model?: 'openai' | 'claude' | 'both'
  type?: 'original' | 'variation' | 'improvement'
  temperature?: number
  maxTokens?: number
  tone?: 'professional' | 'casual' | 'creative' | 'urgent'
  userId?: string
  userName?: string
  context?: Record<string, any>
}

export interface ApproveTranslationDto {
  reviewerId: string
  reviewerName: string
  comments?: string
}

export interface UpdateReviewStateDto {
  newState: ContentPiece['reviewState']
  reviewType: string
  action: string
  comments?: string
  reviewerId: string
  reviewerName: string
  reviewerRole: string
}

// Filter types
export interface CampaignFilters {
  status?: Campaign['status']
  search?: string
  createdBy?: string
}

export interface ContentFilters {
  campaignId?: string
  contentType?: ContentPiece['contentType']
  reviewState?: ContentPiece['reviewState']
  targetLanguage?: string
  search?: string
  page?: number
  limit?: number
}

// Translation management types (for AI draft workflow)
export interface PendingAIDraftTranslation {
  aiDraft: AIDraft
  contentPiece: ContentPiece
}

export interface DetailedTranslationOverview {
  sourceContent: ContentPiece
  translations: Array<{
    translation: Translation
    translatedContentPiece: ContentPiece
    status: string
    reviewRequired: boolean
  }>
  summary: {
    totalTranslations: number
    pendingReview: number
    approved: number
    languages: string[]
    reviewProgress: {
      completed: number
      pending: number
    }
  }
}