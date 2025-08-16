'use client';

import React, { useState } from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { ImagePreviewModal } from './ImagePreviewModal';
import { SearchResult } from '@/lib/search';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export const SearchDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [responseTime, setResponseTime] = useState<number>(0);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const endTime = Date.now();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setResponseTime(endTime - startTime);
      setQuery(searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const closeModal = () => {
    setSelectedResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Visual Memory Search Demo
            {loading && <Badge variant="secondary">Searching...</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search through your screenshots..."
              showShortcut={true}
            />
            
            {responseTime > 0 && (
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Found {results.length} results</span>
                <span>in {responseTime}ms</span>
              </div>
            )}
            
            {error && (
              <div className="p-4 border border-destructive/20 rounded-md bg-destructive/10">
                <p className="text-destructive font-medium">Search Error:</p>
                <p className="text-destructive/80">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SearchResults
        results={results}
        query={query}
        loading={loading}
        onResultClick={handleResultClick}
        emptyMessage={query ? "No screenshots found matching your search." : "Start typing to search through your screenshots..."}
      />

      {selectedResult && (
        <ImagePreviewModal
          isOpen={true}
          onClose={closeModal}
          screenshot={selectedResult}
          showOcrOverlay={false}
          showDescription={true}
          searchQuery={query}
        />
      )}
    </div>
  );
};