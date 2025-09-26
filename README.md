# AI Content Workflow Management System

A comprehensive fullstack application for managing content creation, review, translation, and publishing workflows with AI-powered assistance.

## 🚀 Overview

This system provides a complete content management solution that enables teams to:
- Create and manage marketing campaigns
- Generate content with AI assistance
- Review and approve content through structured workflows
- Translate content to multiple languages
- Track content versions and analytics
- Manage content lifecycle from creation to publication

## 📋 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Content Workflow Processes](#-content-workflow-processes)
- [Campaign Management](#-campaign-management)
- [Content Creation](#-content-creation)
- [AI-Powered Features](#-ai-powered-features)
- [Translation Management](#-translation-management)
- [Review & Approval Workflow](#-review--approval-workflow)
- [Content Organization](#-content-organization)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)

## ✨ Features

### 🎯 Campaign Management
- Create and organize marketing campaigns
- Set campaign status (Draft, Active, Paused, Completed, Archived)
- Track campaign statistics and content progress
- Manage target markets and campaign metadata

### 📝 Content Creation & Management
- Support for multiple content types (Blog Posts, Social Media, Emails, Ads, etc.)
- Rich text editing with version history
- Content templates and quick creation options
- Priority-based content organization
- Content duplication and template reuse

### 🤖 AI-Powered Content Generation
- AI content suggestions with Claude and OpenAI integration
- Multiple generation types (Original, Variation, Improvement)
- Contextual prompts for better content quality
- AI content preview and approval workflow
- Mock AI responses for development environments

### 🌍 Translation Management
- Multi-language content translation
- Professional translation workflow
- Translation quality scoring
- Cultural adaptation options
- Translation approval and review process

### 📊 Review & Approval Workflow
- Structured content review process
- Approval workflows with comments and feedback
- Content rejection with detailed explanations
- Review history and audit trails
- Role-based review permissions

### 📈 Analytics & Reporting
- Content performance tracking
- Campaign statistics and insights
- Translation quality metrics
- Review workflow analytics

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fullstack-engineer-ai-content-workflow-challenge
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your database and API keys in .env
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Configure your API endpoints in .env.local
   npm run dev
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npm run migration:run

   # Seed sample data (optional)
   npm run seed
   ```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/content_workflow
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_claude_key_here
JWT_SECRET=your_jwt_secret
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🔄 Content Workflow Processes

### 1. Campaign Creation Process

```mermaid
graph LR
    A[Create Campaign] --> B[Set Basic Info]
    B --> C[Define Target Markets]
    C --> D[Configure Settings]
    D --> E[Save as Draft]
    E --> F[Activate Campaign]
```

**Steps:**
1. **Create New Campaign**
   - Navigate to campaigns page
   - Click "Create Campaign"
   - Fill in campaign details (name, description, target markets)
   - Set initial status and tags

2. **Campaign Configuration**
   - Define target markets and languages
   - Set campaign goals and metadata
   - Configure approval workflows
   - Save as draft or activate immediately

### 2. Content Creation Process

```mermaid
graph TD
    A[Start Content Creation] --> B{Choose Creation Method}
    B -->|Manual| C[Fill Content Form]
    B -->|Template| D[Select Template]
    B -->|AI Assisted| E[Configure AI Generation]

    C --> F[Set Content Details]
    D --> F
    E --> G[AI Preview & Approval]
    G --> F

    F --> H[Review Content]
    H --> I{Content Ready?}
    I -->|No| F
    I -->|Yes| J[Submit for Review]
    J --> K[Content Created]
```

**Manual Content Creation:**
1. **Navigate to Campaign** → Select campaign → Click "Create Content"
2. **Choose Content Type** from available options:
   - Blog Post
   - Social Media Post
   - Email Subject/Content
   - Advertisement Copy
   - Product Description
   - Landing Page Content
   - Headlines
3. **Fill Content Details:**
   - Title and description
   - Target and source languages
   - Priority level (Low, Medium, High, Urgent)
   - Content body/final text
4. **Save and Submit** for review

**AI-Assisted Content Creation:**
1. **Enable AI Generation** by checking "Show AI generation options"
2. **Configure AI Settings:**
   - Select AI model (Claude, OpenAI, or compare both)
   - Choose generation type (Original, Variation, Improvement)
   - Provide detailed prompt describing desired content
3. **Generate Preview** → Review AI-generated content
4. **Accept, Regenerate, or Skip** AI content
5. **Finalize and Submit** content

### 3. Review & Approval Workflow

```mermaid
graph TD
    A[Content Submitted] --> B[Pending Review]
    B --> C{Reviewer Action}
    C -->|Approve| D[Content Approved]
    C -->|Reject| E[Content Rejected]
    C -->|Request Changes| F[Needs Revision]

    D --> G[Ready for Translation]
    E --> H[Back to Author]
    F --> H
    H --> I[Author Revises]
    I --> B

    G --> J[Translation Available]
```

**Review Process:**
1. **Content Submitted for Review** (Draft → Pending Review)
2. **Reviewer Assigned** (automatic or manual assignment)
3. **Review Actions Available:**
   - **Approve:** Content moves to approved status
   - **Reject:** Content moves to rejected with reasons
   - **Request Changes:** Content moves to needs revision
4. **Feedback Loop:** Authors can revise and resubmit
5. **Final Approval:** Content ready for translation/publication

### 4. Translation Workflow

```mermaid
graph TD
    A[Approved Content] --> B[Request Translation]
    B --> C[Configure Translation]
    C --> D[AI Translation]
    D --> E[Translation Review]
    E --> F{Review Result}
    F -->|Approve| G[Translation Approved]
    F -->|Reject| H[Regenerate Translation]
    H --> D
    G --> I[Published Translation]
```

**Translation Process:**
1. **Content Must Be Approved** first
2. **Request Translation:**
   - Navigate to content detail → Translations tab
   - Click "Create Translation"
   - Select target language and model
3. **Configure Translation:**
   - Choose translation type (Literal, Localized, Culturally Adapted)
   - Provide context for better translation quality
   - Select AI model (Claude or OpenAI)
4. **AI Translation Generation:**
   - System generates translation using selected AI model
   - Creates translation record with quality scoring
5. **Translation Review:**
   - Review translated content for accuracy
   - Approve or reject with feedback
   - Request regeneration if needed

## 🎯 Campaign Management

### Campaign States
- **Draft:** Campaign being planned
- **Active:** Campaign running with content creation
- **Paused:** Temporarily halted campaign
- **Completed:** Finished campaign with all content delivered
- **Archived:** Historical campaign for reference

### Campaign Features
- **Content Statistics:** Track approved, pending, rejected content
- **Workflow Status:** Visual indicators of campaign progress
- **Content Organization:** Filter and search campaign content
- **Translation Hub:** Centralized translation management
- **Analytics Dashboard:** Performance metrics and insights

### Campaign Actions
```bash
# Create Campaign
POST /api/campaigns
{
  "name": "Summer Campaign 2024",
  "description": "Summer product launch campaign",
  "targetMarkets": ["US", "EU", "APAC"],
  "status": "draft"
}

# Update Campaign Status
PATCH /api/campaigns/:id
{
  "status": "active"
}
```

## 📝 Content Creation

### Content Types Supported
| Type | Description | Use Case |
|------|-------------|----------|
| `BLOG_POST` | Long-form articles | SEO content, thought leadership |
| `SOCIAL_POST` | Social media content | Twitter, LinkedIn, Facebook posts |
| `EMAIL_SUBJECT` | Email subject lines | Email marketing campaigns |
| `HEADLINE` | Marketing headlines | Landing pages, ads |
| `DESCRIPTION` | Product/service descriptions | E-commerce, catalogs |
| `AD_COPY` | Advertisement content | Google Ads, Facebook Ads |
| `PRODUCT_DESC` | Product descriptions | E-commerce listings |
| `LANDING_PAGE` | Landing page content | Conversion-focused pages |

### Content States
```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PENDING_REVIEW: Submit
    PENDING_REVIEW --> REVIEWED: Review Complete
    REVIEWED --> APPROVED: Approve
    REVIEWED --> REJECTED: Reject
    REVIEWED --> PENDING_REVIEW: Request Changes
    REJECTED --> DRAFT: Revise
    APPROVED --> [*]
```

### Content Properties
- **Basic Info:** Title, description, content type
- **Localization:** Source/target languages
- **Workflow:** Priority, review state, approval status
- **Versioning:** Content history, change tracking
- **Metadata:** Tags, SEO info, custom fields

## 🤖 AI-Powered Features

### AI Content Generation

**Models Supported:**
- **Claude (Recommended):** High-quality, context-aware content
- **OpenAI:** Creative and diverse content generation
- **Compare Both:** Generate with both models for comparison

**Generation Types:**
1. **Original Content:** Create new content from scratch
2. **Content Variation:** Generate alternative versions
3. **Content Improvement:** Enhance existing content

**Configuration Options:**
```typescript
interface AIGenerationConfig {
  model: 'claude' | 'openai' | 'both'
  prompt: string // Detailed instruction for AI
  type: 'original' | 'variation' | 'improvement'
  context?: string // Additional context
  contentType: ContentType
  targetLanguage: string
}
```

**AI Generation Workflow:**
1. **Enable AI Generation** in content creation form
2. **Configure AI Settings** (model, type, prompt)
3. **Generate Preview** → AI creates content preview
4. **Review and Decide:**
   - Accept: Use AI content as final content
   - Regenerate: Try again with same/different settings
   - Skip: Continue without AI assistance

**Best Practices for AI Prompts:**
```bash
# Good Prompt Example
"Write a compelling blog post introduction about sustainable fashion for millennials.
Focus on environmental impact, trendy options, and budget-friendly choices.
Tone should be informative yet conversational. Include a hook that mentions
surprising statistics about fashion waste."

# Poor Prompt Example
"Write about fashion"
```

### Mock AI Responses
For development environments without API keys, the system provides realistic mock responses:
- Content varies by content type and prompt
- Includes metadata like confidence scores
- Simulates realistic generation delays

## 🌍 Translation Management

### Translation Architecture

**Current System (Quick Fix Implementation):**
- **Original Content:** Master content piece in source language
- **Translation Records:** Separate translation entities linked to original
- **Translated Content Pieces:** Full content pieces in target languages (hidden by default)
- **UI Filter:** `excludeTranslations=true` by default to show clean content lists

**Translation Visibility:**
- **Default View:** Shows only original content pieces (clean, organized)
- **Toggle View:** "Show all (including translations)" reveals translated content pieces
- **Content Detail:** Translations accessible via "Translations" tab for original content
- **Translation Indicators:** Clear visual markers for translated content when visible

### Translation Features

**Translation Types:**
- **Literal:** Direct word-for-word translation
- **Localized:** Adapted for local language norms
- **Culturally Adapted:** Customized for cultural context

**Quality Metrics:**
- **Confidence Score:** AI-generated quality assessment
- **Human Review:** Professional translator validation
- **Cultural Notes:** Context and adaptation notes

**Translation UI:**
- **Content Detail → Translations Tab:** View all translations of original content
- **Translation Hub:** Campaign-wide translation management
- **Translation Detail Modal:** Side-by-side comparison
- **Translation Banner:** Clear indicator when viewing translated content with link to original

### Translation API Examples

```bash
# Create Translation
POST /api/content/:id/translate
{
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "model": "claude",
  "translationType": "localized",
  "context": "Marketing content for Spanish-speaking millennials"
}

# Approve Translation
POST /api/translations/:id/approve
{
  "reviewerId": "reviewer@company.com",
  "comments": "Translation approved with minor cultural adaptations"
}
```

## 📊 Review & Approval Workflow

### Review States

| State | Description | Next Actions |
|-------|-------------|--------------|
| `DRAFT` | Initial content creation | Submit for Review |
| `AI_SUGGESTED` | AI-generated content | Review and Edit |
| `PENDING_REVIEW` | Awaiting reviewer | Approve/Reject/Request Changes |
| `REVIEWED` | Review completed | Final Approval Decision |
| `APPROVED` | Content approved | Ready for Translation/Publishing |
| `REJECTED` | Content rejected | Revise and Resubmit |

### Review Actions

**Approve Content:**
```bash
POST /api/content/:id/approve
{
  "reviewerId": "reviewer@company.com",
  "reviewerName": "John Doe",
  "comments": "Content approved. Great work on the messaging.",
  "publishImmediately": false
}
```

**Reject Content:**
```bash
POST /api/content/:id/reject
{
  "reviewerId": "reviewer@company.com",
  "reason": "Content needs better alignment with brand voice",
  "suggestions": "Consider using more conversational tone and include customer testimonials"
}
```

### Review Workflow Features
- **Comment System:** Detailed feedback and suggestions
- **Review History:** Complete audit trail
- **Batch Actions:** Review multiple items simultaneously
- **Notification System:** Toast notifications for actions
- **Role-Based Access:** Different permissions per role

## 🗂️ Content Organization

### Content Filtering & Search

**Filter Options:**
- **Campaign:** Filter by specific campaign
- **Content Type:** Filter by content type (with proper labels)
- **Review State:** Filter by approval status
- **Priority:** Filter by urgency level
- **Language:** Filter by target language
- **Date Range:** Filter by creation/update dates
- **Translation Status:** Include/exclude translations

**Search Capabilities:**
- **Full-text search** across title, description, and content
- **Campaign name search**
- **Tag-based filtering**
- **Advanced search with multiple criteria**

### Content Views

**Default View (Translations Hidden):**
- Shows only original content pieces
- Clean, focused content list
- Accurate campaign statistics
- Toggle available: "Show all (including translations)"

**Show All Content:**
- Includes translated content pieces
- Clear visual indicators for translations
- Orange "Translation" badges on translated content
- Blue "Including translations" indicator in list header

**Content List Features:**
- **Grid View:** Card-based display with visual indicators
- **Sorting:** By date, priority, status, title
- **Visual Indicators:** Translation badges, priority colors, status badges
- **Quick Actions:** Edit, view, duplicate

### Content Detail Views

**Content Detail Tabs:**
1. **Content Details:** Basic info, metadata, content body
2. **Translations:** All translations for this content (original content only)
3. **Version History:** Content change tracking

**Translation Indicators:**
- **Blue Banner:** "This is a Translation" with original content link
- **Orange Badges:** Translation markers in content lists
- **Language Info:** Source → Target language display
- **Navigation:** Easy access to original content

## 🔧 API Documentation

### Campaign Endpoints
```bash
# List Campaigns
GET /api/campaigns?page=1&limit=10&status=active

# Get Campaign
GET /api/campaigns/:id

# Create Campaign
POST /api/campaigns
{
  "name": "Campaign Name",
  "description": "Campaign description",
  "targetMarkets": ["US", "EU"],
  "status": "draft"
}

# Update Campaign
PATCH /api/campaigns/:id
{
  "status": "active"
}
```

### Content Endpoints
```bash
# List Content (excludes translations by default)
GET /api/content?campaignId=123&reviewState=approved&excludeTranslations=true

# List All Content (includes translations)
GET /api/content?campaignId=123&excludeTranslations=false

# Get Content
GET /api/content/:id

# Create Content
POST /api/content
{
  "campaignId": "uuid",
  "title": "Content Title",
  "contentType": "blog_post",
  "targetLanguage": "en",
  "finalText": "Content body..."
}

# Update Content
PATCH /api/content/:id
{
  "title": "Updated Title",
  "finalText": "Updated content..."
}
```

### Translation Endpoints
```bash
# Get Content Translations
GET /api/content/:id/translations

# Create Translation
POST /api/content/:id/translate
{
  "targetLanguage": "es",
  "model": "claude",
  "translationType": "localized"
}

# Approve Translation
POST /api/translations/:id/approve
{
  "reviewerId": "reviewer@company.com",
  "comments": "Approved"
}
```

### AI Generation Endpoints
```bash
# Generate AI Content
POST /api/content/:id/generate-ai
{
  "model": "claude",
  "prompt": "Write engaging content about...",
  "type": "original",
  "userId": "user@company.com"
}

# Get AI Drafts
GET /api/content/:id/ai-drafts?model=claude&limit=5
```

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Sonner** for toast notifications
- **Lucide React** for icons

**Backend:**
- **NestJS** framework with TypeScript
- **PostgreSQL** database
- **TypeORM** for database operations
- **JWT** authentication
- **Swagger** API documentation
- **Class Validator** for request validation

**AI Integration:**
- **OpenAI API** integration
- **Anthropic Claude API** integration
- **Fallback mock responses** for development
- **Error handling** and retry logic

### Database Schema

**Key Entities:**
- **Campaigns:** Campaign management and organization
- **ContentPieces:** Main content entities with workflow states
- **Translations:** Translation records linked to original content
- **Reviews:** Review and approval records with audit trail
- **AIDrafts:** AI-generated content versions
- **ContentVersions:** Version history tracking

**Translation Architecture (Current):**
```sql
-- Dual approach for translation management
-- 1. Translation entities (proper approach)
Translation {
  id: uuid
  contentPieceId: uuid (links to original)
  sourceLanguage: string
  targetLanguage: string
  translatedContent: json
  qualityScore: number
  isHumanReviewed: boolean
}

-- 2. ContentPiece references (legacy approach - hidden in UI)
ContentPiece {
  id: uuid
  translationOf: uuid (nullable)
  -- other fields
}

-- UI Filter Logic
-- Default: WHERE translationOf IS NULL (clean view)
-- Toggle: Show all content including translations
```

### Content Organization Strategy

**Filter Implementation:**
```typescript
// Backend: excludeTranslations filter
if (filters.excludeTranslations) {
  queryBuilder.andWhere("content.translationOf IS NULL");
}

// Frontend: Hook-level filtering
const useContentList = (filters) => {
  const filtersWithDefaults = {
    excludeTranslations: true, // Default behavior
    ...filters,
  }
  // API call with filters
}

const useAllContentList = (filters) => {
  const filtersWithOverride = {
    ...filters,
    excludeTranslations: false, // Override for special cases
  }
  // API call with overridden filters
}
```

### Deployment

**Environment Setup:**
```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:password@prod_host:5432/content_workflow
OPENAI_API_KEY=prod_openai_key
ANTHROPIC_API_KEY=prod_claude_key
JWT_SECRET=production_jwt_secret
CORS_ORIGIN=https://yourdomain.com
```

**Docker Deployment:**
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

## 📚 Use Case Examples

### Use Case 1: Creating a Marketing Campaign

**Scenario:** Launch a new product campaign with multi-language content

**Steps:**
1. **Create Campaign**
   ```bash
   Campaign: "Summer Product Launch 2024"
   Target Markets: US, Spain, France
   Content Goals: 10 blog posts, 20 social media posts, 5 email campaigns
   ```

2. **Create Content with AI**
   ```bash
   Content Type: Blog Post
   Title: "Revolutionary Summer Tech: What You Need to Know"
   Language: English (source)
   AI Assistance: Enabled
   AI Prompt: "Write compelling blog post about innovative summer technology..."
   ```

3. **AI Generation & Review**
   ```bash
   AI generates preview content
   User reviews and accepts AI content
   Content status: Draft → AI_Suggested → Pending Review
   ```

4. **Review & Approve**
   ```bash
   Reviewer approves with minor edits
   Status: Draft → Pending Review → Approved
   ```

5. **Translate Content**
   ```bash
   Translate to Spanish (localized for Spain market)
   Translate to French (culturally adapted for France)
   Translation review and approval process
   ```

6. **Campaign Management**
   ```bash
   Track all content pieces in campaign dashboard
   Monitor translation progress
   Campaign status: Draft → Active → Completed
   ```

### Use Case 2: Translation Quality Control

**Scenario:** Ensuring high-quality Spanish translations for Mexican market

**Steps:**
1. **Source Content (English)**
   ```bash
   Title: "5 Ways to Boost Your Productivity This Summer"
   Content: Professional productivity advice for knowledge workers
   Status: Approved
   ```

2. **Request Translation**
   ```bash
   Target: Spanish (Mexico)
   Type: Culturally Adapted
   Context: "Professional content for Mexican knowledge workers"
   Model: Claude
   ```

3. **AI Translation Process**
   ```bash
   AI generates translation with cultural adaptations
   Quality Score: 0.92
   Cultural Notes: Adapted formal address and local business culture
   ```

4. **Translation Review**
   ```bash
   Human reviewer checks accuracy and cultural fit
   Minor adjustments for local expressions
   Final approval for Mexican market
   Status: Translation Approved
   ```

### Use Case 3: Content Organization & Management

**Scenario:** Content manager organizing large campaign with multiple content types

**Steps:**
1. **Campaign Overview**
   ```bash
   Campaign: "Global Product Launch"
   Content: 50+ pieces across 8 languages
   Types: Blog posts, social media, emails, ads
   ```

2. **Content Organization**
   ```bash
   Default View: Shows 50 original content pieces (clean)
   Filter by Type: Blog posts only (10 pieces)
   Filter by Status: Pending review (15 pieces)
   Search: "productivity" (5 matching pieces)
   ```

3. **Translation Management**
   ```bash
   Toggle: "Show all including translations"
   View: Now shows 200+ pieces (original + translations)
   Visual Indicators: Orange badges on translated content
   Organization: Easy to distinguish original vs translated
   ```

4. **Content Detail Navigation**
   ```bash
   View Original Content: See all translations in Translations tab
   View Translated Content: Blue banner with link to original
   Translation Hub: Campaign-wide translation status
   ```

## 🚦 Translation Architecture Notes

### Current Implementation (Quick Fix)

The system currently uses a **dual approach** for handling translations:

1. **Translation Entities (Recommended):** Proper translation records linked to original content
2. **Content Piece References (Legacy):** Translated content pieces with `translationOf` field

**UI Strategy:**
- **Default View:** Hide translated content pieces (`excludeTranslations=true`)
- **Toggle View:** Show all content including translations
- **Visual Indicators:** Clear marking of translated content when visible
- **Navigation:** Easy access between original and translated content

### Future Refactor Considerations

For long-term architectural improvement, consider:
- **Single Translation Entity Approach:** Eliminate dual architecture
- **Data Migration:** Move translated content piece data to translation records
- **API Cleanup:** Simplify translation-related endpoints
- **UI Consistency:** Unified translation management interface

**Documentation Available:**
- **Quick Fix Implementation:** `/backend/docs/translation-quick-fix-implementation.md`
- **Full Refactor Plan:** `/backend/docs/translation-architecture-refactor-plan.md`

## 🚀 Getting Support

### Documentation
- **API Documentation:** Available at `/api/docs` when backend is running
- **Architecture Documentation:** See `/backend/docs/` directory
- **Translation Architecture:** See translation-specific documentation files

### Development
- **Issues:** Report bugs and feature requests via GitHub issues
- **Contributing:** Follow TypeScript and NestJS best practices
- **Testing:** Run `npm test` in backend, `npm run test` in frontend

### Configuration
- **Environment Setup:** Copy and configure `.env.example` files
- **Database Setup:** Run migrations with `npm run migration:run`
- **AI API Keys:** Configure OpenAI/Anthropic keys for full AI functionality
- **Mock Mode:** System works without API keys using mock responses

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for modern content teams**

*This system demonstrates a complete content workflow solution with AI integration, translation management, and robust review processes. The architecture balances immediate usability with long-term scalability considerations.*