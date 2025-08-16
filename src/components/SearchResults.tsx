import React from 'react';
import { SearchResultCard } from './SearchResultCard';
import { SearchResult } from '@/lib/search';
import { Skeleton } from '@/components/ui/skeleton';
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
  // Loading skeleton for initial search or when loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <Skeleton 
            key={index} 
            className="h-[200px] w-full rounded-xl bg-background/50" 
          />
        ))}
      </div>
    );
  }

  // Empty state when no results
  if (!loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle 
          size={48} 
          className="text-muted mb-4 opacity-50" 
        />
        <p className="text-muted text-lg">{emptyMessage}</p>
        {query && (
          <p className="text-sm text-muted/70 mt-2">
            Try different keywords or check your spelling
          </p>
        )}
      </div>
    );
  }

  // Results grid
  return (
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
  );
};