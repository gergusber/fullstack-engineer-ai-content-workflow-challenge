import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentPiece } from '../../database/entities/content-piece.entity';
import { AIDraft } from '../../database/entities/ai-draft.entity';
import { Review } from '../../database/entities/review.entity';
import { Translation } from '../../database/entities/translation.entity';
import { ContentVersion } from '../../database/entities/content-version.entity';
import { ContentAnalytics } from '../../database/entities/content-analytics.entity';
import { AIModule } from '../ai/ai.module'; // Import AI module

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentPiece,
      AIDraft,
      Review,
      Translation,
      ContentVersion,
      ContentAnalytics,
    ]),
    AIModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
