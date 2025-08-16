import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showShortcut?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search your screenshots...',
  debounceMs = 500,
  showShortcut = true
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search to reduce unnecessary calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
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

  return (
    <div className="relative w-full max-w-md">
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" 
        size={20} 
      />
      <Input 
        ref={inputRef}
        type="text" 
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 bg-background border-muted focus:ring-2 focus:ring-primary/50"
      />
      {showShortcut && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hidden md:block">
          Cmd+K
        </kbd>
      )}
    </div>
  );
};