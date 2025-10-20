import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import {
  ActivityAction,
  ActivityEntityType,
} from '../../database/entities/activity-log.entity';

@Controller('activity')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * Get my activity logs
   */
  @Get('me')
  async getMyActivity(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    return await this.activityService.findByUser(
      user.clerkId,
      limit ? parseInt(limit.toString()) : 100,
    );
  }

  /**
   * Get my activity statistics
   */
  @Get('me/statistics')
  async getMyStatistics(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.activityService.getUserStatistics(
      user.clerkId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get organization activity logs (Admin and Content Manager only)
   */
  @Get('organization')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async getOrganizationActivity(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    if (!user.organizationId) {
      return [];
    }

    return await this.activityService.findByOrganization(
      user.organizationId,
      limit ? parseInt(limit.toString()) : 100,
    );
  }

  /**
   * Get recent activity for dashboard (Admin and Content Manager only)
   */
  @Get('organization/recent')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async getRecentActivity(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    if (!user.organizationId) {
      return [];
    }

    return await this.activityService.getRecentActivity(
      user.organizationId,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * Get organization statistics (Admin and Content Manager only)
   */
  @Get('organization/statistics')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async getOrganizationStatistics(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.organizationId) {
      return null;
    }

    return await this.activityService.getOrganizationStatistics(
      user.organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get activity by entity
   */
  @Get('entity/:entityType/:entityId')
  async getEntityActivity(
    @Param('entityType') entityType: ActivityEntityType,
    @Param('entityId') entityId: string,
  ) {
    return await this.activityService.findByEntity(entityType, entityId);
  }

  /**
   * Get activity by action (Admin only)
   */
  @Get('action/:action')
  @Roles(UserRole.ADMIN)
  async getByAction(
    @Param('action') action: ActivityAction,
    @Query('limit') limit?: number,
  ) {
    return await this.activityService.findByAction(
      action,
      limit ? parseInt(limit.toString()) : 100,
    );
  }

  /**
   * Get activity by date range (Admin and Content Manager only)
   */
  @Get('date-range')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async getByDateRange(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.activityService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      user.organizationId,
    );
  }
}
