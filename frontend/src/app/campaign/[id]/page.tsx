'use client'

import { useParams } from 'next/navigation'
import { CampaignDetail } from '@/components/campaigns/CampaignDetail'

export default function CampaignPage() {
  const params = useParams()
  const campaignId = params.id as string

  return <CampaignDetail campaignId={campaignId} />
}