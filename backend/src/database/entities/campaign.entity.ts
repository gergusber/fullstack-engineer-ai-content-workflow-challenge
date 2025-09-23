import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ContentPiece } from './content-piece.entity';
import { Review } from './review.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('campaigns')
@Index(['status', 'createdAt'])
@Index(['createdBy'])
@Index(['targetMarkets'])
@Index(['tags'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    enumName: 'campaign_status_enum',
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ name: 'target_markets', type: 'text', array: true, nullable: true })
  targetMarkets: string[];

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => ContentPiece, (contentPiece) => contentPiece.campaign, {
    cascade: true,
  })
  contentPieces: ContentPiece[];

  @OneToMany(() => Review, (review) => review.campaign)
  reviews: Review[];
}