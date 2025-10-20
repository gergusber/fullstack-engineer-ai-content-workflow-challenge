import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          // Verify the JWT token with Clerk
          const verifiedToken = await clerkClient.verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });

          // Attach Clerk user ID to request
          req['auth'] = {
            userId: verifiedToken.sub, // JWT subject is the user ID
            sessionId: verifiedToken.sid, // JWT session ID
            orgId: verifiedToken.org_id as string, // Organization ID from JWT
          };
        } catch (error) {
          // Invalid token, but don't block request - let guard handle it
          console.log('Clerk auth middleware: Invalid token', error.message);
        }
      }

      next();
    } catch (error) {
      console.error('Clerk auth middleware error:', error);
      next();
    }
  }
}
