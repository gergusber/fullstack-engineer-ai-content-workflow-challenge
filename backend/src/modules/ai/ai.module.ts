import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIDraft } from '../../database/entities/ai-draft.entity';
import { Translation } from '../../database/entities/translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIDraft, Translation]),
    ConfigModule,
  ],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}