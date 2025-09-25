export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface Campaign {
  id: string
  name: string
  description?: string
  status: CampaignStatus
  targetMarkets?: string[]
  tags?: string[]
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignRequest {
  name: string
  description?: string
  status?: CampaignStatus
  targetMarkets?: string[]
  tags?: string[]
  createdBy?: string
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {}