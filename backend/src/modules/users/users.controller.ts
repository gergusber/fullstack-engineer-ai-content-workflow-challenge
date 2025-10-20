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
import { UsersService, UpdateUserDto } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@Controller('users')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: User) {
    return user;
  }

  /**
   * Sync current user from Clerk
   * This endpoint is called on login to ensure user data is up to date
   */
  @Post('sync')
  async syncUser(@CurrentUser() user: User) {
    return await this.usersService.syncUserFromClerk(user.clerkId);
  }

  /**
   * Get all users (Admin and Content Manager only)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async findAll(
    @CurrentUser() user: User,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {
      organizationId: user.organizationId,
    };

    if (role) {
      filters.role = role;
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    return await this.usersService.findAll(filters);
  }

  /**
   * Get users by role (for assignment purposes)
   */
  @Get('by-role/:role')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER)
  async findByRole(
    @CurrentUser() user: User,
    @Param('role') role: UserRole,
  ) {
    return await this.usersService.findByRole(role, user.organizationId);
  }

  /**
   * Get user by Clerk ID (Admin and Content Manager only)
   */
  @Get(':clerkId')
  @Roles(UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  async findOne(@Param('clerkId') clerkId: string) {
    return await this.usersService.findByClerkId(clerkId);
  }

  /**
   * Update user profile (self or admin)
   */
  @Patch(':clerkId')
  async update(
    @CurrentUser() user: User,
    @Param('clerkId') clerkId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Users can only update their own profile unless they're admin
    if (user.clerkId !== clerkId && user.role !== UserRole.ADMIN) {
      // Allow content managers to update roles
      if (
        user.role === UserRole.CONTENT_MANAGER &&
        Object.keys(updateUserDto).length === 1 &&
        'role' in updateUserDto
      ) {
        // Content managers can update roles but not to ADMIN
        if (updateUserDto.role === UserRole.ADMIN) {
          throw new Error('Content managers cannot assign admin role');
        }
      } else {
        throw new Error('Insufficient permissions');
      }
    }

    return await this.usersService.update(clerkId, updateUserDto);
  }

  /**
   * Update user role (Admin only)
   */
  @Patch(':clerkId/role')
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('clerkId') clerkId: string,
    @Body('role') role: UserRole,
  ) {
    return await this.usersService.updateRole(clerkId, role);
  }

  /**
   * Deactivate user (Admin only)
   */
  @Delete(':clerkId/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('clerkId') clerkId: string) {
    return await this.usersService.deactivate(clerkId);
  }

  /**
   * Activate user (Admin only)
   */
  @Post(':clerkId/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('clerkId') clerkId: string) {
    return await this.usersService.activate(clerkId);
  }
}
