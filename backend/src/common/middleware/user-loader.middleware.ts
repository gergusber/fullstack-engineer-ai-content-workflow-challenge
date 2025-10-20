import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UserLoaderMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if Clerk auth middleware set auth info
      const auth = req['auth'];

      if (auth && auth.userId) {
        // Load full user from database
        const user = await this.userRepository.findOne({
          where: { clerkId: auth.userId },
        });

        if (user) {
          // Attach user to request
          req['user'] = user;

          // Update last login time (async, don't wait)
          this.userRepository
            .update(user.clerkId, { lastLoginAt: new Date() })
            .catch((err) => console.error('Failed to update last login:', err));
        } else {
          console.log(
            `User not found in database for Clerk ID: ${auth.userId}`,
          );
        }
      }

      next();
    } catch (error) {
      console.error('User loader middleware error:', error);
      next();
    }
  }
}
