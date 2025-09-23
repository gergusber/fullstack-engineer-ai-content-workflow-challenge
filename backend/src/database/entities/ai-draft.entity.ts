import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContentPiece } from './content-piece.entity';

export enum AIModel {
  OPENAI_GPT4 = 'openai_gpt4',
  OPENAI_GPT35 = 'openai_gpt35',
  CLAUDE_3_SONNET = 'claude_3_sonnet',
  CLAUDE_3_HAIKU = 'claude_3_haiku',
  CLAUDE_3_OPUS = 'claude_3_opus',
  CLAUDE = 'claude',
  OPENAI = 'openai',
}

export enum GenerationType {
  ORIGINAL = 'original',
  VARIATION = 'variation',
  IMPROVEMENT = 'improvement',
  TRANSLATION = 'translation',
  SUMMARY = 'summary',
}

export enum DraftStatus {
  CANDIDATE = 'candidate',
  SELECTED = 'selected',
  DISCARDED = 'discarded',
}

@Entity('ai_drafts')
@Index(['contentPieceId', 'createdAt'])
@Index(['modelUsed', 'generationType'])
@Index(['qualityScore'])
export class AIDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_piece_id' })
  contentPieceId: string;

  @Column({
    name: 'model_used',
    type: 'enum',
    enum: AIModel,
    enumName: 'ai_model_enum',
  })
  modelUsed: AIModel;

  @Column({ name: 'model_version', nullable: true })
  modelVersion: string;

  @Column({
    name: 'generation_type',
    type: 'enum',
    enum: GenerationType,
    enumName: 'generation_type_enum',
  })
  generationType: GenerationType;

  @Column({ name: 'generated_content', type: 'jsonb', nullable: true })
  generatedContent: {
    title?: string;
    description?: string;
    body?: string;
    [key: string]: any;
  };

  @Column({
    type: 'enum',
    enum: DraftStatus,
    enumName: 'draft_status_enum',
    default: DraftStatus.CANDIDATE,
  })
  status: DraftStatus;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'float', nullable: true })
  temperature: number;

  @Column({ name: 'max_tokens', nullable: true })
  maxTokens: number;

  @Column({ name: 'response_time_ms', nullable: true })
  responseTimeMs: number;

  @Column({ name: 'token_count', nullable: true })
  tokenCount: number;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 10, scale: 6, nullable: true })
  costUsd: number;

  @Column({ name: 'quality_score', type: 'float', nullable: true })
  qualityScore: number;

  @Column({ name: 'user_rating', nullable: true })
  userRating: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ContentPiece, (contentPiece) => contentPiece.aiDrafts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_piece_id' })
  contentPiece: ContentPiece;
}