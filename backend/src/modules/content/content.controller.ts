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
  import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
  import { ContentService } from './content.service'
  import { AIService } from '../ai/ai.service';
  import { CreateContentPieceDto } from './dto/create-content-piece.dto';
  import { UpdateContentPieceDto } from './dto/update-content-piece.dto';
  import { UpdateReviewStateDto } from './dto/update-review-state.dto';
  import { SubmitForReviewDto } from './dto/submit-for-review.dto';
  import { ApproveContentDto } from './dto/approve-content.dto';
  import { RejectContentDto } from './dto/reject-content.dto';
  import { GenerateAIContentDto } from './dto/generate-ai-content.dto';
  import { TranslateContentDto } from './dto/translate-content.dto';
  import { ContentPiece, ReviewState, ContentType } from '../../database/entities/content-piece.entity';
  import { AIDraft } from '../../database/entities/ai-draft.entity';
import { ReviewAction, ReviewType } from 'src/database/entities';
  
  @ApiTags('Content')
  @Controller('api/content')
  export class ContentController {
    constructor(
      private readonly contentService: ContentService,
      private readonly aiService: AIService,
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
      @Query('excludeTranslations') excludeTranslations?: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      try {
        const filters = {
          campaignId,
          reviewState,
          contentType,
          language,
          excludeTranslations: excludeTranslations === 'true',
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
  
    @Post(':id/generate-ai-content')
    @ApiOperation({
      summary: 'Generate AI content for a content piece',
      description: 'Uses AI models to generate new content variations, improvements, or original content based on the existing content piece'
    })
    @ApiParam({
      name: 'id',
      description: 'UUID of the content piece to generate AI content for',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    })
    @ApiBody({
      type: GenerateAIContentDto,
      description: 'AI content generation parameters'
    })
    @ApiResponse({
      status: 200,
      description: 'AI content generated successfully',
      example: {
        success: true,
        data: {
          aiDraft: {
            id: 'draft-id',
            generatedContent: {
              title: 'AI Generated Title',
              description: 'AI generated description',
              body: 'AI generated main content...'
            },
            qualityScore: 0.85,
            modelUsed: 'claude'
          },
          generationMetadata: {
            model: 'claude-3-5-sonnet',
            responseTime: 1250,
            qualityScore: 0.85,
            tokenCount: 450
          }
        },
        message: 'AI content generated successfully'
      }
    })
    async generateAIContent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() generateDto: GenerateAIContentDto,
    ) {
      try {
        // Get the content piece first
        const content = await this.contentService.findOne(id);

        // Generate AI content
        const result = await this.aiService.generateContentForPiece(
          content,
          generateDto,
        );

        // Update content state to AI_SUGGESTED if it was draft
        if (content.reviewState === ReviewState.DRAFT) {
          await this.contentService.updateReviewState(id, {
            newState: ReviewState.AI_SUGGESTED,
            reviewType: ReviewType.CONTENT_REVIEW,
            action: ReviewAction.EDIT,
            comments: `AI content generated using ${generateDto.model}. ${generateDto.type || 'Original'} generation requested.`,
            reviewerId: generateDto.userId || 'system',
            reviewerName: generateDto.userName || 'AI System',
            reviewerRole: 'AI Assistant',
          });
        }

        return {
          success: true,
          data: {
            contentPiece: await this.contentService.findOne(id),
            aiDraft: result.aiDraft,
            generatedContent: result.generatedContent,
            generationMetadata: {
              model: generateDto.model,
              prompt: generateDto.prompt,
              type: generateDto.type || 'original',
              generatedAt: new Date(),
              ...result.metadata,
            },
          },
          message: 'AI content generated successfully',
        };
      } catch (error) {
        const status = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          `AI generation failed: ${error.message}`,
          status,
        );
      }
    }
  
    @Post(':id/compare-ai-models')
    @ApiOperation({
      summary: 'Compare AI models for content generation',
      description: 'Generates content using multiple AI models and provides a comparison of results, quality scores, and performance metrics'
    })
    @ApiParam({
      name: 'id',
      description: 'UUID of the content piece to use as context for model comparison',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    })
    @ApiBody({
      description: 'Model comparison parameters',
      schema: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt to use for content generation comparison',
            example: 'Create a compelling social media post about this content'
          },
          models: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of AI models to compare',
            example: ['claude', 'openai'],
            default: ['claude', 'openai']
          },
          userId: {
            type: 'string',
            description: 'ID of the user requesting the comparison',
            example: 'user@company.com'
          }
        }
      }
    })
    @ApiResponse({
      status: 200,
      description: 'AI model comparison completed successfully',
      example: {
        success: true,
        data: {
          comparison: {
            claude: {
              content: 'Claude generated content...',
              qualityScore: 0.87,
              responseTime: 1200,
              tokenCount: 324,
              cost: 0.0032
            },
            openai: {
              content: 'OpenAI generated content...',
              qualityScore: 0.82,
              responseTime: 980,
              tokenCount: 298,
              cost: 0.0045
            }
          },
          bestModel: 'claude',
          recommendations: [
            {
              type: 'quality',
              message: 'Claude produced higher quality content',
              advantage: 'claude'
            }
          ]
        }
      }
    })
    async compareAIModels(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() compareDto: { prompt: string; models?: string[]; userId?: string },
    ) {
      try {
        const content = await this.contentService.findOne(id);

        const comparison = await this.aiService.compareModelsForContent(
          content,
          compareDto.prompt,
          compareDto.models || ['claude', 'openai'],
        );

        return {
          success: true,
          data: {
            comparison: comparison.comparison,
            bestModel: comparison.bestModel,
            recommendations: this.generateModelRecommendations(comparison.comparison),
            contentPiece: content,
            totalTime: comparison.totalTime,
            metadata: comparison.metadata,
          },
          message: 'AI model comparison completed',
        };
      } catch (error) {
        const status = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          `Model comparison failed: ${error.message}`,
          status,
        );
      }
    }
  
    @Post(':id/translate')
    @ApiOperation({
      summary: 'Translate content using AI',
      description: 'Translates approved content to a target language using AI translation services (Claude or OpenAI)'
    })
    @ApiParam({
      name: 'id',
      description: 'UUID of the content piece to translate',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    })
    @ApiBody({
      type: TranslateContentDto,
      description: 'Translation configuration'
    })
    @ApiResponse({
      status: 200,
      description: 'Content translated successfully',
      example: {
        success: true,
        data: {
          originalContent: {
            id: 'original-id',
            title: 'Original Title',
            reviewState: 'approved'
          },
          translatedContent: {
            id: 'translated-id',
            title: 'Título Traducido',
            finalText: 'Contenido traducido...'
          },
          translationResult: {
            qualityScore: 0.92,
            culturalNotes: 'Adapted formal addressing for Spanish business culture',
            translationStrategy: 'Localized approach with cultural adaptation and market-specific terminology',
            confidenceScore: 0.89,
            aiDraft: {
              id: 'draft-id',
              modelUsed: 'claude',
              generationType: 'translation'
            }
          },
          translationMetadata: {
            sourceLanguage: 'en',
            targetLanguage: 'es',
            model: 'claude',
            translationType: 'localized'
          }
        },
        message: 'Content translated to es successfully'
      }
    })
    @ApiResponse({
      status: 400,
      description: 'Content not approved for translation or invalid request'
    })
    @ApiResponse({
      status: 404,
      description: 'Content not found'
    })
    @ApiResponse({
      status: 500,
      description: 'Translation service error'
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async translateContent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() translateDto: TranslateContentDto,
    ) {
      try {
        // Get the content piece first
        const content = await this.contentService.findOne(id);

        // Validate content is ready for translation
        if (content.reviewState !== ReviewState.APPROVED) {
          throw new HttpException(
            'Content must be approved before translation',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Perform AI translation with retry logic
        const translationResult = await this.aiService.translateContentWithRetry(
          content,
          translateDto,
          3, // max retries
        );

        // Create new content piece for translation
        const translatedContent = await this.contentService.createTranslation(
          content.id,
          {
            campaignId: content.campaignId,
            contentType: content.contentType,
            title: translationResult.translatedContent.title,
            description: translationResult.translatedContent.description,
            targetLanguage: translateDto.targetLanguage,
            sourceLanguage: translateDto.sourceLanguage,
            finalText: translationResult.translatedContent.body,
            // reviewState: ReviewState.PENDING_REVIEW, // Set to pending review for translation approval
            contentMetadata: {
              translationQuality: translationResult.qualityScore,
              aiModel: translateDto.model,
              translationType: translateDto.translationType,
              culturalNotes: translationResult.translatedContent.culturalNotes,
              translationStrategy: translationResult.translatedContent.translationStrategy || 'Standard translation',
              confidenceScore: translationResult.translatedContent.confidenceScore || 0.8,
              suggestedImprovements: translationResult.translatedContent.suggestedImprovements || 'None',
            },
          },
          translationResult, // Pass translation result to create translation record
        );

        return {
          success: true,
          data: {
            originalContent: content,
            translatedContent,
            translationResult: {
              qualityScore: translationResult.qualityScore,
              aiDraft: translationResult.aiDraft,
              culturalNotes: translationResult.translatedContent.culturalNotes || 'No cultural notes',
              translationStrategy: translationResult.translatedContent.translationStrategy || 'Standard translation',
              confidenceScore: translationResult.translatedContent.confidenceScore || 0.8,
            },
            translationMetadata: translationResult.metadata,
          },
          message: `Content translated to ${translateDto.targetLanguage} successfully`,
        };
      } catch (error) {
        const status = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          `Translation failed: ${error.message}`,
          status,
        );
      }
    }
  
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
    // TRANSLATION ENDPOINTS
    // ================================

    @Get('translations/pending')
    @ApiOperation({
      summary: 'Get pending translations for review',
      description: 'Returns all translations that are pending human review'
    })
    @ApiResponse({
      status: 200,
      description: 'Pending translations retrieved successfully',
    })
    async getPendingTranslations() {
      try {
        const pendingTranslations = await this.contentService.getPendingTranslations();

        return {
          success: true,
          data: pendingTranslations,
          message: `Found ${pendingTranslations.length} pending translations`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get pending translations: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    @Post('translations/:translationId/approve')
    @ApiOperation({
      summary: 'Approve a translation',
      description: 'Approve a specific translation and set the translated content as approved'
    })
    @ApiParam({
      name: 'translationId',
      description: 'UUID of the translation to approve',
    })
    async approveTranslation(
      @Param('translationId', ParseUUIDPipe) translationId: string,
      @Body() approveDto: { reviewerId: string; reviewerName: string; comments?: string },
    ) {
      try {
        const result = await this.contentService.approveTranslation(
          translationId,
          approveDto.reviewerId,
          approveDto.reviewerName,
          approveDto.comments,
        );

        return {
          success: true,
          data: result,
          message: 'Translation approved successfully',
        };
      } catch (error) {
        const status = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          `Failed to approve translation: ${error.message}`,
          status,
        );
      }
    }

    @Post('translations/:translationId/reject')
    @ApiOperation({
      summary: 'Reject a translation',
      description: 'Reject a specific translation with a reason'
    })
    @ApiParam({
      name: 'translationId',
      description: 'UUID of the translation to reject',
    })
    async rejectTranslation(
      @Param('translationId', ParseUUIDPipe) translationId: string,
      @Body() rejectDto: { reviewerId: string; reviewerName: string; reason: string },
    ) {
      try {
        const result = await this.contentService.rejectTranslation(
          translationId,
          rejectDto.reviewerId,
          rejectDto.reviewerName,
          rejectDto.reason,
        );

        return {
          success: true,
          data: result,
          message: 'Translation rejected',
        };
      } catch (error) {
        const status = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          `Failed to reject translation: ${error.message}`,
          status,
        );
      }
    }

    @Get('ai-draft-translations/pending')
    @ApiOperation({
      summary: 'Get pending AI draft translations',
      description: 'Returns all AI draft translations that are pending human review. Optionally filter by content ID.'
    })
    @ApiQuery({
      name: 'contentId',
      required: false,
      description: 'Filter by specific content piece ID',
      type: String,
    })
    @ApiResponse({
      status: 200,
      description: 'Pending AI draft translations retrieved successfully',
    })
    async getPendingAIDraftTranslations(@Query('contentId') contentId?: string) {
      try {
        const pendingAIDraftTranslations = await this.contentService.getPendingAIDraftTranslations(contentId);

        const message = contentId 
          ? `Found ${pendingAIDraftTranslations.length} pending AI draft translations for content ${contentId}`
          : `Found ${pendingAIDraftTranslations.length} pending AI draft translations`;

        return {
          success: true,
          data: pendingAIDraftTranslations,
          message,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get pending AI draft translations: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    @Post('ai-draft-translations/:aiDraftId/approve')
    @ApiOperation({
      summary: 'Approve an AI draft translation',
      description: 'Approve a specific AI draft translation, create translation record, and set the translated content as approved'
    })
    @ApiParam({
      name: 'aiDraftId',
      description: 'UUID of the AI draft translation to approve',
    })
    async approveAIDraftTranslation(
      @Param('aiDraftId', ParseUUIDPipe) aiDraftId: string,
      @Body() approveDto: { reviewerId: string; reviewerName: string; comments?: string },
    ) {
      try {
        const result = await this.contentService.approveAIDraftTranslation(
          aiDraftId,
          approveDto.reviewerId,
          approveDto.reviewerName,
          approveDto.comments,
        );

        return {
          success: true,
          data: result,
          message: 'AI draft translation approved successfully',
        };
      } catch (error) {
        const status = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          `Failed to approve AI draft translation: ${error.message}`,
          status,
        );
      }
    }

    @Get(':id/translations')
    @ApiOperation({
      summary: 'Get all translations for a content piece',
      description: 'Returns all translation records for a specific content piece with basic details'
    })
    async getContentTranslations(@Param('id', ParseUUIDPipe) id: string) {
      try {
        const translations = await this.contentService.findTranslationsByContentPiece(id);

        return {
          success: true,
          data: translations,
          message: `Found ${translations.length} translations`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get translations: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    @Get(':id/translations/detailed')
    @ApiOperation({
      summary: 'Get detailed translation overview for a content piece',
      description: 'Returns comprehensive translation information including source content, translation records, translated content pieces, and review status'
    })
    @ApiParam({
      name: 'id',
      description: 'UUID of the source content piece',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    })
    @ApiResponse({
      status: 200,
      description: 'Detailed translation overview retrieved successfully',
      example: {
        success: true,
        data: {
          sourceContent: {
            id: 'source-content-id',
            title: 'Original English Content',
            reviewState: 'approved'
          },
          translations: [
            {
              translation: {
                id: 'translation-record-id',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                qualityScore: 0.87,
                isHumanReviewed: false
              },
              translatedContentPiece: {
                id: 'translated-content-id',
                title: 'Contenido en Español',
                reviewState: 'pending_review'
              },
              status: 'pending_review',
              reviewRequired: true
            }
          ]
        }
      }
    })
    async getDetailedTranslations(@Param('id', ParseUUIDPipe) id: string) {
      try {
        const translationDetails = await this.contentService.getTranslationsByContentWithDetails(id);

        const summary = {
          totalTranslations: translationDetails.translations.length,
          pendingReview: translationDetails.translations.filter(t => t.reviewRequired).length,
          approved: translationDetails.translations.filter(t => t.status === 'approved').length,
          languages: [...new Set(translationDetails.translations.map(t => t.translation.targetLanguage))],
          reviewProgress: {
            completed: translationDetails.translations.filter(t => t.translation.isHumanReviewed).length,
            pending: translationDetails.translations.filter(t => !t.translation.isHumanReviewed).length
          }
        };

        return {
          success: true,
          data: {
            ...translationDetails,
            summary
          },
          message: `Found ${translationDetails.translations.length} translations for content piece`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get detailed translations: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    @Get(':id/translations/pending-review')
    @ApiOperation({
      summary: 'Get translations pending review for a specific content piece',
      description: 'Returns only translations that require human review for a specific content piece'
    })
    async getContentTranslationsPendingReview(@Param('id', ParseUUIDPipe) id: string) {
      try {
        const translationDetails = await this.contentService.getTranslationsByContentWithDetails(id);

        const pendingTranslations = translationDetails.translations.filter(t => t.reviewRequired);

        return {
          success: true,
          data: {
            sourceContent: translationDetails.sourceContent,
            pendingTranslations,
            count: pendingTranslations.length
          },
          message: `Found ${pendingTranslations.length} translations pending review`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get pending translations: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // ================================
    // REVIEW WORKFLOW ENDPOINTS
    // ================================
  
    @Patch(':id/review-state')
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
      @Body() submitDto: SubmitForReviewDto,
    ) {
      try {
        const existingContent = await this.contentService.findOne(id);
        if (!existingContent) {
          throw new HttpException(
            `Content piece with ID ${id} not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        const content = await this.contentService.updateReviewState(id, {
          newState: ReviewState.PENDING_REVIEW,
          reviewType: ReviewType.CONTENT_REVIEW,
          action: ReviewAction.EDIT,
          comments: submitDto.comments || 'Submitted for review',
          reviewerId: submitDto.reviewerIds?.[0] || 'system',
          reviewerName: 'System',
          reviewerRole: 'Automated',
        });

        console.log('Content updated successfully:', content.id, content.reviewState);

        // TODO: Send notifications to reviewers
        // await this.notificationService.notifyReviewers(submitDto.reviewerIds, content);

        // Return a clean response without circular references
        const cleanContent = {
          id: content.id,
          campaignId: content.campaignId,
          title: content.title,
          description: content.description,
          contentType: content.contentType,
          reviewState: content.reviewState,
          priority: content.priority,
          targetLanguage: content.targetLanguage,
          sourceLanguage: content.sourceLanguage,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        };

        return {
          success: true,
          data: cleanContent,
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
    @UsePipes(new ValidationPipe({ transform: true }))
    async approveContent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() approveDto: ApproveContentDto,
    ) {
      try {
        const newState = approveDto.publishImmediately 
          ? ReviewState.APPROVED 
          : ReviewState.APPROVED;
  
        const content = await this.contentService.updateReviewState(id, {
          newState,
          reviewType: ReviewType.FINAL_APPROVAL,
          action: ReviewAction.APPROVE,
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
    @UsePipes(new ValidationPipe({ transform: true }))
    async rejectContent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() rejectDto: RejectContentDto,
    ) {
      try {
        const content = await this.contentService.updateReviewState(id, {
          newState: ReviewState.REJECTED,
          reviewType: ReviewType.CONTENT_REVIEW,
          action: ReviewAction.REJECT,
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
  
    @Get(':id/versions')
    async getContentVersions(@Param('id', ParseUUIDPipe) id: string) {
      try {
        const versions = await this.contentService.getContentVersions(id);
        return {
          success: true,
          data: versions,
          message: `Found ${versions.length} versions`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get versions: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Get(':id/ai-drafts')
    async getAIDrafts(
      @Param('id', ParseUUIDPipe) id: string,
      @Query('model') model?: string,
      @Query('limit') limit: number = 10,
    ) {
      try {
        const drafts = await this.contentService.getAIDrafts(id, {
          model,
          limit: Math.min(50, Math.max(1, limit)),
        });
  
        return {
          success: true,
          data: drafts,
          message: `Found ${drafts.length} AI drafts`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get AI drafts: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Get(':id/review-history')
    async getReviewHistory(@Param('id', ParseUUIDPipe) id: string) {
      try {
        const history = await this.contentService.getReviewHistory(id);
        return {
          success: true,
          data: history,
          message: `Found ${history.reviews.length} review entries`,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to get review history: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
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
  
    private generateModelRecommendations(comparison: any): Array<{
      type: string;
      message: string;
      advantage: string;
      metric: string;
    }> {
      const recommendations = [];

      const models = Object.keys(comparison);

      if (models.length < 2) {
        return recommendations;
      }

      // Response time comparison
      const modelsBySpeed = models.filter(m => comparison[m].responseTime).sort(
        (a, b) => comparison[a].responseTime - comparison[b].responseTime
      );

      if (modelsBySpeed.length >= 2) {
        const fastest = modelsBySpeed[0];
        const difference = comparison[modelsBySpeed[1]].responseTime - comparison[fastest].responseTime;

        if (difference > 200) { // Only recommend if significant difference
          recommendations.push({
            type: 'performance',
            message: `${fastest} responded ${Math.round(difference)}ms faster`,
            advantage: fastest,
            metric: 'response_time',
          });
        }
      }

      // Quality score comparison
      const modelsByQuality = models.filter(m => comparison[m].qualityScore).sort(
        (a, b) => comparison[b].qualityScore - comparison[a].qualityScore
      );

      if (modelsByQuality.length >= 2) {
        const best = modelsByQuality[0];
        const qualityDiff = comparison[best].qualityScore - comparison[modelsByQuality[1]].qualityScore;

        if (qualityDiff > 0.05) { // Only recommend if meaningful difference
          recommendations.push({
            type: 'quality',
            message: `${best} produced higher quality content (score: ${comparison[best].qualityScore.toFixed(2)})`,
            advantage: best,
            metric: 'quality_score',
          });
        }
      }

      // Content length comparison
      const contentLengths = models.map(m => ({
        model: m,
        length: comparison[m]?.content?.length || 0
      })).filter(m => m.length > 0);

      if (contentLengths.length >= 2) {
        const longest = contentLengths.sort((a, b) => b.length - a.length)[0];
        const shortest = contentLengths[contentLengths.length - 1];

        if (Math.abs(longest.length - shortest.length) > 100) {
          recommendations.push({
            type: 'content_length',
            message: `${longest.model} provided more detailed content (${longest.length} vs ${shortest.length} characters)`,
            advantage: longest.model,
            metric: 'content_length',
          });
        }
      }

      // Cost comparison
      const modelsByCost = models.filter(m => comparison[m].cost).sort(
        (a, b) => comparison[a].cost - comparison[b].cost
      );

      if (modelsByCost.length >= 2) {
        const cheapest = modelsByCost[0];
        const costDiff = comparison[modelsByCost[1]].cost - comparison[cheapest].cost;

        if (costDiff > 0.001) { // Only recommend if meaningful cost difference
          recommendations.push({
            type: 'cost',
            message: `${cheapest} is more cost-effective ($${comparison[cheapest].cost.toFixed(4)} vs $${comparison[modelsByCost[1]].cost.toFixed(4)})`,
            advantage: cheapest,
            metric: 'cost',
          });
        }
      }

      return recommendations;
    }
  }
  