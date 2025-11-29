'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AnalyticsFiltersProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function AnalyticsFilters({ dateRange, onDateRangeChange, searchQuery = '', onSearchChange }: AnalyticsFiltersProps) {
  const presets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 6 Months', days: 180 },
    { label: 'Last Year', days: 365 }
  ];

  const handleClearFilters = () => {
    onDateRangeChange({
      from: subDays(new Date(), 30),
      to: new Date()
    });
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const hasActiveFilters = searchQuery !== '' || 
    dateRange.from.getTime() !== subDays(new Date(), 30).setHours(0, 0, 0, 0) ||
    dateRange.to.getTime() !== new Date().setHours(23, 59, 59, 999);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, sessions, or metrics..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Date Range Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date Range:</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() => onDateRangeChange({
                    from: subDays(new Date(), preset.days),
                    to: new Date()
                  })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Start Date
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start-date"
                    type="date"
                    value={format(dateRange.from, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        onDateRangeChange({ from: newDate, to: dateRange.to });
                      }
                    }}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  End Date
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end-date"
                    type="date"
                    value={format(dateRange.to, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        onDateRangeChange({ from: dateRange.from, to: newDate });
                      }
                    }}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Selected Range Display */}
            <div className="text-sm text-muted-foreground">
              Showing data from <strong>{format(dateRange.from, 'MMM dd, yyyy')}</strong> to <strong>{format(dateRange.to, 'MMM dd, yyyy')}</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
