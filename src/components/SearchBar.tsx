import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;       // default: 500
  showShortcut?: boolean;    // default: true (Cmd+K)
  isLoading?: boolean;       // controlled loading state
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search your screenshots...',
  debounceMs = 500,
  showShortcut = true,
  isLoading = false
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search with loading state
  useEffect(() => {
    // Only trigger search for non-empty queries
    if (query.trim()) {
      const timer = setTimeout(() => {
        onSearch(query);
      }, debounceMs);

      return () => clearTimeout(timer);
    }
  }, [query, onSearch, debounceMs]);

  // Keyboard shortcut handler (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // macOS: Cmd+K, Windows/Linux: Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear search query
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          size={20} 
        />
        <Input 
          ref={inputRef}
          type="text" 
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-12 bg-background border-muted focus:ring-2 focus:ring-primary/50"
        />
        
        {/* Dynamic right-side icon: loading spinner or clear button */}
        {isLoading ? (
          <Loader2 
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" 
            size={20} 
          />
        ) : query && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          >
            <X size={20} className="text-muted-foreground" />
          </Button>
        )}
      </div>
      
      {/* Keyboard Shortcut Hint */}
      {showShortcut && (
        <div className="text-xs text-muted-foreground mt-1 text-center">
          Press Cmd/Ctrl + K to focus
        </div>
      )}
    </div>
  );
};