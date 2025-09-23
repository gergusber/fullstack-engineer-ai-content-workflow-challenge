import { AppDataSource } from "../data-source";
import { Campaign, CampaignStatus } from "../entities/campaign.entity";
import {
  ContentPiece,
  ContentType,
  ReviewState,
  Priority,
} from "../entities/content-piece.entity";
import { AIDraft, AIModel, GenerationType, DraftStatus } from "../entities/ai-draft.entity";
import { Review, ReviewType, ReviewAction } from "../entities/review.entity";

export class DatabaseSeeder {
  async run(): Promise<void> {
    // Initialize data source
    await AppDataSource.initialize();

    console.log("🌱 Starting database seeding...");

    try {
      // Create sample campaigns
      const campaign1 = await this.createSampleCampaign();
      const campaign2 = await this.createSampleCampaign2();

      // Create sample content pieces
      await this.createSampleContent(campaign1.id);
      await this.createSampleContent2(campaign2.id);

      console.log("✅ Database seeding completed successfully!");
    } catch (error) {
      console.error("❌ Error seeding database:", error);
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  }

  private async createSampleCampaign(): Promise<Campaign> {
    const campaignRepo = AppDataSource.getRepository(Campaign);

    const campaign = campaignRepo.create({
      name: "Q4 2024 Holiday Campaign",
      description:
        "Holiday season marketing materials for Black Friday and Christmas",
      status: CampaignStatus.ACTIVE,
      targetMarkets: ["US", "CA", "GB"],
      tags: ["holiday", "e-commerce", "seasonal", "black-friday"],
      createdBy: "seed-admin",
    });

    return await campaignRepo.save(campaign);
  }

  private async createSampleCampaign2(): Promise<Campaign> {
    const campaignRepo = AppDataSource.getRepository(Campaign);

    const campaign = campaignRepo.create({
      name: "Product Launch - AI Assistant",
      description: "Marketing materials for new AI assistant product launch",
      status: CampaignStatus.DRAFT,
      targetMarkets: ["US", "ES", "DE", "FR"],
      tags: ["product-launch", "ai", "technology", "b2b"],
      createdBy: "seed-admin",
    });

    return await campaignRepo.save(campaign);
  }

  private async createSampleContent(campaignId: string): Promise<void> {
    const contentRepo = AppDataSource.getRepository(ContentPiece);
    const aiDraftRepo = AppDataSource.getRepository(AIDraft);
    const reviewRepo = AppDataSource.getRepository(Review);

    // Create content piece 1
    const content1 = contentRepo.create({
      campaignId,
      title: "Black Friday Super Sale - Up to 70% Off!",
      description: "Limited time offer on all electronics and gadgets",
      contentType: ContentType.HEADLINE,
      reviewState: ReviewState.AI_SUGGESTED,
      priority: Priority.HIGH,
      targetLanguage: "en",
      originalPrompt:
        "Create a compelling Black Friday headline that emphasizes urgency and savings",
      contentMetadata: {
        keywords: ["black friday", "sale", "discount", "electronics"],
        sentiment: "positive",
        tone: "urgent",
      },
    });

    const savedContent1 = await contentRepo.save(content1);

    // Create AI draft for content 1
    const aiDraft1 = aiDraftRepo.create({
      contentPieceId: savedContent1.id,
      modelUsed: AIModel.CLAUDE_3_SONNET,
      modelVersion: "claude-3-5-sonnet-20241022",
      generationType: GenerationType.ORIGINAL,
      generatedContent: {
        title: "Black Friday Mega Sale - Save Up To 70% on Electronics!",
        description: "Don't miss out on the biggest sale of the year! Get incredible discounts on laptops, smartphones, headphones, and more. Limited time offer - shop now before it's too late!"
      },
      status: DraftStatus.SELECTED,
      prompt:
        "Create a compelling Black Friday headline that emphasizes urgency and savings",
      temperature: 0.7,
      maxTokens: 100,
      responseTimeMs: 1250,
      tokenCount: 45,
      costUsd: 0.025,
      qualityScore: 0.89,
      userRating: 4,
    });

    await aiDraftRepo.save(aiDraft1);

    // Create content piece 2
    const content2 = contentRepo.create({
      campaignId,
      title: "Holiday Gift Guide Email Subject",
      description: "Subject line for holiday gift guide email campaign",
      contentType: ContentType.EMAIL_SUBJECT,
      reviewState: ReviewState.REVIEWED,
      finalText: "🎁 Perfect Holiday Gifts for Everyone on Your List",
      versionHistory: [
        {
          version: 1,
          text: "Holiday Gift Guide - Find Perfect Gifts",
          editedBy: "ai-system",
          editedAt: new Date('2024-11-20'),
          changeReason: "Initial AI generation"
        },
        {
          version: 2,
          text: "🎁 Perfect Holiday Gifts for Everyone on Your List",
          editedBy: "sarah.johnson",
          editedAt: new Date('2024-11-21'),
          changeReason: "Added emoji and improved wording for better engagement"
        }
      ],
      priority: Priority.MEDIUM,
      targetLanguage: "en",
      originalPrompt:
        "Create an engaging email subject line for holiday gift guide",
    });

    const savedContent2 = await contentRepo.save(content2);

    // Create AI draft for content 2
    const aiDraft2 = aiDraftRepo.create({
      contentPieceId: savedContent2.id,
      modelUsed: AIModel.OPENAI_GPT4,
      modelVersion: "gpt-4",
      generationType: GenerationType.ORIGINAL,
      generatedContent: {
        title: "🎁 Perfect Holiday Gifts for Everyone on Your List",
        description: "Discover thoughtfully curated gift ideas for every personality and budget in our comprehensive holiday guide."
      },
      status: DraftStatus.SELECTED,
      prompt: "Create an engaging email subject line for holiday gift guide",
      temperature: 0.6,
      maxTokens: 50,
      responseTimeMs: 980,
      tokenCount: 28,
      costUsd: 0.018,
      qualityScore: 0.92,
      userRating: 5,
    });

    await aiDraftRepo.save(aiDraft2);

    // Create review for content 2
    const review1 = reviewRepo.create({
      contentPieceId: savedContent2.id,
      reviewType: ReviewType.CONTENT_REVIEW,
      action: ReviewAction.APPROVE,
      previousState: ReviewState.AI_SUGGESTED,
      newState: ReviewState.REVIEWED,
      comments:
        "Great subject line! The emoji adds visual appeal and the copy is engaging.",
      reviewerId: "reviewer-1",
      reviewerName: "Sarah Johnson",
      reviewerRole: "Marketing Manager",
    });

    await reviewRepo.save(review1);

    // Create Spanish translation of content 2
    const content2Spanish = contentRepo.create({
      campaignId,
      title: "Guía de Regalos Navideños - Email Subject",
      description: "Línea de asunto en español para el email de la guía de regalos navideños",
      contentType: ContentType.EMAIL_SUBJECT,
      reviewState: ReviewState.APPROVED,
      priority: Priority.MEDIUM,
      targetLanguage: "es",
      sourceLanguage: "en",
      translationOf: savedContent2.id,
      finalText: "🎁 Regalos Navideños Perfectos para Todos en Tu Lista",
      originalPrompt: "Traduce al español: Create an engaging email subject line for holiday gift guide",
      contentMetadata: {
        translationQuality: "professional",
        localizedFor: "ES",
        culturalAdaptations: ["emoji usage", "tone adaptation"]
      },
      versionHistory: [
        {
          version: 1,
          text: "Guía de Regalos Navideños - Encuentra Regalos Perfectos",
          editedBy: "translation-ai",
          editedAt: new Date('2024-11-22'),
          changeReason: "Initial AI translation"
        },
        {
          version: 2,
          text: "🎁 Regalos Navideños Perfectos para Todos en Tu Lista",
          editedBy: "maria.garcia",
          editedAt: new Date('2024-11-22'),
          changeReason: "Added emoji and improved Spanish phrasing for Latin American market"
        }
      ]
    });

    await contentRepo.save(content2Spanish);
  }

  private async createSampleContent2(campaignId: string): Promise<void> {
    const contentRepo = AppDataSource.getRepository(ContentPiece);
    const aiDraftRepo = AppDataSource.getRepository(AIDraft);

    const content = contentRepo.create({
      campaignId,
      title: "AI Assistant Product Description",
      description: "Compelling product description for our new AI assistant",
      contentType: ContentType.PRODUCT_DESC,
      reviewState: ReviewState.DRAFT,
      priority: Priority.HIGH,
      targetLanguage: "en",
      originalPrompt:
        "Write a compelling product description for an AI assistant that helps with daily tasks",
      contentMetadata: {
        keywords: ["AI", "assistant", "productivity", "automation"],
        targetAudience: "professionals",
        tone: "professional",
      },
    });

    const savedContent = await contentRepo.save(content);

    // Create multiple AI draft variations
    const drafts = [
      {
        model: AIModel.CLAUDE_3_SONNET,
        title: "Meet Your New AI Assistant - Productivity Redefined",
        desc: "Transform your daily workflow with our intelligent AI assistant. Automate routine tasks, get instant answers, and boost your productivity by up to 40%. From scheduling meetings to analyzing data, your AI assistant handles it all.",
        quality: 0.91,
        responseTime: 1420,
      },
      {
        model: AIModel.OPENAI_GPT4,
        title: "Your Personal AI Assistant - Smarter Work, Better Results",
        desc: "Experience the future of productivity with our advanced AI assistant. Streamline your workday, make data-driven decisions, and focus on what matters most while AI handles the rest.",
        quality: 0.87,
        responseTime: 1650,
      },
    ];

    for (const [index, draft] of drafts.entries()) {
      const aiDraft = aiDraftRepo.create({
        contentPieceId: savedContent.id,
        modelUsed: draft.model,
        generationType: GenerationType.ORIGINAL,
        generatedContent: {
          title: draft.title,
          description: draft.desc
        },
        status: index === 0 ? DraftStatus.SELECTED : DraftStatus.CANDIDATE,
        prompt:
          "Write a compelling product description for an AI assistant that helps with daily tasks",
        temperature: 0.7,
        maxTokens: 200,
        responseTimeMs: draft.responseTime,
        tokenCount: Math.floor(draft.desc.length / 4),
        costUsd: draft.responseTime > 1500 ? 0.045 : 0.032,
        qualityScore: draft.quality,
      });

      await aiDraftRepo.save(aiDraft);
    }
  }
}

// Run the seeder
async function runSeed() {
  const seeder = new DatabaseSeeder();
  await seeder.run();
}

if (require.main === module) {
  runSeed().catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}
