# Visual Memory Search - API Reference

## Convex Schema

### Screenshots Table
```typescript
{
  filename: string;            // Original filename
  uploadedAt: number;          // Timestamp of upload
  ocrText: string;             // Extracted text via OCR
  visualDescription: string;   // AI-generated visual description
  imageUrl: string;            // URL of uploaded image
  fileSize: number;            // Size of the image file
  processingStatus: "pending" | "completed" | "failed";
}
```

### Search Indices
- `search_content`: Enables full-text search on `ocrText`
- Indices: `by_uploaded_at`, `by_processing_status`

## API Endpoints

### Search API
`GET /api/search`

**Parameters:**
- `q`: Search query (required)
- `limit`: Maximum number of results (optional, default: 5)

**Response:**
```typescript
{
  results: SearchResult[];
  total: number;
  query: string;
}

interface SearchResult {
  id: Id<"screenshots">;
  filename: string;
  imageUrl: string;
  ocrText: string;
  visualDescription: string;
  confidence: number;
  matchType: 'text' | 'visual' | 'both';
}
```

### Screenshot Upload API
`POST /api/upload`

**Request Body:**
- Multipart form data with files
- Maximum 50 files
- Maximum file size: 10MB per file

**Response:**
```typescript
{
  uploadedScreenshots: Id<"screenshots">[];
  processingStatus: "pending" | "completed";
}
```

## Convex Functions

### Screenshots Functions
- `listScreenshots()`: Retrieve all processed screenshots
- `getScreenshotById(id)`: Get detailed screenshot by ID
- `searchScreenshots(query)`: Perform AI-powered search

### Search Tracking Functions
- `logSearch(query, resultsCount, responseTime)`: Log search analytics

## Authentication & Permissions
- Current version: Public access
- Future: User-based authentication and permission system

## Rate Limits
- Search: 100 queries per minute
- Upload: 50 files per session
- Total storage: 1GB per user (future implementation)

## Error Handling
- 400: Invalid request parameters
- 429: Rate limit exceeded
- 500: Internal server error
- 503: Service temporarily unavailable

## Performance Metrics
- Average Search Response Time: < 500ms
- OCR Processing Time: < 2s per image
- Visual Description Generation: < 1s per image