# Campaign and AI Translation Workflow

This document outlines the complete workflow for creating campaigns and requesting AI translations in the content management system.

## 🎯 Overview

The system supports a comprehensive workflow from campaign creation to multi-language content generation using AI translation services. The process involves campaign management, content creation, review workflows, and automated translation with quality control.

## 📋 Workflow Phases

### **Phase 1: Campaign Creation**

Create a new marketing campaign that will contain content pieces in multiple languages.

**Endpoint:**

```http
POST /api/campaigns
```

**Request Body:**

```json
{
  "name": "Summer 2024 Product Launch",
  "description": "A comprehensive campaign for our summer collection targeting international markets",
  "status": "draft",
  "targetMarkets": ["US", "ES", "DE", "FR", "IT"],
  "tags": ["product-launch", "summer", "international", "social-media"],
  "createdBy": "campaign-manager@company.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Summer 2024 Product Launch",
    "status": "draft",
    "targetMarkets": ["US", "ES", "DE", "FR", "IT"],
    "tags": ["product-launch", "summer", "international", "social-media"],
    "createdAt": "2024-07-15T10:30:00Z"
  },
  "message": "Campaign created successfully"
}
```

### **Phase 2: Content Piece Creation**

Create the original content piece that will serve as the source for translations.

**Endpoint:**

```http
POST /api/content
```

**Request Body:**

```json
{
  "campaignId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Summer Fashion Trends 2024",
  "description": "A comprehensive guide showcasing the versatility of our summer collection for young professionals",
  "contentType": "blog_post",
  "sourceLanguage": "en",
  "targetLanguage": "en",
  "priority": "medium",
  "originalPrompt": "Write a blog post about summer fashion trends for young professionals, focusing on versatile pieces that work for both work and weekend",
  "contentMetadata": {
    "seoKeywords": ["summer", "fashion", "trends", "professional"],
    "targetAudience": "young professionals",
    "estimatedWordCount": 1500
  },
  "createdBy": "content-creator@company.com"
}
```

### **Phase 3: AI Content Generation** *(Optional)*

Generate AI content for the original piece before translation.

**Endpoint:** *(Currently commented out in codebase)*

```http
POST /api/content/{contentId}/generate-ai-content
```

**Expected Request Body:**

```json
{
  "prompt": "Write a comprehensive blog post about summer fashion trends for young professionals",
  "model": "claude",
  "temperature": 0.7,
  "maxTokens": 2000,
  "userId": "content-generator@company.com"
}
```

### **Phase 4: Content Review Process**

Submit content for review before translation to ensure quality and translation readiness.

#### 4.1 Submit for Review

**Endpoint:**

```http
POST /api/content/{contentId}/submit-for-review
```

**Request Body:**

```json
{
  "reviewerIds": ["reviewer1@company.com", "translator-coordinator@company.com"],
  "priority": "high",
  "comments": "Please review for translation readiness and international market adaptation"
}
```

#### 4.2 Review State Management

**Endpoint:**

```http
PATCH /api/content/{contentId}/review-state
```

**Request Body:**

```json
{
  "newState": "pending_review",
  "reviewType": "content_review",
  "action": "approve",
  "comments": "Content meets quality standards and is ready for translation",
  "reviewerId": "reviewer@company.com",
  "reviewerName": "John Smith",
  "reviewerRole": "Content Editor"
}
```

#### 4.3 Approve Content

**Endpoint:**

```http
POST /api/content/{contentId}/approve
```

**Request Body:**

```json
{
  "reviewerId": "reviewer@company.com",
  "reviewerName": "John Smith",
  "comments": "Content approved for translation. Ready for international markets.",
  "publishImmediately": false
}
```

### **Phase 5: AI Translation Request**

Request AI translation for approved content.

**Endpoint:** *(Currently commented out in codebase)*

```http
POST /api/content/{contentId}/translate
```

**Expected Request Body:**

```json
{
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "translationType": "localized",
  "context": "Professional fashion content for Spanish market, maintain professional tone while adapting cultural references",
  "model": "claude",
  "userId": "translator@company.com"
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "originalContent": {
      "id": "original-content-id",
      "title": "Summer Fashion Trends 2024"
    },
    "translation": {
      "translatedTitle": "Tendencias de Moda Verano 2024",
      "translatedContent": "Content translated by AI...",
      "qualityScore": 0.92
    },
    "translationMetadata": {
      "sourceLanguage": "en",
      "targetLanguage": "es",
      "model": "claude",
      "translatedAt": "2024-07-15T14:30:00Z"
    }
  },
  "message": "Content translated to es successfully"
}
```

### **Phase 6: Translation Content Management**

Create a new content piece for the translation, linked to the original.

**Endpoint:**

```http
POST /api/content
```

**Request Body:**

```json
{
  "campaignId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Tendencias de Moda Verano 2024",
  "description": "Una guía completa que muestra la versatilidad de nuestra colección de verano para jóvenes profesionales",
  "contentType": "blog_post",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "translationOf": "original-content-uuid",
  "finalText": "El verano ha llegado y con él la oportunidad perfecta de renovar tu guardarropa...",
  "contentMetadata": {
    "translationQuality": "professional",
    "aiModel": "claude",
    "humanReviewed": false,
    "culturalAdaptation": "localized"
  },
  "versionHistory": [
    {
      "version": 1,
      "text": "AI generated translation...",
      "editedBy": "ai-translator",
      "editedAt": "2024-07-15T14:30:00Z",
      "changeReason": "Initial AI translation"
    }
  ],
  "createdBy": "ai-translation-service"
}
```

### **Phase 7: Translation Review Workflow**

Review and approve translated content with specialized translation review process.

#### 7.1 Translation Quality Review

**Endpoint:**

```http
PATCH /api/content/{translationId}/review-state
```

**Request Body:**

```json
{
  "newState": "pending_review",
  "reviewType": "translation_review",
  "action": "approve",
  "comments": "Translation maintains original meaning while adapting to Spanish market culture",
  "suggestions": "Consider adjusting some cultural references for better local relevance",
  "reviewerId": "translation-reviewer@company.com",
  "reviewerName": "María García",
  "reviewerRole": "Translation Editor"
}
```

#### 7.2 Final Translation Approval

**Endpoint:**

```http
POST /api/content/{translationId}/approve
```

**Request Body:**

```json
{
  "reviewerId": "translation-manager@company.com",
  "reviewerName": "Carlos Rodriguez",
  "comments": "Translation approved for Spanish market. Ready for publication.",
  "publishImmediately": true
}
```

### **Phase 8: Translation Rejection & Revision**

If translation needs improvement:

**Endpoint:**

```http
POST /api/content/{translationId}/reject
```

**Request Body:**

```json
{
  "reviewerId": "translation-reviewer@company.com",
  "reviewerName": "María García",
  "reason": "Translation needs cultural adaptation improvements for Spanish market",
  "suggestions": "Revise fashion terminology to use more common Spanish terms. Adapt cultural references to Spanish context."
}
```

## 🗄️ Data Structure Relationships

```
Campaign
├── id: UUID
├── name: "Summer 2024 Product Launch"
├── targetMarkets: ["US", "ES", "DE", "FR", "IT"]
├── tags: ["product-launch", "international"]
└── ContentPieces[]
    ├── Original Content (English)
    │   ├── id: UUID
    │   ├── sourceLanguage: "en"
    │   ├── targetLanguage: "en"
    │   ├── translationOf: null
    │   ├── reviewState: "approved"
    │   ├── AIDrafts[] (AI generation history)
    │   ├── Reviews[] (approval workflow)
    │   └── Translations[] (separate translation entity)
    │
    ├── Spanish Translation
    │   ├── id: UUID
    │   ├── sourceLanguage: "en"
    │   ├── targetLanguage: "es"
    │   ├── translationOf: "original-content-uuid"
    │   ├── reviewState: "approved"
    │   └── Reviews[] (translation-specific reviews)
    │
    └── German Translation
        ├── id: UUID
        ├── sourceLanguage: "en"
        ├── targetLanguage: "de"
        ├── translationOf: "original-content-uuid"
        └── reviewState: "pending_review"
```

## 📊 Review State Lifecycle

Content pieces follow a strict state lifecycle:

```
draft → ai_suggested → pending_review → reviewed → approved | rejected
```

**State Definitions:**
- `draft` - Initial content creation
- `ai_suggested` - AI has generated content suggestions
- `pending_review` - Submitted for human review
- `reviewed` - Review completed, awaiting final decision
- `approved` - Content approved for publication/translation
- `rejected` - Content needs revision

## 🎯 Translation Types

The system supports different translation approaches:

- **`literal`** - Direct word-for-word translation
- **`localized`** - Adapted for local language conventions
- **`culturally_adapted`** - Full cultural adaptation for target market

## 🔍 API Endpoints Summary

### Campaign Management
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/{id}` - Get specific campaign
- `PATCH /api/campaigns/{id}` - Update campaign
- `DELETE /api/campaigns/{id}` - Delete campaign
- `GET /api/campaigns/{id}/stats` - Campaign statistics

### Content Management
- `POST /api/content` - Create content piece
- `GET /api/content` - List content with filters
- `GET /api/content/{id}` - Get specific content
- `PATCH /api/content/{id}` - Update content
- `DELETE /api/content/{id}` - Delete content

### Review Workflow
- `POST /api/content/{id}/submit-for-review` - Submit for review
- `PATCH /api/content/{id}/review-state` - Update review state
- `POST /api/content/{id}/approve` - Approve content
- `POST /api/content/{id}/reject` - Reject content

### AI Integration *(Planned)*
- `POST /api/content/{id}/generate-ai-content` - Generate AI content
- `POST /api/content/{id}/translate` - Request AI translation
- `POST /api/content/{id}/improve` - AI content improvement

## 🚀 Implementation Status

- ✅ **Campaign CRUD** - Fully implemented
- ✅ **Content CRUD** - Fully implemented with translation linking
- ✅ **Review Workflow** - Complete state management system
- ✅ **Translation Entity** - Database schema ready
- ✅ **Translation DTOs** - Request/response structures defined
- ⚠️ **AI Translation Service** - Endpoints defined but not implemented
- ⚠️ **AI Content Generation** - Framework ready, service pending

## 🔮 Next Implementation Steps

To complete the AI translation workflow:

1. **Implement AI Service Integration**
   - Create `AIService` class
   - Integrate with translation APIs (OpenAI, Claude, etc.)
   - Add error handling and retry logic

2. **Enable Translation Endpoints**
   - Uncomment translation routes in `ContentController`
   - Implement translation request processing
   - Add translation result storage

3. **Enhanced Translation Management**
   - Bulk translation operations
   - Translation memory integration
   - Quality scoring and metrics

4. **Advanced Features**
   - Real-time translation status updates
   - Translation comparison tools
   - Automated quality assessment

## 📝 Usage Examples

### Complete Workflow Example

```bash
# 1. Create Campaign
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Global Product Launch",
    "targetMarkets": ["US", "ES", "DE"],
    "tags": ["product-launch", "international"]
  }'

# 2. Create Original Content
curl -X POST http://localhost:3001/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-uuid",
    "title": "Product Features Guide",
    "contentType": "blog_post",
    "sourceLanguage": "en"
  }'

# 3. Submit for Review
curl -X POST http://localhost:3001/api/content/{id}/submit-for-review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewerIds": ["reviewer@company.com"],
    "comments": "Ready for translation review"
  }'

# 4. Approve for Translation
curl -X POST http://localhost:3001/api/content/{id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "reviewerId": "reviewer@company.com",
    "reviewerName": "John Doe",
    "comments": "Approved for Spanish translation"
  }'

# 5. Request Translation (when implemented)
curl -X POST http://localhost:3001/api/content/{id}/translate \
  -H "Content-Type: application/json" \
  -d '{
    "targetLanguage": "es",
    "translationType": "localized",
    "model": "claude"
  }'
```

This workflow ensures quality control, proper review processes, and maintains translation relationships for effective international content management.