import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Campaign } from './entities/campaign.entity';
import { ContentPiece } from './entities/content-piece.entity';
import { AIDraft } from './entities/ai-draft.entity';
import { Review } from './entities/review.entity';
import { Translation } from './entities/translation.entity';
import { ContentVersion } from './entities/content-version.entity';
import { ContentAnalytics } from './entities/content-analytics.entity';
import { TaskQueue } from './entities/task-queue.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config: any = {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'password'),
          database: configService.get('DB_NAME', 'ai_content_workflow'),
          entities: [
            Campaign,
            ContentPiece,
            AIDraft,
            Review,
            Translation,
            ContentVersion,
            ContentAnalytics,
            TaskQueue,
          ],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          ssl: configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        };

        // Use DATABASE_URL if provided, otherwise use individual connection params
        const databaseUrl = configService.get('DATABASE_URL');
        if (databaseUrl) {
          config.url = databaseUrl;
        }

        return config;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}