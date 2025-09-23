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

@Entity('content_versions')
@Index(['contentPieceId', 'versionNumber'])
@Index(['isCurrentVersion'])
export class ContentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_piece_id' })
  contentPieceId: string;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;

  @Column({ name: 'is_current_version', default: false })
  isCurrentVersion: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ContentPiece, (contentPiece) => contentPiece.contentVersions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_piece_id' })
  contentPiece: ContentPiece;
}