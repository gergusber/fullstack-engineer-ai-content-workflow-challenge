import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContentPiece } from './content-piece.entity';
import { AIModel } from './ai-draft.entity';

@Entity('translations')
@Index(['contentPieceId', 'targetLanguage'])
@Index(['sourceLanguage', 'targetLanguage'])
export class Translation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_piece_id' })
  contentPieceId: string;

  @Column({ name: 'source_language' })
  sourceLanguage: string;

  @Column({ name: 'target_language' })
  targetLanguage: string;

  @Column({ name: 'translated_title', type: 'text', nullable: true })
  translatedTitle: string;

  @Column({ name: 'translated_desc', type: 'text', nullable: true })
  translatedDesc: string;

  @Column({ name: 'translated_content', type: 'jsonb', nullable: true })
  translatedContent: Record<string, any>;

  @Column({
    name: 'model_used',
    type: 'enum',
    enum: AIModel,
  })
  modelUsed: AIModel;

  @Column({ name: 'translation_context', type: 'text', nullable: true })
  translationContext: string;

  @Column({ name: 'quality_score', type: 'float', nullable: true })
  qualityScore: number;

  @Column({ name: 'is_human_reviewed', default: false })
  isHumanReviewed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ContentPiece, (contentPiece) => contentPiece.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_piece_id' })
  contentPiece: ContentPiece;
}