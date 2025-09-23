import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import {
  ContentPiece,
  ReviewState,
  ContentType,
} from "../../database/entities/content-piece.entity";
import { AIDraft } from "../../database/entities/ai-draft.entity";
import { Review } from "../../database/entities/review.entity";
import { ContentVersion } from "../../database/entities/content-version.entity";
import { CreateContentPieceDto } from "./dto/create-content-piece.dto";
import { UpdateContentPieceDto } from "./dto/update-content-piece.dto";
import { UpdateReviewStateDto } from "./dto/update-review-state.dto";
import { ContentFiltersDto } from "./dto/content-filters.dto";

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
    const content = await this.findOne(id);
    const previousState = content.reviewState;

    content.reviewState = updateStateDto.newState;

    // Create review record
    const review = this.reviewRepository.create({
      contentPieceId: id,
      reviewType: updateStateDto.reviewType,
      action: updateStateDto.action,
      previousState: previousState,
      newState: updateStateDto.newState,
      comments: updateStateDto.comments,
      suggestions: updateStateDto.suggestions,
      reviewerId: updateStateDto.reviewerId,
      reviewerName: updateStateDto.reviewerName,
      reviewerRole: updateStateDto.reviewerRole,
    });

    await this.reviewRepository.save(review);

    // Update published date if approved
    if (updateStateDto.newState === ReviewState.PUBLISHED) {
      content.publishedAt = new Date();
    }

    return await this.contentRepository.save(content);
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

  async getReviewHistory(contentId: string): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { contentPieceId: contentId },
      order: { createdAt: "DESC" },
    });
  }
  async createAIDraft(createDraftDto: any): Promise<AIDraft> {
    const draft = this.aiDraftRepository.create(createDraftDto);
    return await this.aiDraftRepository.save(draft)[0];
  }

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
}
