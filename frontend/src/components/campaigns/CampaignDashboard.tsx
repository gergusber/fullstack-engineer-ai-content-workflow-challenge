"use client";

import { useState } from "react";
import { CampaignList } from "./CampaignList";
import { CampaignCreation } from "./CampaignCreation";
import { CampaignEdit } from "./CampaignEdit";
import { Campaign } from "@/types/campaign";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampaignsService } from "@/lib/services/campaigns.service";
import { toast } from "sonner";

type ViewMode = "list" | "create" | "edit";

export function CampaignDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateNew = () => {
    setSelectedCampaign(null);
    setViewMode("create");
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewMode("edit");
  };

  const handleCampaignCreated = (campaign: any) => {
    // TODO: Refresh campaigns list
    setViewMode("list");
  };

  const handleBackToList = () => {
    setSelectedCampaign(null);
    setViewMode("list");
  };

  const handleSaveCampaign = async (data: any) => {
    if (!selectedCampaign) return;

    setIsSubmitting(true);
    try {
      const response = await CampaignsService.updateCampaign(
        selectedCampaign.id,
        data
      );

      if (response.success) {
        toast.success("Campaign updated successfully!");
        setViewMode("list");
        setSelectedCampaign(null);
      } else {
        toast.error("Failed to update campaign");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {viewMode === "list" && (
        <CampaignList
          onCreateNew={handleCreateNew}
          onEditCampaign={handleEditCampaign}
        />
      )}

      {viewMode === "create" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToList}>
              ← Back to Campaigns
            </Button>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
          </div>

          <CampaignCreation onSuccess={handleCampaignCreated} />
        </div>
      )}

      {viewMode === "edit" && selectedCampaign && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToList}>
              ← Back to Campaigns
            </Button>
            <h1 className="text-3xl font-bold">
              Edit Campaign: {selectedCampaign.name}
            </h1>
          </div>

          <CampaignEdit
            campaign={selectedCampaign}
            onSave={handleSaveCampaign}
            onCancel={handleBackToList}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
