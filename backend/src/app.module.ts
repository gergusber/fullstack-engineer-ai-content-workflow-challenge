import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContentModule } from './modules/content/content.module';
import { AIModule } from './modules/ai/ai.module';
// import { WebSocketsModule } from './modules/websockets/websockets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,// Connects to PostgreSQL
    CampaignsModule,// Campaign CRUD operations
    ContentModule,// Content management
    AIModule,// AI translation and content generation
    // WebSocketsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

