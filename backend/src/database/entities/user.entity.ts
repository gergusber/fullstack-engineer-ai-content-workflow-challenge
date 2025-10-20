import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { ContentPiece } from './content-piece.entity';

export enum UserRole {
  ADMIN = 'admin',
  CONTENT_MANAGER = 'content_manager',
  COPYWRITER = 'copywriter',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer',
}

@Entity('users')
@Index(['organizationId'])
@Index(['email'])
export class User {
  @PrimaryColumn({ name: 'clerk_id' })
  clerkId: string; // Clerk user ID

  @Column({ unique: true })
  email: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string; // Clerk organization ID

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.COPYWRITER,
  })
  role: UserRole;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    avatar?: string;
    phone?: string;
    department?: string;
    timezone?: string;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Relations
  @OneToMany(() => Campaign, (campaign) => campaign.createdByUser)
  campaigns: Campaign[];

  @OneToMany(() => ContentPiece, (content) => content.createdByUser)
  contentPieces: ContentPiece[];
}
