"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useCreateContent,
  useGenerateAIContent,
  useUpdateContent,
} from "@/lib/hooks/api/content/mutations";
import { ContentType, Priority } from "@/types/content";
import { FileText, MessageSquare, Mail, Tag, Target, ShoppingBag, Globe, CheckCircle, Loader2, Rocket, Info, RotateCcw, Circle } from "lucide-react";

interface QuickContentTemplate {
  contentType: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Content creation schema
const contentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  contentType: z
    .enum([...Object.values(ContentType)])
    .transform((val) => val as ContentType),
  targetLanguage: z.string().min(1, "Target language is required"),
  sourceLanguage: z.string().min(1, "Source language is required"),
  priority: z
    .enum([...Object.values(Priority)])
    .transform((val) => val as Priority),
  finalText: z.string().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface ContentCreationProps {
  campaignId: string;
  quickTemplate?: QuickContentTemplate | null;
  onSuccess?: () => void;
}

export function ContentCreation({
  campaignId,
  quickTemplate,
  onSuccess,
}: ContentCreationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiGeneration, setShowAiGeneration] = useState(false);
  const [aiModel, setAiModel] = useState<"claude" | "openai" | "both">(
    "claude"
  );
  const [aiGenerationType, setAiGenerationType] = useState<
    "original" | "variation" | "improvement"
  >("original");
  const [enableAISuggestion, setEnableAISuggestion] = useState(true);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string>("");
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const { mutateAsync: createContent } = useCreateContent();
  const { mutateAsync: generateAIContent, isPending: isGeneratingAI } =
    useGenerateAIContent();
  const { mutateAsync: updateContent } = useUpdateContent();

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST:
        return "Blog Post";
      case ContentType.SOCIAL_POST:
        return "Social Post";
      case ContentType.EMAIL_SUBJECT:
        return "Email Subject";
      case ContentType.HEADLINE:
        return "Headline";
      case ContentType.DESCRIPTION:
        return "Description";
      case ContentType.AD_COPY:
        return "Ad Copy";
      case ContentType.PRODUCT_DESC:
        return "Product Description";
      case ContentType.LANDING_PAGE:
        return "Landing Page";
      default:
        return type;
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.BLOG_POST:
        return <FileText className="h-4 w-4" />;
      case ContentType.SOCIAL_POST:
        return <MessageSquare className="h-4 w-4" />;
      case ContentType.EMAIL_SUBJECT:
        return <Mail className="h-4 w-4" />;
      case ContentType.HEADLINE:
        return <Tag className="h-4 w-4" />;
      case ContentType.DESCRIPTION:
        return <FileText className="h-4 w-4" />;
      case ContentType.AD_COPY:
        return <Target className="h-4 w-4" />;
      case ContentType.PRODUCT_DESC:
        return <ShoppingBag className="h-4 w-4" />;
      case ContentType.LANDING_PAGE:
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return "Low";
      case Priority.MEDIUM:
        return "Medium";
      case Priority.HIGH:
        return "High";
      case Priority.URGENT:
        return "Urgent";
      default:
        return priority;
    }
  };

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: "",
      description: quickTemplate?.description || "",
      contentType: quickTemplate?.contentType || ContentType.BLOG_POST,
      targetLanguage: "en",
      sourceLanguage: "en",
      priority: Priority.MEDIUM,
      finalText: "",
    },
  });

  const onSubmit = async (data: ContentFormData) => {
    // If AI generation is enabled and we don't have generated content yet, show AI preview first
    if (showAiGeneration && !aiGeneratedContent && !showAiPreview) {
      setShowAiPreview(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Use AI-generated content if available, otherwise use the manual content
      const finalContent = aiGeneratedContent || data.finalText || "";

      const result = await createContent({
        campaignId,
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        targetLanguage: data.targetLanguage,
        sourceLanguage: data.sourceLanguage,
        priority: data.priority as Priority,
        finalText: finalContent,
      });

      console.log('Content created successfully:', result.data?.id);

      // Reset form and AI states
      form.reset();
      setAiGeneratedContent("");
      setShowAiPreview(false);
      setShowAiGeneration(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Content creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIPreviewGeneration = async () => {
    if (!aiPrompt.trim()) {
      console.error('AI prompt is required');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const formData = form.getValues();
      console.log('Creating content and generating AI preview with:', {
        model: aiModel,
        prompt: aiPrompt.trim(),
        type: aiGenerationType,
        contentType: formData.contentType,
        title: formData.title,
        description: formData.description
      });

      // First, create the content piece with minimal data
      const contentResult = await createContent({
        campaignId,
        title: formData.title,
        description: formData.description,
        contentType: formData.contentType,
        targetLanguage: formData.targetLanguage,
        sourceLanguage: formData.sourceLanguage,
        priority: formData.priority as Priority,
        finalText: formData.finalText || "", // Start with empty or existing content
      });

      if (!contentResult?.data?.id) {
        throw new Error('Failed to create content piece');
      }

      // Store the created content ID
      setCreatedContentId(contentResult.data.id);

      // Now generate AI content for the created content piece
      const result = await generateAIContent({
        id: contentResult.data.id,
        generateDto: {
          model: aiModel,
          prompt: aiPrompt.trim(),
          type: aiGenerationType,
          userId: "user@example.com", // TODO: Get from auth context
          userName: "User", // TODO: Get from auth context
        },
      });

      console.log('AI preview generation completed:', result);

      // Extract the generated content from the result
      if (result?.data?.aiDraft?.generatedContent) {
        const generatedContent = result.data.aiDraft.generatedContent;
        // Try different possible content fields
        const contentText = generatedContent.body || generatedContent.content || generatedContent.finalText || JSON.stringify(generatedContent);
        setAiGeneratedContent(contentText);
      } else if (result?.data?.content) {
        setAiGeneratedContent(result.data.content);
      } else {
        console.warn('No content found in AI response:', result);
        setAiGeneratedContent("AI content generated successfully! (Content will be processed)");
      }

    } catch (error) {
      console.error("AI preview generation error:", error);
      // Set a mock response for development
      setAiGeneratedContent(`Generated AI content for "${form.getValues().title}":\n\nThis is a sample AI-generated content based on your prompt: "${aiPrompt.trim()}"\n\nContent Type: ${form.getValues().contentType}\nTarget: ${form.getValues().targetLanguage}\n\nThis content would be customized based on your specific requirements and the AI model selected.`);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleAcceptAIContent = async () => {
    if (!createdContentId || !aiGeneratedContent) {
      console.error('Missing content ID or AI content');
      return;
    }

    try {
      // Update the created content with the AI-generated content
      await updateContent({
        id: createdContentId,
        data: {
          finalText: aiGeneratedContent,
        },
      });

      console.log('Content updated with AI-generated content');

      // Reset states and notify success
      setAiGeneratedContent("");
      setShowAiPreview(false);
      setShowAiGeneration(false);
      setCreatedContentId(null);
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating content with AI content:', error);
    }
  };

  const handleRejectAIContent = () => {
    setAiGeneratedContent("");
    setShowAiPreview(false);
    // Keep the created content ID in case they want to try again
  };

  const handleSkipAI = () => {
    setShowAiGeneration(false);
    setCreatedContentId(null);
    if (onSuccess) {
      onSuccess();
    }
  };

  // Use ContentType enum values directly
  const contentTypeOptions = Object.values(ContentType).map((type) => ({
    value: type,
    label: getContentTypeLabel(type),
  }));

  const priorityOptions = Object.values(Priority).map((priority) => ({
    value: priority,
    label: getPriorityLabel(priority),
  }));

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "pt", label: "Portuguese" },
    { value: "it", label: "Italian" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
  ];

  return (
    <>
      {/* Quick Template Indicator */}
      {quickTemplate && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="text-2xl">{quickTemplate.icon}</div>
            <div>
              <div className="font-medium">Creating: {quickTemplate.title}</div>
              <div className="text-sm text-blue-600">
                Template pre-configured for {quickTemplate.description.toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Content Title *</Label>
            <Input
              id="title"
              placeholder="Enter content title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type *</Label>
            <select
              id="contentType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register("contentType")}
            >
              {Object.values(ContentType).map((option) => (
                <option key={option} value={option}>
                  {getContentTypeLabel(option)}
                </option>
              ))}
            </select>
            {form.formState.errors.contentType && (
              <p className="text-sm text-red-600">
                {form.formState.errors.contentType.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the content purpose and requirements..."
            rows={3}
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-600">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Language and Priority */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sourceLanguage">Source Language *</Label>
            <select
              id="sourceLanguage"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register("sourceLanguage")}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.sourceLanguage && (
              <p className="text-sm text-red-600">
                {form.formState.errors.sourceLanguage.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language *</Label>
            <select
              id="targetLanguage"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register("targetLanguage")}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.targetLanguage && (
              <p className="text-sm text-red-600">
                {form.formState.errors.targetLanguage.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <select
              id="priority"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register("priority")}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.priority && (
              <p className="text-sm text-red-600">
                {form.formState.errors.priority.message}
              </p>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-2">
          <Label htmlFor="finalText">Content Body</Label>
          <Textarea
            id="finalText"
            placeholder="Write your content here or leave empty to create later..."
            rows={8}
            {...form.register("finalText")}
          />
          <p className="text-xs text-gray-500">
            You can leave this empty and add the content later, or use AI
            generation tools.
          </p>
          {form.formState.errors.finalText && (
            <p className="text-sm text-red-600">
              {form.formState.errors.finalText.message}
            </p>
          )}
        </div>

        {/* AI Generation Suggestion */}
        {enableAISuggestion && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-purple-800">AI Content Suggestion</h4>
                  <button
                    type="button"
                    onClick={() => setEnableAISuggestion(false)}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Want help creating engaging content? I can generate AI-powered content for your{" "}
                  {quickTemplate?.title.toLowerCase() || form.watch("contentType")} after you save this draft.
                </p>
                <div className="text-xs text-purple-600 mb-2">
                  💡 Check the box below, then create your content to see AI generation options!
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Status: AI Generation is {showAiGeneration ? '✅ ENABLED' : '❌ DISABLED'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-300">
                    <input
                      type="checkbox"
                      id="auto-ai-generate"
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-purple-300 rounded focus:ring-purple-500 focus:ring-2"
                      checked={showAiGeneration}
                      onChange={(e) => setShowAiGeneration(e.target.checked)}
                    />
                    <label htmlFor="auto-ai-generate" className="text-purple-700 font-medium cursor-pointer">
                      ✨ Show AI generation options after creating content
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore AI Suggestion if dismissed */}
        {!enableAISuggestion && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">
                💡 Want AI-powered content generation?
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEnableAISuggestion(true)}
                className="text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                Show AI Options
              </Button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset Form
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : showAiGeneration && !aiGeneratedContent && !showAiPreview ? (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Generate AI Content
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Content
              </>
            )}
          </Button>
        </div>
      </form>

      {/* AI Preview Generation Section */}
      {showAiPreview && (
        <div className="mt-8 p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🤖</div>
            <h3 className="text-xl font-semibold">Generate AI Content Preview</h3>
          </div>

          <p className="text-gray-600 mb-4">
            Generate AI content based on your form data. You can review and accept it before saving.
          </p>

          <div className="space-y-4">
            {/* AI Configuration */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <select
                  id="aiModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={aiModel}
                  onChange={(e) =>
                    setAiModel(e.target.value as "claude" | "openai" | "both")
                  }
                >
                  <option value="claude">🤖 Claude (Recommended)</option>
                  <option value="openai">🧠 OpenAI</option>
                  <option value="both">⚡ Compare Both Models</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiGenerationType">Generation Type</Label>
                <select
                  id="aiGenerationType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={aiGenerationType}
                  onChange={(e) =>
                    setAiGenerationType(
                      e.target.value as "original" | "variation" | "improvement"
                    )
                  }
                >
                  <option value="original">✨ Original Content</option>
                  <option value="variation">🔄 Content Variation</option>
                  <option value="improvement">📈 Content Improvement</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiPrompt">AI Generation Prompt *</Label>
              <Textarea
                id="aiPrompt"
                placeholder={
                  aiGenerationType === "original"
                    ? "Describe what kind of content you want the AI to generate. For example: 'Write a compelling introduction about our new product features, highlighting the benefits for small businesses.'"
                    : aiGenerationType === "variation"
                    ? "Describe how you want the content to be varied. For example: 'Create a more casual version of this content for social media' or 'Make this content more technical for developers.'"
                    : "Describe how you want the existing content to be improved. For example: 'Make this content more engaging by adding statistics and examples' or 'Improve the SEO by adding relevant keywords.'"
                }
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Be specific about the tone, audience, and key points you want to include.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAIPreviewGeneration}
                disabled={!aiPrompt.trim() || isGeneratingPreview}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {aiModel === "both"
                      ? "Comparing Models..."
                      : `Generating with ${aiModel}...`}
                  </>
                ) : aiModel === "both" ? (
                  "⚡ Compare AI Models"
                ) : (
                  `Generate Preview with ${
                    aiModel === "claude" ? "Claude" : "OpenAI"
                  }`
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAiPreview(false)}
                disabled={isGeneratingPreview}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generated Content Preview */}
      {aiGeneratedContent && (
        <div className="mt-8 p-6 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">✨</div>
            <h3 className="text-xl font-semibold">AI Generated Content Preview</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white border rounded-lg">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Generated Content:</Label>
              <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded border min-h-[200px] max-h-[400px] overflow-y-auto">
                {aiGeneratedContent}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAcceptAIContent}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept & Use This Content
              </Button>

              <Button
                variant="outline"
                onClick={handleRejectAIContent}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate Content
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setAiGeneratedContent("");
                  setShowAiGeneration(false);
                }}
              >
                Skip AI Generation
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Next Steps:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li><strong>Accept:</strong> Use this AI-generated content in your content piece</li>
                    <li><strong>Regenerate:</strong> Generate new content with the same or different prompt</li>
                    <li><strong>Skip:</strong> Continue without AI-generated content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
