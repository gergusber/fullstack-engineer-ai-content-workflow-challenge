import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContentPiece, ReviewState } from './content-piece.entity';

export enum ReviewType {
  CONTENT_REVIEW = 'content_review',
  TRANSLATION_REVIEW = 'translation_review',
  QUALITY_CHECK = 'quality_check',
  FINAL_APPROVAL = 'final_approval',
}

export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  EDIT = 'edit',
}

@Entity('reviews')
@Index(['contentPieceId', 'createdAt'])
@Index(['reviewType', 'action'])
@Index(['reviewerId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  

  @Column({ name: 'content_piece_id' })
  contentPieceId: string;

  @Column({
    name: 'review_type',
    type: 'enum',
    enum: ReviewType,
    enumName: 'review_type_enum',
  })
  reviewType: ReviewType;

  @Column({
    type: 'enum',
    enum: ReviewAction,
    enumName: 'review_action_enum',
  })
  action: ReviewAction;

  @Column({
    name: 'previous_state',
    type: 'enum',
    enum: ReviewState,
    enumName: 'review_state_enum',
    nullable: true,
  })
  previousState: ReviewState;

  @Column({
    name: 'new_state',
    type: 'enum',
    enum: ReviewState,
    enumName: 'review_state_enum',
  })
  newState: ReviewState;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'text', nullable: true })
  suggestions: string;

  @Column({ name: 'edited_content', type: 'jsonb', nullable: true })
  editedContent: Record<string, any>;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @Column({ name: 'reviewer_name', nullable: true })
  reviewerName: string;

  @Column({ name: 'reviewer_role', nullable: true })
  reviewerRole: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ContentPiece, (contentPiece) => contentPiece.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_piece_id' })
  contentPiece: ContentPiece;

}