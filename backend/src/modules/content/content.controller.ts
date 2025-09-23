import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpException,
    HttpStatus,
    UseGuards,
    ValidationPipe,
    UsePipes,
    ParseUUIDPipe,
  } from '@nestjs/common';
  import { ContentService } from './content.service'
//   import { AIService } from '../ai/ai.service';
  import { CreateContentPieceDto } from './dto/create-content-piece.dto';
  import { UpdateContentPieceDto } from './dto/update-content-piece.dto';
  import { UpdateReviewStateDto } from './dto/update-review-state.dto';
//   import { GenerateAIContentDto } from './dto/generate-ai-content.dto';
//   import { TranslateContentDto } from './dto/translate-content.dto';
  import { ContentPiece, ReviewState, ContentType } from '../../database/entities/content-piece.entity';
  import { AIDraft } from '../../database/entities/ai-draft.entity';
  
  @Controller('api/content')
  export class ContentController {
    constructor(
      private readonly contentService: ContentService,
    //   private readonly aiService: AIService,
    ) {}
  
    // ================================
    // BASIC CRUD OPERATIONS
    // ================================
  
    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createContentDto: CreateContentPieceDto) {
      try {
        const content = await this.contentService.create(createContentDto);
        return {
          success: true,
          data: content,
          message: 'Content piece created successfully',
        };
      } catch (error) {
        throw new HttpException(
          `Failed to create content: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    @Get()
    async findAll(
      @Query('campaignId') campaignId?: string,
      @Query('reviewState') reviewState?: ReviewState,
      @Query('contentType') contentType?: ContentType,
      @Query('language') language?: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      try {
        const filters = {
          campaignId,
          reviewState,
          contentType,
          language,
          page: Math.max(1, page),
          limit: Math.min(50, Math.max(1, limit)), // Cap at 50 items
        };
  
        const result = await this.contentService.findWithFilters(filters);
  
        return {
          success: true,
          data: result.data,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / filters.limit),
          },
          message: `Found ${result.total} content pieces`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to fetch content: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
      try {
        const content = await this.contentService.findOne(id);
        
        // Calculate some additional metrics
        // const metrics = await this.contentService.getContentMetrics(id);
  
        return {
          success: true,
          data: {
            ...content,
            // metrics,
          },
        };
      } catch (error) {
        const status = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
        
        throw new HttpException(error.message, status);
      }
    }
  
    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateContentDto: UpdateContentPieceDto,
    ) {
      try {
        const content = await this.contentService.update(id, updateContentDto);
        return {
          success: true,
          data: content,
          message: 'Content updated successfully',
        };
      } catch (error) {
        const status = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
        
        throw new HttpException(error.message, status);
      }
    }
  
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
      try {
        await this.contentService.remove(id);
        return {
          success: true,
          message: 'Content deleted successfully',
        };
      } catch (error) {
        const status = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
        
        throw new HttpException(error.message, status);
      }
    }
  
    // ================================
    // AI INTEGRATION ENDPOINTS
    // ================================
  
    // @Post(':id/generate-ai-content')
    // @UsePipes(new ValidationPipe({ transform: true }))
    // async generateAIContent(
    //   @Param('id', ParseUUIDPipe) id: string,
    //   @Body() generateDto: GenerateAIContentDto,
    // ) {
    //   try {
    //     // Get the content piece first
    //     const content = await this.contentService.findOne(id);
  
    //     // Generate AI content
    //     const aiDraft = await this.aiService.generateContentForPiece(
    //       content,
    //       generateDto,
    //     );
  
    //     // Update content state to AI_GENERATED
    //     await this.contentService.updateReviewState(id, {
    //       newState: ReviewState.AI_GENERATED,
    //       reviewType: 'CONTENT_REVIEW' as any,
    //       action: 'EDIT' as any,
    //       comments: `AI content generated using ${generateDto.model}`,
    //       reviewerId: generateDto.userId || 'system',
    //       reviewerName: generateDto.userName || 'AI System',
    //       reviewerRole: 'AI Assistant',
    //     });
  
    //     return {
    //       success: true,
    //       data: {
    //         contentPiece: await this.contentService.findOne(id),
    //         aiDraft,
    //         generationMetadata: {
    //           model: generateDto.model,
    //           prompt: generateDto.prompt,
    //           generatedAt: new Date(),
    //         },
    //       },
    //       message: 'AI content generated successfully',
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `AI generation failed: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Post(':id/compare-ai-models')
    // @UsePipes(new ValidationPipe({ transform: true }))
    // async compareAIModels(
    //   @Param('id', ParseUUIDPipe) id: string,
    //   @Body() compareDto: { prompt: string; models?: string[]; userId?: string },
    // ) {
    //   try {
    //     const content = await this.contentService.findOne(id);
  
    //     const comparison = await this.aiService.compareModelsForContent(
    //       content,
    //       compareDto.prompt,
    //       compareDto.models || ['claude', 'openai'],
    //     );
  
    //     return {
    //       success: true,
    //       data: {
    //         comparison,
    //         recommendations: this.generateModelRecommendations(comparison),
    //         contentPiece: content,
    //       },
    //       message: 'AI model comparison completed',
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Model comparison failed: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Post(':id/translate')
    // @UsePipes(new ValidationPipe({ transform: true }))
    // async translateContent(
    //   @Param('id', ParseUUIDPipe) id: string,
    //   @Body() translateDto: TranslateContentDto,
    // ) {
    //   try {
    //     const content = await this.contentService.findOne(id);
  
    //     const translation = await this.aiService.translateContent(
    //       content,
    //       translateDto,
    //     );
  
    //     return {
    //       success: true,
    //       data: {
    //         originalContent: content,
    //         translation,
    //         translationMetadata: {
    //           sourceLanguage: translateDto.sourceLanguage,
    //           targetLanguage: translateDto.targetLanguage,
    //           model: translateDto.model || 'claude',
    //           translatedAt: new Date(),
    //         },
    //       },
    //       message: `Content translated to ${translateDto.targetLanguage} successfully`,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Translation failed: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Post(':id/improve')
    // @UsePipes(new ValidationPipe({ transform: true }))
    // async improveContent(
    //   @Param('id', ParseUUIDPipe) id: string,
    //   @Body() improveDto: { improvementRequest: string; model?: string; userId?: string },
    // ) {
    //   try {
    //     const content = await this.contentService.findOne(id);
  
    //     const improvement = await this.aiService.improveContent(
    //       content,
    //       improveDto.improvementRequest,
    //       improveDto.model || 'claude',
    //     );
  
    //     // Create new AI draft with the improvement
    //     const improvedDraft = await this.contentService.createAIDraft({
    //       contentPieceId: id,
    //       modelUsed: improveDto.model || 'claude',
    //       generationType: 'IMPROVEMENT' as any,
    //       generatedTitle: improvement.title,
    //       generatedDesc: improvement.description,
    //       prompt: `Improve: ${improveDto.improvementRequest}`,
    //       qualityScore: improvement.qualityScore,
    //     });
  
    //     return {
    //       success: true,
    //       data: {
    //         originalContent: content,
    //         improvedContent: improvement,
    //         aiDraft: improvedDraft,
    //       },
    //       message: 'Content improved successfully',
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Content improvement failed: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // ================================
    // REVIEW WORKFLOW ENDPOINTS
    // ================================
  
    @Patch(':id/review-state')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateReviewState(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateStateDto: UpdateReviewStateDto,
    ) {
      try {
        const content = await this.contentService.updateReviewState(id, updateStateDto);
  
        // Send real-time notification (WebSocket)
        // this.eventsGateway.notifyReviewStateChange(content);
  
        return {
          success: true,
          data: content,
          message: `Review state updated to ${updateStateDto.newState}`,
        };
      } catch (error) {
        const status = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
        
        throw new HttpException(error.message, status);
      }
    }
  
    @Post(':id/submit-for-review')
    async submitForReview(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() submitDto: { reviewerIds?: string[]; priority?: string; comments?: string },
    ) {
      try {
        const content = await this.contentService.updateReviewState(id, {
          newState: ReviewState.PENDING_REVIEW,
          reviewType: 'CONTENT_REVIEW' as any,
          action: 'REQUEST_REVISION' as any,
          comments: submitDto.comments || 'Submitted for review',
          reviewerId: 'system',
          reviewerName: 'System',
          reviewerRole: 'Automated',
        });
  
        // TODO: Send notifications to reviewers
        // await this.notificationService.notifyReviewers(submitDto.reviewerIds, content);
  
        return {
          success: true,
          data: content,
          message: 'Content submitted for review successfully',
        };
      } catch (error) {
        throw new HttpException(
          `Failed to submit for review: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Post(':id/approve')
    async approveContent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() approveDto: { 
        reviewerId: string; 
        reviewerName: string; 
        comments?: string;
        publishImmediately?: boolean;
      },
    ) {
      try {
        const newState = approveDto.publishImmediately 
          ? ReviewState.PUBLISHED 
          : ReviewState.APPROVED;
  
        const content = await this.contentService.updateReviewState(id, {
          newState,
          reviewType: 'FINAL_APPROVAL' as any,
          action: 'APPROVE' as any,
          comments: approveDto.comments || 'Content approved',
          reviewerId: approveDto.reviewerId,
          reviewerName: approveDto.reviewerName,
          reviewerRole: 'Approver',
        });
  
        return {
          success: true,
          data: content,
          message: approveDto.publishImmediately 
            ? 'Content approved and published' 
            : 'Content approved successfully',
        };
      } catch (error) {
        throw new HttpException(
          `Failed to approve content: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Post(':id/reject')
    async rejectContent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() rejectDto: { 
        reviewerId: string; 
        reviewerName: string; 
        reason: string;
        suggestions?: string;
      },
    ) {
      try {
        const content = await this.contentService.updateReviewState(id, {
          newState: ReviewState.REJECTED,
          reviewType: 'CONTENT_REVIEW' as any,
          action: 'REJECT' as any,
          comments: rejectDto.reason,
          suggestions: rejectDto.suggestions,
          reviewerId: rejectDto.reviewerId,
          reviewerName: rejectDto.reviewerName,
          reviewerRole: 'Reviewer',
        });
  
        return {
          success: true,
          data: content,
          message: 'Content rejected',
        };
      } catch (error) {
        throw new HttpException(
          `Failed to reject content: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    // ================================
    // ANALYTICS AND REPORTING
    // ================================
  
    // @Get(':id/analytics')
    // async getContentAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    //   try {
    //     const analytics = await this.contentService.getContentAnalytics(id);
    //     return {
    //       success: true,
    //       data: analytics,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Failed to get analytics: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Get(':id/versions')
    // async getContentVersions(@Param('id', ParseUUIDPipe) id: string) {
    //   try {
    //     const versions = await this.contentService.getContentVersions(id);
    //     return {
    //       success: true,
    //       data: versions,
    //       message: `Found ${versions.length} versions`,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Failed to get versions: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Get(':id/ai-drafts')
    // async getAIDrafts(
    //   @Param('id', ParseUUIDPipe) id: string,
    //   @Query('model') model?: string,
    //   @Query('limit') limit: number = 10,
    // ) {
    //   try {
    //     const drafts = await this.contentService.getAIDrafts(id, {
    //       model,
    //       limit: Math.min(50, Math.max(1, limit)),
    //     });
  
    //     return {
    //       success: true,
    //       data: drafts,
    //       message: `Found ${drafts.length} AI drafts`,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Failed to get AI drafts: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Get(':id/review-history')
    // async getReviewHistory(@Param('id', ParseUUIDPipe) id: string) {
    //   try {
    //     const history = await this.contentService.getReviewHistory(id);
    //     return {
    //       success: true,
    //       data: history,
    //       message: `Found ${history.length} review entries`,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Failed to get review history: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // ================================
    // BULK OPERATIONS
    // ================================
  
    // @Post('bulk/generate-ai-content')
    // async bulkGenerateAI(@Body() bulkDto: { 
    //   contentIds: string[]; 
    //   prompt: string; 
    //   model?: string 
    // }) {
    //   try {
    //     const results = await Promise.allSettled(
    //       bulkDto.contentIds.map(id => 
    //         this.generateAIContent(id, {
    //           prompt: bulkDto.prompt,
    //           model: bulkDto.model || 'claude',
    //         } as any)
    //       )
    //     );
  
    //     const successful = results.filter(r => r.status === 'fulfilled').length;
    //     const failed = results.length - successful;
  
    //     return {
    //       success: true,
    //       data: {
    //         total: results.length,
    //         successful,
    //         failed,
    //         results: results.map((result, index) => ({
    //           contentId: bulkDto.contentIds[index],
    //           status: result.status,
    //           error: result.status === 'rejected' ? result.reason : null,
    //         })),
    //       },
    //       message: `Bulk AI generation completed: ${successful} successful, ${failed} failed`,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Bulk AI generation failed: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // @Patch('bulk/review-state')
    // async bulkUpdateReviewState(@Body() bulkDto: {
    //   contentIds: string[];
    //   newState: ReviewState;
    //   reviewerId: string;
    //   reviewerName: string;
    //   comments?: string;
    // }) {
    //   try {
    //     const results = await Promise.allSettled(
    //       bulkDto.contentIds.map(id =>
    //         this.contentService.updateReviewState(id, {
    //           newState: bulkDto.newState,
    //           reviewType: 'CONTENT_REVIEW' as any,
    //           action: 'EDIT' as any,
    //           comments: bulkDto.comments || 'Bulk state update',
    //           reviewerId: bulkDto.reviewerId,
    //           reviewerName: bulkDto.reviewerName,
    //           reviewerRole: 'Reviewer',
    //         })
    //       )
    //     );
  
    //     const successful = results.filter(r => r.status === 'fulfilled').length;
    //     const failed = results.length - successful;
  
    //     return {
    //       success: true,
    //       data: {
    //         total: results.length,
    //         successful,
    //         failed,
    //         newState: bulkDto.newState,
    //       },
    //       message: `Bulk review state update completed: ${successful} successful, ${failed} failed`,
    //     };
    //   } catch (error) {
    //     throw new HttpException(
    //       `Bulk review state update failed: ${error.message}`,
    //       HttpStatus.INTERNAL_SERVER_ERROR,
    //     );
    //   }
    // }
  
    // ================================
    // HELPER METHODS
    // ================================
  
    // private generateModelRecommendations(comparison: any) {
    //   const recommendations = [];
  
    //   // Response time comparison
    //   if (comparison.claude?.responseTime < comparison.openai?.responseTime) {
    //     recommendations.push({
    //       type: 'performance',
    //       message: 'Claude responded faster',
    //       advantage: 'claude',
    //       metric: 'response_time',
    //     });
    //   } else {
    //     recommendations.push({
    //       type: 'performance',
    //       message: 'OpenAI responded faster',
    //       advantage: 'openai',
    //       metric: 'response_time',
    //     });
    //   }
  
    //   // Quality score comparison
    //   if (comparison.claude?.qualityScore > comparison.openai?.qualityScore) {
    //     recommendations.push({
    //       type: 'quality',
    //       message: 'Claude produced higher quality content',
    //       advantage: 'claude',
    //       metric: 'quality_score',
    //     });
    //   } else if (comparison.openai?.qualityScore > comparison.claude?.qualityScore) {
    //     recommendations.push({
    //       type: 'quality',
    //       message: 'OpenAI produced higher quality content',
    //       advantage: 'openai',
    //       metric: 'quality_score',
    //     });
    //   }
  
    //   // Content length comparison
    //   const claudeLength = comparison.claude?.content?.length || 0;
    //   const openaiLength = comparison.openai?.content?.length || 0;
      
    //   if (Math.abs(claudeLength - openaiLength) > 100) {
    //     recommendations.push({
    //       type: 'content_length',
    //       message: claudeLength > openaiLength 
    //         ? 'Claude provided more detailed content' 
    //         : 'OpenAI provided more detailed content',
    //       advantage: claudeLength > openaiLength ? 'claude' : 'openai',
    //       metric: 'content_length',
    //     });
    //   }
  
    //   return recommendations;
    // }
  }
  