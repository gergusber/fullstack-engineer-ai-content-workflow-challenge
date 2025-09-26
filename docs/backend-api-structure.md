# Backend API Structure Documentation

## 🏗️ Overview

This document provides comprehensive documentation for the AI Content Workflow backend API structure. The backend is built with NestJS and provides robust APIs for campaign management, content creation, AI integration, translation workflows, and review processes.

## 🎯 API Architecture

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT-based authentication (planned)
- **Validation**: Class Validator with DTOs
- **Documentation**: Swagger/OpenAPI integration
- **AI Integration**: OpenAI and Anthropic Claude APIs
- **Caching**: Built-in caching for performance optimization

### Core Principles
- **RESTful Design**: Standard HTTP methods and status codes
- **Type Safety**: TypeScript throughout the entire stack
- **Validation**: Request/response validation with DTOs
- **Error Handling**: Comprehensive error responses with proper status codes
- **Documentation**: Auto-generated Swagger documentation
- **Scalability**: Modular architecture for easy extension

## 📚 API Modules

### 1. Campaigns Module (`/api/campaigns`)

**Purpose**: Manage marketing campaigns and their lifecycle

**Endpoints**:
- `GET /` - List all campaigns with filtering and pagination
- `POST /` - Create a new campaign
- `GET /:id` - Get specific campaign details
- `PATCH /:id` - Update campaign information
- `DELETE /:id` - Delete a campaign
- `GET /:id/statistics` - Get campaign performance statistics

**Key Features**:
- Campaign status management (Draft, Active, Paused, Completed, Archived)
- Target market and audience management
- Campaign statistics and analytics
- Content association and tracking
- Bulk operations support

**Data Model**:
- Campaign entity with status tracking
- Target markets and metadata
- Creation and modification timestamps
- Relationship with content pieces

### 2. Content Module (`/api/content`)

**Purpose**: Core content management with AI integration and workflows

#### Core Content Operations
- `GET /` - List content with advanced filtering and pagination
- `POST /` - Create new content piece
- `GET /:id` - Get detailed content information
- `PATCH /:id` - Update content piece
- `DELETE /:id` - Delete content piece

#### AI Integration Endpoints
- `POST /:id/generate-ai` - Generate AI content variations
- `POST /:id/compare-ai-models` - Compare outputs from different AI models
- `GET /:id/ai-drafts` - Get AI-generated drafts for content

#### Translation Management
- `POST /:id/translate` - Create AI translation for content
- `GET /:id/translations` - Get all translations for content piece
- `GET /:id/translations/details` - Get detailed translation overview
- `GET /translations/pending` - Get pending translations queue
- `POST /translations/:id/approve` - Approve a translation
- `POST /translations/:id/reject` - Reject a translation
- `GET /translations/dashboard` - Translation dashboard data

#### Review Workflow
- `POST /:id/submit-for-review` - Submit content for review
- `POST /:id/approve` - Approve content piece
- `POST /:id/reject` - Reject content with feedback
- `PATCH /:id/review-state` - Update review state

**Key Features**:
- Multiple content types support (Blog Post, Social Media, Email, Ads, etc.)
- Review state management with workflow automation
- Priority-based organization (Low, Medium, High, Urgent)
- Version history and change tracking
- AI-powered content generation with mock fallbacks
- Multi-language translation support
- Quality scoring and assessment

**Data Models**:
- ContentPiece entity with comprehensive metadata
- Translation entity for proper translation records
- AIDraft entity for AI-generated variations
- ContentVersion entity for version tracking

### 3. Translation Management

**Purpose**: Comprehensive translation workflow management

**Key Features**:
- **Dual Architecture Support**: Translation entities + ContentPiece references
- **AI Translation**: Integration with Claude and OpenAI for automated translation
- **Quality Assessment**: Confidence scoring and quality metrics
- **Human Review**: Professional translator validation workflows
- **Cultural Adaptation**: Support for cultural context and localization
- **Bulk Operations**: Efficient handling of multiple translations

**Translation Types**:
- **Literal**: Direct word-for-word translation
- **Localized**: Adapted for local language norms
- **Culturally Adapted**: Customized for cultural context

**Quality Management**:
- AI confidence scoring (0.0-1.0)
- Human review validation
- Cultural adaptation notes
- Translation context preservation

### 4. AI Integration

**Purpose**: AI-powered content generation and translation

**Supported Models**:
- **Claude (Anthropic)**: High-quality, context-aware content generation
- **OpenAI**: Creative and diverse content generation
- **Model Comparison**: Side-by-side comparison capabilities

**Generation Types**:
- **Original Content**: Create new content from scratch
- **Content Variation**: Generate alternative versions
- **Content Improvement**: Enhance existing content
- **Translation**: AI-powered translation services
- **Content Summary**: Generate summaries and abstracts

**Key Features**:
- Mock response system for development without API keys
- Quality scoring and confidence assessment
- Context-aware generation with user prompts
- Model performance comparison
- Generation history and tracking

### 5. Review Workflow System

**Purpose**: Structured content review and approval processes

**Review States**:
- **Draft**: Initial content creation state
- **AI_Suggested**: Content generated or enhanced by AI
- **Pending_Review**: Submitted for human review
- **Reviewed**: Review completed, awaiting final decision
- **Approved**: Content approved for publication/translation
- **Rejected**: Content rejected with feedback for revision

**Key Features**:
- Reviewer assignment and workload distribution
- Review deadline tracking and notifications
- Detailed feedback and comment systems
- Review history and audit trails
- Bulk review operations for efficiency
- Integration with campaign status automation

## 🔧 Technical Implementation

### Database Architecture

**Core Entities**:
- **Campaign**: Campaign management with status and metadata
- **ContentPiece**: Main content entities with workflow states
- **Translation**: Translation records with quality scoring
- **AIDraft**: AI-generated content variations
- **ContentVersion**: Version history tracking
- **User**: User management for authentication (planned)

**Relationships**:
- Campaign → ContentPieces (One-to-Many)
- ContentPiece → Translations (One-to-Many)
- ContentPiece → AIDrafts (One-to-Many)
- ContentPiece → ContentVersions (One-to-Many)
- ContentPiece → ContentPiece (Self-referencing for translations)

### Data Transfer Objects (DTOs)

**Validation Features**:
- Request validation with Class Validator
- Response transformation with proper typing
- Error handling with detailed validation messages
- Optional and required field management

**Key DTOs**:
- **CreateCampaignDto**: Campaign creation with validation
- **CreateContentDto**: Content creation with type safety
- **TranslateContentDto**: Translation request parameters
- **GenerateAIContentDto**: AI generation configuration
- **ApproveContentDto**: Content approval with reviewer information
- **RejectContentDto**: Content rejection with detailed feedback

### Service Layer Architecture

**Separation of Concerns**:
- **Controllers**: HTTP request handling and response formatting
- **Services**: Business logic and data manipulation
- **Repositories**: Data access and database operations
- **Guards**: Authentication and authorization (planned)
- **Interceptors**: Request/response transformation and logging

**Key Services**:
- **CampaignsService**: Campaign management and statistics
- **ContentService**: Content CRUD and workflow management
- **AIService**: AI integration and content generation
- **TranslationService**: Translation workflow management
- **EmailService**: Notification and communication (planned)

## 🚀 API Features

### Filtering and Pagination

**Content Filtering**:
- Campaign association filtering
- Content type filtering
- Review state filtering
- Language filtering (source and target)
- Priority-based filtering
- Date range filtering
- Translation exclusion filtering (`excludeTranslations` parameter)

**Pagination Support**:
- Page-based pagination with configurable limits
- Total count and page information in responses
- Efficient database queries with proper indexing

### Search Capabilities

**Full-Text Search**:
- Content title and description search
- Campaign name search
- Tag-based search functionality
- Multi-criteria search with filters

### Response Format

**Standardized Responses**:
```
{
  "success": boolean,
  "data": any,
  "message": string,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

**Error Responses**:
```
{
  "success": false,
  "message": string,
  "statusCode": number,
  "timestamp": string,
  "path": string
}
```

## 🔐 Security and Validation

### Input Validation

**Request Validation**:
- DTO-based validation with Class Validator
- Type safety with TypeScript interfaces
- Custom validation rules for business logic
- Sanitization of user input

**Data Integrity**:
- Foreign key constraints
- Unique constraints where appropriate
- Cascade deletion for related entities
- Transaction support for complex operations

### Error Handling

**Comprehensive Error Management**:
- HTTP status code standardization
- Detailed error messages for debugging
- User-friendly error responses
- Validation error aggregation

**Error Types**:
- **400 Bad Request**: Invalid input or validation errors
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflicts (e.g., duplicate names)
- **500 Internal Server Error**: Server-side errors with logging

## 📊 Performance Optimization

### Caching Strategy

**Query Optimization**:
- Efficient database queries with proper joins
- Indexing on frequently queried fields
- Eager loading for related entities when appropriate
- Pagination to limit response sizes

**Response Optimization**:
- Data transformation at the service layer
- Minimal data transfer with selective field inclusion
- Compression for large responses

### Database Optimization

**Indexing Strategy**:
- Primary key indexing (automatic)
- Foreign key indexing for relationships
- Composite indexes for multi-field queries
- Text search indexing for content search

**Query Performance**:
- Optimized JOIN operations
- Selective field loading
- Batch operations for bulk updates
- Connection pooling for concurrent requests

## 🧪 Development Features

### Mock AI Integration

**Development Support**:
- Mock AI responses when API keys are not configured
- Realistic mock data for different content types
- Configurable response delays for testing
- Quality scoring simulation

**Testing Capabilities**:
- Unit tests for service layer logic
- Integration tests for API endpoints
- Mock database for isolated testing
- Automated testing with CI/CD integration

### Documentation

**Swagger Integration**:
- Auto-generated API documentation
- Interactive API testing interface
- Request/response schema documentation
- Authentication documentation (when implemented)

**Code Documentation**:
- TypeScript interfaces for type safety
- JSDoc comments for complex logic
- README files for module-specific documentation
- Architecture decision records (ADRs)

## 🔄 Translation Architecture

### Current Implementation (Quick Fix)

**Dual Approach**:
- **Translation Entities**: Proper translation records with quality metrics
- **ContentPiece References**: Legacy support with `translationOf` field
- **UI Filtering**: Frontend filtering to hide translated content pieces by default

**Benefits**:
- **Non-Breaking**: Existing functionality preserved
- **User-Friendly**: Clean content lists without translation clutter
- **Flexible**: Can show/hide translations based on user needs
- **Future-Ready**: Foundation for full architectural refactor

### Translation Workflow

**Creation Process**:
1. Content must be approved before translation
2. AI translation generation with model selection
3. Quality scoring and confidence assessment
4. Human review and approval process
5. Cultural adaptation notes and context

**Quality Management**:
- Confidence scoring (0.0-1.0)
- Human review validation
- Cultural adaptation notes
- Translation type tracking (literal, localized, culturally adapted)

## 🚦 API Status and Roadmap

### Current Status ✅

**Implemented Features**:
- Complete campaign management with statistics
- Comprehensive content CRUD operations
- AI integration with mock fallbacks
- Translation workflow with quality assessment
- Review and approval processes
- Advanced filtering and search capabilities
- Translation architecture quick fix

**Tested and Validated**:
- All CRUD operations working correctly
- AI integration with both real and mock responses
- Translation creation and approval workflows
- Content filtering including translation exclusion
- Error handling and validation

### Future Enhancements

**Authentication and Authorization**:
- JWT-based authentication system
- Role-based access control (RBAC)
- User management and permissions
- API key management for external integrations

**Advanced Features**:
- Real-time notifications with WebSocket support
- Advanced analytics and reporting
- Bulk operations for all entities
- Export/import functionality
- Audit logging and compliance features

**Performance Improvements**:
- Redis caching for frequently accessed data
- Database query optimization
- Rate limiting for API protection
- CDN integration for static assets

## 📈 Monitoring and Observability

### Logging

**Structured Logging**:
- Request/response logging with correlation IDs
- Error logging with stack traces
- Performance metrics logging
- Business event logging for audit trails

### Health Checks

**System Health Monitoring**:
- Database connectivity checks
- External API health checks (AI services)
- Memory and CPU usage monitoring
- Application startup and shutdown logging

### Metrics

**Key Performance Indicators**:
- API response times
- Error rates by endpoint
- Database query performance
- AI service usage and costs
- Translation workflow efficiency

This backend API provides a robust, scalable foundation for the AI Content Workflow system, with comprehensive features for content management, AI integration, and translation workflows while maintaining high performance and reliability standards! 🎯