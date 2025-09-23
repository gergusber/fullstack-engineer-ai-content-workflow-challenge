import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskType {
  GENERATE_CONTENT = 'generate_content',
  TRANSLATE_CONTENT = 'translate_content',
  ANALYZE_CONTENT = 'analyze_content',
  SEND_NOTIFICATION = 'send_notification',
  EXPORT_CONTENT = 'export_content',
  BATCH_PROCESS = 'batch_process',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('task_queue')
@Index(['status', 'createdAt'])
@Index(['taskType', 'status'])
export class TaskQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'task_type',
    type: 'enum',
    enum: TaskType,
  })
  taskType: TaskType;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', default: 3 })
  maxAttempts: number;

  @Column({ name: 'next_retry_at', nullable: true })
  nextRetryAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}