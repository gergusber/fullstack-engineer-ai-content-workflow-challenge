import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContentModule } from './modules/content/content.module';
import { AIModule } from './modules/ai/ai.module';
import { UsersModule } from './modules/users/users.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ClerkAuthMiddleware } from './common/middleware/clerk-auth.middleware';
import { UserLoaderMiddleware } from './common/middleware/user-loader.middleware';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard';
import { User } from './database/entities/user.entity';
// import { WebSocketsModule } from './modules/websockets/websockets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([User]), // For UserLoaderMiddleware
    DatabaseModule, // Connects to PostgreSQL
    CampaignsModule, // Campaign CRUD operations
    ContentModule, // Content management
    AIModule, // AI translation and content generation
    UsersModule, // User management
    AssignmentsModule, // Content assignment workflow
    ActivityModule, // Activity logging and audit trails
    // WebSocketsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClerkAuthMiddleware, UserLoaderMiddleware)
      .forRoutes('*'); // Apply to all routes (ClerkAuth -> UserLoader)
  }
}

