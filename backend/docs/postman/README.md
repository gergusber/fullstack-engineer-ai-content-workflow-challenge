# AI Content Workflow - Postman Testing Guide

This directory contains complete Postman collections and documentation for testing the AI Content Workflow API.

## 📁 Files Included

- **`complete-workflow-examples.md`** - Detailed step-by-step documentation with examples
- **`AI-Content-Workflow.postman_collection.json`** - Importable Postman collection
- **`AI-Content-Workflow.postman_environment.json`** - Environment variables setup

## 🚀 Quick Setup

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Upload `AI-Content-Workflow.postman_collection.json`
4. Collection will appear in your sidebar

### 2. Import Environment

1. In Postman, go to **Environments** tab
2. Click **Import**
3. Upload `AI-Content-Workflow.postman_environment.json`
4. Select the environment from dropdown (top-right)

### 3. Start Backend Server

```bash
cd backend
npm run start:dev
```

### 4. Verify Setup

1. Run the first request: **"Create Campaign"**
2. Check if `campaignId` is automatically saved to environment
3. Proceed with sequential testing

## 📋 Collection Structure

```
📁 AI Content Workflow
├── 📁 1. Campaign Management
│   ├── Create Campaign ✨ (Run First)
│   ├── Get Campaign
│   └── Campaign Stats
├── 📁 2. Content Creation
│   ├── Create Content Piece ✨ (Run Second)
│   └── Get Content Piece
├── 📁 3. Review Workflow
│   ├── Submit for Review ✨ (Run Third)
│   ├── Update Review State ✨ (Run Fourth)
│   ├── Approve Content ✨ (Run Fifth)
│   └── Reject Content (Alternative)
├── 📁 4. AI Translation
│   ├── Translate to Spanish ✨ (Run Sixth)
│   ├── Translate to German
│   ├── Translate to French
│   └── Translate to Italian
├── 📁 5. Translation Review
│   ├── Review Spanish Translation
│   ├── Approve Spanish Translation
│   └── Review German Translation
└── 📁 6. Content Listing & Search
    ├── List All Content
    ├── Filter by Campaign
    ├── Filter by Review State
    └── Filter by Language
```

## ⚡ Essential Workflow (Starred Items ✨)

**Run these requests in sequence for complete workflow:**

1. **Create Campaign** → Saves `campaignId`
2. **Create Content Piece** → Saves `contentId`
3. **Submit for Review** → Changes state to `pending_review`
4. **Update Review State** → Changes state to `reviewed`
5. **Approve Content** → Changes state to `approved`
6. **Translate to Spanish** → Creates translation, saves `spanishContentId`

## 🔧 Environment Variables

These are automatically populated during workflow:

| Variable | Description | Auto-Populated By |
|----------|-------------|-------------------|
| `baseUrl` | API base URL | Pre-configured |
| `campaignId` | Campaign UUID | Create Campaign |
| `contentId` | Original content UUID | Create Content Piece |
| `spanishContentId` | Spanish translation UUID | Translate to Spanish |
| `germanContentId` | German translation UUID | Translate to German |
| `frenchContentId` | French translation UUID | Translate to French |
| `italianContentId` | Italian translation UUID | Translate to Italian |

## 📊 Success Indicators

### ✅ Campaign Created

```json
{
  "success": true,
  "data": {
    "id": "campaign-uuid-here",
    "status": "draft"
  }
}
```

### ✅ Content Approved

```json
{
  "success": true,
  "data": {
    "reviewState": "approved"
  }
}
```

### ✅ Translation Success

```json
{
  "success": true,
  "data": {
    "translationResult": {
      "qualityScore": 0.92,
      "culturalNotes": "Adapted for Spanish market",
      "translationStrategy": "Localized approach"
    }
  }
}
```

## 🔍 Testing Different Scenarios

### Translation Types

- **Literal**: Word-for-word translation
- **Localized**: Natural language adaptation
- **Culturally Adapted**: Full market adaptation

### AI Models

- **Claude**: Generally better for creative content
- **OpenAI**: Good for technical content

### Target Languages

- **Spanish (es)**: Both Spain and Latin America
- **German (de)**: Formal business culture
- **French (fr)**: Linguistic precision focus
- **Italian (it)**: Fashion heritage consideration

## 🚨 Common Issues

### 1. Content Not Approved Error

```json
{
  "statusCode": 400,
  "message": "Content must be approved before translation"
}
```

**Solution**: Run the approval workflow first (steps 3-5)

### 2. Campaign Not Found

```json
{
  "statusCode": 404,
  "message": "Campaign with ID xxx not found"
}
```

**Solution**: Ensure `campaignId` is set in environment

### 3. Translation API Error

```json
{
  "statusCode": 500,
  "message": "Translation failed: API key not configured"
}
```

**Solution**: Configure AI API keys in backend `.env` file

## 📈 Quality Metrics to Monitor

- **Quality Score**: Should be > 0.8 for good translations
- **Confidence Score**: AI's confidence in translation quality
- **Response Time**: API response time for performance monitoring
- **Cultural Notes**: Indicates proper cultural adaptation

## 💡 Pro Tips

1. **Sequential Testing**: Always run requests in order for dependencies
2. **Save Variables**: Use test scripts to auto-save IDs
3. **Monitor Quality**: Check quality scores in responses
4. **Test Edge Cases**: Try different content types and languages
5. **Validate Workflow**: Ensure each step completes before next

## 🛠️ Advanced Usage

### Custom Content Types

Modify the content creation request to test different content types:

- `blog_post`
- `social_media`
- `email_marketing`
- `product_description`

### Bulk Testing

Use Postman Runner to execute the entire workflow automatically:

1. Select the collection
2. Click **Run Collection**
3. Configure iterations and delay
4. Monitor results dashboard

## 📞 Support

For issues with the API or Postman collection:

1. Check server logs: `npm run start:dev`
2. Verify environment variables are set
3. Ensure database is running and migrated
4. Check API documentation at `/api/docs` (Swagger)

Happy testing! 🎉