import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Contact, Briefcase, Loader2, XCircle } from 'lucide-react';
import { ContactId, DealId, DealStage } from '@/lib/types/branded';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SearchResult =
  | { type: 'contact'; id: ContactId; name: string; company: string }
  | { type: 'deal'; id: DealId; name: string; stage: DealStage; value: number };

export type SearchState =
  | { status: 'idle' }
  | { status: 'focused' }
  | { status: 'searching'; query: string }
  | { status: 'results'; items: SearchResult[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; message: string };

interface SearchBarProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onResultSelect,
  placeholder = 'Search contacts or deals...'
}) => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setState({ status: 'focused' });
      return;
    }

    setState({ status: 'searching', query: searchQuery });
    try {
      const results = await onSearch(searchQuery);
      if (results.length === 0) {
        setState({ status: 'empty', query: searchQuery });
      } else {
        setState({ status: 'results', items: results });
      }
    } catch (error) {
      setState({ status: 'error', message: 'Search unavailable.' });
    }
  }, [onSearch]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query) {
      debounceTimer.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else if (state.status !== 'idle') {
      setState({ status: 'focused' });
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, performSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (state.status !== 'results') return;

    const items = state.items;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onResultSelect(items[selectedIndex]);
          setQuery('');
          setState({ status: 'idle' });
        }
        break;
      case 'Escape':
        e.preventDefault();
        setState({ status: 'idle' });
        containerRef.current?.querySelector('input')?.blur();
        break;
    }
  };

  const results = state.status === 'results' ? state.items : [];
  const contacts = results.filter(r => r.type === 'contact') as Extract<SearchResult, { type: 'contact' }>[];
  const deals = results.filter(r => r.type === 'deal') as Extract<SearchResult, { type: 'deal' }>[];

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={cn(
            "h-5 w-5 transition-colors",
            state.status === 'searching' ? "text-purple-500 animate-pulse" : "text-zinc-500 group-focus-within:text-purple-400"
          )} />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all sm:text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setState(prev => query ? prev : { status: 'focused' })}
          aria-label="Search"
          aria-expanded={state.status === 'results'}
          aria-controls="search-results"
          aria-haspopup="listbox"
        />
      </div>

      <AnimatePresence>
        {(state.status !== 'idle' && state.status !== 'focused' || (state.status === 'focused' && query)) && (
          <div
            id="search-results"
            role="listbox"
            className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {state.status === 'searching' && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-1/3" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state.status === 'empty' && (
              <div className="p-8 text-center">
                <p className="text-zinc-400">No results found for <span className="text-zinc-100 font-medium">"{state.query}"</span></p>
              </div>
            )}

            {state.status === 'error' && (
              <div className="p-4 flex items-center gap-3 text-red-400 bg-red-400/5 border-y border-red-400/10">
                <XCircle size={18} />
                <span className="text-sm font-medium">{state.message}</span>
              </div>
            )}

            {state.status === 'results' && (
              <div className="max-h-[60vh] overflow-y-auto">
                {contacts.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contacts</div>
                    {contacts.map((contact, i) => {
                      const globalIdx = results.indexOf(contact);
                      return (
                        <div
                          key={contact.id}
                          role="option"
                          aria-selected={selectedIndex === globalIdx}
                          onClick={() => onResultSelect(contact)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === globalIdx ? "bg-purple-500/10 text-purple-100" : "hover:bg-zinc-800 text-zinc-300"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-purple-400">
                            <Contact size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{contact.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{contact.company}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {deals.length > 0 && (
                  <div className={cn("p-2", contacts.length > 0 && "border-t border-zinc-800/50")}>
                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Deals</div>
                    {deals.map((deal, i) => {
                      const globalIdx = results.indexOf(deal);
                      return (
                        <div
                          key={deal.id}
                          role="option"
                          aria-selected={selectedIndex === globalIdx}
                          onClick={() => onResultSelect(deal)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === globalIdx ? "bg-teal-500/10 text-teal-100" : "hover:bg-zinc-800 text-zinc-300"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <Briefcase size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{deal.name}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-2">
                              <span>{deal.stage.replace('_', ' ')}</span>
                              <span>•</span>
                              <span className="text-teal-500 font-mono">${deal.value.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Minimal AnimatePresence mock if framer-motion is not fully configured for this context
const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
