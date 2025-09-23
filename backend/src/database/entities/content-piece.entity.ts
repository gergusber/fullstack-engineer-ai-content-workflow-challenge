import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { AIDraft } from './ai-draft.entity';
import { Review } from './review.entity';
import { Translation } from './translation.entity';
import { ContentVersion } from './content-version.entity';
import { ContentAnalytics } from './content-analytics.entity';

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

@Entity('content_pieces')
@Index(['campaignId', 'reviewState'])
@Index(['contentType', 'targetLanguage'])
@Index(['reviewState', 'priority'])
@Index(['translationOf'])
@Index(['sourceLanguage', 'targetLanguage'])
export class ContentPiece {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id' })
  campaignId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'content_type',
    type: 'enum',
    enum: ContentType,
    enumName: 'content_type_enum',
  })
  contentType: ContentType;

  @Column({ name: 'target_language', default: 'en' })
  targetLanguage: string;

  @Column({ name: 'source_language', default: 'en' })
  sourceLanguage: string;

  @Column({
    name: 'review_state',
    type: 'enum',
    enum: ReviewState,
    enumName: 'review_state_enum',
    default: ReviewState.DRAFT,
  })
  reviewState: ReviewState;

  @Column({
    type: 'enum',
    enum: Priority,
    enumName: 'priority_enum',
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ name: 'original_prompt', type: 'text', nullable: true })
  originalPrompt: string;

  @Column({ name: 'content_metadata', type: 'jsonb', nullable: true })
  contentMetadata: Record<string, any>;

  @Column({ name: 'translation_of', nullable: true })
  translationOf: string;

  @Column({ name: 'final_text', type: 'text', nullable: true })
  finalText: string;

  @Column({ name: 'version_history', type: 'jsonb', nullable: true })
  versionHistory: Array<{
    version: number;
    text: string;
    editedBy: string;
    editedAt: Date;
    changeReason?: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;

  // Relations
  @ManyToOne(() => Campaign, (campaign) => campaign.contentPieces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @OneToMany(() => AIDraft, (aiDraft) => aiDraft.contentPiece, {
    cascade: true,
  })
  aiDrafts: AIDraft[];

  @OneToMany(() => Review, (review) => review.contentPiece, {
    cascade: true,
  })
  reviews: Review[];

  @OneToMany(() => Translation, (translation) => translation.contentPiece, {
    cascade: true,
  })
  translations: Translation[];

  @OneToMany(() => ContentVersion, (version) => version.contentPiece, {
    cascade: true,
  })
  contentVersions: ContentVersion[];

  @OneToMany(() => ContentAnalytics, (analytics) => analytics.contentPiece, {
    cascade: true,
  })
  analytics: ContentAnalytics[];
}