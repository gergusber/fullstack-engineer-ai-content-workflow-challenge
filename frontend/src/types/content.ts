// Content types based on backend entities and DTOs

export enum ContentType {
  HEADLINE = 'headline',
  DESCRIPTION = 'description',
  SOCIAL_POST = 'social_post',
  EMAIL_SUBJECT = 'email_subject',
  BLOG_POST = 'blog_post',
  AD_COPY = 'ad_copy',
  PRODUCT_DESC = 'product_desc',
  LANDING_PAGE = 'landing_page',
}

export enum ReviewState {
  DRAFT = 'draft',
  AI_SUGGESTED = 'ai_suggested',
  PENDING_REVIEW = 'pending_review',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DraftStatus {
  CANDIDATE = 'candidate',
  SELECTED = 'selected',
  DISCARDED = 'discarded',
}

export enum ReviewAction {
  EDIT = 'edit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
}

export enum ReviewType {
  CONTENT_REVIEW = 'content_review',
  TRANSLATION_REVIEW = 'translation_review',
  FINAL_APPROVAL = 'final_approval',
}

// Base content piece interface
export interface ContentPiece {
  id: string;
  campaignId: string;
  title?: string;
  description?: string;
  contentType: ContentType;
  targetLanguage: string;
  sourceLanguage: string;
  reviewState: ReviewState;
  priority: Priority;
  originalPrompt?: string;
  contentMetadata?: Record<string, any>;
  translationOf?: string;
  finalText?: string;
  versionHistory?: VersionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Relations
  campaign?: Campaign;
  aiDrafts?: AIDraft[];
  reviews?: Review[];
  translations?: Translation[];
  contentVersions?: ContentVersion[];
  analytics?: ContentAnalytics[];
}

export interface VersionHistoryEntry {
  version: number;
  text: string;
  editedBy: string;
  editedAt: string;
  changeReason?: string;
}

// AI Draft interface
export interface AIDraft {
  id: string;
  contentPieceId: string;
  modelUsed: string;
  generationType: string;
  prompt: string;
  generatedTitle?: string;
  generatedDesc?: string;
  generatedContent?: {
    title?: string;
    description?: string;
    body?: string;
    culturalNotes?: string;
    translationStrategy?: string;
    confidenceScore?: number;
    suggestedImprovements?: string;
  };
  qualityScore?: number;
  userRating?: number;
  status: DraftStatus;
  responseTimeMs?: number;
  costUsd?: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  contentPiece?: ContentPiece;
}

// Review interface
export interface Review {
  id: string;
  contentPieceId: string;
  reviewType: ReviewType;
  action: ReviewAction;
  previousState: ReviewState;
  newState: ReviewState;
  comments?: string;
  suggestions?: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerRole?: string;
  createdAt: string;

  // Relations
  contentPiece?: ContentPiece;
}

// Translation interface
export interface Translation {
  id: string;
  contentPieceId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedTitle?: string;
  translatedDesc?: string;
  translatedContent?: {
    title?: string;
    description?: string;
    body?: string;
    culturalNotes?: string;
    translationStrategy?: string;
    confidenceScore?: number;
    suggestedImprovements?: string;
  };
  modelUsed?: string;
  translationContext?: string;
  qualityScore?: number;
  isHumanReviewed: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  contentPiece?: ContentPiece;
}

// Content Version interface
export interface ContentVersion {
  id: string;
  contentPieceId: string;
  versionNumber: number;
  title?: string;
  description?: string;
  changeReason?: string;
  changedBy?: string;
  isCurrentVersion: boolean;
  createdAt: string;

  // Relations
  contentPiece?: ContentPiece;
}

// Content Analytics interface
export interface ContentAnalytics {
  id: string;
  contentPieceId: string;
  views?: number;
  clicks?: number;
  conversions?: number;
  engagement?: number;
  performanceMetrics?: Record<string, any>;
  recordedAt: string;

  // Relations
  contentPiece?: ContentPiece;
}

// Campaign interface (referenced in ContentPiece)
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs for API requests
export interface CreateContentPieceDto {
  campaignId: string;
  title?: string;
  description?: string;
  contentType: ContentType;
  targetLanguage?: string;
  sourceLanguage?: string;
  priority?: Priority;
  originalPrompt?: string;
  contentMetadata?: Record<string, any>;
  translationOf?: string;
  finalText?: string;
  versionHistory?: VersionHistoryEntry[];
  createdBy?: string;
}

export interface UpdateContentPieceDto {
  title?: string;
  description?: string;
  contentType?: ContentType;
  targetLanguage?: string;
  sourceLanguage?: string;
  priority?: Priority;
  originalPrompt?: string;
  contentMetadata?: Record<string, any>;
  finalText?: string;
  versionHistory?: VersionHistoryEntry[];
  changeReason?: string;
  updatedBy?: string;
}

export interface ContentFiltersDto {
  campaignId?: string;
  reviewState?: ReviewState;
  contentType?: ContentType;
  priority?: Priority;
  language?: string;
  search?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'reviewState';
  sortOrder?: 'ASC' | 'DESC';
}

export interface UpdateReviewStateDto {
  newState: ReviewState;
  reviewType: ReviewType;
  action: ReviewAction;
  comments?: string;
  suggestions?: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerRole?: string;
}

export interface GenerateAIContentDto {
  model: string;
  prompt: string;
  type?: string;
  userId?: string;
  userName?: string;
}

export interface TranslateContentDto {
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
  model?: 'openai' | 'claude';
  translationType?: 'literal' | 'localized' | 'culturally_adapted';
  userId?: string;
}

export interface SubmitForReviewDto {
  comments?: string;
  reviewerIds?: string[];
}

export interface ApproveContentDto {
  reviewerId: string;
  reviewerName: string;
  comments?: string;
  publishImmediately?: boolean;
}

export interface RejectContentDto {
  reviewerId: string;
  reviewerName: string;
  reason: string;
  suggestions?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface ContentListResponse extends PaginatedResponse<ContentPiece> {}

export interface ContentDetailResponse extends ApiResponse<ContentPiece> {}

// Generation and AI-related types
export interface AIGenerationResult {
  contentPiece: ContentPiece;
  aiDraft: AIDraft;
  generatedContent: {
    title?: string;
    description?: string;
    body?: string;
  };
  generationMetadata: {
    model: string;
    prompt: string;
    type: string;
    generatedAt: string;
    responseTime?: number;
    qualityScore?: number;
    tokenCount?: number;
  };
}

export interface TranslationResult {
  originalContent: ContentPiece;
  translatedContent: ContentPiece;
  translationResult: {
    qualityScore: number;
    aiDraft: AIDraft;
    culturalNotes?: string;
    translationStrategy?: string;
    confidenceScore?: number;
  };
  translationMetadata: {
    sourceLanguage: string;
    targetLanguage: string;
    model: string;
    translationType: string;
  };
}

// Model comparison types
export interface ModelComparison {
  comparison: Record<string, {
    content: string;
    qualityScore: number;
    responseTime: number;
    tokenCount: number;
    cost: number;
  }>;
  bestModel: string;
  recommendations: Array<{
    type: string;
    message: string;
    advantage: string;
    metric: string;
  }>;
  contentPiece: ContentPiece;
  totalTime: number;
  metadata: Record<string, any>;
}

// Translation management types
export interface TranslationOverview {
  sourceContent: ContentPiece;
  translations: Array<{
    translation: Translation;
    translatedContentPiece: ContentPiece;
    status: string;
    reviewRequired: boolean;
  }>;
  summary?: {
    totalTranslations: number;
    pendingReview: number;
    approved: number;
    languages: string[];
    reviewProgress: {
      completed: number;
      pending: number;
    };
  };
}

export interface PendingTranslation {
  translation: Translation;
  contentPiece: ContentPiece;
}

export interface PendingAIDraftTranslation {
  aiDraft: AIDraft;
  contentPiece: ContentPiece;
}

// Content metrics and analytics
export interface ContentMetrics {
  aiMetrics: {
    totalDrafts: number;
    avgQualityScore: number;
    avgResponseTime: number;
    modelDistribution: Record<string, number>;
    bestPerformingDraft: AIDraft | null;
  };
  reviewMetrics: {
    totalReviews: number;
    avgTimeInReview: number;
    reviewerDistribution: Record<string, number>;
    lastReviewAction: Review | null;
  };
  versionMetrics: {
    totalVersions: number;
    currentVersion: ContentVersion | null;
    versionHistory: ContentVersion[];
  };
  translationMetrics: {
    totalTranslations: number;
    availableLanguages: string[];
    avgTranslationQuality: number;
  };
  performanceMetrics: ContentAnalytics | null;
}

// Review history types
export interface ReviewHistory {
  reviews: Review[];
  stateTransitions: Array<{
    from: ReviewState;
    to: ReviewState;
    action: string;
    reviewer: string;
    date: string;
    comments?: string;
  }>;
}
