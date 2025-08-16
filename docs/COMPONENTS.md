# Visual Memory Search - Component Guide

## Core Components

### SearchBar
**File:** `src/components/SearchBar.tsx`
**Purpose:** Handle user search input and query processing

**Props:**
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showShortcut?: boolean;
}
```

### SearchResults
**File:** `src/components/SearchResults.tsx`
**Purpose:** Display search results with ranking and interaction

**Props:**
```typescript
interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
  onResultClick: (result: SearchResult) => void;
  emptyMessage?: string;
}
```

### UploadZone
**File:** `src/components/UploadZone.tsx`
**Purpose:** Handle screenshot file uploads with drag-and-drop

**Props:**
```typescript
interface UploadZoneProps {
  onUploadComplete: (screenshotIds: Id<"screenshots">[]) => void;
  onUploadProgress: (progress: UploadProgress[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}
```

### ImagePreviewModal
**File:** `src/components/ImagePreviewModal.tsx`
**Purpose:** Display full-screen preview of selected screenshot

**Props:**
```typescript
interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: Screenshot;
  showOcrOverlay?: boolean;
  showDescription?: boolean;
}
```

### Stats
**File:** `src/components/Stats.tsx`
**Purpose:** Display user's screenshot collection statistics

**Props:**
```typescript
interface StatsProps {
  totalScreenshots: number;
  storageUsed: number;
}
```

## UI Components (shadcn/ui)

- Button
- Card
- Input
- Alert
- Badge
- Dialog
- Dropdown Menu
- Form Elements

## Advanced Features

### OCR Processing
**File:** `src/lib/ocr.ts`
- Extracts text from images
- Supports multiple languages
- High accuracy text recognition

### Search Algorithm
**File:** `src/lib/search.tsx`
- Hybrid search across text and visual descriptions
- Confidence scoring
- Relevance ranking
- Semantic search capabilities

## Performance Optimization Techniques
- Debounced search
- Memoized components
- Lazy loading
- Efficient state management
- Timeout handling for search requests

## Accessibility Considerations
- Keyboard navigation support
- Screen reader friendly
- High color contrast
- Responsive design
- ARIA attributes for interactive elements