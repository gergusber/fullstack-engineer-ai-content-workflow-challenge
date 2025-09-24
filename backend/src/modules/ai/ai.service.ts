import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIDraft, AIModel, GenerationType } from '../../database/entities/ai-draft.entity';
import { Translation } from '../../database/entities/translation.entity';
import { ContentPiece, ReviewState } from '../../database/entities/content-piece.entity';
import { TranslateContentDto } from '../content/dto/translate-content.dto';

export interface TranslationResult {
  translatedContent: {
    title: string;
    description?: string;
    body: string;
    culturalNotes?: string;
    confidenceScore?: number;
    translationStrategy?: string;
    suggestedImprovements?: string;
  };
  qualityScore: number;
  aiDraft: AIDraft;
  metadata: {
    sourceLanguage: string;
    targetLanguage: string;
    model: string;
    translationType: string;
  };
}

@Injectable()
export class AIService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(AIDraft)
    private aiDraftRepository: Repository<AIDraft>,
    @InjectRepository(Translation)
    private translationRepository: Repository<Translation>,
  ) {}

  async translateContent(
    contentPiece: ContentPiece,
    translateDto: TranslateContentDto,
  ): Promise<TranslationResult> {
    // 1. Validate content readiness
    if (contentPiece.reviewState !== ReviewState.APPROVED) {
      throw new BadRequestException('Content must be approved before translation');
    }

    // 2. Build translation prompt
    const prompt = this.buildTranslationPrompt(contentPiece, translateDto);

    // 3. Call AI provider
    let translationResponse;
    const startTime = Date.now();

    try {
      if (translateDto.model === 'claude') {
        translationResponse = await this.callClaudeAPI(prompt, {
          temperature: 0.3, // Lower for translation consistency
          maxTokens: 4000,
        });
      } else {
        translationResponse = await this.callOpenAIAPI(prompt, {
          temperature: 0.3,
          maxTokens: 4000,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(`Translation failed: ${error.message}`);
    }

    // 4. Process and validate response
    const translatedContent = this.parseTranslationResponse(translationResponse);

    // 5. Assess translation quality
    const qualityScore = await this.assessTranslationQuality(
      contentPiece.finalText || contentPiece.description,
      translatedContent.body,
      translatedContent,
    );

    // 6. Create AI Draft record
    const aiDraft = await this.createTranslationDraft({
      contentPieceId: contentPiece.id,
      modelUsed: translateDto.model === 'claude' ? AIModel.CLAUDE : AIModel.OPENAI,
      generationType: GenerationType.TRANSLATION,
      generatedContent: translatedContent,
      prompt,
      qualityScore,
      responseTimeMs: Date.now() - startTime,
      costUsd: this.calculateCost(translationResponse),
    });

    return {
      translatedContent,
      qualityScore,
      aiDraft,
      metadata: {
        sourceLanguage: translateDto.sourceLanguage,
        targetLanguage: translateDto.targetLanguage,
        model: translateDto.model,
        translationType: translateDto.translationType,
      },
    };
  }

  private async callClaudeAPI(prompt: string, options: any): Promise<any> {
    const startTime = Date.now();

    const apiKey =this.configService.get('CLAUDE_API_KEY');
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.content[0].text,
        responseTime: Date.now() - startTime,
        tokenCount: data.usage?.output_tokens || 0,
        model: 'claude-3-sonnet',
      };
    } catch (error) {
      throw new Error(`Claude API call failed: ${error.message}`);
    }
  }

  private async callOpenAIAPI(prompt: string, options: any): Promise<any> {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        responseTime: Date.now() - startTime,
        tokenCount: data.usage?.total_tokens || 0,
        model: 'gpt-4',
      };
    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error.message}`);
    }
  }

  private buildTranslationPrompt(
    contentPiece: ContentPiece,
    dto: TranslateContentDto,
  ): string {
    const contentToTranslate = contentPiece.finalText || contentPiece.description;
    const contentType = contentPiece.contentType;
    const metadata = contentPiece.contentMetadata || {};

    // Detect content characteristics for smarter prompting
    const contentAnalysis = this.analyzeContent(contentToTranslate, contentType, metadata);

    // Build context-aware system prompt
    let systemPrompt = this.buildSystemPrompt(dto, contentAnalysis);

    // Build content-specific instructions
    let contentInstructions = this.buildContentInstructions(dto, contentAnalysis);

    // Build cultural adaptation guidelines
    let culturalGuidelines = this.buildCulturalGuidelines(dto, contentAnalysis);

    // Build quality requirements
    let qualityRequirements = this.buildQualityRequirements(dto, contentAnalysis);

    const fullPrompt = `${systemPrompt}

## CONTENT TO TRANSLATE

**Content Type**: ${contentType}
**Source Language**: ${dto.sourceLanguage}
**Target Language**: ${dto.targetLanguage}
**Translation Type**: ${dto.translationType}

**Title**: ${contentPiece.title || 'N/A'}
**Content**:
${contentToTranslate}

**Additional Context**: ${dto.context || 'No additional context provided'}
**Content Metadata**: ${JSON.stringify(metadata, null, 2)}

## TRANSLATION INSTRUCTIONS

${contentInstructions}

## CULTURAL ADAPTATION GUIDELINES

${culturalGuidelines}

## QUALITY REQUIREMENTS

${qualityRequirements}

## OUTPUT FORMAT

Please return your translation in the following JSON format:
{
  "title": "translated title (preserve meaning and impact)",
  "description": "translated description if applicable",
  "body": "translated main content (maintain structure and flow)",
  "culturalNotes": "explanation of any cultural adaptations made",
  "confidenceScore": "0.0-1.0 confidence score in translation quality",
  "translationStrategy": "brief explanation of translation approach used",
  "suggestedImprovements": "any suggestions for further refinement if needed"
}

Ensure the translation is accurate, culturally appropriate, and maintains the original intent and impact.`;

    return fullPrompt;
  }

  private analyzeContent(content: string, contentType: string, metadata: any): any {
    return {
      length: content.length,
      wordCount: content.split(/\s+/).length,
      hasNumbers: /\d/.test(content),
      hasCurrency: /[$€£¥₹]/.test(content),
      hasPercentages: /%/.test(content),
      hasUrls: /https?:\/\//.test(content),
      hasEmails: /@\w+\.\w+/.test(content),
      hasBulletPoints: /^\s*[-*•]/m.test(content),
      hasHeadings: /^#{1,6}\s/m.test(content),
      tone: this.detectTone(content),
      complexity: this.assessComplexity(content),
      contentType,
      targetAudience: metadata.targetAudience || 'general',
      industry: metadata.industry || 'general',
      seoKeywords: metadata.seoKeywords || [],
    };
  }

  private buildSystemPrompt(dto: TranslateContentDto, analysis: any): string {
    const languagePair = `${dto.sourceLanguage}-${dto.targetLanguage}`;

    let systemPrompt = `You are an expert translator with deep expertise in ${languagePair} translation, specializing in ${analysis.contentType} content for ${analysis.targetAudience} audiences.

Your translation philosophy:
- Preserve the original intent and emotional impact
- Adapt cultural references naturally for the target market
- Maintain the author's voice and style
- Ensure readability and engagement for the target audience
- Consider SEO implications when translating web content`;

    if (analysis.industry !== 'general') {
      systemPrompt += `
- Apply ${analysis.industry} industry knowledge and terminology`;
    }

    return systemPrompt;
  }

  private buildContentInstructions(dto: TranslateContentDto, analysis: any): string {
    let instructions = '';

    switch (dto.translationType) {
      case 'literal':
        instructions = `**LITERAL TRANSLATION APPROACH**
- Maintain exact word order where grammatically possible
- Preserve all technical terms and proper nouns
- Keep original structure and formatting intact
- Translate idioms literally, adding explanatory notes if needed
- Maintain formal register and terminology`;
        break;

      case 'localized':
        instructions = `**LOCALIZED TRANSLATION APPROACH**
- Adapt to natural ${dto.targetLanguage} language patterns
- Use appropriate idioms and expressions for the target language
- Adjust sentence structure for optimal readability
- Maintain professional tone while ensuring naturalness
- Apply local language conventions and grammar rules`;
        break;

      case 'culturally_adapted':
        instructions = `**CULTURALLY ADAPTED TRANSLATION APPROACH**
- Full cultural adaptation for target market
- Replace cultural references with local equivalents
- Adapt examples, scenarios, and case studies
- Adjust humor, metaphors, and cultural touchstones
- Ensure marketing messages resonate with local values`;
        break;
    }

    // Add content-type specific instructions
    if (analysis.contentType === 'blog_post') {
      instructions += `\n\n**BLOG POST SPECIFIC GUIDELINES**
- Maintain engaging, conversational tone
- Preserve SEO keywords naturally in translation
- Keep headings compelling and clickable
- Ensure smooth flow between paragraphs`;
    } else if (analysis.contentType === 'social_media') {
      instructions += `\n\n**SOCIAL MEDIA SPECIFIC GUIDELINES**
- Keep punchy and engaging tone
- Maintain character limits where applicable
- Preserve hashtag strategy and mentions
- Ensure shareability and engagement potential`;
    } else if (analysis.contentType === 'email_marketing') {
      instructions += `\n\n**EMAIL MARKETING SPECIFIC GUIDELINES**
- Preserve compelling subject line impact
- Maintain clear call-to-action prominence
- Keep scannable format with bullet points
- Ensure conversion-focused language`;
    }

    return instructions;
  }

  private buildCulturalGuidelines(dto: TranslateContentDto, analysis: any): string {
    const targetCulture = this.getCulturalContext(dto.targetLanguage);

    let guidelines = `**TARGET MARKET**: ${targetCulture.market}
**CULTURAL CONSIDERATIONS**:
${targetCulture.considerations.map(c => `- ${c}`).join('\n')}`;

    if (analysis.hasCurrency) {
      guidelines += `\n\n**CURRENCY ADAPTATION**:
- Convert currencies to local equivalents
- Use appropriate currency symbols and formats
- Consider local pricing psychology`;
    }

    if (analysis.hasNumbers) {
      guidelines += `\n\n**NUMBER FORMAT ADAPTATION**:
- Use local number formatting conventions
- Adapt date formats to local standards
- Convert measurements if needed`;
    }

    return guidelines;
  }

  private buildQualityRequirements(dto: TranslateContentDto, analysis: any): string {
    return `**QUALITY STANDARDS**:
- Accuracy: Maintain factual correctness and intended meaning
- Fluency: Ensure natural, native-like language flow
- Cultural Appropriateness: Respect local customs and sensitivities
- Consistency: Use consistent terminology throughout
- Engagement: Preserve or enhance reader engagement

**VALIDATION CHECKLIST**:
- Does the translation read naturally to native speakers?
- Are cultural references appropriate for the target market?
- Is the tone and style consistent with the original?
- Are technical terms and brand names handled correctly?
- Would this achieve the same impact as the original?

**CONFIDENCE SCORING CRITERIA**:
- 0.9-1.0: Perfect translation, native-level fluency
- 0.8-0.9: Excellent translation, minor cultural adjustments possible
- 0.7-0.8: Good translation, some refinements recommended
- 0.6-0.7: Acceptable translation, needs review
- Below 0.6: Requires significant improvement`;
  }

  private detectTone(content: string): string {
    const formalIndicators = ['nevertheless', 'furthermore', 'consequently', 'therefore'];
    const casualIndicators = ['awesome', 'cool', 'hey', 'totally'];
    const urgentIndicators = ['urgent', 'immediate', 'asap', 'critical'];

    const lowerContent = content.toLowerCase();

    if (urgentIndicators.some(word => lowerContent.includes(word))) return 'urgent';
    if (casualIndicators.some(word => lowerContent.includes(word))) return 'casual';
    if (formalIndicators.some(word => lowerContent.includes(word))) return 'formal';

    return 'neutral';
  }

  private assessComplexity(content: string): string {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence > 20) return 'high';
    if (avgWordsPerSentence > 15) return 'medium';
    return 'low';
  }

  private getCulturalContext(language: string): any {
    const culturalMap: { [key: string]: any } = {
      'es': {
        market: 'Spanish-speaking markets',
        considerations: [
          'Use formal "usted" vs informal "tú" appropriately',
          'Consider regional variations (Spain vs Latin America)',
          'Adapt to local business customs and hierarchy',
          'Consider religious and family values in messaging'
        ]
      },
      'fr': {
        market: 'French-speaking markets',
        considerations: [
          'Maintain French linguistic purity preferences',
          'Consider formal business communication style',
          'Respect cultural pride and heritage references',
          'Adapt to local regulatory language requirements'
        ]
      },
      'de': {
        market: 'German-speaking markets',
        considerations: [
          'Use appropriate formal/informal address (Sie/Du)',
          'Prefer precision and detail in communication',
          'Consider engineering and quality focus',
          'Respect privacy and data protection sensitivities'
        ]
      },
      'ja': {
        market: 'Japanese market',
        considerations: [
          'Use appropriate levels of politeness (keigo)',
          'Consider indirect communication style',
          'Respect hierarchical business relationships',
          'Adapt to seasonal and cultural timing considerations'
        ]
      },
      'zh': {
        market: 'Chinese markets',
        considerations: [
          'Consider simplified vs traditional characters',
          'Respect cultural symbolism and numerology',
          'Adapt to local business relationship importance',
          'Consider regional differences (mainland vs Hong Kong/Taiwan)'
        ]
      }
    };

    return culturalMap[language] || {
      market: 'General international market',
      considerations: [
        'Research local cultural norms and business practices',
        'Consider religious and cultural sensitivities',
        'Adapt communication style to local preferences',
        'Ensure compliance with local regulations and standards'
      ]
    };
  }

  private parseTranslationResponse(response: any): any {
    try {
      // Extract JSON from the response content
      const content = response.content;

      // Try to find JSON in the response (handle both direct JSON and markdown-wrapped JSON)
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/);
      }

      if (!jsonMatch) {
        throw new Error('No JSON found in translation response');
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const translatedContent = JSON.parse(jsonText);

      // Validate required fields
      if (!translatedContent.title || !translatedContent.body) {
        throw new Error('Invalid translation response format - missing required fields');
      }

      // Ensure all expected fields have default values
      const processedContent = {
        title: translatedContent.title,
        description: translatedContent.description || '',
        body: translatedContent.body,
        culturalNotes: translatedContent.culturalNotes || 'No specific cultural adaptations noted',
        confidenceScore: Math.min(1, Math.max(0, Number(translatedContent.confidenceScore) || 0.7)),
        translationStrategy: translatedContent.translationStrategy || 'Standard translation approach',
        suggestedImprovements: translatedContent.suggestedImprovements || 'No improvements suggested',
      };

      return processedContent;
    } catch (error) {
      throw new Error(`Failed to parse translation response: ${error.message}`);
    }
  }

  private async assessTranslationQuality(
    originalText: string,
    translatedText: string,
    translatedContent?: any,
  ): Promise<number> {
    // Basic quality checks
    const checks = {
      lengthRatio: this.checkLengthRatio(originalText, translatedText),
      structurePreservation: this.checkStructurePreservation(originalText, translatedText),
      completeness: this.checkCompleteness(originalText, translatedText),
      contentCoherence: this.checkContentCoherence(originalText, translatedText),
    };

    // Calculate base score from automated checks
    let baseScore = (
      checks.lengthRatio * 0.25 +
      checks.structurePreservation * 0.3 +
      checks.completeness * 0.25 +
      checks.contentCoherence * 0.2
    );

    // Factor in AI confidence score if available
    if (translatedContent?.confidenceScore) {
      const aiConfidence = Number(translatedContent.confidenceScore);
      // Blend AI confidence with automated checks (70% automated, 30% AI confidence)
      baseScore = (baseScore * 0.7) + (aiConfidence * 0.3);
    }

    // Apply quality bonuses/penalties
    let finalScore = baseScore;

    // Bonus for having translation strategy explanation
    if (translatedContent?.translationStrategy && translatedContent.translationStrategy.length > 10) {
      finalScore += 0.05;
    }

    // Bonus for cultural adaptation notes
    if (translatedContent?.culturalNotes && translatedContent.culturalNotes.length > 20) {
      finalScore += 0.05;
    }

    // Penalty for very short translations (likely incomplete)
    if (translatedText.length < originalText.length * 0.4) {
      finalScore -= 0.1;
    }

    return Math.max(0, Math.min(1, finalScore));
  }

  private checkContentCoherence(original: string, translated: string): number {
    // Simple coherence check based on structure preservation
    const originalSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const translatedSentences = translated.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    const sentenceRatio = Math.min(originalSentences, translatedSentences) / Math.max(originalSentences, translatedSentences);

    // Check for basic coherence indicators
    const hasProperCapitalization = /^[A-Z]/.test(translated);
    const hasProperPunctuation = /[.!?]$/.test(translated.trim());
    const hasNoDoubleSpaces = !translated.includes('  ');

    let coherenceScore = sentenceRatio;
    if (hasProperCapitalization) coherenceScore += 0.1;
    if (hasProperPunctuation) coherenceScore += 0.1;
    if (hasNoDoubleSpaces) coherenceScore += 0.1;

    return Math.min(1, coherenceScore);
  }

  private checkLengthRatio(original: string, translated: string): number {
    const ratio = translated.length / original.length;
    // Expect translation to be 80%-150% of original length
    if (ratio >= 0.8 && ratio <= 1.5) return 1.0;
    if (ratio >= 0.6 && ratio <= 2.0) return 0.7;
    return 0.3;
  }

  private checkStructurePreservation(original: string, translated: string): number {
    // Check if structure elements are preserved
    const originalStructure = {
      paragraphs: original.split('\n\n').length,
      sentences: original.split(/[.!?]+/).length,
      lists: (original.match(/^\s*[-*+]/gm) || []).length,
    };

    const translatedStructure = {
      paragraphs: translated.split('\n\n').length,
      sentences: translated.split(/[.!?]+/).length,
      lists: (translated.match(/^\s*[-*+]/gm) || []).length,
    };

    let score = 1.0;
    if (Math.abs(originalStructure.paragraphs - translatedStructure.paragraphs) > 1) score -= 0.3;
    if (Math.abs(originalStructure.lists - translatedStructure.lists) > 0) score -= 0.2;

    return Math.max(0, score);
  }

  private checkCompleteness(original: string, translated: string): number {
    // Simple completeness check based on content presence
    if (!translated || translated.trim().length === 0) return 0;
    if (translated.length < original.length * 0.5) return 0.5;
    return 1.0;
  }

  private async createTranslationDraft(draftData: any): Promise<AIDraft> {
    const aiDraft = this.aiDraftRepository.create({
      contentPieceId: draftData.contentPieceId,
      modelUsed: draftData.modelUsed,
      generationType: draftData.generationType,
      generatedContent: draftData.generatedContent,
      prompt: draftData.prompt,
      qualityScore: draftData.qualityScore,
      responseTimeMs: draftData.responseTimeMs,
      costUsd: draftData.costUsd,
      tokenCount: draftData.tokenCount || 0,
    });

    return await this.aiDraftRepository.save(aiDraft);
  }

  private calculateCost(response: any): number {
    // Basic cost calculation - adjust based on actual pricing
    const tokenCount = response.tokenCount || 0;

    if (response.model?.includes('claude')) {
      // Claude pricing (approximate)
      return (tokenCount / 1000) * 0.008; // $0.008 per 1K tokens
    } else {
      // OpenAI GPT-4 pricing (approximate)
      return (tokenCount / 1000) * 0.03; // $0.03 per 1K tokens
    }
  }

  async translateContentWithRetry(
    contentPiece: ContentPiece,
    translateDto: TranslateContentDto,
    maxRetries: number = 3,
  ): Promise<TranslationResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.translateContent(contentPiece, translateDto);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          console.log(`Translation attempt ${attempt} failed, retrying in ${delay}ms...`);
        }
      }
    }

    throw new InternalServerErrorException(
      `Translation failed after ${maxRetries} attempts: ${lastError.message}`
    );
  }
}