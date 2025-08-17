'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { MagnifyingGlassIcon, BuildingOfficeIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { searchSuggestions, trackEvent } from '../../lib/api';
import { Suggestion } from '../../types';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

function SuggestionItem({ suggestion, onSelect }: { suggestion: Suggestion; onSelect: (suggestion: Suggestion) => void }) {
  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'company':
        return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'deal':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'ticker':
        return <ChartBarIcon className="h-4 w-4" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'company':
        return 'Company';
      case 'deal':
        return 'Deal';
      case 'ticker':
        return 'Ticker';
      default:
        return 'Search';
    }
  };

  return (
    <Command.Item
      value={`${suggestion.type}-${suggestion.value}`}
      onSelect={() => onSelect(suggestion)}
      className="flex items-center space-x-3 px-3 py-2 text-sm cursor-pointer hover:bg-[hsl(var(--surface-100))] data-[selected=true]:bg-[hsl(var(--surface-100))] rounded-md transition-colors"
    >
      <div className="text-[hsl(var(--muted-foreground))]">{getIcon(suggestion.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[hsl(var(--foreground))] truncate">{suggestion.label}</div>
        {suggestion.subtitle && (
          <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{suggestion.subtitle}</div>
        )}
      </div>
      <div className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded">
        {getTypeLabel(suggestion.type)}
      </div>
    </Command.Item>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="px-3 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
      <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>No results found for &quot;{query}&quot;</p>
      <p className="text-xs mt-1">Try searching for companies, deals, or tickers</p>
    </div>
  );
}

function LoadingSuggestions() {
  return (
    <div className="px-3 py-2">
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 py-2">
            <div className="w-4 h-4 bg-[hsl(var(--muted))] rounded animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-[hsl(var(--muted))] rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-[hsl(var(--muted))] rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GlobalSearch({ className = '', placeholder = 'Search companies, deals, tickers...' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Search suggestions query
  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => searchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length > 0 && open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSelect = useCallback((suggestion: Suggestion) => {
    trackEvent('search_suggestion_selected', {
      query: debouncedQuery,
      suggestion_type: suggestion.type,
      suggestion_value: suggestion.value,
    });

    // Navigate based on suggestion type
    switch (suggestion.type) {
      case 'company':
      case 'ticker':
        router.push(`/companies/${suggestion.ticker || suggestion.value}`);
        break;
      case 'deal':
        router.push(`/deals/${suggestion.id}`);
        break;
      default:
        break;
    }

    // Update input and close
    setQuery(suggestion.label);
    setOpen(false);
  }, [debouncedQuery, router]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Enter' && !suggestions.length && query.length > 0) {
      // If no suggestions and user presses Enter, do a general search
      trackEvent('search_direct_enter', { query });
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Small delay to allow click events to process
      setTimeout(() => {
        if (!document.activeElement?.closest('[cmdk-root]')) {
          // Only clear if focus isn't within the command
        }
      }, 100);
    }
  };

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const key = suggestion.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  const hasResults = suggestions.length > 0;
  const showResults = open && (hasResults || isLoading || (debouncedQuery.length > 0 && !isLoading));

  return (
    <div className={`relative ${className}`}>
      <Command
        shouldFilter={false}
        onKeyDown={handleKeyDown}
        className="relative"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-terminal-primary" />
          </div>
          <Command.Input
            value={query}
            onValueChange={handleInputChange}
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2 border border-terminal-border rounded-md bg-black text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-terminal-primary focus:border-transparent text-sm"
            onFocus={() => query.length > 0 && setOpen(true)}
            onBlur={() => {
              // Delay closing to allow clicks on suggestions
              setTimeout(() => setOpen(false), 150);
            }}
          />
        </div>

        {showResults && (
          <Command.List className="absolute top-full left-0 right-0 mt-1 bg-[hsl(var(--popover-background))] border border-[hsl(var(--border))] rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
            {isLoading ? (
              <LoadingSuggestions />
            ) : !hasResults && debouncedQuery.length > 0 ? (
              <NoResults query={debouncedQuery} />
            ) : (
              <div className="py-2">
                {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
                  <Command.Group key={type} heading={type.charAt(0).toUpperCase() + type.slice(1)} className="px-3">
                    <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 px-0">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    {typeSuggestions.slice(0, 3).map((suggestion, index) => (
                      <SuggestionItem
                        key={`${suggestion.type}-${suggestion.value}-${index}`}
                        suggestion={suggestion}
                        onSelect={handleSelect}
                      />
                    ))}
                  </Command.Group>
                ))}
              </div>
            )}
          </Command.List>
        )}
      </Command>
    </div>
  );
}
