import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { clerkClient } from '@clerk/express';

export interface CreateUserDto {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Sync a user from Clerk to our database
   * This is typically called on first login or when user data changes
   */
  async syncUserFromClerk(clerkId: string): Promise<User> {
    try {
      // Fetch user from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkId);

      // Check if user exists in our DB
      let user = await this.userRepository.findOne({
        where: { clerkId },
      });

      const userData = {
        email:
          clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
            ?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        organizationId: clerkUser.publicMetadata?.organizationId as string,
        lastLoginAt: new Date(),
      };

      if (user) {
        // Update existing user
        Object.assign(user, userData);
        return await this.userRepository.save(user);
      } else {
        // Create new user with default role
        user = this.userRepository.create({
          clerkId,
          ...userData,
          role: UserRole.COPYWRITER, // Default role
          isActive: true,
        });
        return await this.userRepository.save(user);
      }
    } catch (error) {
      console.error('Error syncing user from Clerk:', error);
      throw error;
    }
  }

  /**
   * Create a user manually (for testing or admin purposes)
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { clerkId: createUserDto.clerkId },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      role: createUserDto.role || UserRole.COPYWRITER,
      isActive: true,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  /**
   * Get all users in an organization
   */
  async findByOrganization(organizationId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole, organizationId?: string): Promise<User[]> {
    const where: any = { role, isActive: true };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return await this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update user
   */
  async update(clerkId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findByClerkId(clerkId);

    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  /**
   * Update user role
   */
  async updateRole(clerkId: string, role: UserRole): Promise<User> {
    return await this.update(clerkId, { role });
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(clerkId: string): Promise<User> {
    return await this.update(clerkId, { isActive: false });
  }

  /**
   * Activate user
   */
  async activate(clerkId: string): Promise<User> {
    return await this.update(clerkId, { isActive: true });
  }

  /**
   * Get all users with filtering
   */
  async findAll(filters?: {
    organizationId?: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<User[]> {
    const where: any = {};

    if (filters?.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete user (hard delete - use with caution)
   */
  async delete(clerkId: string): Promise<void> {
    const user = await this.findByClerkId(clerkId);
    await this.userRepository.remove(user);
  }
}
