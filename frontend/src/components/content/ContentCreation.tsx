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
  const { mutateAsync: createContent } = useCreateContent();
  const { mutateAsync: generateAIContent, isPending: isGeneratingAI } =
    useGenerateAIContent();

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
    setIsSubmitting(true);
    try {
      const result = await createContent({
        campaignId,
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        targetLanguage: data.targetLanguage,
        sourceLanguage: data.sourceLanguage,
        priority: data.priority as Priority,
        finalText: data.finalText || "",
      });

      // Store the created content ID for AI generation
      if (result?.data?.id && showAiGeneration) {
        setCreatedContentId(result.data.id);
        setShowAiGeneration(true);
      } else if (result?.data?.id && !showAiGeneration) {
        // Content created successfully without AI generation
        if (onSuccess) {
          onSuccess();
        }
      }

      form.reset();
    } catch (error) {
      console.error("Content creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIGeneration = async () => {
    if (!createdContentId || !aiPrompt.trim()) return;

    try {
      await generateAIContent({
        id: createdContentId,
        generateDto: {
          model: aiModel,
          prompt: aiPrompt.trim(),
          type: aiGenerationType,
          userId: "user@example.com", // TODO: Get from auth context
          userName: "User", // TODO: Get from auth context
        },
      });

      setAiPrompt("");
      setShowAiGeneration(false);
      setCreatedContentId(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("AI generation error:", error);
    }
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
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="auto-ai-generate"
                      className="rounded border-purple-300"
                      checked={showAiGeneration}
                      onChange={(e) => setShowAiGeneration(e.target.checked)}
                    />
                    <label htmlFor="auto-ai-generate" className="text-purple-700">
                      Show AI generation options after creating content
                    </label>
                  </div>
                </div>
              </div>
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
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Content
              </>
            )}
          </Button>
        </div>
      </form>

      {/* AI Content Generation Section */}
      {showAiGeneration && (
        <div className="mt-8 p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🤖</div>
            <h3 className="text-xl font-semibold">Generate AI Content</h3>
          </div>

          <p className="text-gray-600 mb-4">
            Your content piece has been created successfully! Now you can
            generate AI content to populate it with engaging text.
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
                  <option value="variation">Content Variation</option>
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
                Be specific about the tone, audience, and key points you want to
                include.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAIGeneration}
                disabled={!aiPrompt.trim() || isGeneratingAI}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {aiModel === "both"
                      ? "Comparing Models..."
                      : `Generating with ${aiModel}...`}
                  </>
                ) : aiModel === "both" ? (
                  "⚡ Compare AI Models"
                ) : (
                  `Generate with ${
                    aiModel === "claude" ? "Claude" : "OpenAI"
                  }`
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSkipAI}
                disabled={isGeneratingAI}
              >
                Skip AI Generation
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>AI Generation Process:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>The AI will analyze your prompt and content type</li>
                    <li>Generated content will be added as an AI draft</li>
                    <li>
                      You can review and approve the content before publishing
                    </li>
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
