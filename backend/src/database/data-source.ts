import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Campaign } from './entities/campaign.entity';
import { ContentPiece } from './entities/content-piece.entity';
import { AIDraft } from './entities/ai-draft.entity';
import { Review } from './entities/review.entity';
import { Translation } from './entities/translation.entity';
import { ContentVersion } from './entities/content-version.entity';
import { ContentAnalytics } from './entities/content-analytics.entity';
import { TaskQueue } from './entities/task-queue.entity';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
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
  synchronize: false, // Always false in production
  logging: configService.get('NODE_ENV') === 'development',
});