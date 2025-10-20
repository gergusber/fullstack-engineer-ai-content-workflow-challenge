import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContentAssignment,
  AssignmentStatus,
  AssignmentTaskType,
} from '../../database/entities/content-assignment.entity';
import { ContentPiece } from '../../database/entities/content-piece.entity';
import { User } from '../../database/entities/user.entity';

export interface CreateAssignmentDto {
  contentPieceId: string;
  assignedToUserId: string;
  taskType: AssignmentTaskType;
  notes?: string;
  dueDate?: Date;
}

export interface UpdateAssignmentDto {
  status?: AssignmentStatus;
  notes?: string;
  dueDate?: Date;
}

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(ContentAssignment)
    private readonly assignmentRepository: Repository<ContentAssignment>,
    @InjectRepository(ContentPiece)
    private readonly contentRepository: Repository<ContentPiece>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new assignment
   */
  async create(
    assignedByUserId: string,
    createDto: CreateAssignmentDto,
  ): Promise<ContentAssignment> {
    // Verify content piece exists
    const content = await this.contentRepository.findOne({
      where: { id: createDto.contentPieceId },
    });

    if (!content) {
      throw new NotFoundException(
        `Content piece with ID ${createDto.contentPieceId} not found`,
      );
    }

    // Verify assigned user exists
    const assignedUser = await this.userRepository.findOne({
      where: { clerkId: createDto.assignedToUserId },
    });

    if (!assignedUser) {
      throw new NotFoundException(
        `User with ID ${createDto.assignedToUserId} not found`,
      );
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      contentPieceId: createDto.contentPieceId,
      assignedToUserId: createDto.assignedToUserId,
      assignedByUserId: assignedByUserId,
      taskType: createDto.taskType,
      notes: createDto.notes,
      dueDate: createDto.dueDate,
      status: AssignmentStatus.PENDING,
    });

    return await this.assignmentRepository.save(assignment);
  }

  /**
   * Get assignment by ID
   */
  async findOne(id: string): Promise<ContentAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['contentPiece', 'assignedTo', 'assignedBy'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    return assignment;
  }

  /**
   * Get all assignments for a user
   */
  async findByUser(userId: string): Promise<ContentAssignment[]> {
    return await this.assignmentRepository.find({
      where: { assignedToUserId: userId },
      relations: ['contentPiece', 'assignedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get assignments by status for a user
   */
  async findByUserAndStatus(
    userId: string,
    status: AssignmentStatus,
  ): Promise<ContentAssignment[]> {
    return await this.assignmentRepository.find({
      where: {
        assignedToUserId: userId,
        status,
      },
      relations: ['contentPiece', 'assignedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all assignments for a content piece
   */
  async findByContentPiece(contentPieceId: string): Promise<ContentAssignment[]> {
    return await this.assignmentRepository.find({
      where: { contentPieceId },
      relations: ['assignedTo', 'assignedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get assignments created by a user
   */
  async findByAssigner(assignedByUserId: string): Promise<ContentAssignment[]> {
    return await this.assignmentRepository.find({
      where: { assignedByUserId },
      relations: ['contentPiece', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update assignment
   */
  async update(
    id: string,
    updateDto: UpdateAssignmentDto,
  ): Promise<ContentAssignment> {
    const assignment = await this.findOne(id);

    // If status is being changed to completed, set completed timestamp
    if (
      updateDto.status === AssignmentStatus.COMPLETED &&
      assignment.status !== AssignmentStatus.COMPLETED
    ) {
      assignment.completedAt = new Date();
    }

    Object.assign(assignment, updateDto);

    return await this.assignmentRepository.save(assignment);
  }

  /**
   * Update assignment status
   */
  async updateStatus(
    id: string,
    status: AssignmentStatus,
  ): Promise<ContentAssignment> {
    return await this.update(id, { status });
  }

  /**
   * Start assignment (change status to in_progress)
   */
  async start(id: string): Promise<ContentAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new BadRequestException(
        'Only pending assignments can be started',
      );
    }

    return await this.updateStatus(id, AssignmentStatus.IN_PROGRESS);
  }

  /**
   * Complete assignment
   */
  async complete(id: string): Promise<ContentAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.status === AssignmentStatus.COMPLETED) {
      throw new BadRequestException('Assignment is already completed');
    }

    if (assignment.status === AssignmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled assignment');
    }

    return await this.updateStatus(id, AssignmentStatus.COMPLETED);
  }

  /**
   * Cancel assignment
   */
  async cancel(id: string): Promise<ContentAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.status === AssignmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed assignment');
    }

    return await this.updateStatus(id, AssignmentStatus.CANCELLED);
  }

  /**
   * Delete assignment
   */
  async delete(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
  }

  /**
   * Get overdue assignments
   */
  async findOverdue(): Promise<ContentAssignment[]> {
    const now = new Date();

    return await this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.dueDate < :now', { now })
      .andWhere('assignment.status IN (:...statuses)', {
        statuses: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
      })
      .leftJoinAndSelect('assignment.contentPiece', 'contentPiece')
      .leftJoinAndSelect('assignment.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignment.assignedBy', 'assignedBy')
      .orderBy('assignment.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Get assignment statistics for a user
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }> {
    const assignments = await this.findByUser(userId);
    const now = new Date();

    return {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === AssignmentStatus.PENDING)
        .length,
      inProgress: assignments.filter(
        (a) => a.status === AssignmentStatus.IN_PROGRESS,
      ).length,
      completed: assignments.filter(
        (a) => a.status === AssignmentStatus.COMPLETED,
      ).length,
      cancelled: assignments.filter(
        (a) => a.status === AssignmentStatus.CANCELLED,
      ).length,
      overdue: assignments.filter(
        (a) =>
          a.dueDate &&
          a.dueDate < now &&
          [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS].includes(
            a.status,
          ),
      ).length,
    };
  }
}
