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

  @Column({ name: 'generated_title', type: 'text', nullable: true })
  generatedTitle: string;

  @Column({ name: 'generated_desc', type: 'text', nullable: true })
  generatedDesc: string;

  @Column({ name: 'generated_content', type: 'jsonb', nullable: true })
  generatedContent: Record<string, any>;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'float', nullable: true })
  temperature: number;

  @Column({ name: 'max_tokens', nullable: true })
  maxTokens: number;

  @Column({ name: 'response_time', nullable: true })
  responseTime: number;

  @Column({ name: 'token_count', nullable: true })
  tokenCount: number;

  @Column({ type: 'float', nullable: true })
  cost: number;

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