import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ActivityLog,
  ActivityAction,
  ActivityEntityType,
} from '../../database/entities/activity-log.entity';

export interface CreateActivityLogDto {
  userId: string;
  organizationId?: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Log an activity
   */
  async log(createDto: CreateActivityLogDto): Promise<ActivityLog> {
    const activity = this.activityRepository.create(createDto);
    return await this.activityRepository.save(activity);
  }

  /**
   * Log campaign activity
   */
  async logCampaign(
    userId: string,
    action: ActivityAction,
    campaignId: string,
    campaignName: string,
    organizationId?: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityLog> {
    return await this.log({
      userId,
      organizationId,
      action,
      entityType: ActivityEntityType.CAMPAIGN,
      entityId: campaignId,
      entityName: campaignName,
      metadata,
    });
  }

  /**
   * Log content activity
   */
  async logContent(
    userId: string,
    action: ActivityAction,
    contentId: string,
    contentTitle: string,
    organizationId?: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityLog> {
    return await this.log({
      userId,
      organizationId,
      action,
      entityType: ActivityEntityType.CONTENT,
      entityId: contentId,
      entityName: contentTitle,
      metadata,
    });
  }

  /**
   * Log translation activity
   */
  async logTranslation(
    userId: string,
    action: ActivityAction,
    translationId: string,
    translationName: string,
    organizationId?: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityLog> {
    return await this.log({
      userId,
      organizationId,
      action,
      entityType: ActivityEntityType.TRANSLATION,
      entityId: translationId,
      entityName: translationName,
      metadata,
    });
  }

  /**
   * Log assignment activity
   */
  async logAssignment(
    userId: string,
    action: ActivityAction,
    assignmentId: string,
    assignmentName: string,
    organizationId?: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityLog> {
    return await this.log({
      userId,
      organizationId,
      action,
      entityType: ActivityEntityType.ASSIGNMENT,
      entityId: assignmentId,
      entityName: assignmentName,
      metadata,
    });
  }

  /**
   * Get activity logs for a user
   */
  async findByUser(
    userId: string,
    limit: number = 100,
  ): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get activity logs for an organization
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100,
  ): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get activity logs for an entity
   */
  async findByEntity(
    entityType: ActivityEntityType,
    entityId: string,
  ): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: {
        entityType,
        entityId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get activity logs by action
   */
  async findByAction(
    action: ActivityAction,
    limit: number = 100,
  ): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get activity logs within a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<ActivityLog[]> {
    const where: any = {
      createdAt: Between(startDate, endDate),
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return await this.activityRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get recent activity for an organization (dashboard)
   */
  async getRecentActivity(
    organizationId: string,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Get activity statistics for an organization
   */
  async getOrganizationStatistics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalActivities: number;
    byAction: Record<ActivityAction, number>;
    byEntityType: Record<ActivityEntityType, number>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const where: any = { organizationId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const activities = await this.activityRepository.find({ where });

    // Count by action
    const byAction = {} as Record<ActivityAction, number>;
    Object.values(ActivityAction).forEach((action) => {
      byAction[action] = activities.filter((a) => a.action === action).length;
    });

    // Count by entity type
    const byEntityType = {} as Record<ActivityEntityType, number>;
    Object.values(ActivityEntityType).forEach((entityType) => {
      byEntityType[entityType] = activities.filter(
        (a) => a.entityType === entityType,
      ).length;
    });

    // Top users
    const userCounts = activities.reduce(
      (acc, activity) => {
        acc[activity.userId] = (acc[activity.userId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActivities: activities.length,
      byAction,
      byEntityType,
      topUsers,
    };
  }

  /**
   * Get user activity statistics
   */
  async getUserStatistics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalActivities: number;
    byAction: Record<ActivityAction, number>;
    byEntityType: Record<ActivityEntityType, number>;
  }> {
    const where: any = { userId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const activities = await this.activityRepository.find({ where });

    // Count by action
    const byAction = {} as Record<ActivityAction, number>;
    Object.values(ActivityAction).forEach((action) => {
      byAction[action] = activities.filter((a) => a.action === action).length;
    });

    // Count by entity type
    const byEntityType = {} as Record<ActivityEntityType, number>;
    Object.values(ActivityEntityType).forEach((entityType) => {
      byEntityType[entityType] = activities.filter(
        (a) => a.entityType === entityType,
      ).length;
    });

    return {
      totalActivities: activities.length,
      byAction,
      byEntityType,
    };
  }

  /**
   * Delete old activity logs (for cleanup/maintenance)
   */
  async deleteOldLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.activityRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
