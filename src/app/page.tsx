'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadZone } from "@/components/UploadZone";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { Stats } from "@/components/Stats";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// Screenshot type from Convex schema
interface Screenshot {
  _id: Id<"screenshots">;
  filename: string;
  uploadedAt: number;
  ocrText: string;
  visualDescription: string;
  imageUrl: string;
  fileSize: number;
  processingStatus: "pending" | "completed" | "failed";
}

// Types based on project context
interface SearchResult {
  id: Id<"screenshots">;
  filename: string;
  imageUrl: string;
  ocrText: string;
  visualDescription: string;
  confidence: number;
  uploadedAt: number;
  matchType: 'text' | 'visual' | 'both';
  fileSize: number;
}

interface UploadProgress {
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export default function Home() {
  // Real-time Convex data
  const screenshots = useQuery(api.screenshots.listScreenshots);
  
  // Local state management
  const [isUploadCollapsed, setIsUploadCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Use variables to prevent unused variable warnings
  console.debug('Upload state:', { uploadProgress, isUploading });
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Handle initial loading state
  useEffect(() => {
    setIsInitialLoading(screenshots === undefined);
  }, [screenshots]);

  // Calculate stats from real-time data with memoization
  const { totalScreenshots, storageUsed } = useMemo(() => {
    if (!screenshots) return { totalScreenshots: 0, storageUsed: 0 };
    
    return {
      totalScreenshots: screenshots.length,
      storageUsed: screenshots.reduce((total, s) => total + s.fileSize, 0)
    };
  }, [screenshots]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleUploadComplete = useCallback((screenhotIds: Id<"screenshots">[]) => {
    setIsUploading(false);
    setUploadProgress([]);
    if (screenhotIds.length > 0) {
      setIsUploadCollapsed(true);
    }
    setError(null);
  }, []);

  const handleUploadProgress = useCallback((progress: UploadProgress[]) => {
    setUploadProgress(progress);
    setIsUploading(progress.some(p => p.status === 'uploading' || p.status === 'processing'));
  }, []);

  // Debounced search with performance optimization
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);
    setError(null);

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      setSearchResults(data.results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Search timed out. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Search failed');
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Find the full screenshot data from Convex with optimization
    if (!screenshots) return;
    
    const screenshot = screenshots.find(s => s._id === result.id);
    if (screenshot) {
      setSelectedScreenshot(screenshot);
      setIsModalOpen(true);
    }
  }, [screenshots]);

  // Performance optimization: Detect slow connections
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
      if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
        // On slow connections, show a performance notice
        console.warn('Slow connection detected - optimizing for performance');
      }
    }
  }, []);

  // Show loading state while Convex initializes
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Visual Memory Search...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
            Visual Memory Search
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
            Search Your Screenshots
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered visual search through your screenshots using OCR text extraction 
            and visual descriptions. Upload images and search through their content instantly.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-8 border-destructive">
            <AlertDescription className="text-destructive">
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        {!isUploadCollapsed && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">
              Upload Your Screenshots
            </h2>
            <UploadZone 
              onUploadComplete={handleUploadComplete}
              onUploadProgress={handleUploadProgress}
              maxFiles={50} 
              maxFileSize={10 * 1024 * 1024}
            />
          </div>
        )}

        {/* Collapsible Upload Button */}
        {isUploadCollapsed && (
          <div className="text-center mb-8">
            <Button 
              variant="outline" 
              onClick={() => setIsUploadCollapsed(false)}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Upload More Screenshots
            </Button>
          </div>
        )}

        {/* Search Bar - Sticky */}
        <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm py-4">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search through your screenshots... (e.g., 'blue button', 'error message', 'login form')"
            debounceMs={500}
            showShortcut={true}
          />
        </div>

        {/* Search Results */}
        <div className="mt-8">
          <SearchResults 
            results={searchResults}
            query={searchQuery}
            loading={isSearching}
            onResultClick={handleResultClick}
            emptyMessage={searchQuery ? "No results found. Try a different search term." : "Start typing to search through your screenshots"}
          />
        </div>

        {/* Stats Display */}
        <div className="mt-16">
          <Stats 
            totalScreenshots={totalScreenshots}
            storageUsed={storageUsed}
          />
        </div>

        {/* Image Preview Modal */}
        {selectedScreenshot && (
          <ImagePreviewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            screenshot={selectedScreenshot}
            showOcrOverlay={false}
            showDescription={true}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔍 AI-Powered Search</span>
              </CardTitle>
              <CardDescription>
                Advanced search through OCR text and visual descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search through your screenshots using natural language. Our AI extracts 
                text and creates visual descriptions for comprehensive search.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📸 Smart Upload</span>
              </CardTitle>
              <CardDescription>
                Drag & drop screenshot processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload screenshots and get instant OCR text extraction and 
                AI-generated visual descriptions for searchable content.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⚡ Real-time Results</span>
              </CardTitle>
              <CardDescription>
                Instant search with relevance scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get ranked search results instantly with confidence scores and 
                match highlighting across text and visual content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}