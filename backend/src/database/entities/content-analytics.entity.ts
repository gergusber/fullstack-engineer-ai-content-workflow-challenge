import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ContentPiece } from './content-piece.entity';

@Entity('content_analytics')
export class ContentAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_piece_id', unique: true })
  contentPieceId: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'engagement_rate', type: 'float', nullable: true })
  engagementRate: number;

  @Column({ name: 'conversion_rate', type: 'float', nullable: true })
  conversionRate: number;

  @Column({ name: 'click_through_rate', type: 'float', nullable: true })
  clickThroughRate: number;

  @Column({ name: 'sentiment_score', type: 'float', nullable: true })
  sentimentScore: number;

  @Column({ name: 'readability_score', type: 'float', nullable: true })
  readabilityScore: number;

  @Column({ name: 'keyword_density', type: 'jsonb', nullable: true })
  keywordDensity: Record<string, any>;

  @Column({ name: 'variant_group', nullable: true })
  variantGroup: string;

  @Column({ name: 'performance_score', type: 'float', nullable: true })
  performanceScore: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  // Relations
  @OneToOne(() => ContentPiece, (contentPiece) => contentPiece.analytics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_piece_id' })
  contentPiece: ContentPiece;
}