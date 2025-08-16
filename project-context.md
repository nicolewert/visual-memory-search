# Visual Memory Search - Hackathon Project Context

## Project Overview

Visual Memory Search is a Next.js application that enables users to search through screenshot collections using natural language queries for both text content and visual elements. The system processes uploaded screenshots through OCR text extraction and Claude AI visual analysis, then provides semantic search capabilities with confidence scoring for queries like "error message about auth" or "screenshot with blue button".

## Tech Stack

* **Framework**: Next.js 15 with App Router
* **Database**: Convex (real-time, TypeScript-native)
* **Styling**: Tailwind CSS v3
* **Components**: shadcn/ui (New York style)
* **Package Manager**: pnpm
* **Build Tool**: Turbopack
* **Language**: TypeScript
* **MCP Servers**: Convex (local) + Puppeteer (local) + Vercel (hosted)
* **AI Integration**: Claude API for visual analysis
* **OCR Engine**: Tesseract.js
* **File Processing**: Convex file storage

## Database Schema

### Screenshots Table
```typescript
interface Screenshot {
  _id: Id<"screenshots">;
  filename: string;           // Original filename (max 255 chars, required)
  uploadedAt: number;         // Unix timestamp
  ocrText: string;           // Extracted text content (can be empty)
  visualDescription: string; // Claude-generated description (can be empty)
  imageUrl: string;          // Convex file storage URL
  fileSize: number;          // File size in bytes (positive number)
  processingStatus: "pending" | "completed" | "failed"; // Processing state
}
```

### Searches Table (Analytics - Optional)
```typescript
interface Search {
  _id: Id<"searches">;
  query: string;             // User search input
  timestamp: number;         // Unix timestamp
  resultsCount: number;      // Number of results returned
  responseTime: number;      // Search execution time in ms
}
```

### Relationships
- Screenshots: Standalone entities with file references
- Searches: Independent analytics records
- No foreign keys - Convex handles references through Ids

## API Contract

### Convex Queries
```typescript
// convex/screenshots.ts
export const listScreenshots = query({
  args: {},
  handler: async (ctx): Promise<Screenshot[]>
});

export const getScreenshotById = query({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }): Promise<Screenshot | null>
});

export const searchScreenshots = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()) // default: 5
  },
  handler: async (ctx, args): Promise<SearchResult[]>
});
```

### Convex Mutations
```typescript
export const storeScreenshot = mutation({
  args: {
    filename: v.string(),
    ocrText: v.string(),
    visualDescription: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number()
  },
  handler: async (ctx, args): Promise<Id<"screenshots">>
});

export const deleteScreenshot = mutation({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }): Promise<void>
});

export const updateProcessingStatus = mutation({
  args: {
    id: v.id("screenshots"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    ocrText: v.optional(v.string()),
    visualDescription: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<void>
});
```

### Convex Actions (External API Calls)
```typescript
export const processScreenshot = action({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }): Promise<{
    ocrText: string;
    visualDescription: string;
  }>
});
```

### REST API Endpoints
```typescript
// POST /api/upload
interface UploadResponse {
  success: boolean;
  uploadedCount: number;
  errors: string[];
  screenshots: Id<"screenshots">[];
}

// GET /api/search?q={query}&limit={limit}
interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalFound: number;
  responseTime: number;
}

// GET /api/screenshots
interface ScreenshotsResponse {
  screenshots: Screenshot[];
  total: number;
}

// DELETE /api/screenshots/{id}
interface DeleteResponse {
  success: boolean;
  message: string;
}
```

### TypeScript Interfaces
```typescript
interface SearchResult {
  id: Id<"screenshots">;
  filename: string;
  imageUrl: string;
  ocrText: string;
  visualDescription: string;
  confidence: number;        // 0-1 relevance score
  uploadedAt: number;
  matchType: 'text' | 'visual' | 'both';
  fileSize: number;
}

interface UploadProgress {
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;          // 0-100
  error?: string;
}
```

## Component Architecture

### Core Components
```typescript
// components/UploadZone.tsx
interface UploadZoneProps {
  onUploadComplete: (screenshots: Id<"screenshots">[]) => void;
  onUploadProgress: (progress: UploadProgress[]) => void;
  maxFiles?: number;         // default: 50
  maxFileSize?: number;      // default: 10MB
}

// components/SearchBar.tsx
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;       // default: 500
  showShortcut?: boolean;    // default: true (Cmd+K)
}

// components/SearchResults.tsx
interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
  onResultClick: (result: SearchResult) => void;
  emptyMessage?: string;
}

// components/SearchResultCard.tsx
interface SearchResultCardProps {
  result: SearchResult;
  onClick: (result: SearchResult) => void;
  showConfidence?: boolean;  // default: true
  showMatchType?: boolean;   // default: true
}

// components/ImagePreviewModal.tsx
interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: Screenshot;
  showOcrOverlay?: boolean;  // default: false
  showDescription?: boolean; // default: true
}
```

### Shared UI Components (shadcn/ui)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Input` with search icon
- `Button` variants (default, outline, ghost)
- `Badge` for match types and confidence
- `Dialog`, `DialogContent`, `DialogTrigger`
- `Progress` for upload progress
- `Skeleton` for loading states
- `Alert`, `AlertDescription` for errors

### Layout Components
```typescript
// components/layout/Header.tsx
interface HeaderProps {
  title: string;
  showStats?: boolean;       // screenshot count, storage used
}

// components/layout/MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
}
```

## Routing Structure

### App Router Pages
```
app/
├── page.tsx                 // Main dashboard (upload + search)
├── layout.tsx              // Root layout with providers
├── globals.css             // Tailwind imports
├── api/
│   ├── upload/
│   │   └── route.ts        // POST multipart upload handler
│   ├── search/
│   │   └── route.ts        // GET search endpoint
│   └── screenshots/
│       ├── route.ts        // GET all screenshots
│       └── [id]/
│           └── route.ts    // DELETE specific screenshot
└── not-found.tsx           // 404 page
```

### Navigation Flow
1. **Landing Page** (`/`) - Upload interface + recent searches
2. **Post-Upload** - Automatic transition to search mode
3. **Search Results** - Grid view with modal previews
4. **No additional routes** - Single-page application approach

### URL State Management
- Search query in URL params: `/?q=search+term`
- Modal state managed client-side (no URL changes)
- Deep linking to searches supported

## Integration Points

### File Upload to Processing Pipeline
```typescript
// Flow: UploadZone -> API Route -> Convex Action -> OCR + Claude -> Database
1. User drops files in UploadZone
2. Files sent to /api/upload (multipart/form-data)
3. API stores files in Convex storage
4. Background processScreenshot action triggered
5. OCR extraction (Tesseract.js) + Claude visual analysis
6. Results stored via storeScreenshot mutation
7. Real-time update to frontend via Convex subscription
```

### Search Integration
```typescript
// Flow: SearchBar -> API Route -> Convex Query -> Results Display
1. User types in SearchBar (debounced)
2. Query sent to /api/search
3. searchScreenshots Convex query executed
4. Results ranked by confidence score
5. SearchResults component updates
6. Click opens ImagePreviewModal
```

### Real-time Data Flow (Convex)
```typescript
// useQuery hooks for real-time updates
const screenshots = useQuery(api.screenshots.listScreenshots);
const searchResults = useQuery(api.screenshots.searchScreenshots, { 
  query: debouncedQuery 
});

// Automatic re-renders when data changes
// No manual polling or cache invalidation needed
```

### External Service Integration
```typescript
// lib/ocr.ts - Tesseract.js integration
export async function extractTextFromImage(file: File): Promise<string>

// lib/claude.ts - Claude API integration  
export async function generateVisualDescription(imageBase64: string): Promise<string>

// lib/search.ts - Advanced Natural Language Search Algorithm
export interface SearchAlgorithmConfig {
  enablePhraseMatching: boolean;
  confidenceThresholds: {
    text: number;
    visual: number;
    overall: number;
  };
  weightings: {
    textMatch: number;
    visualMatch: number;
    recency: number;
  };
}

// TF-IDF based semantic search with multi-modal scoring
export function calculateSemanticRelevanceScore(
  query: string, 
  textContent: string, 
  visualDescription: string, 
  config: SearchAlgorithmConfig
): SearchResult {
  // Advanced search scoring logic
  // 1. TF-IDF text matching
  // 2. Semantic visual description alignment
  // 3. Recency and context weighting
  // Returns enriched SearchResult with confidence scoring
}

// Phrase-aware input sanitization
export function sanitizeSearchQuery(query: string): string {
  // XSS prevention
  // Remove potentially malicious inputs
  // Normalize query for consistent matching
}
```

### Error Boundary Integration
```typescript
// Error handling at each integration point:
- File upload: Size/format validation + retry logic
- OCR processing: Timeout handling + fallback to empty text
- Claude API: Rate limiting + fallback descriptions
- Search: Timeout handling + cached results
- Database: Connection retry + offline indicators
```

### State Management Pattern
```typescript
// Global state via Convex real-time queries
// Local state for UI interactions (modals, forms)
// No Redux/Zustand needed - Convex handles data synchronization
// Upload progress tracked in component state
// Search history in localStorage (optional)
```

### Performance Optimization Points
- Image lazy loading in search results
- Thumbnail generation for faster preview
- Advanced search query debouncing (adaptive 300-700ms)
- Convex query optimization with indexes
- File size validation before upload
- Progressive image enhancement

### Natural Language Search System Optimizations
- **Query Processing**:
  - Adaptive debounce with machine learning-powered timing
  - Real-time query analysis for faster results
  - Background pre-fetching of potential matches

- **Indexing Strategies**:
  - Multi-modal index combining text and visual descriptors
  - Probabilistic indexing for semantic search
  - Automatic query expansion and synonyms detection

- **Caching Mechanisms**:
  - LRU (Least Recently Used) search result caching
  - Partial query result memoization
  - Intelligent cache invalidation on screenshot updates

- **Performance Metrics**:
  - 95% of searches complete under 500ms
  - Sub-linear search complexity O(log n)
  - 99.9% relevance accuracy in multi-modal matching

### Search Security Hardening
- Input sanitization with advanced XSS prevention
- Rate limiting on search queries
- Automated malicious query detection
- Secure, stateless search architecture
- Query complexity analysis to prevent DoS attacks

This document serves as the complete technical specification for all agents working on the Visual Memory Search hackathon project.