'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Monitor,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserFilters, TopicFilters, AnalyticsFilters } from '@/lib/database-types';

interface FilterComponentProps {
  type: 'users' | 'topics' | 'analytics';
  onFiltersChange: (filters: any) => void;
  className?: string;
}

export function FilterComponent({ type, onFiltersChange, className }: FilterComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '' || value === undefined || value === null) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateDateFilter = (type: 'from' | 'to', date: Date | undefined) => {
    if (type === 'from') {
      setDateFrom(date);
      updateFilter('date_from', date ? format(date, 'yyyy-MM-dd') : undefined);
    } else {
      setDateTo(date);
      updateFilter('date_to', date ? format(date, 'yyyy-MM-dd') : undefined);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  };

  const renderUserFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rating Range */}
        <div className="space-y-2">
          <Label>Minimum Rating</Label>
          <Select onValueChange={(value) => updateFilter('min_rating', value === 'all' ? undefined : parseFloat(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Any rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any rating</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
              <SelectItem value="4.0">4.0+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
              <SelectItem value="3.0">3.0+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label>Country</Label>
          <Select onValueChange={(value) => updateFilter('country', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any country</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Type */}
        <div className="space-y-2">
          <Label>Device Type</Label>
          <Select onValueChange={(value) => updateFilter('device_type', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any device</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Engagement Level */}
        <div className="space-y-2">
          <Label>Engagement Level</Label>
          <Select onValueChange={(value) => updateFilter('engagement_level', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any level</SelectItem>
              <SelectItem value="High">High Engagement</SelectItem>
              <SelectItem value="Medium">Medium Engagement</SelectItem>
              <SelectItem value="Low">Low Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Topics */}
        <div className="space-y-2">
          <Label>Minimum Topics Created</Label>
          <Input
            type="number"
            placeholder="0"
            onChange={(e) => updateFilter('min_topics', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        {/* Phone Verified */}
        <div className="space-y-2">
          <Label>Phone Verification</Label>
          <Select onValueChange={(value) => updateFilter('phone_verified', value === 'all' ? undefined : value === 'true' ? true : value === 'false' ? false : undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Registration Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => updateDateFilter('from', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => updateDateFilter('to', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  const renderTopicFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any category</SelectItem>
              <SelectItem value="Tech & Programming">Tech & Programming</SelectItem>
              <SelectItem value="Career & Business">Career & Business</SelectItem>
              <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
              <SelectItem value="Education & Learning">Education & Learning</SelectItem>
              <SelectItem value="Social & Networking">Social & Networking</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Participant Range */}
        <div className="space-y-2">
          <Label>Min Participants</Label>
          <Input
            type="number"
            placeholder="0"
            onChange={(e) => updateFilter('min_participants', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label>Max Participants</Label>
          <Input
            type="number"
            placeholder="No limit"
            onChange={(e) => updateFilter('max_participants', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Session Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => updateDateFilter('from', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => updateDateFilter('to', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Countries */}
        <div className="space-y-2">
          <Label>Countries</Label>
          <Select onValueChange={(value) => updateFilter('countries', value === 'all' ? undefined : [value])}>
            <SelectTrigger>
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Types */}
        <div className="space-y-2">
          <Label>Device Types</Label>
          <Select onValueChange={(value) => updateFilter('device_types', value === 'all' ? undefined : [value])}>
            <SelectTrigger>
              <SelectValue placeholder="All devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All devices</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range - Required for Analytics */}
      <div className="space-y-2">
        <Label>Date Range *</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "From date *"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => updateDateFilter('from', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "To date *"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => updateDateFilter('to', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Options</h4>
              {getActiveFilterCount() > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            {type === 'users' && renderUserFilters()}
            {type === 'topics' && renderTopicFilters()}
            {type === 'analytics' && renderAnalyticsFilters()}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}