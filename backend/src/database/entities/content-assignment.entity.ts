import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ContentPiece } from './content-piece.entity';
import { User } from './user.entity';

export enum AssignmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AssignmentTaskType {
  EDIT = 'edit',
  REVIEW = 'review',
  TRANSLATE = 'translate',
  APPROVE = 'approve',
}

@Entity('content_assignments')
@Index(['contentPieceId', 'status'])
@Index(['assignedToUserId', 'status'])
export class ContentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_piece_id' })
  contentPieceId: string;

  @ManyToOne(() => ContentPiece, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_piece_id' })
  contentPiece: ContentPiece;

  @Column({ name: 'assigned_to_user_id' })
  assignedToUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedTo: User;

  @Column({ name: 'assigned_by_user_id' })
  assignedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_by_user_id' })
  assignedBy: User;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({
    name: 'task_type',
    type: 'enum',
    enum: AssignmentTaskType,
  })
  taskType: AssignmentTaskType;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
