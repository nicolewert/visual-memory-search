import React from 'react';
import { SearchResultCard } from './SearchResultCard';
import { SearchResult } from '@/lib/search';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

export interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  emptyMessage?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  loading = false,
  onResultClick,
  emptyMessage = "No screenshots found matching your search."
}) => {
  // Query validation (short query warning)
  if (query && query.length < 2) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please enter a more specific search query (minimum 2 characters).
        </AlertDescription>
      </Alert>
    );
  }

  // Loading skeleton for initial search or when loading
  if (loading) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground mb-4">
          Searching...
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state when no results
  if (!loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle 
          size={48} 
          className="text-muted-foreground mb-4 opacity-50" 
        />
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        {query && (
          <p className="text-sm text-muted-foreground/70 mt-2">
            Try different keywords, alternate phrasings, or broaden your search
          </p>
        )}
      </div>
    );
  }

  // Results grid with counter
  return (
    <div className="p-4">
      {/* Results counter */}
      <div className="text-sm text-muted-foreground mb-4">
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <SearchResultCard 
            key={result.id} 
            result={result}
            searchQuery={query}
            onClick={() => onResultClick && onResultClick(result)}
          />
        ))}
      </div>
    </div>
  );
};