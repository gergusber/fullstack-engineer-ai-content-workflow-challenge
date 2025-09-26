import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from '../../database/entities/campaign.entity';
import { ContentPiece, ReviewState } from '../../database/entities/content-piece.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(ContentPiece)
    private contentPiecesRepository: Repository<ContentPiece>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignsRepository.create(createCampaignDto);
    return await this.campaignsRepository.save(campaign);
  }

  async findAll(): Promise<Campaign[]> {
    return await this.campaignsRepository.find({
      relations: {
        contentPieces: {
          aiDrafts: true,
          reviews: true,
        },
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: {
        contentPieces: {
          aiDrafts: true,
          reviews: true,
          translations: true,
          contentVersions: {
            // Only current versions
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findOne(id);
    Object.assign(campaign, updateCampaignDto);
    return await this.campaignsRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const result = await this.campaignsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
  }

  async getCampaignStats(id: string): Promise<any> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: {
        contentPieces: {
          aiDrafts: true,
          reviews: true,
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Calculate statistics
    const stats = {
      totalContentPieces: campaign.contentPieces.length,
      contentByState: this.groupByReviewState(campaign.contentPieces),
      totalAIDrafts: campaign.contentPieces.reduce(
        (sum, piece) => sum + piece.aiDrafts.length,
        0,
      ),
      totalReviews: campaign.contentPieces.reduce(
        (sum, piece) => sum + piece.reviews.length,
        0,
      ),
      avgResponseTime: this.calculateAvgResponseTime(campaign.contentPieces),
      completionRate: this.calculateCompletionRate(campaign.contentPieces),
    };

    return stats;
  }

  async findByStatus(status: CampaignStatus): Promise<Campaign[]> {
    return await this.campaignsRepository.find({
      where: { status },
      relations: {
        contentPieces: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async searchCampaigns(searchTerm: string): Promise<Campaign[]> {
    return await this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.contentPieces', 'contentPieces')
      .where('campaign.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('campaign.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere(':searchTerm = ANY(campaign.target_markets)', { searchTerm })
      .orWhere(':searchTerm = ANY(campaign.tags)', { searchTerm })
      .orderBy('campaign.updatedAt', 'DESC')
      .getMany();
  }

  async findByMarkets(markets: string[]): Promise<Campaign[]> {
    return await this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.contentPieces', 'contentPieces')
      .where('campaign.target_markets && :markets', { markets })
      .orderBy('campaign.updatedAt', 'DESC')
      .getMany();
  }

  async findByTags(tags: string[]): Promise<Campaign[]> {
    return await this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.contentPieces', 'contentPieces')
      .where('campaign.tags && :tags', { tags })
      .orderBy('campaign.updatedAt', 'DESC')
      .getMany();
  }

  async findWithFilters(status?: CampaignStatus, search?: string): Promise<Campaign[]> {
    const queryBuilder = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.contentPieces', 'contentPieces')
      .leftJoinAndSelect('contentPieces.aiDrafts', 'aiDrafts')
      .leftJoinAndSelect('contentPieces.reviews', 'reviews');

    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('campaign.status = :status', { status });
    }

    // Apply search filter if provided
    if (search) {
      queryBuilder.andWhere(
        '(campaign.name ILIKE :searchTerm OR campaign.description ILIKE :searchTerm OR :searchTerm = ANY(campaign.target_markets) OR :searchTerm = ANY(campaign.tags))',
        { searchTerm: `%${search}%` }
      );
    }

    return await queryBuilder
      .orderBy('campaign.updatedAt', 'DESC')
      .getMany();
  }

  private groupByReviewState(contentPieces: ContentPiece[]): Record<string, number> {
    return contentPieces.reduce((acc, piece) => {
      const state = piece.reviewState;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAvgResponseTime(contentPieces: ContentPiece[]): number {
    const allDrafts = contentPieces.flatMap(piece => piece.aiDrafts);
    if (allDrafts.length === 0) return 0;

    const totalResponseTime = allDrafts.reduce(
      (sum, draft) => sum + (draft.responseTimeMs || 0),
      0,
    );
    return totalResponseTime / allDrafts.length;
  }

  private calculateCompletionRate(contentPieces: ContentPiece[]): number {
    if (contentPieces.length === 0) return 0;

    const completedPieces = contentPieces.filter(
      piece => piece.reviewState === ReviewState.APPROVED
    );
    
    return (completedPieces.length / contentPieces.length) * 100;
  }
}
