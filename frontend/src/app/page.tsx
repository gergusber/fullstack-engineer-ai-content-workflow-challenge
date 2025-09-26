import { CampaignDashboard } from '@/components/campaigns/CampaignDashboard'
import { Badge } from '@/components/ui/badge'
import { Languages } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Content Workflow</h1>
                <p className="text-sm text-gray-600">Campaign & Content Management Dashboard</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {/* <CheckCircle className="h-3 w-3 mr-1" /> */}
              Backend Connected
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <CampaignDashboard />
    </div>
  )
}

   