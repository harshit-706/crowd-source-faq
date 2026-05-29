import React, { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import type { SearchResult } from '../../types/ui';

interface SearchBarProps {
  onResults: (results: SearchResult[] | null) => void;
  onLoading: (loading: boolean) => void;
  value?: string;
  onQueryChange?: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  {
    onResults,
    onLoading,
    value,
    onQueryChange,
    placeholder = 'Ask anything about your internship...',
    onFocus,
    onBlur,
    className = '',
  },
  ref
) {
  const [internalQuery, setInternalQuery] = useState<string>('');
  const isControlled = value !== undefined;
  const query = isControlled ? (value ?? '') : internalQuery;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      onResults(null);
      return;
    }

    onLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      onResults(data.results as SearchResult[]);
    } catch (error) {
      console.error('Search failed:', error);
      onResults([]);
    } finally {
      onLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isControlled) {
      onQueryChange?.(val);
    } else {
      setInternalQuery(val);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 3) {
      debounceRef.current = setTimeout(() => handleSearch(val), 600);
    } else {
      onResults(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    handleSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="relative search-glow rounded-[26px] transition-all duration-300">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 13L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <input
          ref={ref}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full pl-12 pr-32 py-5 sm:py-[22px] rounded-[26px] border border-border/70 bg-cream text-sm sm:text-base text-ink placeholder-ink-faint focus:outline-none focus:border-accent/50 focus:bg-white transition-all duration-300 shadow-[0_14px_34px_rgba(0,0,0,0.08)]"
        />

        <button
          type="submit"
          disabled={!query.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-hover active:bg-accent-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-80">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Search
        </button>
      </div>
    </form>
  );
});

export default SearchBar;