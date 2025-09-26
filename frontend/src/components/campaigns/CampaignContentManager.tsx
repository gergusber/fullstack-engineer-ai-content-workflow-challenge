"use client";

import { useState } from "react";
import { Campaign } from "@/types/campaign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ContentCreation } from "../content/ContentCreation";
import { ContentList } from "../content/ContentList";
import { ContentDetail } from "../content/ContentDetail";
import { TranslationDashboard } from "../content/TranslationDashboard";
import { CampaignStatistics } from "./CampaignStatistics";
import { CampaignEdit } from "./CampaignEdit";
import { ContentType, ReviewState } from "@/types/content";
import { CampaignStatus } from "@/types/campaign";
import { useContentList, useAllContentList } from "@/lib/hooks/api/content/queries";
import { useUpdateCampaign } from "@/lib/hooks/api/campaigns/mutations";
import { toast } from "sonner";
import {
  FileText,
  ShoppingBag,
  Tag,
  Edit,
  Plus,
  BarChart3,
  Rocket,
  MessageSquare,
  Mail,
  Target,
  BrainCircuit,
  Languages,
  Zap,
} from "lucide-react";

interface CampaignContentManagerProps {
  campaignId: string;
  campaign: Campaign;
}

type ContentView =
  | "list"
  | "create"
  | "detail"
  | "translations"
  | "statistics"
  | "edit";

interface QuickContentTemplate {
  contentType: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function CampaignContentManager({
  campaignId,
  campaign,
}: CampaignContentManagerProps) {
  const [currentView, setCurrentView] = useState<ContentView>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [quickTemplate, setQuickTemplate] =
    useState<QuickContentTemplate | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    null
  );
  const [showAllContent, setShowAllContent] = useState(true);

  // Get content stats for workflow status - use appropriate hook based on toggle
  const { data: contentResponse } = showAllContent
    ? useAllContentList({
        campaignId,
        limit: 1000,
      })
    : useContentList({
        campaignId,
        limit: 1000,
      });

  // Campaign update mutation
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign();

  const allContent = contentResponse?.data || [];
  const contentStats = {
    total: allContent.length,
    approved: allContent.filter((c) => c.reviewState === ReviewState.APPROVED)
      .length,
    pending: allContent.filter(
      (c) =>
        c.reviewState === ReviewState.PENDING_REVIEW ||
        c.reviewState === ReviewState.REVIEWED
    ).length,
    draft: allContent.filter((c) => c.reviewState === ReviewState.DRAFT).length,
    rejected: allContent.filter((c) => c.reviewState === ReviewState.REJECTED)
      .length,
    aiSuggested: allContent.filter(
      (c) => c.reviewState === ReviewState.AI_SUGGESTED
    ).length,
  };

  const getStatusBadgeColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case CampaignStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case CampaignStatus.PAUSED:
        return "bg-yellow-100 text-yellow-800";
      case CampaignStatus.COMPLETED:
        return "bg-blue-100 text-blue-800";
      case CampaignStatus.ARCHIVED:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkflowMessage = () => {
    if (contentStats.total === 0) {
      return "No content yet - create content to start the workflow";
    }
    if (
      contentStats.approved === contentStats.total &&
      contentStats.total > 0
    ) {
      return "🎉 All content approved! Campaign ready for completion.";
    }
    if (
      contentStats.approved > 0 &&
      (contentStats.pending > 0 || contentStats.aiSuggested > 0)
    ) {
      return `✨ ${contentStats.approved} approved, ${
        contentStats.pending + contentStats.aiSuggested
      } in review`;
    }
    if (contentStats.pending > 0 || contentStats.aiSuggested > 0) {
      return `⏳ ${
        contentStats.pending + contentStats.aiSuggested
      } content pieces awaiting review`;
    }
    if (contentStats.draft > 0 || contentStats.rejected > 0) {
      return `${
        contentStats.draft + contentStats.rejected
      } content pieces need work`;
    }
    return "Ready for content creation";
  };

  // Quick content templates
  const contentTemplates: QuickContentTemplate[] = [
    {
      contentType: ContentType.BLOG_POST,
      title: "Blog Post",
      description: "Create engaging long-form content",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      contentType: ContentType.SOCIAL_POST,
      title: "Social Media Post",
      description: "Quick and engaging social content",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      contentType: ContentType.EMAIL_SUBJECT,
      title: "Email Subject Line",
      description: "Compelling email headlines",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      contentType: ContentType.AD_COPY,
      title: "Advertisement Copy",
      description: "Persuasive ad content",
      icon: <Target className="h-5 w-5" />,
    },
    {
      contentType: ContentType.PRODUCT_DESC,
      title: "Product Description",
      description: "Detailed product information",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      contentType: ContentType.HEADLINE,
      title: "Headlines & Titles",
      description: "Catchy headlines and titles",
      icon: <Tag className="h-5 w-5" />,
    },
  ];

  const handleQuickCreate = (template: QuickContentTemplate) => {
    setQuickTemplate(template);
    setCurrentView("create");
  };

  const handleAIContentSprint = () => {
    // This would open a modal or dedicated view for bulk AI content generation
    toast.info("🤖 AI Content Sprint: Coming Soon!", {
      description:
        "Select content pieces and generate AI improvements for all at once. This feature will be available soon!",
    });
  };

  const handleViewContent = (contentId: string) => {
    setSelectedContentId(contentId);
    setCurrentView("detail");
  };

  const handleEditContent = (contentId: string) => {
    setSelectedContentId(contentId);
    setCurrentView("detail");
    // The detail view will handle edit mode internally
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedContentId(null);
  };

  const getContentTypeLabel = (type: ContentType): string => {
    switch (type) {
      case ContentType.BLOG_POST:
        return "Blog Post";
      case ContentType.SOCIAL_POST:
        return "Social Media Post";
      case ContentType.EMAIL_SUBJECT:
        return "Email Subject";
      case ContentType.HEADLINE:
        return "Headline";
      case ContentType.DESCRIPTION:
        return "Description";
      case ContentType.AD_COPY:
        return "Advertisement Copy";
      case ContentType.PRODUCT_DESC:
        return "Product Description";
      case ContentType.LANDING_PAGE:
        return "Landing Page";
      default:
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleEditCampaign = async (data: any) => {
    try {
      await updateCampaign({
        id: campaign.id,
        data: {
          name: data.name,
          description: data.description,
          targetMarkets: data.targetMarkets,
          tags: data.tags,
          status: data.status,
        },
      });

      toast.success("Campaign updated successfully! 🎉", {
        description: "Your campaign changes have been saved.",
      });
      setCurrentView("list");
    } catch (error) {
      console.error("Failed to update campaign:", error);
      toast.error("Failed to update campaign", {
        description: "Please try again or check your connection.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Management Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 mr-2" />
                Content Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and organize content for {campaign.name}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Badge
                  className={getStatusBadgeColor(campaign.status)}
                  variant="secondary"
                >
                  {campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)}
                </Badge>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-600">
                  {getWorkflowMessage()}
                </span>
                {contentStats.total > 0 && (
                  <>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-medium text-gray-700">
                      {contentStats.total} content pieces
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllContent(!showAllContent)}
                      className="text-xs h-6 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      {showAllContent ? "Hide translations" : "Show all (including translations)"}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("edit")}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Campaign
            </Button>
            <div className="flex gap-2">
              <Button
                variant={currentView === "list" ? "default" : "outline"}
                onClick={() => setCurrentView("list")}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Content
              </Button>
              <Button
                variant={currentView === "create" ? "default" : "outline"}
                onClick={() => setCurrentView("create")}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
              <Button
                variant={currentView === "translations" ? "default" : "outline"}
                onClick={() => setCurrentView("translations")}
                size="sm"
              >
                <Languages className="h-4 w-4 mr-2" />
                Translation Hub
              </Button>
              <Button
                variant={currentView === "statistics" ? "default" : "outline"}
                onClick={() => setCurrentView("statistics")}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistics
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Action Templates */}
      {currentView === "list" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 mr-2" />
              Quick Create
            </CardTitle>
            <p className="text-sm text-gray-600">
              Start with pre-configured content types for faster creation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Individual Content Types
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {contentTemplates.map((template) => (
                    <Button
                      key={template.contentType}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary/20"
                      onClick={() => handleQuickCreate(template)}
                    >
                      <div className="text-2xl">{template.icon}</div>
                      <div className="text-xs font-medium text-center">
                        {template.title}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Bulk Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                    onClick={handleAIContentSprint}
                  >
                    <div className="text-xl">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-purple-800">
                        AI Content Sprint
                      </div>
                      <div className="text-xs text-purple-600">
                        Bulk AI improvements
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12"
                    onClick={() =>
                      toast.info("📱 Social Media Campaign", {
                        description:
                          "Bulk creation for multiple social platforms is coming soon!",
                      })
                    }
                  >
                    <div className="text-xl">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Social Campaign</div>
                      <div className="text-xs text-gray-500">
                        Create posts for multiple platforms
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12"
                    onClick={() =>
                      toast.info("📧 Email Campaign", {
                        description:
                          "Bulk email subject and content creation is coming soon!",
                      })
                    }
                  >
                    <div className="text-xl">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Email Campaign</div>
                      <div className="text-xs text-gray-500">
                        Create email subjects and content
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 justify-start h-12"
                    onClick={() =>
                      toast.info("Product Launch", {
                        description:
                          "All content for product launch creation is coming soon!",
                      })
                    }
                  >
                    <Rocket className="h-5 w-5" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Product Launch</div>
                      <div className="text-xs text-gray-500">
                        All content for a product launch
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content View */}
      {currentView === "list" && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-search">Search Content</Label>
                  <Input
                    id="content-search"
                    placeholder="Search by title, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-type-filter">
                    Filter by Content Type
                  </Label>
                  <select
                    id="content-type-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {Object.values(ContentType).map((type) => (
                      <option key={type} value={type}>
                        {getContentTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content List */}
          <ContentList
            campaignId={campaignId}
            searchTerm={searchTerm}
            contentTypeFilter={contentTypeFilter}
            showAllContent={showAllContent}
            onViewContent={handleViewContent}
            onEditContent={handleEditContent}
          />
        </div>
      )}

      {currentView === "create" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("list")}
                  size="sm"
                >
                  ← Back to Content List
                </Button>
                <CardTitle>Create New Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ContentCreation
                campaignId={campaignId}
                quickTemplate={quickTemplate}
                onSuccess={() => {
                  setCurrentView("list");
                  setQuickTemplate(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {currentView === "detail" && selectedContentId && (
        <ContentDetail
          contentId={selectedContentId}
          onBack={handleBackToList}
        />
      )}

      {currentView === "translations" && (
        <TranslationDashboard
          campaignId={campaignId}
          onViewContent={handleViewContent}
        />
      )}

      {currentView === "statistics" && (
        <CampaignStatistics campaign={campaign} campaignId={campaignId} />
      )}

      {currentView === "edit" && (
        <CampaignEdit
          campaign={campaign}
          onSave={handleEditCampaign}
          onCancel={() => setCurrentView("list")}
          isSubmitting={isUpdating}
        />
      )}
    </div>
  );
}
