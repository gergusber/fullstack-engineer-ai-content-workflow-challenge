import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AssignmentsService,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from './assignments.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { AssignmentStatus } from '../../database/entities/content-assignment.entity';

@Controller('assignments')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * Create new assignment (Content Manager and Admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async create(
    @CurrentUser() user: User,
    @Body() createDto: CreateAssignmentDto,
  ) {
    return await this.assignmentsService.create(user.clerkId, createDto);
  }

  /**
   * Get my assignments
   */
  @Get('me')
  async getMyAssignments(@CurrentUser() user: User) {
    return await this.assignmentsService.findByUser(user.clerkId);
  }

  /**
   * Get my assignment statistics
   */
  @Get('me/statistics')
  async getMyStatistics(@CurrentUser() user: User) {
    return await this.assignmentsService.getStatistics(user.clerkId);
  }

  /**
   * Get my assignments by status
   */
  @Get('me/status/:status')
  async getMyAssignmentsByStatus(
    @CurrentUser() user: User,
    @Param('status') status: AssignmentStatus,
  ) {
    return await this.assignmentsService.findByUserAndStatus(
      user.clerkId,
      status,
    );
  }

  /**
   * Get assignments by content piece
   */
  @Get('content/:contentPieceId')
  async getByContentPiece(@Param('contentPieceId') contentPieceId: string) {
    return await this.assignmentsService.findByContentPiece(contentPieceId);
  }

  /**
   * Get assignments created by me
   */
  @Get('created-by-me')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async getCreatedByMe(@CurrentUser() user: User) {
    return await this.assignmentsService.findByAssigner(user.clerkId);
  }

  /**
   * Get overdue assignments (Admin and Content Manager only)
   */
  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async getOverdue() {
    return await this.assignmentsService.findOverdue();
  }

  /**
   * Get assignment by ID
   */
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.assignmentsService.findOne(id);
  }

  /**
   * Update assignment
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssignmentDto,
  ) {
    return await this.assignmentsService.update(id, updateDto);
  }

  /**
   * Start assignment
   */
  @Post(':id/start')
  async start(@Param('id') id: string) {
    return await this.assignmentsService.start(id);
  }

  /**
   * Complete assignment
   */
  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    return await this.assignmentsService.complete(id);
  }

  /**
   * Cancel assignment (Admin and Content Manager only)
   */
  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async cancel(@Param('id') id: string) {
    return await this.assignmentsService.cancel(id);
  }

  /**
   * Delete assignment (Admin only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.assignmentsService.delete(id);
    return { message: 'Assignment deleted successfully' };
  }
}
