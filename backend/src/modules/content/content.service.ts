import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import {
  ContentPiece,
  ReviewState,
  ContentType,
} from "../../database/entities/content-piece.entity";
import { AIDraft, DraftStatus } from "../../database/entities/ai-draft.entity";
import { Review } from "../../database/entities/review.entity";
import { ContentVersion } from "../../database/entities/content-version.entity";
import { CreateContentPieceDto } from "./dto/create-content-piece.dto";
import { UpdateContentPieceDto } from "./dto/update-content-piece.dto";
import { UpdateReviewStateDto } from "./dto/update-review-state.dto";
import { ContentFiltersDto } from "./dto/content-filters.dto";
import { CreateAIDraftDto } from "./dto/create-ai-draft.dto";

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentPiece)
    private contentRepository: Repository<ContentPiece>,
    @InjectRepository(AIDraft)
    private aiDraftRepository: Repository<AIDraft>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ContentVersion)
    private contentVersionRepository: Repository<ContentVersion>
  ) {}

  async create(createContentDto: CreateContentPieceDto): Promise<ContentPiece> {
    const contentPiece = this.contentRepository.create(createContentDto);
    const savedContent = await this.contentRepository.save(contentPiece);

    // Create initial version
    await this.createVersion(savedContent.id, {
      title: savedContent.title,
      description: savedContent.description,
      changeReason: "Initial version",
      changedBy: createContentDto.createdBy || "system",
    });

    return savedContent;
  }

  async findAll(): Promise<ContentPiece[]> {
    return await this.contentRepository.find({
      relations: {
        campaign: true,
        aiDrafts: true,
        reviews: true,
        translations: true,
        contentVersions: true,
      },
      order: {
        updatedAt: "DESC",
      },
    });
  }

  async findOne(id: string): Promise<ContentPiece> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: {
        campaign: true,
        aiDrafts: {
          // Order by creation date, latest first
        },
        reviews: true,
        translations: true,
        contentVersions: true,
        analytics: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content piece with ID ${id} not found`);
    }

    // Sort AI drafts by creation date
    if (content.aiDrafts) {
      content.aiDrafts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    return content;
  }

  async update(
    id: string,
    updateContentDto: UpdateContentPieceDto
  ): Promise<ContentPiece> {
    const content = await this.findOne(id);
    const previousState = content.reviewState;

    Object.assign(content, updateContentDto);
    const updatedContent = await this.contentRepository.save(content);

    // Create version if content changed
    if (updateContentDto.title || updateContentDto.description) {
      await this.createVersion(id, {
        title: updatedContent.title,
        description: updatedContent.description,
        changeReason: updateContentDto.changeReason || "Content updated",
        changedBy: updateContentDto.updatedBy || "system",
      });
    }

    return updatedContent;
  }

  async updateReviewState(
    id: string,
    updateStateDto: UpdateReviewStateDto
  ): Promise<ContentPiece> {
    if (!id) {
      throw new Error('Content piece ID is required');
    }

    const content = await this.findOne(id);
    const previousState = content.reviewState;

    console.log('Creating review record for content ID:', content.id);
    console.log('Content exists:', !!content, 'Content ID type:', typeof content.id);

    // Ensure we're creating a completely new review record
    const reviewData = {
      contentPieceId: content.id,
      reviewType: updateStateDto.reviewType,
      action: updateStateDto.action,
      previousState: previousState,
      newState: updateStateDto.newState,
      comments: updateStateDto.comments,
      suggestions: updateStateDto.suggestions,
      reviewerId: updateStateDto.reviewerId,
      reviewerName: updateStateDto.reviewerName,
      reviewerRole: updateStateDto.reviewerRole,
    };

    console.log('Review data before create:', reviewData);

    // Create new review record (explicitly set both FK and relation)
    const review = await this.reviewRepository.create({
      ...reviewData,
      contentPiece: content,
    });

    console.log('Review object after create:', {
      id: review.id,
      contentPieceId: review.contentPieceId,
      hasId: !!review.id
    });

    // Double-ensure FK is present before save
    review.contentPieceId = review.contentPieceId || content.id;

    await this.reviewRepository.save(review);

    // Prepare content updates without touching relations to avoid cascading nulls
    const contentUpdate: Partial<ContentPiece> = {
      reviewState: updateStateDto.newState,
    };

    // Update published date and finalText if approved
    if (updateStateDto.newState === ReviewState.APPROVED) {
      contentUpdate.publishedAt = new Date();

      // Automatically populate finalText from selected AI draft
      const selectedDraft = await this.aiDraftRepository.findOne({
        where: {
          contentPieceId: id,
          status: DraftStatus.SELECTED,
        },
        order: { createdAt: 'DESC' },
      });

      if (selectedDraft && selectedDraft.generatedContent) {
        const { title, description, body } = selectedDraft.generatedContent;
        let finalText = '';
        if (title) finalText += `${title}\n\n`;
        if (description) finalText += `${description}\n\n`;
        if (body) finalText += body;
        contentUpdate.finalText = finalText.trim();
      }
    }
    // return await this.contentRepository.save(content);
    // Perform a lightweight update to avoid relation cascades
    await this.contentRepository.update(id, contentUpdate);

    // Return the fresh entity
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.contentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Content piece with ID ${id} not found`);
    }
  }

  async findByCampaign(campaignId: string): Promise<ContentPiece[]> {
    return await this.contentRepository.find({
      where: { campaignId },
      relations: {
        aiDrafts: true,
        reviews: true,
        translations: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findByReviewState(state: ReviewState): Promise<ContentPiece[]> {
    return await this.contentRepository.find({
      where: { reviewState: state },
      relations: {
        campaign: true,
        aiDrafts: true,
        reviews: true,
      },
      order: {
        updatedAt: "DESC",
      },
    });
  }

  async findByContentType(type: ContentType): Promise<ContentPiece[]> {
    return await this.contentRepository.find({
      where: { contentType: type },
      relations: {
        campaign: true,
        aiDrafts: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  // async getContentAnalytics(id: string): Promise<any> {
  //   const content = await this.contentRepository.findOne({
  //     where: { id },
  //     relations: {
  //       analytics: true,
  //       aiDrafts: true,
  //       reviews: true,
  //     },
  //   });

  //   if (!content) {
  //     throw new NotFoundException(`Content piece with ID ${id} not found`);
  //   }

  //   return {
  //     content: content,
  //     analytics: content.analytics,
  //     aiMetrics: {
  //       totalDrafts: content.aiDrafts.length,
  //       avgQualityScore: this.calculateAvgQualityScore(content.aiDrafts),
  //       avgResponseTime: this.calculateAvgResponseTime(content.aiDrafts),
  //       modelUsage: this.getModelUsageStats(content.aiDrafts),
  //     },
  //     reviewMetrics: {
  //       totalReviews: content.reviews.length,
  //       reviewHistory: content.reviews.map((review) => ({
  //         action: review.action,
  //         previousState: review.previousState,
  //         newState: review.newState,
  //         createdAt: review.createdAt,
  //         reviewer: review.reviewerName,
  //       })),
  //     },
  //   };
  // }

  private async createVersion(
    contentPieceId: string,
    versionData: {
      title?: string;
      description?: string;
      changeReason?: string;
      changedBy?: string;
    }
  ): Promise<ContentVersion> {
    // Get current max version number
    const maxVersion = await this.contentVersionRepository
      .createQueryBuilder("version")
      .where("version.contentPieceId = :contentPieceId", { contentPieceId })
      .select("MAX(version.versionNumber)", "maxVersion")
      .getRawOne();

    const versionNumber = (maxVersion?.maxVersion || 0) + 1;

    // Set previous versions as not current
    await this.contentVersionRepository.update(
      { contentPieceId, isCurrentVersion: true },
      { isCurrentVersion: false }
    );

    // Create new version
    const version = this.contentVersionRepository.create({
      contentPieceId,
      versionNumber,
      title: versionData.title,
      description: versionData.description,
      changeReason: versionData.changeReason,
      changedBy: versionData.changedBy,
      isCurrentVersion: true,
    });

    return await this.contentVersionRepository.save(version);
  }

  // private calculateAvgQualityScore(drafts: AIDraft[]): number {
  //   if (drafts.length === 0) return 0;
  //   const validScores = drafts.filter((d) => d.qualityScore !== null);
  //   if (validScores.length === 0) return 0;

  //   const sum = validScores.reduce((acc, d) => acc + d.qualityScore, 0);
  //   return sum / validScores.length;
  // }

  // private calculateAvgResponseTime(drafts: AIDraft[]): number {
  //   if (drafts.length === 0) return 0;
  //   const validTimes = drafts.filter((d) => d.responseTime !== null);
  //   if (validTimes.length === 0) return 0;

  //   const sum = validTimes.reduce((acc, d) => acc + d.responseTime, 0);
  //   return sum / validTimes.length;
  // }

  // private getModelUsageStats(drafts: AIDraft[]): Record<string, number> {
  //   return drafts.reduce((acc, draft) => {
  //     const model = draft.modelUsed;
  //     acc[model] = (acc[model] || 0) + 1;
  //     return acc;
  //   }, {} as Record<string, number>);
  // }

  private applyContentFilters(
    queryBuilder: SelectQueryBuilder<ContentPiece>,
    filters: ContentFiltersDto
  ): void {
    // Filter by campaign ID
    if (filters.campaignId) {
      queryBuilder.andWhere("content.campaignId = :campaignId", {
        campaignId: filters.campaignId,
      });
    }

    // Filter by review state
    if (filters.reviewState) {
      queryBuilder.andWhere("content.reviewState = :reviewState", {
        reviewState: filters.reviewState,
      });
    }

    // Filter by content type
    if (filters.contentType) {
      queryBuilder.andWhere("content.contentType = :contentType", {
        contentType: filters.contentType,
      });
    }

    // Filter by priority
    if (filters.priority) {
      queryBuilder.andWhere("content.priority = :priority", {
        priority: filters.priority,
      });
    }

    // Filter by language
    if (filters.language) {
      queryBuilder.andWhere("content.targetLanguage = :language", {
        language: filters.language,
      });
    }

    // Filter by creator
    if (filters.createdBy) {
      queryBuilder.andWhere("campaign.createdBy = :createdBy", {
        createdBy: filters.createdBy,
      });
    }

    // Date range filters
    if (filters.dateFrom) {
      queryBuilder.andWhere("content.createdAt >= :dateFrom", {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere("content.createdAt <= :dateTo", {
        dateTo: new Date(filters.dateTo),
      });
    }

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(
        "(content.title ILIKE :search OR content.description ILIKE :search OR campaign.name ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }
  }
  private applyContentSorting(
    queryBuilder: SelectQueryBuilder<ContentPiece>,
    filters: ContentFiltersDto
  ): void {
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";

    switch (sortBy) {
      case "createdAt":
        queryBuilder.orderBy("content.createdAt", sortOrder);
        break;
      case "updatedAt":
        queryBuilder.orderBy("content.updatedAt", sortOrder);
        break;
      case "title":
        queryBuilder.orderBy("content.title", sortOrder);
        break;
      case "priority":
        queryBuilder.orderBy("content.priority", sortOrder);
        break;
      case "reviewState":
        queryBuilder.orderBy("content.reviewState", sortOrder);
        break;
      default:
        queryBuilder.orderBy("content.createdAt", "DESC");
    }

    // Add secondary sort by ID for consistent ordering
    queryBuilder.addOrderBy("content.id", "ASC");
  }

  // private calculateAverageTranslationQuality(translations: any[]): number {
  //   if (translations.length === 0) return 0;
  //   const validQualityScores = translations.filter(
  //     (t) => t.qualityScore !== null && t.qualityScore !== undefined
  //   );
  //   if (validQualityScores.length === 0) return 0;

  //   const sum = validQualityScores.reduce(
  //     (acc, translation) => acc + translation.qualityScore,
  //     0
  //   );
  //   return Math.round((sum / validQualityScores.length) * 100) / 100;
  // }
  // private calculateAverageQuality(drafts: AIDraft[]): number {
  //   if (drafts.length === 0) return 0;
  //   const validQualityScores = drafts.filter(
  //     (d) => d.qualityScore !== null && d.qualityScore !== undefined
  //   );
  //   if (validQualityScores.length === 0) return 0;

  //   const sum = validQualityScores.reduce(
  //     (acc, draft) => acc + draft.qualityScore,
  //     0
  //   );
  //   return Math.round((sum / validQualityScores.length) * 100) / 100; // Round to 2 decimal places
  // }

  // private calculateAverageResponseTime(drafts: AIDraft[]): number {
  //   if (drafts.length === 0) return 0;
  //   const validResponseTimes = drafts.filter(
  //     (d) => d.responseTime !== null && d.responseTime !== undefined
  //   );
  //   if (validResponseTimes.length === 0) return 0;

  //   const sum = validResponseTimes.reduce(
  //     (acc, draft) => acc + draft.responseTime,
  //     0
  //   );
  //   return Math.round(sum / validResponseTimes.length);
  // }

  // private getModelDistribution(drafts: AIDraft[]): Record<string, number> {
  //   return drafts.reduce((acc, draft) => {
  //     const model = draft.modelUsed;
  //     acc[model] = (acc[model] || 0) + 1;
  //     return acc;
  //   }, {} as Record<string, number>);
  // }

  // private getBestPerformingDraft(drafts: AIDraft[]): AIDraft | null {
  //   if (drafts.length === 0) return null;

  //   return drafts.reduce((best, current) => {
  //     if (!best) return current;

  //     // Prioritize by quality score, then by user rating, then by response time
  //     if ((current.qualityScore || 0) > (best.qualityScore || 0))
  //       return current;
  //     if ((current.qualityScore || 0) === (best.qualityScore || 0)) {
  //       if ((current.userRating || 0) > (best.userRating || 0)) return current;
  //       if ((current.userRating || 0) === (best.userRating || 0)) {
  //         if ((current.responseTime || 999999) < (best.responseTime || 999999))
  //           return current;
  //       }
  //     }

  //     return best;
  //   });
  // }

  // private calculateAverageReviewTime(reviews: Review[]): number {
  //   if (reviews.length <= 1) return 0;

  //   // Calculate time between consecutive reviews
  //   const sortedReviews = reviews.sort(
  //     (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  //   );
  //   let totalTime = 0;
  //   let intervals = 0;

  //   for (let i = 1; i < sortedReviews.length; i++) {
  //     const timeDiff =
  //       sortedReviews[i].createdAt.getTime() -
  //       sortedReviews[i - 1].createdAt.getTime();
  //     totalTime += timeDiff;
  //     intervals++;
  //   }

  //   return intervals > 0
  //     ? Math.round(totalTime / intervals / (1000 * 60 * 60))
  //     : 0; // Convert to hours
  // }

  // private getReviewerDistribution(reviews: Review[]): Record<string, number> {
  //   return reviews.reduce((acc, review) => {
  //     const reviewer = review.reviewerName || "Unknown";
  //     acc[reviewer] = (acc[reviewer] || 0) + 1;
  //     return acc;
  //   }, {} as Record<string, number>);
  // }

  // async getContentMetrics(contentId: string): Promise<any> {
  //   const content = await this.contentRepository.findOne({
  //     where: { id: contentId },
  //     relations: {
  //       aiDrafts: true,
  //       reviews: true,
  //       translations: true,
  //       contentVersions: true,
  //       analytics: true,
  //     },
  //   });

  //   if (!content) {
  //     throw new NotFoundException(
  //       `Content piece with ID ${contentId} not found`
  //     );
  //   }

  //   return {
  //     aiMetrics: {
  //       totalDrafts: content.aiDrafts.length,
  //       avgQualityScore: this.calculateAverageQuality(content.aiDrafts),
  //       avgResponseTime: this.calculateAverageResponseTime(content.aiDrafts),
  //       modelDistribution: this.getModelDistribution(content.aiDrafts),
  //       bestPerformingDraft: this.getBestPerformingDraft(content.aiDrafts),
  //     },
  //     reviewMetrics: {
  //       totalReviews: content.reviews.length,
  //       avgTimeInReview: this.calculateAverageReviewTime(content.reviews),
  //       reviewerDistribution: this.getReviewerDistribution(content.reviews),
  //       lastReviewAction: content.reviews[0] || null,
  //     },
  //     versionMetrics: {
  //       totalVersions: content.contentVersions.length,
  //       currentVersion: content.contentVersions.find((v) => v.isCurrentVersion),
  //       versionHistory: content.contentVersions.slice(-5), // Last 5 versions
  //     },
  //     translationMetrics: {
  //       totalTranslations: content.translations.length,
  //       availableLanguages: [
  //         ...new Set(content.translations.map((t) => t.targetLanguage)),
  //       ],
  //       avgTranslationQuality: this.calculateAverageTranslationQuality(
  //         content.translations
  //       ),
  //     },
  //     performanceMetrics: content.analytics || null,
  //   };
  // }
  async getAIDrafts(
    contentId: string,
    options: { model?: string; limit?: number } = {}
  ): Promise<AIDraft[]> {
    const queryBuilder = this.aiDraftRepository
      .createQueryBuilder("draft")
      .where("draft.contentPieceId = :contentId", { contentId })
      .orderBy("draft.createdAt", "DESC");

    if (options.model) {
      queryBuilder.andWhere("draft.modelUsed = :model", {
        model: options.model,
      });
    }

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    return await queryBuilder.getMany();
  }
  async getContentVersions(contentId: string): Promise<ContentVersion[]> {
    return await this.contentVersionRepository.find({
      where: { contentPieceId: contentId },
      order: { versionNumber: "DESC" },
    });
  }

  // async getReviewHistory(contentId: string): Promise<Review[]> {
  //   return await this.reviewRepository.find({
  //     where: { contentPieceId: contentId },
  //     order: { createdAt: "DESC" },
  //   });
  // }
  // async createAIDraft(createDraftDto: any): Promise<AIDraft> {
  //   const draft = this.aiDraftRepository.create(createDraftDto);
  //   return await this.aiDraftRepository.save(draft)[0];
  // }

  // async getContentAnalytics(contentId: string): Promise<any> {
  //   const content = await this.findOne(contentId);
  //   const metrics = await this.getContentMetrics(contentId);

  //   return {
  //     content,
  //     ...metrics,
  //     summary: {
  //       totalAIDrafts: metrics.aiMetrics.totalDrafts,
  //       totalReviews: metrics.reviewMetrics.totalReviews,
  //       totalVersions: metrics.versionMetrics.totalVersions,
  //       totalTranslations: metrics.translationMetrics.totalTranslations,
  //       currentState: content.reviewState,
  //       lastUpdated: content.updatedAt,
  //       performance: metrics.performanceMetrics,
  //     },
  //   };
  // }

  private applyPagination(
    queryBuilder: SelectQueryBuilder<ContentPiece>,
    filters: ContentFiltersDto
  ): void {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 10)); // Cap at 50 items per page
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
  }

  async findWithFilters(
    filters: ContentFiltersDto
  ): Promise<{ data: ContentPiece[]; total: number }> {
    // Create base query with all necessary joins
    const queryBuilder = this.contentRepository
      .createQueryBuilder("content")
      .leftJoinAndSelect("content.campaign", "campaign")
      .leftJoinAndSelect("content.aiDrafts", "aiDrafts")
      .leftJoinAndSelect("content.reviews", "reviews")
      .leftJoinAndSelect("content.translations", "translations")
      .leftJoinAndSelect(
        "content.contentVersions",
        "contentVersions",
        "contentVersions.isCurrentVersion = :isCurrentVersion",
        { isCurrentVersion: true }
      )
      .leftJoinAndSelect("content.analytics", "analytics");

    // Apply filters
    this.applyContentFilters(queryBuilder, filters);

    // Apply sorting
    this.applyContentSorting(queryBuilder, filters);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    this.applyPagination(queryBuilder, filters);

    // Execute query
    const data = await queryBuilder.getMany();

    return { data, total };
  }

  // New methods for enhanced functionality

  async createTranslation(
    sourceContentId: string,
    createDto: CreateContentPieceDto
  ): Promise<ContentPiece> {
    const sourceContent = await this.findOne(sourceContentId);

    const translationDto = {
      ...createDto,
      translationOf: sourceContentId,
      sourceLanguage: sourceContent.targetLanguage,
    };

    return await this.create(translationDto);
  }

  async findTranslations(contentId: string): Promise<ContentPiece[]> {
    return await this.contentRepository.find({
      where: { translationOf: contentId },
      relations: {
        campaign: true,
        aiDrafts: true,
        reviews: true,
      },
      order: {
        targetLanguage: 'ASC',
      },
    });
  }

  async updateWithVersionHistory(
    id: string,
    updateDto: UpdateContentPieceDto & { editedBy: string }
  ): Promise<ContentPiece> {
    const content = await this.findOne(id);

    // If finalText is being updated, add to version history
    if (updateDto.finalText && updateDto.finalText !== content.finalText) {
      const currentHistory = content.versionHistory || [];
      const newVersion = {
        version: currentHistory.length + 1,
        text: updateDto.finalText,
        editedBy: updateDto.editedBy,
        editedAt: new Date(),
        changeReason: updateDto.changeReason || 'Content updated',
      };

      updateDto.versionHistory = [...currentHistory, newVersion];
    }

    Object.assign(content, updateDto);
    return await this.contentRepository.save(content);
  }

  async findByLanguage(targetLanguage: string): Promise<ContentPiece[]> {
    return await this.contentRepository.find({
      where: { targetLanguage },
      relations: {
        campaign: true,
        aiDrafts: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async getTranslationChain(contentId: string): Promise<{
    source: ContentPiece | null;
    translations: ContentPiece[];
  }> {
    const content = await this.findOne(contentId);

    let source: ContentPiece | null = null;
    if (content.translationOf) {
      source = await this.findOne(content.translationOf);
    } else {
      source = content;
    }

    const translations = await this.findTranslations(source.id);

    return { source, translations };
  }

  // AIDraft methods

  async createAIDraft(createDto: CreateAIDraftDto): Promise<AIDraft> {
    const contentPiece = await this.findOne(createDto.contentPieceId);

    const aiDraft = this.aiDraftRepository.create({
      ...createDto,
      status: createDto.status || DraftStatus.CANDIDATE,
    });

    const savedDraft = await this.aiDraftRepository.save(aiDraft);

    // If this draft is marked as selected, mark others as candidates
    if (savedDraft.status === DraftStatus.SELECTED) {
      await this.selectAIDraft(savedDraft.id);
    }

    return savedDraft;
  }

  async selectAIDraft(draftId: string): Promise<AIDraft> {
    const draft = await this.aiDraftRepository.findOne({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException(`AI Draft with ID ${draftId} not found`);
    }

    // Mark all other drafts for this content piece as candidates
    await this.aiDraftRepository.update(
      {
        contentPieceId: draft.contentPieceId,
        status: DraftStatus.SELECTED,
      },
      { status: DraftStatus.CANDIDATE }
    );

    // Mark this draft as selected
    draft.status = DraftStatus.SELECTED;
    return await this.aiDraftRepository.save(draft);
  }

  async discardAIDraft(draftId: string): Promise<AIDraft> {
    const draft = await this.aiDraftRepository.findOne({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException(`AI Draft with ID ${draftId} not found`);
    }

    draft.status = DraftStatus.DISCARDED;
    return await this.aiDraftRepository.save(draft);
  }

  async findAIDraftsByContentPiece(contentPieceId: string): Promise<AIDraft[]> {
    return await this.aiDraftRepository.find({
      where: { contentPieceId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAIDraftsByStatus(
    contentPieceId: string,
    status: DraftStatus
  ): Promise<AIDraft[]> {
    return await this.aiDraftRepository.find({
      where: { contentPieceId, status },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getAIDraftMetrics(contentPieceId: string): Promise<{
    totalDrafts: number;
    selectedDrafts: number;
    candidateDrafts: number;
    discardedDrafts: number;
    avgResponseTime: number;
    avgCost: number;
    avgQualityScore: number;
  }> {
    const drafts = await this.findAIDraftsByContentPiece(contentPieceId);

    const selected = drafts.filter(d => d.status === DraftStatus.SELECTED);
    const candidates = drafts.filter(d => d.status === DraftStatus.CANDIDATE);
    const discarded = drafts.filter(d => d.status === DraftStatus.DISCARDED);

    const validResponseTimes = drafts.filter(d => d.responseTimeMs);
    const validCosts = drafts.filter(d => d.costUsd);
    const validQualityScores = drafts.filter(d => d.qualityScore);

    return {
      totalDrafts: drafts.length,
      selectedDrafts: selected.length,
      candidateDrafts: candidates.length,
      discardedDrafts: discarded.length,
      avgResponseTime: validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, d) => sum + d.responseTimeMs, 0) / validResponseTimes.length
        : 0,
      avgCost: validCosts.length > 0
        ? validCosts.reduce((sum, d) => sum + d.costUsd, 0) / validCosts.length
        : 0,
      avgQualityScore: validQualityScores.length > 0
        ? validQualityScores.reduce((sum, d) => sum + d.qualityScore, 0) / validQualityScores.length
        : 0,
    };
  }

  // Review methods

  async findReviewsByContentPiece(contentPieceId: string): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { contentPieceId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getReviewHistory(contentPieceId: string): Promise<{
    reviews: Review[];
    stateTransitions: Array<{
      from: ReviewState;
      to: ReviewState;
      action: string;
      reviewer: string;
      date: Date;
      comments?: string;
    }>;
  }> {
    const reviews = await this.findReviewsByContentPiece(contentPieceId);

    const stateTransitions = reviews.map(review => ({
      from: review.previousState,
      to: review.newState,
      action: review.action,
      reviewer: review.reviewerName || review.reviewerId || 'Unknown',
      date: review.createdAt,
      comments: review.comments,
    }));

    return { reviews, stateTransitions };
  }

  async approveContent(
    contentPieceId: string,
    reviewerId: string,
    reviewerName: string,
    comments?: string
  ): Promise<ContentPiece> {
    return await this.updateReviewState(contentPieceId, {
      newState: ReviewState.APPROVED,
      reviewType: 'content_review' as any,
      action: 'approve' as any,
      comments,
      reviewerId,
      reviewerName,
      reviewerRole: 'approver',
    });
  }

  async rejectContent(
    contentPieceId: string,
    reviewerId: string,
    reviewerName: string,
    comments: string
  ): Promise<ContentPiece> {
    return await this.updateReviewState(contentPieceId, {
      newState: ReviewState.REJECTED,
      reviewType: 'content_review' as any,
      action: 'reject' as any,
      comments,
      reviewerId,
      reviewerName,
      reviewerRole: 'reviewer',
    });
  }
}
