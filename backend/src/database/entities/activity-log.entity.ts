import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ASSIGNED = 'assigned',
  SUBMITTED = 'submitted',
  TRANSLATED = 'translated',
  REVIEWED = 'reviewed',
}

export enum ActivityEntityType {
  CAMPAIGN = 'campaign',
  CONTENT = 'content',
  TRANSLATION = 'translation',
  REVIEW = 'review',
  ASSIGNMENT = 'assignment',
}

@Entity('activity_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['organizationId', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action: ActivityAction;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: ActivityEntityType,
  })
  entityType: ActivityEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_name', nullable: true })
  entityName: string; // e.g., campaign name, content title

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
