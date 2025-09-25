import { apiClient, ApiResponse } from '@/lib/api/client'
import { Campaign, CampaignStats, CreateCampaignDto, CampaignFilters } from '@/lib/api/types'

export class CampaignsService {
  private static readonly BASE_URL = '/api/campaigns'

  static async getCampaigns(filters?: CampaignFilters): Promise<ApiResponse<Campaign[]>> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.createdBy) params.append('createdBy', filters.createdBy)

    const { data } = await apiClient.get(`${this.BASE_URL}?${params}`)
    return data
  }

  static async getCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}`)
    return data
  }

  static async getCampaignStats(id: string): Promise<ApiResponse<CampaignStats>> {
    const { data } = await apiClient.get(`${this.BASE_URL}/${id}/stats`)
    return data
  }

  static async createCampaign(campaignData: CreateCampaignDto): Promise<ApiResponse<Campaign>> {
    const { data } = await apiClient.post(this.BASE_URL, campaignData)
    return data
  }

  static async updateCampaign(id: string, campaignData: Partial<CreateCampaignDto>): Promise<ApiResponse<Campaign>> {
    const { data } = await apiClient.patch(`${this.BASE_URL}/${id}`, campaignData)
    return data
  }

  static async deleteCampaign(id: string): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`${this.BASE_URL}/${id}`)
    return data
  }
}