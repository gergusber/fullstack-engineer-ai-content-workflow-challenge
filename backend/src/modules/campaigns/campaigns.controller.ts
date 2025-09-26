import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { CampaignsService } from './campaigns.service';
  import { CreateCampaignDto } from './dto/create-campaign.dto';
  import { UpdateCampaignDto } from './dto/update-campaign.dto';
  import { CampaignStatus } from '../../database/entities/campaign.entity';
  
  @Controller('api/campaigns')
  export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) {}
  
    @Post()
    async create(@Body() createCampaignDto: CreateCampaignDto) {
      try {
        const campaign = await this.campaignsService.create(createCampaignDto);
        return {
          success: true,
          data: campaign,
          message: 'Campaign created successfully',
        };
      } catch (error) {
        throw new HttpException(
          `Failed to create campaign: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    @Get()
    async findAll(@Query('status') status?: CampaignStatus, @Query('search') search?: string) {
      try {
        const campaigns = await this.campaignsService.findWithFilters(status, search);

        return {
          success: true,
          data: campaigns,
          count: campaigns.length,
        };
      } catch (error) {
        throw new HttpException(
          `Failed to fetch campaigns: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      try {
        const campaign = await this.campaignsService.findOne(id);
        return {
          success: true,
          data: campaign,
        };
      } catch (error) {
        throw new HttpException(
          error.message,
          error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Get(':id/stats')
    async getCampaignStats(@Param('id') id: string) {
      try {
        const stats = await this.campaignsService.getCampaignStats(id);
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        throw new HttpException(
          error.message,
          error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
      try {
        const campaign = await this.campaignsService.update(id, updateCampaignDto);
        return {
          success: true,
          data: campaign,
          message: 'Campaign updated successfully',
        };
      } catch (error) {
        throw new HttpException(
          error.message,
          error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    @Delete(':id')
    async remove(@Param('id') id: string) {
      try {
        await this.campaignsService.remove(id);
        return {
          success: true,
          message: 'Campaign deleted successfully',
        };
      } catch (error) {
        throw new HttpException(
          error.message,
          error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
  