import { apiClient, ApiResponse } from './client'
import type { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '@/types/campaign'

export const campaignApi = {
  // Get all campaigns
  getCampaigns: async (): Promise<ApiResponse<Campaign[]>> => {
    const response = await apiClient.get('/campaigns')
    return response.data
  },

  // Get campaign by ID
  getCampaign: async (id: string): Promise<ApiResponse<Campaign>> => {
    const response = await apiClient.get(`/campaigns/${id}`)
    return response.data
  },

  // Create campaign
  createCampaign: async (data: CreateCampaignRequest): Promise<ApiResponse<Campaign>> => {
    const response = await apiClient.post('/campaigns', data)
    return response.data
  },

  // Update campaign
  updateCampaign: async (id: string, data: UpdateCampaignRequest): Promise<ApiResponse<Campaign>> => {
    const response = await apiClient.put(`/campaigns/${id}`, data)
    return response.data
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/campaigns/${id}`)
    return response.data
  },

  // Update campaign status
  updateCampaignStatus: async (id: string, status: Campaign['status']): Promise<ApiResponse<Campaign>> => {
    const response = await apiClient.patch(`/campaigns/${id}/status`, { status })
    return response.data
  }
}