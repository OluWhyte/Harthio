'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSessionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string, filters: SearchFilters) => void;
}

export interface SearchFilters {
  timeFilter: 'all' | 'today' | 'week' | 'available';
  sortBy: 'soonest' | 'newest' | 'popular';
}

export function SearchSessionsSheet({ open, onOpenChange, onSearch }: SearchSessionsSheetProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query, { timeFilter: 'all', sortBy: 'soonest' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="h-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Search Sessions</SheetTitle>
          <SheetDescription>Search for sessions by title or topic</SheetDescription>
        </SheetHeader>

        <div className="pt-4">
          {/* Simple Search Input - matches desktop */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 h-11"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
